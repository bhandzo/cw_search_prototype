import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, clockworkApiKey, firmApiKey, firmSlug } = body;

    // In production, this would be a real API call
    // const response = await fetch(
    //   `https://api.clockworkrecruiting.com/v3.0/setpiecepeople_search?q=${encodeURIComponent(query)}`,
    //   {
    //     headers: {
    //       'X-API-Key': clockworkApiKey,
    //       'Accept': 'application/json',
    //       'Authorization': firmApiKey
    //     }
    //   }
    // );
    // const data = await response.json();

    // For now, return mock response
    const mockResponse = {
      query: query, // Include the query for reference
      candidates: [
        {
          id: "123",
          name: "John Doe",
          currentPosition: "Senior Developer",
          location: "San Francisco, CA"
        },
        {
          id: "456",
          name: "Jane Smith",
          currentPosition: "Product Manager",
          location: "New York, NY"
        }
      ]
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
