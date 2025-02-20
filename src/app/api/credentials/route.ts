import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Credentials } from "@/types/settings";

// Get credentials
export async function GET() {
  const credentialsCookie = cookies().get("credentials");
  if (!credentialsCookie) {
    return NextResponse.json({ error: "No credentials found" }, { status: 404 });
  }
  
  try {
    const credentials = JSON.parse(decodeURIComponent(credentialsCookie.value));
    return NextResponse.json(credentials);
  } catch (error) {
    return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
  }
}

// Save credentials
export async function POST(request: Request) {
  try {
    const credentials: Credentials = await request.json();
    
    // Set cookie with credentials, httpOnly for security
    cookies().set({
      name: "credentials",
      value: encodeURIComponent(JSON.stringify(credentials)),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Credentials } from "@/types/settings";

const COOKIE_NAME = "credentials";
const COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Get credentials
export async function GET() {
  const credentialsCookie = cookies().get(COOKIE_NAME);
  if (!credentialsCookie) {
    return NextResponse.json({ error: "No credentials found" }, { status: 404 });
  }
  
  try {
    const credentials = JSON.parse(decodeURIComponent(credentialsCookie.value));
    return NextResponse.json(credentials);
  } catch (error) {
    return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
  }
}

// Save credentials
export async function POST(request: Request) {
  try {
    const credentials: Credentials = await request.json();
    
    // Set cookie with credentials, httpOnly for security
    cookies().set({
      name: COOKIE_NAME,
      value: encodeURIComponent(JSON.stringify(credentials)),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: new Date(Date.now() + COOKIE_EXPIRY) // Set expiration to 7 days
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }
}

// Delete credentials
export async function DELETE() {
  try {
    // Delete the credentials cookie
    cookies().delete(COOKIE_NAME);
    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}
