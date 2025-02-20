import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, apiKey, firmApiKey, firmSlug } = body;

    // Mock response
    const mockResponse = {
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
