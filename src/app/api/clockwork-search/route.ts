import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

const MAX_RESULTS = 5;

async function saveSummaryToFile(personId: string, summaryData: any) {
  if (process.env.NODE_ENV === 'development') {
    try {
      const summariesDir = path.join(process.cwd(), 'dev-data', 'summaries');
      
      // Ensure directory exists
      if (!fs.existsSync(summariesDir)){
        fs.mkdirSync(summariesDir, { recursive: true });
      }
      
      const filename = path.join(summariesDir, `${personId}-${Date.now()}.json`);
      const dataToSave = {
        personId,
        timestamp: new Date().toISOString(),
        ...summaryData
      };
      
      fs.writeFileSync(
        filename, 
        JSON.stringify(dataToSave, null, 2)
      );
      console.log(`Saved summary to ${filename}`);
    } catch (error) {
      console.error('Error saving summary file:', error);
    }
  }
}

async function processBatch(batch: any[], request: Request, body: any) {
  return Promise.all(
    batch.map(async (result) => {
      try {
        const cleanedNotes = result.notes?.map((note: any) => ({
          type: note.type,
          createdAt: note.createdAt,
          content: note.content
            .replace(/<[^>]*>/g, '')
            .substring(0, 500)
        })) || [];

        const summaryResponse = await fetch(`${request.url.split('/api/')[0]}/api/openai-summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person: {
              ...result,
              notes: cleanedNotes
            },
            originalQuery: body.originalQuery,
            keywords: body.keywords
          })
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          await saveSummaryToFile(result.id, summaryData);
          result.shortSummary = summaryData.shortSummary;
          result.longSummary = summaryData.longSummary;
        }

        result.notes = result.notes?.map((note: any) => ({
          id: note.id,
          type: note.type,
          createdAt: note.createdAt
        })) || [];

        return result;
      } catch (error) {
        console.error(`Error processing summary for person ${result.id}:`, error);
        return result;
      }
    })
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keywords, credentials } = body;

    if (!credentials) {
      console.error("No API credentials provided");
      throw new Error("No API credentials provided");
    }

    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    console.log(`Making Clockwork API request for firm: ${firmSlug}`);
    console.log("Using auth key:", clockworkAuthKey);
    console.log(`Search keywords:`, keywords);

    // Flatten keywords object into array while preserving multi-word keywords
    const keywordsList = Object.values(keywords).flat().map(kw => kw.trim());

    // Track frequency of each person
    const personFrequency = new Map<string, { 
      count: number; 
      person: any;
      matchedKeywords: Set<string>;
    }>();

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
      (data.peopleSearch || []).forEach((person: any) => {
        if (personFrequency.has(person.id)) {
          const entry = personFrequency.get(person.id)!;
          entry.count++;
          // Only add the exact keyword that matched
          if (person.name.toLowerCase().includes(keyword.toLowerCase()) ||
              JSON.stringify(person).toLowerCase().includes(keyword.toLowerCase())) {
            entry.matchedKeywords.add(keyword);
          }
        } else {
          // Check if this keyword actually matches before adding it
          const matchedKeywords = new Set<string>();
          if (person.name.toLowerCase().includes(keyword.toLowerCase()) ||
              JSON.stringify(person).toLowerCase().includes(keyword.toLowerCase())) {
            matchedKeywords.add(keyword);
          }
          personFrequency.set(person.id, { 
            count: 1, 
            person,
            matchedKeywords
          });
        }
      });
    });

    // Sort by frequency and convert back to array
    const combinedPeopleSearch = Array.from(personFrequency.values())
      .sort((a, b) => b.count - a.count)
      .map(({ person, count, matchedKeywords }) => ({
        ...person,
        matchScore: count,
        matchedKeywords: Array.from(matchedKeywords)
      }))
      .slice(0, MAX_RESULTS);

    // Return initial results immediately
    const response = new NextResponse(
      new ReadableStream({
        async start(controller) {
          // Send initial results
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: 'initial',
                peopleSearch: combinedPeopleSearch,
                total: combinedPeopleSearch.length,
                limitedTo: MAX_RESULTS
              }) + '\n'
            )
          );

          // Process each result
          for (const result of combinedPeopleSearch) {
            // Fetch notes
            const notesResponse = await fetch(`${request.url.split('/api/')[0]}/api/clockwork-notes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                personId: result.id,
                credentials 
              })
            });
            
            if (notesResponse.ok) {
              const notesData = await notesResponse.json();
              result.notes = notesData.notes || [];
              
              // Send notes update
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: 'notes',
                    personId: result.id,
                    notes: result.notes
                  }) + '\n'
                )
              );
            }

            // Generate summaries
            const summaryResponse = await fetch(`${request.url.split('/api/')[0]}/api/openai-summary`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                person: result,
                originalQuery: body.originalQuery,
                keywords: keywordsList
              })
            });

            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              await saveSummaryToFile(result.id, summaryData);
              
              // Send summary update
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: 'summary',
                    personId: result.id,
                    ...summaryData
                  }) + '\n'
                )
              );
            }
          }

          controller.close();
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
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
