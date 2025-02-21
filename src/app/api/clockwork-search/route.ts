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

    // Organize keywords by category
    const categorizedKeywords = {
      title: keywords.title || [],
      industry: keywords.industry || [],
      experience: keywords.experience || [],
      skills: keywords.skills || [], 
      location: keywords.location || []
    };

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

    const headers = {
      "X-API-Key": firmApiKey,
      Accept: "application/json",
      Authorization: `Bearer ${clockworkAuthKey}`,
    };

    const searchPromises = [];

    // Search title keywords first (limit 20 per keyword)
    for (const keyword of categorizedKeywords.title) {
      const url = `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people_search?q=${encodeURIComponent(keyword)}&limit=20`;
      searchPromises.push(
        fetch(url, { headers }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Clockwork API error: ${res.status} - ${errorText}`);
          }
          const data = await res.json();
          return { keyword, category: 'title', data };
        })
      );
    }

    // Search industry keywords second (limit 20 per keyword)
    for (const keyword of categorizedKeywords.industry) {
      const url = `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people_search?q=${encodeURIComponent(keyword)}&limit=20`;
      searchPromises.push(
        fetch(url, { headers }).then(async (res) => {
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Clockwork API error: ${res.status} - ${errorText}`);
          }
          const data = await res.json();
          return { keyword, category: 'industry', data };
        })
      );
    }

    // Wait for all requests to complete
    const results = await Promise.all(searchPromises);

    const personMatches = new Map<string, {
      person: Person,
      categories: Set<string>,
      matchedKeywords: Set<string>
    }>();

    // Process results and track categories
    results.forEach(({ keyword, category, data }) => {
      (data.peopleSearch || []).forEach((person: Person) => {
        if (personMatches.has(person.id)) {
          const entry = personMatches.get(person.id)!;
          entry.categories.add(category);
          if (
            person.name.toLowerCase().includes(keyword.toLowerCase()) ||
            JSON.stringify(person).toLowerCase().includes(keyword.toLowerCase())
          ) {
            entry.matchedKeywords.add(keyword);
          }
        } else {
          const matchedKeywords = new Set<string>();
          if (
            person.name.toLowerCase().includes(keyword.toLowerCase()) ||
            JSON.stringify(person).toLowerCase().includes(keyword.toLowerCase())
          ) {
            matchedKeywords.add(keyword);
          }
          personMatches.set(person.id, {
            person,
            categories: new Set([category]),
            matchedKeywords
          });
        }
      });
    });

    // Convert to array and filter/sort results
    const allResults = Array.from(personMatches.values())
      // Only include results that matched title or industry
      .filter(({ categories }) => 
        categories.has('title') || categories.has('industry')
      )
      // Sort by number of matching categories and keywords
      .sort((a, b) => {
        // First sort by number of categories matched
        const catDiff = b.categories.size - a.categories.size;
        if (catDiff !== 0) return catDiff;
        // Then by number of keywords matched
        return b.matchedKeywords.size - a.matchedKeywords.size;
      })
      .map(({ person, categories, matchedKeywords }) => ({
        ...person,
        matchScore: categories.size + (matchedKeywords.size * 0.5),
        matchedKeywords: Array.from(matchedKeywords),
        matchedCategories: Array.from(categories)
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

              // Send notes update and status change
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: "notes",
                    personId: result.id,
                    notes: result.notes,
                    status: "summarizing"
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
