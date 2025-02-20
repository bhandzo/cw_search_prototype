"use client";

import { useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";

export default function Home() {
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: number }>>([]);

  const handleSearch = (query: string) => {
    setSearchHistory((prev) => [...prev, { query, timestamp: Date.now() }]);
  };

  return (
    <div className="flex min-h-screen">
      {searchHistory.length > 0 && <Sidebar searchHistory={searchHistory} />}
      <main className={`flex-1 flex flex-col ${searchHistory.length === 0 ? 'items-center justify-center' : 'items-center p-24'}`}>
        <SearchBar onSearch={handleSearch} />
      </main>
    </div>
  );
}
