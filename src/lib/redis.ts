// Temporary in-memory storage for development
const tokenStore = new Map<string, any>();

export async function storeCredentials(token: string, credentials: any): Promise<void> {
  if (credentials === null) {
    tokenStore.delete(token);
  } else {
    tokenStore.set(token, credentials);
  }
}

export async function getCredentialsFromToken(token: string): Promise<any> {
  return tokenStore.get(token) || null;
}
