export interface Credentials {
  firmSlug: string;
  firmApiKey: string;
  clockworkAuthKey: string;
  openaiApiKey: string;
  maxCandidates: number;
}

export interface StoredCredentials extends Credentials {
  userId: string;      // Link to the user's session
  createdAt: number;   // When credentials were first stored
  updatedAt: number;   // When credentials were last updated
}
