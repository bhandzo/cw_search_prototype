"use client";

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
      <div className="space-y-4">
        <SearchBar onSearch={onSearch} />
        <h2 className="font-semibold">Search History</h2>
      </div>
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
                <div className="font-medium">Elasticsearch Query:</div>
                <div className="font-mono text-xs bg-muted p-2 rounded whitespace-pre-wrap break-all">
                  {item.structuredQuery.split(' AND ').map((clause, i) => (
                    <div key={i}>
                      {i > 0 && <span className="text-blue-500 font-bold"> AND </span>}
                      {clause.includes(' OR ') ? (
                        clause.split(' OR ').map((orClause, j) => (
                          <span key={j}>
                            {j > 0 && <span className="text-green-500 font-bold"> OR </span>}
                            {orClause.includes('NOT ') ? (
                              <>
                                <span className="text-red-500 font-bold">NOT </span>
                                {orClause.replace('NOT ', '')}
                              </>
                            ) : orClause}
                          </span>
                        ))
                      ) : clause.includes('NOT ') ? (
                        <>
                          <span className="text-red-500 font-bold">NOT </span>
                          {clause.replace('NOT ', '')}
                        </>
                      ) : clause}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {item.candidates && item.candidates.length > 0 && (
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="font-medium">Candidates:</div>
                <div className="space-y-1">
                  {item.candidates.map((candidate) => (
                    <div key={candidate.id} className="text-sm">
                      {candidate.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
