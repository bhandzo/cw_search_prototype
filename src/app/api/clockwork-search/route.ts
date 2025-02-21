import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCredentialsFromToken } from "@/lib/redis";

import { Person } from "@/types/clockwork";

type SummaryData = Record<string, unknown>;

async function saveSummaryToFile(personId: string, summaryData: SummaryData) {
  if (process.env.NODE_ENV === "development") {
    try {
      const summariesDir = path.join(process.cwd(), "dev-data", "summaries");
      // Ensure directory exists
      if (!fs.existsSync(summariesDir)) {
        fs.mkdirSync(summariesDir, { recursive: true });
      }

      const filename = path.join(
        summariesDir,
        `${personId}-${Date.now()}.json`
      );
      const dataToSave = {
        personId,
        timestamp: new Date().toISOString(),
        ...summaryData,
      };

      fs.writeFileSync(filename, JSON.stringify(dataToSave, null, 2));
      console.log(`Saved summary to ${filename}`);
    } catch (error) {
      console.error("Error saving summary file:", error);
    }
  }
}

interface SearchRequestBody {
  keywords: Record<string, string[]>;
  originalQuery: string;
  credentials: {
    firmSlug: string;
    firmApiKey: string;
    clockworkAuthKey: string;
    maxCandidates: number;
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SearchRequestBody;
    const { keywords } = body;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "No session token provided" }, { status: 401 });
    }

    const sessionToken = authHeader.split('Bearer ')[1];
    const credentials = await getCredentialsFromToken(sessionToken);
    
    if (!credentials) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    console.log(`Making Clockwork API request for firm: ${firmSlug}`);
    console.log("Using auth key:", clockworkAuthKey);
    console.log(`Search keywords:`, keywords);

    // Flatten keywords object into array while preserving multi-word keywords
    const keywordsList = Object.values(keywords)
      .flat()
      .map((kw) => (typeof kw === "string" ? kw.trim() : ""));

    // Track frequency of each person
    const personFrequency = new Map<
      string,
      {
        count: number;
        person: Person;
        matchedKeywords: Set<string>;
      }
    >();

    // Make requests for each keyword, getting first two pages
    const searchPromises = keywordsList.flatMap((keyword: string) => {
      const pages = [1, 2];
      return pages.map((page) =>
        fetch(
          `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people_search?q=${encodeURIComponent(
            keyword
          )}&page=${page}`,
          {
            headers: {
              "X-API-Key": firmApiKey,
              Accept: "application/json",
              Authorization: `Bearer ${clockworkAuthKey}`,
            },
          }
        ).then(async (res) => {
          if (!res.ok) {
            throw new Error(`Clockwork API error: ${res.status}`);
          }
          const data = await res.json();
          return { keyword, data };
        })
      );
    });

    // Wait for all requests to complete
    const results = await Promise.all(searchPromises);

    // Process results and count frequencies
    results.forEach(({ keyword, data }) => {
      (data.peopleSearch || []).forEach((person: Person) => {
        if (personFrequency.has(person.id)) {
          const entry = personFrequency.get(person.id)!;
          entry.count++;
          // Only add the exact keyword that matched
          if (
            person.name.toLowerCase().includes(keyword.toLowerCase()) ||
            JSON.stringify(person).toLowerCase().includes(keyword.toLowerCase())
          ) {
            entry.matchedKeywords.add(keyword);
          }
        } else {
          // Check if this keyword actually matches before adding it
          const matchedKeywords = new Set<string>();
          if (
            person.name.toLowerCase().includes(keyword.toLowerCase()) ||
            JSON.stringify(person).toLowerCase().includes(keyword.toLowerCase())
          ) {
            matchedKeywords.add(keyword);
          }
          personFrequency.set(person.id, {
            count: 1,
            person,
            matchedKeywords,
          });
        }
      });
    });

    // Sort by frequency and convert back to array
    const allResults = Array.from(personFrequency.values())
      .sort((a, b) => b.count - a.count)
      .map(({ person, count, matchedKeywords }) => ({
        ...person,
        matchScore: count,
        matchedKeywords: Array.from(matchedKeywords),
      }));

    const resultsToProcess = allResults.slice(0, credentials.maxCandidates);

    // Return initial results immediately
    const response = new NextResponse(
      new ReadableStream({
        async start(controller) {
          // Send initial results
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: "initial",
                peopleSearch: allResults,
                total: allResults.length,
                limitedTo: credentials.maxCandidates,
                processingCount: resultsToProcess.length,
              }) + "\n"
            )
          );

          // Process top results
          for (const result of resultsToProcess) {
            // Fetch notes
            const notesResponse = await fetch(
              `${request.url.split("/api/")[0]}/api/clockwork-notes`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  personId: result.id,
                  credentials,
                }),
              }
            );

            if (notesResponse.ok) {
              const notesData = await notesResponse.json();
              result.notes = notesData.notes || [];

              // Send notes update
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: "notes",
                    personId: result.id,
                    notes: result.notes,
                  }) + "\n"
                )
              );
            }

            // Generate summaries
            const summaryResponse = await fetch(
              `${request.url.split("/api/")[0]}/api/openai-summary`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  person: result,
                  originalQuery: body.originalQuery,
                  keywords: keywordsList,
                }),
              }
            );

            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              await saveSummaryToFile(result.id, summaryData);

              // Send summary update
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: "summary",
                    personId: result.id,
                    ...summaryData,
                  }) + "\n"
                )
              );
            }
          }

          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Clockwork API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
