import { Redis } from "@upstash/redis";
import { StoredCredentials, Credentials } from "@/types/auth";
import { v4 as uuidv4 } from "uuid";

// Create Redis client using Vercel KV credentials
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const CREDENTIALS_PREFIX = 'credentials:';
const TOKEN_TTL = 24 * 60 * 60; // 24 hours in seconds

// Store credentials in Redis with token
export async function storeCredentials(token: string, credentials: Credentials | null): Promise<void> {
  const key = `${CREDENTIALS_PREFIX}${token}`;
  if (credentials === null) {
    await redis.del(key);
  } else {
    const storedCredentials: StoredCredentials = {
      ...credentials,
      userId: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await redis.set(key, JSON.stringify(storedCredentials), { ex: TOKEN_TTL });
  }
}

// Get credentials using token
export async function getCredentialsFromToken(token: string): Promise<Credentials | null> {
  if (!token) return null;

  const key = `${CREDENTIALS_PREFIX}${token}`;
  const data = await redis.get<string>(key);
  if (!data) return null;

  // Refresh TTL
  await redis.expire(key, TOKEN_TTL);
  
  return JSON.parse(data);
}

export default {
  storeCredentials,
  getCredentialsFromToken,
};
