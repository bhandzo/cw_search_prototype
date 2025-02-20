// Define the SearchStatus type
type SearchStatus =
  | "generating-criteria"
  | "searching-clockwork"
  | "fetching-notes"
  | "summarizing"
  | "complete"
  | "error";

interface LoadingStatusProps {
  status: SearchStatus;
}

export function LoadingStatus({ status }: LoadingStatusProps) {
  const statusMessages: Record<SearchStatus, string> = {
    "generating-criteria": "Generating search criteria...",
    "searching-clockwork": "Searching for candidates...",
    "fetching-notes": "Retrieving candidate notes...",
    summarizing: "Generating candidate summaries...",
    complete: "Search complete",
    error: "Error occurred during search",
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      {status !== "complete" && status !== "error" && (
        <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent" />
      )}
      <span>{statusMessages[status]}</span>
    </div>
  );
}
