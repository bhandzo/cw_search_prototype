interface LoadingStatusProps {
  status: SearchStatus;
}

export function LoadingStatus({ status }: LoadingStatusProps) {
  const statusMessages = {
    "generating-criteria": "Analyzing search criteria...",
    "searching-clockwork": "Searching for candidates...",
    "fetching-notes": "Retrieving candidate notes...",
    "summarizing": "Generating candidate summaries...",
    "complete": "Search complete",
    "error": "Error occurred during search"
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
