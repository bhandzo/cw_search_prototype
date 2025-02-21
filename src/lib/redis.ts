import { Redis } from "@upstash/redis";
import { StoredCredentials, Credentials } from "@/types/auth";
import { v4 as uuidv4 } from "uuid";

// Create Redis client using Vercel KV credentials
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// In-memory cache for credentials
const credentialsCache = new Map<
  string,
  {
    credentials: Credentials;
    expiresAt: number;
  }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const TOKEN_TTL = 24 * 60 * 60; // 24 hours in seconds

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

  // Set expiration for both entries
  await redis.expire(`credentials:${userId}`, TOKEN_TTL);
  await redis.expire(`session:${sessionToken}`, TOKEN_TTL);

  // Add to cache
  credentialsCache.set(sessionToken, {
    credentials: storedCredentials,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return sessionToken;
}

// Get credentials using session token
export async function getCredentialsFromToken(
  sessionToken: string
): Promise<Credentials | null> {
  if (!sessionToken) return null;

  // Check cache first
  const cachedData = credentialsCache.get(sessionToken);
  if (cachedData && Date.now() < cachedData.expiresAt) {
    return cachedData.credentials;
  }

  // If not in cache or expired, get from Redis
  const userId = await redis.get<string>(`session:${sessionToken}`);
  if (!userId) {
    credentialsCache.delete(sessionToken); // Clear invalid token from cache
    return null;
  }

  const credentialsStr = await redis.get<string>(`credentials:${userId}`);
  if (!credentialsStr) {
    credentialsCache.delete(sessionToken);
    return null;
  }

  const credentials: StoredCredentials = JSON.parse(credentialsStr);

  // Refresh token expiration
  await redis.expire(`credentials:${userId}`, TOKEN_TTL);
  await redis.expire(`session:${sessionToken}`, TOKEN_TTL);

  // Update cache
  credentialsCache.set(sessionToken, {
    credentials,
    expiresAt: Date.now() + CACHE_TTL,
  });

  return credentials;
}

// Delete credentials and session
export async function deleteCredentials(sessionToken: string): Promise<void> {
  const userId = await redis.get<string>(`session:${sessionToken}`);
  if (!userId) return;

  // Delete both session and credentials
  await redis.del(`session:${sessionToken}`);
  await redis.del(`credentials:${userId}`);

  // Clear from cache
  credentialsCache.delete(sessionToken);
}

// Clean expired tokens from cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of credentialsCache.entries()) {
    if (now > data.expiresAt) {
      credentialsCache.delete(token);
    }
  }
}, 60000); // Clean every minute

export default {
  storeCredentials,
  getCredentialsFromToken,
  deleteCredentials,
  generateSessionToken,
};
