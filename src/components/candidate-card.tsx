"use client";

interface CandidateCardProps {
  name: string;
  currentPosition: string;
  location: string;
  matchScore?: number;
  person: any;
  keywords: string[];
  onSelect: (person: any) => void;
}

export function CandidateCard({ 
  name, 
  currentPosition, 
  location, 
  matchScore,
  person,
  keywords,
  onSelect
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
      
      {keywords.length > 0 && (
        <div className="mt-4 text-sm space-y-2">
          <h4 className="font-medium">Matched Content:</h4>
          <div className="space-y-1">
            {Object.entries(person).map(([key, value]) => {
              if (typeof value !== 'string') return null;
              
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
        </div>
      )}
      </div>
    </>
  );
}
