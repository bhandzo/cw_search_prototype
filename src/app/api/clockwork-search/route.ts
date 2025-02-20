import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, credentials } = body;

    if (!credentials) {
      console.error("No API credentials provided");
      throw new Error("No API credentials provided");
    }

    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    console.log(`Making Clockwork API request for firm: ${firmSlug}`);
    console.log("Using auth key:", clockworkAuthKey);
    console.log(`Search query: ${query}`);

    // Split the comma-separated keywords
    const keywords = query.split(',').map(k => k.trim());
    
    // Make a request for each keyword
    const searchPromises = keywords.map(keyword => 
      fetch(
        `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people_search?q=${encodeURIComponent(keyword)}`,
        {
          headers: {
            "X-API-Key": firmApiKey,
            Accept: "application/json",
            Authorization: `Bearer ${clockworkAuthKey}`,
          },
        }
      ).then(res => {
        if (!res.ok) {
          throw new Error(`Clockwork API error: ${res.status}`);
        }
        return res.json();
      })
    );

    // Wait for all requests to complete
    const results = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const seenIds = new Set();
    const combinedPeopleSearch = results.flatMap(r => r.peopleSearch || [])
      .filter(person => {
        if (seenIds.has(person.id)) return false;
        seenIds.add(person.id);
        return true;
      });

    return NextResponse.json({ peopleSearch: combinedPeopleSearch });
  } catch (error) {
    console.error("Clockwork API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}
