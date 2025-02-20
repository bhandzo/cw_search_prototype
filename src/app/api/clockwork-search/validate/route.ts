import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { credentials } = body;

    if (!credentials) {
      console.error("No credentials provided for validation");
      throw new Error("No credentials provided");
    }

    const { firmSlug, firmApiKey, clockworkAuthKey } = credentials;

    console.log(`Validating credentials for firm: ${firmSlug}`);

    const response = await fetch(
      `https://api.clockworkrecruiting.com/v3.0/${firmSlug}/people?limit=1`,
      {
        headers: {
          "X-API-Key": firmApiKey,
          Accept: "application/json",
          Authorization: clockworkAuthKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`Validation failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error("Invalid credentials");
    }

    console.log("Credentials validated successfully");
    return NextResponse.json({ status: "valid" });
  } catch (error) {
    console.error("Credential validation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate credentials" },
      { status: 400 }
    );
  }
}
