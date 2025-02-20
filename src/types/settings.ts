export interface Credentials {
  firmSlug: string;
  firmApiKey: string;
  clockworkAuthKey: string;
  openaiApiKey?: string;
}

export interface SettingsFormData {
  firmSlug: string;
  firmApiKey: string;
  clockworkApiKey: string;
  clockworkApiSecret: string;
  openaiApiKey: string;
}
