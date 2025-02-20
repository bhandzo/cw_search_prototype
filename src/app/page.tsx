"use client";

import { useState, useCallback } from "react";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";
import { CandidateCard } from "@/components/candidate-card";
import { ProfileDrawer } from "@/components/profile-drawer";

export default function Home() {
  interface SearchHistoryItem {
    query: string;
    timestamp: number;
    keywords?: Record<string, string[]>;
    resultCount?: number;
    status: "pending" | "complete" | "error";
  }

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [currentResults, setCurrentResults] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const handleSearch = async (query: string) => {
    const timestamp = Date.now();
    setSearchHistory((prev) => [
      ...prev,
      { query, timestamp, status: "pending" },
    ]);

    try {
      // Get structured query from OpenAI
      const openaiResponse = await fetch("/api/openai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: query }),
      });

      const { structuredQuery } = await openaiResponse.json();
      const keywords = JSON.parse(structuredQuery);

      // Get candidates from Clockwork
      const clockworkResponse = await fetch("/api/clockwork-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keywords,
          credentials: JSON.parse(localStorage.getItem("credentials") || "{}")
        }),
      });

      if (!clockworkResponse.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const clockworkData = await clockworkResponse.json();
      const results = clockworkData.peopleSearch || [];

      setCurrentResults(results);
      setSearchHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp
            ? {
                ...item,
                keywords: JSON.parse(structuredQuery),
                resultCount: results.length,
                status: "complete",
              }
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
            <div className="mt-8 grid grid-cols-1 gap-4">
              {searchHistory[0]?.status === "complete" && currentResults.map((person) => {
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
