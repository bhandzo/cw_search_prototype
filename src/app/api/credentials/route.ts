import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Credentials } from "@/types/settings";

const COOKIE_NAME = "credentials";
const COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Get credentials
export async function GET() {
  const credentialsCookie = (await cookies()).get(COOKIE_NAME);
  if (!credentialsCookie) {
    return NextResponse.json({ error: "No credentials found" }, { status: 404 });
  }
  
  try {
    const credentials = JSON.parse(decodeURIComponent(credentialsCookie.value));
    return NextResponse.json(credentials);
  } catch {
    return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
  }
}

// Save credentials
export async function POST(request: Request) {
  try {
    const credentials: Credentials = await request.json();
    
    // Set cookie with credentials, httpOnly for security
    (await cookies()).set({
      name: COOKIE_NAME,
      value: encodeURIComponent(JSON.stringify(credentials)),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(Date.now() + COOKIE_EXPIRY) // Set expiration to 7 days
    });

    return NextResponse.json({ status: "success" });
  } catch {
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }
}

// Delete credentials
export async function DELETE() {
  try {
    // Delete the credentials cookie
    (await cookies()).delete(COOKIE_NAME);
    return NextResponse.json({ status: "success" });
  } catch {
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}
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
    const token = await generateToken();
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
