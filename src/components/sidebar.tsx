"use client";

interface SearchHistory {
  query: string;
  timestamp: number;
}

interface SidebarProps {
  searchHistory: SearchHistory[];
}

export function Sidebar({ searchHistory }: SidebarProps) {
  return (
    <div className="w-80 h-screen border-r p-4 space-y-4">
      <h2 className="font-semibold">Search History</h2>
      <div className="space-y-2">
        {searchHistory.map((item) => (
          <div
            key={item.timestamp}
            className="p-2 rounded bg-muted"
          >
            {item.query}
          </div>
        ))}
      </div>
    </div>
  );
}
