export interface Position {
  id?: string;
  title: string;
  companyName: string;
  companyId?: string;
  startDate: string;
  endDate?: string;
  type: string;
  jobDuration?: number;
}

export interface School {
  name: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface Note {
  id: string;
  type: string;
  content?: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  firmSlug: string;
  preferredAddress?: string;
  preferredEmailAddress?: string;
  preferredPhoneNumber?: string;
  preferredLinkedinUrl?: string;
  updatedAt: string;
  positions?: Position[];
  schools?: School[];
  notes?: Note[];
  tags?: Array<{ name: string }>;
  matchScore?: number;
  matchedKeywords?: string[];
  shortSummary?: string;
  longSummary?: string;
}
