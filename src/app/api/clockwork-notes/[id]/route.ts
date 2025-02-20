import { NextResponse } from "next/server";
import { Note } from "@/types/clockwork";

interface NoteResponse extends Note {
  content: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const credentials = JSON.parse(localStorage.getItem("credentials") || "{}");
    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    if (!credentials) {
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
      { error: "Failed to fetch note content" },
      { status: 500 }
    );
  }
}
