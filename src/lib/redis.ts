// Temporary in-memory storage for development
const tokenStore = new Map<string, any>();

export async function storeCredentials(token: string, credentials: any): Promise<void> {
  console.log("[Redis] Storing credentials for token:", token);
  if (credentials === null) {
    console.log("[Redis] Deleting credentials for token:", token);
    tokenStore.delete(token);
  } else {
    console.log("[Redis] Setting credentials for token:", token);
    tokenStore.set(token, credentials);
  }
  console.log("[Redis] Current store size:", tokenStore.size);
}

export async function getCredentialsFromToken(token: string): Promise<any> {
  console.log("[Redis] Getting credentials for token:", token);
  const credentials = tokenStore.get(token);
  console.log("[Redis] Found credentials:", !!credentials);
  return credentials || null;
}
