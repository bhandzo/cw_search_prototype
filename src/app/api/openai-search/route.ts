import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userInput, clockworkContext } = body;

    // Mock structured query response
    const mockResponse = {
      structuredQuery: {
        role: "Software Engineer",
        skills: ["React", "TypeScript"],
        location: "Remote",
        experience: "5+ years"
      },
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
