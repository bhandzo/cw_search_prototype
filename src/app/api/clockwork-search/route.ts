import { NextResponse } from "next/server";

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

    // Flatten keywords object into array
    const keywordsList = Object.values(keywords).flat();

    // Track frequency of each person
    const personFrequency = new Map<string, { count: number; person: any }>();

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
          personFrequency.get(person.id)!.count++;
        } else {
          personFrequency.set(person.id, { count: 1, person });
        }
      });
    });

    // Sort by frequency and convert back to array
    const combinedPeopleSearch = Array.from(personFrequency.values())
      .sort((a, b) => b.count - a.count)
      .map(({ person }) => ({
        ...person,
        matchScore: personFrequency.get(person.id)?.count || 0
      }));

    return NextResponse.json({ 
      peopleSearch: combinedPeopleSearch || [],
      total: combinedPeopleSearch?.length || 0 
    });
  } catch (error) {
    console.error("Clockwork API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
