import { Redis } from "@upstash/redis";
import { StoredCredentials, Credentials } from "@/types/auth";
import { v4 as uuidv4 } from "uuid";

// Create Redis client using Vercel KV credentials
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Generate a session token
export function generateSessionToken(): string {
  return uuidv4();
}

// Store credentials in Redis
export async function storeCredentials(
  credentials: Credentials
): Promise<string> {
  const userId = uuidv4();
  const sessionToken = generateSessionToken();

  const storedCredentials: StoredCredentials = {
    ...credentials,
    userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Store credentials with userId as key
  await redis.set(`credentials:${userId}`, JSON.stringify(storedCredentials));

  // Store session token mapping to userId
  await redis.set(`session:${sessionToken}`, userId);

  // Set expiration for both entries (24 hours)
  await redis.expire(`credentials:${userId}`, 24 * 60 * 60);
  await redis.expire(`session:${sessionToken}`, 24 * 60 * 60);

  return sessionToken;
}

// Get credentials using session token
export async function getCredentialsFromToken(
  sessionToken: string
): Promise<Credentials | null> {
  // Get userId from session token
  const userId = await redis.get<string>(`session:${sessionToken}`);
  if (!userId) return null;

  // Get credentials using userId
  const credentialsStr = await redis.get<string>(`credentials:${userId}`);
  if (!credentialsStr) return null;

  const credentials: StoredCredentials = JSON.parse(credentialsStr);
  return credentials;
}

// Delete credentials and session
export async function deleteCredentials(sessionToken: string): Promise<void> {
  const userId = await redis.get<string>(`session:${sessionToken}`);
  if (!userId) return;

  // Delete both session and credentials
  await redis.del(`session:${sessionToken}`);
  await redis.del(`credentials:${userId}`);
}

export default {
  storeCredentials,
  getCredentialsFromToken,
  deleteCredentials,
  generateSessionToken,
};
