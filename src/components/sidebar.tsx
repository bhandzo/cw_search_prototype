"use client";

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  structuredQuery?: {
    role?: string;
    skills?: string[];
    location?: string;
    experience?: string;
  };
  status: 'pending' | 'complete' | 'error';
}

interface SidebarProps {
  searchHistory: SearchHistoryItem[];
}

export function Sidebar({ searchHistory }: SidebarProps) {
  return (
    <div className="w-80 h-screen border-r p-4 space-y-4">
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
              <div className="text-sm text-muted-foreground">
                <div>Role: {item.structuredQuery.role}</div>
                {item.structuredQuery.skills && (
                  <div>Skills: {item.structuredQuery.skills.join(', ')}</div>
                )}
                {item.structuredQuery.location && (
                  <div>Location: {item.structuredQuery.location}</div>
                )}
                {item.structuredQuery.experience && (
                  <div>Experience: {item.structuredQuery.experience}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
