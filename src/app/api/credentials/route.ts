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
