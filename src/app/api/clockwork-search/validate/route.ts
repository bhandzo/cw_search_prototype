import { NextResponse } from "next/server";
import { getCredentialsFromToken } from "@/lib/redis";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    console.log("Auth header:", authHeader);
    
    const sessionToken = authHeader?.split('Bearer ')[1];
    console.log("Extracted session token:", sessionToken);
    
    if (!sessionToken) {
      console.error("No session token provided");
      return NextResponse.json({ error: "No session token provided" }, { status: 401 });
    }

    const credentials = await getCredentialsFromToken(sessionToken);
    if (!credentials) {
      console.error("Invalid or expired session token");
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    console.log(`Validating credentials for firm: ${firmSlug}`);
    console.log("Using auth key:", clockworkAuthKey);

    const url = `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people_search?limit=1`;
    const headers = new Headers();
    headers.append("X-API-Key", firmApiKey);
    headers.append("Accept", "application/json");
    headers.append("Authorization", `Bearer ${clockworkAuthKey}`);

    console.log("Making request to:", url);
    console.log("With headers:", headers);
    console.log(JSON.stringify(headers, null, 2));

    const response = await fetch(url, { headers });

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
