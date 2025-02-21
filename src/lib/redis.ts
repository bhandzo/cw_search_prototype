import { Redis } from '@upstash/redis';
import type { StoredCredentials } from '@/types/auth';

// Initialize Redis using environment variables
const redis = Redis.fromEnv();

export async function storeCredentials(token: string, credentials: StoredCredentials | null): Promise<void> {
  console.log("[Redis] Storing credentials for token:", token);
  try {
    if (credentials === null) {
      console.log("[Redis] Deleting credentials for token:", token);
      await redis.del(`credentials:${token}`);
    } else {
      console.log("[Redis] Setting credentials for token:", token);
      // Store with 24 hour expiration
      await redis.set(`credentials:${token}`, JSON.stringify(credentials), {
        ex: 24 * 60 * 60 // 24 hours in seconds
      });
    }
  } catch (error) {
    console.error("[Redis] Error storing credentials:", error);
    throw new Error("Failed to store credentials");
  }
}

export async function getCredentialsFromToken(token: string): Promise<StoredCredentials | null> {
  console.log("[Redis] Getting credentials for token:", token);
  try {
    const credentials = await redis.get(`credentials:${token}`);
    console.log("[Redis] Found credentials:", !!credentials);
    return credentials ? 
      (typeof credentials === 'string' ? JSON.parse(credentials) : credentials) 
      : null;
  } catch (error) {
    console.error("[Redis] Error fetching credentials:", error);
    throw new Error("Failed to fetch credentials");
  }
}
