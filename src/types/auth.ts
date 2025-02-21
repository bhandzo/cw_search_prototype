export interface Credentials {
  firmSlug: string;
  firmApiKey: string;
  clockworkAuthKey: string;
  openaiApiKey: string;
  maxCandidates: number;
}

export interface StoredCredentials extends Omit<Credentials, 'clockworkAuthKey'> {
  clockworkAuthKey?: string;  // May be null when deleting
  userId?: string;           // Optional since we don't always have user context
  createdAt?: number;        // Optional for backward compatibility
  updatedAt?: number;        // Optional for backward compatibility
}

export interface DecodedCredentials extends Omit<Credentials, 'clockworkAuthKey'> {
  clockworkApiKey: string;
  clockworkApiSecret: string;
}
