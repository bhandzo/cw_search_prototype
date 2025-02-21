"use client";

import { useEffect, useState } from "react";
import { Person, Note } from "@/types/clockwork";
import { SearchHistoryItem } from "@/types/search";
import { LoadingStatus } from "@/components/loading-status";
import { SearchBar } from "@/components/search-bar";
import { Sidebar } from "@/components/sidebar";
import { CandidateCard } from "@/components/candidate-card";
import { ProfileDrawer } from "@/components/profile-drawer";
import { SettingsDialog } from "@/components/settings-dialog";

export default function Home() {

  const [sessionToken, setSessionToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [currentResults, setCurrentResults] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const checkCredentials = async () => {
      const token = localStorage.getItem('sessionToken');
      if (!token) return;

      try {
        const response = await fetch("/api/credentials", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          localStorage.removeItem('sessionToken');
          setSessionToken(null);
        }
      } catch (error) {
        console.error("Error checking credentials:", error);
        localStorage.removeItem('sessionToken');
        setSessionToken(null);
      }
    };

    checkCredentials();
  }, []);

  const handleSearch = async (
    query: string,
    existingKeywords?: Record<string, string[]>
  ) => {
    try {
      if (!sessionToken) {
        setShowSettings(true);
        return;
      }

      const credentialsResponse = await fetch("/api/credentials", {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      console.log("Credentials verification response:", credentialsResponse.status);
      
      if (!credentialsResponse.ok) {
        if (credentialsResponse.status === 401) {
          localStorage.removeItem('sessionToken');
          setSessionToken(null);
        }
        throw new Error("Please configure your credentials");
      }

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
          }),
        });

        if (!clockworkResponse.ok) {
          throw new Error("Failed to fetch candidates");
        }

        const reader = clockworkResponse.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const update = JSON.parse(line);

              switch (update.type) {
                case "initial":
                  setCurrentResults(update.peopleSearch);
                  setSearchHistory((prev) =>
                    prev.map((item) =>
                      item.timestamp === timestamp
                        ? {
                            ...item,
                            keywords,
                            resultCount: update.peopleSearch.length,
                            results: update.peopleSearch,
                            status: "fetching-notes",
                          }
                        : item
                    )
                  );
                  break;

                case "notes":
                  setCurrentResults((prev) =>
                    prev.map((person) =>
                      person.id === update.personId
                        ? {
                            ...person,
                            notes: update.notes?.map((note: Note) => ({
                              ...note,
                              content: note.content
                                ?.replace(/<[^>]*>/g, "") // Remove HTML tags
                                ?.substring(0, 500), // Limit content length
                            })),
                          }
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

                case "summary":
                  setCurrentResults((prev) =>
                    prev.map((person) =>
                      person.id === update.personId
                        ? {
                            ...person,
                            shortSummary: update.shortSummary,
                            longSummary: update.longSummary,
                          }
                        : person
                    )
                  );
                  break;
              }
            } catch (e) {
              console.error("Error parsing update:", e);
            }
          }
        }

        // Mark search as complete
        setSearchHistory((prev) =>
          prev.map((item) =>
            item.timestamp === timestamp ? { ...item, status: "complete" } : item
          )
        );
      } catch (error) {
        console.error("Error in search:", error);
        console.error("Search error:", error);
        setSearchHistory((prev) => [
          { 
            query, 
            timestamp: Date.now(), 
            status: "error",
            error: error instanceof Error ? error.message : "An error occurred during search"
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Credentials error:", error);
      setSearchHistory((prev) => [
        {
          query,
          timestamp: Date.now(),
          status: "error",
          error: "Please configure your credentials"
        },
        ...prev,
      ]);
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
                    currentPosition={person.positions?.[0]?.title || "Unknown"}
                    location={person.preferredAddress || "Unknown"}
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
      <SettingsDialog 
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
