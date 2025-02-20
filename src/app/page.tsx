"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";
import { CandidateCard } from "@/components/candidate-card";

export default function Home() {
  interface SearchHistoryItem {
    query: string;
    timestamp: number;
    structuredQuery?: string;
    resultCount?: number;
    status: "pending" | "complete" | "error";
  }

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

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

      const openaiData = await openaiResponse.json();

      // Get candidates from Clockwork
      const clockworkResponse = await fetch("/api/clockwork-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: openaiData.structuredQuery,
          clockworkApiKey: "mock-key",
          firmApiKey: "mock-key",
          firmSlug: "mock-slug"
        }),
      });

      const clockworkData = await clockworkResponse.json();

      setSearchHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp
            ? {
                ...item,
                structuredQuery: openaiData.structuredQuery,
                resultCount: clockworkData.peopleSearch.length,
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
              {searchHistory[0]?.status === "complete" && clockworkData?.peopleSearch.map((person: any) => (
                <CandidateCard
                  key={candidate.id}
                  name={candidate.name}
                  currentPosition={candidate.currentPosition}
                  location={candidate.location}
                />
              ))}
            </div>
          </main>
        </>
      ) : (
        <main className="flex-1 flex items-center justify-center">
          <SearchBar onSearch={handleSearch} />
        </main>
      )}
    </div>
  );
}
