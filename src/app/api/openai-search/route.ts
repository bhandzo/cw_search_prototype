import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput, clockworkContext } = body;

    // Mock structured query response
    const mockResponse = {
      structuredQuery: `primary_position:"Software Engineer" AND positions.startDate:[NOW-5y TO NOW] AND preferredAddress:"Remote" AND skills:"React" AND skills:"TypeScript"`,
      originalInput: userInput
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
