export interface UserSession {
  id: string;          // Unique session identifier
  createdAt: number;   // Timestamp of session creation
  expiresAt: number;   // Timestamp of session expiration
  lastUsed: number;    // Timestamp of last activity
}

export interface StoredCredentials extends Credentials {
  userId: string;      // Link to the user's session
  createdAt: number;   // When credentials were first stored
  updatedAt: number;   // When credentials were last updated
}
