import { NextResponse } from "next/server";
import { getCredentialsFromToken, storeCredentials } from "@/lib/redis";
import { generateToken } from "@/lib/tokens";

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const credentials = await getCredentialsFromToken(token);
    if (!credentials) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(credentials);
  } catch (error) {
    console.error("Error fetching credentials:", error);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const credentials = await request.json();
    
    // Check if there's an existing token
    const existingToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    
    // Generate new token if none exists
    const token = existingToken || await generateToken();
    
    await storeCredentials(token, credentials);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error storing credentials:", error);
    return NextResponse.json({ error: "Failed to store credentials" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Clear credentials from Redis
    await storeCredentials(token, null);
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error deleting credentials:", error);
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}
