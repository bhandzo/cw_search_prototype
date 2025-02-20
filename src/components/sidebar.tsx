"use client";

import { SearchBar } from "@/components/search-bar";

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  keywords?: Record<string, string[]>;
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
            {item.keywords && (
              <div className="text-sm text-muted-foreground space-y-2">
                <EditableKeywords 
                  keywords={item.keywords}
                  onUpdate={(updatedKeywords) => {
                    onSearch(item.query);
                  }}
                />
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
