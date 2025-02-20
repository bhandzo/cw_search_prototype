interface CandidateCardProps {
  name: string;
  currentPosition: string;
  location: string;
  matchScore?: number;
}

export function CandidateCard({ name, currentPosition, location, matchScore }: CandidateCardProps) {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{name}</h3>
        {matchScore && (
          <span className="text-sm px-2 py-1 bg-secondary rounded">
            Matched {matchScore} {matchScore === 1 ? 'keyword' : 'keywords'}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">{currentPosition}</p>
      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  );
}
