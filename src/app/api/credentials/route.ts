import { NextResponse } from "next/server";
import { getCredentialsFromToken, storeCredentials } from "@/lib/redis";
import { generateToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    console.log("[Credentials API] POST request received");
    const credentials = await request.json();
    const token = generateToken();
    console.log("[Credentials API] Generated new token:", token);
    
    await storeCredentials(token, credentials);
    console.log("[Credentials API] Stored credentials with token:", token);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error("[Credentials API] Error storing credentials:", error);
    return NextResponse.json({ error: "Failed to store credentials" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    console.log("[Credentials API] GET request with token:", token);

    if (!token) {
      console.log("[Credentials API] No token provided");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const credentials = await getCredentialsFromToken(token);
    console.log("[Credentials API] Retrieved credentials exists:", !!credentials);
    
    if (!credentials) {
      console.log("[Credentials API] Invalid token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(credentials);
  } catch (error) {
    console.error("[Credentials API] Error fetching credentials:", error);
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
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
