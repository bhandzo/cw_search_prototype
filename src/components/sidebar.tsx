"use client";

import { SearchBar } from "@/components/search-bar";

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  structuredQuery?: string;
  candidates?: Array<{
    id: string;
    name: string;
    currentPosition: string;
    location: string;
  }>;
  status: 'pending' | 'complete' | 'error';
}

interface SidebarProps {
  searchHistory: SearchHistoryItem[];
  onSearch: (query: string) => void;
}

export function Sidebar({ searchHistory, onSearch }: SidebarProps) {
  return (
    <div className="w-80 h-screen border-r p-4 space-y-4 overflow-y-auto">
      <h2 className="font-semibold">Search History</h2>
      <div className="space-y-2">
        {searchHistory.map((item) => (
          <div
            key={item.timestamp}
            className="p-2 rounded bg-muted space-y-2"
          >
            <div className="font-medium">{item.query}</div>
            {item.status === 'pending' && (
              <div className="text-sm text-muted-foreground">Processing...</div>
            )}
            {item.status === 'error' && (
              <div className="text-sm text-destructive">Error processing query</div>
            )}
            {item.structuredQuery && (
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="font-medium">Search Keywords:</div>
                <div className="font-mono text-xs bg-muted p-2 rounded whitespace-pre-wrap break-all">
                  {item.structuredQuery.split(',').map((keyword, i) => (
                    <div key={i} className="inline-block m-1 px-2 py-1 bg-secondary rounded">
                      {keyword.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {item.resultCount !== undefined && (
              <div className="text-sm text-muted-foreground">
                Found {item.resultCount} candidates
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
