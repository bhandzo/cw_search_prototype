import { NextResponse } from "next/server";
// Removed unused import
// import { getCredentialsFromToken } from "@/lib/redis";

export async function POST(request: Request) {
  console.log("[Validate] Request received");
  
  try {
    const authHeader = request.headers.get('Authorization');
    console.log("[Validate] Auth header present:", !!authHeader);
    
    const credentials = await request.json();
    console.log("[Validate] Received credentials:", {
      ...credentials,
      clockworkAuthKey: credentials.clockworkAuthKey ? '[REDACTED]' : undefined
    });

    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials || {};

    if (!firmSlug || !firmApiKey || !clockworkAuthKey) {
      console.error("Missing required credentials");
      return NextResponse.json(
        { error: "Missing required credentials" },
        { status: 400 }
      );
    }

    console.log("[Validate] Starting validation for firm:", firmSlug);
    
    const url = `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people_search?limit=1`;
    console.log("[Validate] Request URL:", url);
    const headers = new Headers();
    headers.append("X-API-Key", firmApiKey);
    headers.append("Accept", "application/json");
    headers.append("Authorization", `Bearer ${clockworkAuthKey}`);

    console.log("[Validate] Request headers:", {
      "X-API-Key": "[REDACTED]",
      "Accept": headers.get("Accept"),
      "Authorization": "[REDACTED]"
    });

    console.log("[Validate] Making request...");
    const response = await fetch(url, { headers });
    console.log("[Validate] Response received");

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      console.error(`Validation failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error("Invalid credentials");
    }

    const data = await response.json();
    console.log("Response data:", data);

    console.log("Credentials validated successfully");
    return NextResponse.json({ status: "valid" });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Credential validation error:", error.message);
      return NextResponse.json(
        { error: error.message || "Failed to validate credentials" },
        { status: 400 }
      );
    } else {
      console.error("Unknown error during credential validation");
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 400 }
      );
    }
  }
}
