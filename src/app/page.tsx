"use client";

import { useState } from "react";
import { LoadingStatus } from "@/components/loading-status";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";
import { CandidateCard } from "@/components/candidate-card";
import { ProfileDrawer } from "@/components/profile-drawer";

export default function Home() {
  type SearchStatus = 
    | "generating-criteria"
    | "searching-clockwork" 
    | "fetching-notes"
    | "summarizing"
    | "complete"
    | "error";

  interface SearchHistoryItem {
    query: string;
    timestamp: number;
    keywords?: Record<string, string[]>;
    resultCount?: number;
    status: SearchStatus;
    results?: any[];
  }

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [currentResults, setCurrentResults] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const handleSearch = async (query: string, existingKeywords?: Record<string, string[]>) => {
    const timestamp = Date.now();
    setSearchHistory((prev) => [
      { query, timestamp, status: "generating-criteria" },
      ...prev,
    ]);

    try {
      let keywords;
      if (existingKeywords) {
        keywords = existingKeywords;
      } else {
        const openaiResponse = await fetch("/api/openai-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInput: query }),
        });
        const response = await openaiResponse.json();
        keywords = JSON.parse(response.structuredQuery);
      }

      const clockworkResponse = await fetch("/api/clockwork-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          originalQuery: query,
          credentials: JSON.parse(localStorage.getItem("credentials") || "{}"),
        }),
      });

      if (!clockworkResponse.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const reader = clockworkResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const update = JSON.parse(line);
            
            switch (update.type) {
              case 'initial':
                setCurrentResults(update.peopleSearch);
                setSearchHistory((prev) =>
                  prev.map((item) =>
                    item.timestamp === timestamp
                      ? {
                          ...item,
                          keywords,
                          resultCount: update.peopleSearch.length,
                          results: update.peopleSearch,
                          status: "fetching-notes"
                        }
                      : item
                  )
                );
                break;

              case 'notes':
                setCurrentResults(prev =>
                  prev.map(person =>
                    person.id === update.personId
                      ? { ...person, notes: update.notes }
                      : person
                  )
                );
                setSearchHistory((prev) =>
                  prev.map((item) =>
                    item.timestamp === timestamp
                      ? { ...item, status: "summarizing" }
                      : item
                  )
                );
                break;

              case 'summary':
                setCurrentResults(prev =>
                  prev.map(person =>
                    person.id === update.personId
                      ? {
                          ...person,
                          shortSummary: update.shortSummary,
                          longSummary: update.longSummary
                        }
                      : person
                  )
                );
                break;
            }
          } catch (e) {
            console.error('Error parsing update:', e);
          }
        }
      }

      // Mark search as complete
      setSearchHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp
            ? { ...item, status: "complete" }
            : item
        )
      );
    } catch (error) {
      setSearchHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp ? { ...item, status: "error" } : item
        )
      );
    }
  };

  return (
    <div className="flex min-h-screen">
      {searchHistory.length > 0 ? (
        <>
          <Sidebar searchHistory={searchHistory} onSearch={handleSearch} />
          <main className="flex-1 p-8 flex flex-col">
            <SearchBar onSearch={handleSearch} />
            <div className="mt-4">
              <LoadingStatus status={searchHistory[0].status} />
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4">
              {currentResults.map((person) => {
                const keywords = searchHistory[0]?.keywords
                  ? Object.values(searchHistory[0].keywords).flat()
                  : [];
                
                return (
                  <CandidateCard
                    key={person.id}
                    name={person.name}
                    currentPosition={person.positions?.[0]?.title || 'Unknown'}
                    location={person.preferredAddress || 'Unknown'}
                    matchScore={person.matchScore}
                    person={person}
                    keywords={keywords}
                    onSelect={setSelectedPerson}
                    summarizing={searchHistory[0].status === "summarizing"}
                  />
                );
              })}
            </div>
          </main>
        </>
      ) : (
        <main className="flex-1 flex items-center justify-center">
          <SearchBar onSearch={handleSearch} />
        </main>
      )}
      <ProfileDrawer 
        person={selectedPerson}
        open={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </div>
  );
}
