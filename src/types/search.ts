 import { Person } from "@/types/clockwork";

export type SearchStatus =
  | "generating-criteria"
  | "searching-clockwork"
  | "fetching-notes"
  | "summarizing"
  | "complete"
  | "error"
  | "pending";

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  keywords?: Record<string, string[]>;
  resultCount?: number;
  status: SearchStatus;
  results?: Person[];
}
