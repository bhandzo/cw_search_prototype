import { NextResponse } from "next/server";
import { Note } from "@/types/clockwork";

export async function POST(request: Request): Promise<NextResponse<{ notes: Note[] }>> {
  try {
    const body = await request.json();
    const { personId, credentials } = body;
    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    const response = await fetch(
      `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people/${personId}/notes`,
      {
        headers: {
          "X-API-Key": firmApiKey,
          Accept: "application/json",
          Authorization: `Bearer ${clockworkAuthKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { notes: [], error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
