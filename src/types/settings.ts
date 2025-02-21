export interface Credentials {
  firmSlug: string;
  firmApiKey: string;
  clockworkAuthKey: string;
  openaiApiKey?: string;
  maxCandidates: number;
}

export interface SettingsFormData extends Omit<Credentials, 'clockworkAuthKey'> {
  clockworkApiKey: string;
  clockworkApiSecret: string;
}
