interface CandidateCardProps {
  name: string;
  currentPosition: string;
  location: string;
}

export function CandidateCard({ name, currentPosition, location }: CandidateCardProps) {
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <h3 className="font-semibold text-lg">{name}</h3>
      <p className="text-sm text-muted-foreground mt-1">{currentPosition}</p>
      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  );
}
