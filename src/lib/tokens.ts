import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-please-change-in-production'
);

interface Credentials {
  firmSlug: string;
  firmApiKey: string;
  clockworkAuthKey: string;
  openaiApiKey: string;
  maxCandidates: number;
}

export const tokenService = {
  async createToken(credentials: Credentials): Promise<string> {
    return await new SignJWT(credentials)
      .setProtectedHeader({ alg: 'HS256' })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
  },

  async getCredentials(token: string): Promise<Credentials | null> {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload as Credentials;
    } catch (error) {
      return null;
    }
  }
};
