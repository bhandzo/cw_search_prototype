import { NextResponse, NextRequest } from "next/server";
import { Note } from "@/types/clockwork";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ notes: Note[] }>> {
  try {
    // Read the JSON payload; expecting personId to be passed in the request body.
    const { personId } = await request.json();

    // Retrieve credentials from the cookies.
    const credentialsCookie = request.cookies.get("credentials");
    if (!credentialsCookie) {
      throw new Error("No credentials cookie provided");
    }
    const credentials = JSON.parse(credentialsCookie.value);
    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    // Call the external API using the retrieved credentials.
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
