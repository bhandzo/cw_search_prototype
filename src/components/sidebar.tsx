"use client";

import { EditableKeywords } from "@/components/editable-keywords";
import { SearchHistoryItem } from "@/types/search";

interface SidebarProps {
  searchHistory: SearchHistoryItem[];
  onSearch: (query: string, existingKeywords?: Record<string, string[]>) => void;
}

export function Sidebar({ searchHistory, onSearch }: SidebarProps) {
  return (
    <div className="w-80 h-screen border-r p-4 space-y-4 overflow-y-auto">
      <h2 className="font-semibold">Search History</h2>
      <div className="space-y-2">
        {searchHistory.map((item) => (
          <div
            key={item.timestamp}
            className="p-4 rounded bg-muted space-y-3"
          >
            <div>
              <div className="font-medium text-lg">{item.query}</div>
              {item.resultCount !== undefined && (
                <div className="text-sm text-muted-foreground mt-1">
                  Found {item.resultCount} candidates
                </div>
              )}
            </div>
            
            {item.status === 'pending' && (
              <div className="text-sm text-muted-foreground">Processing...</div>
            )}
            {item.status === 'error' && (
              <div className="text-sm text-destructive">Error processing query</div>
            )}
            {item.keywords && (
              <div className="text-sm space-y-2">
                <EditableKeywords 
                  keywords={item.keywords}
                  onUpdate={(updatedKeywords) => {
                    // Update the search history with new keywords before searching
                    // Trigger a new search with the same query but updated keywords
                    onSearch(item.query, updatedKeywords);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
