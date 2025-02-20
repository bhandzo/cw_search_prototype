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
  status: SearchStatus;
  keywords?: Record<string, string[]>;
  resultCount?: number;
  results?: Person[];
}
