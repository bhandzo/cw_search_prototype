"use client";

import { Person } from "@/types/clockwork";

interface CandidateCardProps {
  name: string;
  currentPosition: string;
  location: string;
  matchScore?: number;
  person: Person;
  keywords: string[];
  onSelect: (person: Person) => void;
  summarizing: boolean;
}

export function CandidateCard({ 
  name, 
  currentPosition, 
  location, 
  matchScore,
  person,
  keywords,
  onSelect,
  summarizing
}: CandidateCardProps) {

  return (
    <>
      <div 
        className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white cursor-pointer"
        onClick={() => onSelect(person)}
      >
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{name}</h3>
        {matchScore && (
          <span className="text-sm px-2 py-1 bg-secondary rounded">
            Matched {matchScore} {matchScore === 1 ? 'keyword' : 'keywords'}: {person.matchedKeywords?.join(', ')}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{currentPosition}</p>
      <p className="text-sm text-muted-foreground">{location}</p>
      
      {/* Summaries Section */}
      {(person.shortSummary || person.longSummary) && (
        <div className="mt-4 space-y-2">
          {person.shortSummary && (
            <p className="text-sm" dangerouslySetInnerHTML={{
              __html: keywords.reduce((text, keyword) => {
                const regex = new RegExp(`(${keyword})`, 'gi');
                return text.replace(regex, '<strong>$1</strong>');
              }, person.shortSummary)
            }} />
          )}
          {person.longSummary && (
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{
              __html: keywords.reduce((text, keyword) => {
                const regex = new RegExp(`(${keyword})`, 'gi');
                return text.replace(regex, '<strong>$1</strong>');
              }, person.longSummary)
            }} />
          )}
        </div>
      )}
      
      {/* Loading State for Summaries */}
      {summarizing && !person.shortSummary && (
        <div className="mt-4 animate-pulse">
          <div className="h-4 bg-secondary rounded w-3/4"></div>
          <div className="h-4 bg-secondary rounded w-1/2 mt-2"></div>
        </div>
      )}
      
      {/* Matched Content Section */}
      {keywords.length > 0 && (
        <div className="mt-4 text-sm space-y-2">
          {Object.entries(person).some(([key, value]) => {
            if (typeof value !== 'string' || key === 'shortSummary' || key === 'longSummary') return false;
            return keywords.some(keyword => 
              value.toLowerCase().includes(keyword.toLowerCase())
            );
          }) && (
            <>
              <h4 className="font-medium">Matched Content:</h4>
              <div className="space-y-1">
                {Object.entries(person).map(([key, value]) => {
                  if (typeof value !== 'string' || key === 'shortSummary' || key === 'longSummary') return null;
                  
                  const matchedKeywords = keywords.filter(keyword => 
                    value.toLowerCase().includes(keyword.toLowerCase())
                  );
                  
                  if (matchedKeywords.length === 0) return null;
                  
                  let highlightedText = value;
                  matchedKeywords.forEach(keyword => {
                    const regex = new RegExp(`(${keyword})`, 'gi');
                    highlightedText = highlightedText.replace(regex, '**$1**');
                  });
                  
                  return (
                    <div key={key}>
                      <span className="italic">{key}:</span>{' '}
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </>
  );
}
