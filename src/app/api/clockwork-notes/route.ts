import { NextResponse, NextRequest } from "next/server";
import { Note } from "@/types/clockwork";

export async function POST(
  request: NextRequest
): Promise<NextResponse<{ notes: Note[] }>> {
  try {
    // Read the JSON payload; expecting personId to be passed in the request body.
    const { personId } = await request.json();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: "No session token provided" }, { status: 401 });
    }

    const sessionToken = authHeader.split('Bearer ')[1];
    const credentials = await tokenService.getCredentials(sessionToken);
    
    if (!credentials) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

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
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { notes: [], error: "Failed to fetch notes" },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
