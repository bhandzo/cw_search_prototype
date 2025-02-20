"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";

export default function Home() {
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
      const response = await fetch("/api/openai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: query }),
      });

      const data = await response.json();

      setSearchHistory((prev) =>
        prev.map((item) =>
          item.timestamp === timestamp
            ? {
                ...item,
                structuredQuery: data.structuredQuery,
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
      {searchHistory.length > 0 && <Sidebar searchHistory={searchHistory} />}
      <main
        className={`flex-1 flex flex-col ${
          searchHistory.length === 0
            ? "items-center justify-center"
            : "items-center p-24"
        }`}
      >
        <SearchBar onSearch={handleSearch} />
      </main>
    </div>
  );
}
