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

    const authHeader = request.headers.get("Authorization");
    console.log("[ClockworkSearch] Auth header:", authHeader);

    const authToken = authHeader?.split("Bearer ")[1];
    console.log("[ClockworkSearch] Extracted token:", authToken);

    if (!authToken) {
      console.log("[ClockworkSearch] No authorization token provided");
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    console.log("[ClockworkSearch] Fetching credentials for token");
    const credentials = await getCredentialsFromToken(authToken);
    console.log(
      "[ClockworkSearch] Retrieved credentials:",
      credentials ? "exists" : "null"
    );

    if (!credentials) {
      console.log("[ClockworkSearch] Invalid or expired token");
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;
    if (!firmSlug || !firmApiKey || !clockworkAuthKey) {
      return NextResponse.json(
        { error: "Missing required credentials" },
        { status: 401 }
      );
    }

    console.log(`[ClockworkSearch] Making API request for firm: ${firmSlug}`);
    console.log(`[ClockworkSearch] Search keywords:`, keywords);
    console.log(
      `[ClockworkSearch] Using auth key:`,
      clockworkAuthKey ? "[REDACTED]" : "missing"
    );
    console.log(
      `[ClockworkSearch] Using firm API key:`,
      firmApiKey ? "[REDACTED]" : "missing"
    );

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

    // Make initial requests for each keyword to get total counts
    const searchPromises = await Promise.all(keywordsList.map(async (keyword: string) => {
      const headers = {
        "X-API-Key": firmApiKey,
        "Accept": "application/json",
        "Authorization": `Bearer ${clockworkAuthKey}`,
      };

      // Initial request without pagination
      const url = `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people?q=${encodeURIComponent(keyword)}`;
      
      console.log(`[ClockworkSearch] Making initial request for "${keyword}":`, {
        url,
        headers: {
          "X-API-Key": "[REDACTED]",
          "Accept": "application/json",
          "Authorization": "[REDACTED]",
        },
      });

      const initialRes = await fetch(url, { headers });
      
      if (!initialRes.ok) {
        const errorText = await initialRes.text();
        console.error(`[ClockworkSearch] Error response for "${keyword}":`, errorText);
        throw new Error(`Clockwork API error: ${initialRes.status} - ${errorText}`);
      }

      const initialData = await initialRes.json();
      const totalResults = initialData.meta?.total || 0;
      
      console.log(`[ClockworkSearch] Initial response for "${keyword}":`, {
        status: initialRes.status,
        totalResults,
        firstBatchSize: initialData.peopleSearch?.length || 0
      });

      // If there are more results, fetch them with the offset
      if (totalResults > initialData.peopleSearch?.length) {
        const offset = initialData.peopleSearch.length;
        const remainingUrl = `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people?q=${encodeURIComponent(keyword)}&offset=${offset}`;
        
        console.log(`[ClockworkSearch] Fetching remaining results for "${keyword}":`, {
          url: remainingUrl,
          offset
        });

        const remainingRes = await fetch(remainingUrl, { headers });
        
        if (!remainingRes.ok) {
          const errorText = await remainingRes.text();
          console.error(`[ClockworkSearch] Error fetching remaining results for "${keyword}":`, errorText);
          throw new Error(`Clockwork API error: ${remainingRes.status} - ${errorText}`);
        }

        const remainingData = await remainingRes.json();
        
        // Combine the results
        return {
          keyword,
          data: {
            ...initialData,
            peopleSearch: [...initialData.peopleSearch, ...remainingData.peopleSearch]
          }
        };
      }

      return { keyword, data: initialData };
    }));

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
