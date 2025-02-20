import { NextResponse, NextRequest } from "next/server";
import { Credentials } from "@/types/settings";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const credentialsCookie = (await cookies()).get("credentials");
    if (!credentialsCookie) {
      throw new Error("No credentials found");
    }
    const credentials: Credentials = JSON.parse(decodeURIComponent(credentialsCookie.value));
    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    if (!firmSlug || !firmApiKey || !clockworkAuthKey) {
      throw new Error("No API credentials provided");
    }

    const noteId = params.id;
    const url = `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/notes/${noteId}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": firmApiKey,
        Accept: "application/json",
        Authorization: `Bearer ${clockworkAuthKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { notes: [], error: "Failed to fetch note content" },
      { status: 500 }
    );
  }
}
