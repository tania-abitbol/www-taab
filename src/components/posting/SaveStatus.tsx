export type SaveState = "synced" | "pending" | "error";

export const SaveStatus = ({
  state,
  labels,
  onRetry,
}: {
  state: SaveState;
  labels: { synced: string; pending: string; error: string; retry: string };
  onRetry: () => void;
}) => {
  const tone =
    state === "error" ? "bg-[#FDE2E4] text-[#8A0F22]" : state === "pending" ? "bg-[#FFF3C4] text-black" : "bg-[#E7F6EC] text-[#146C36]";
  const dot = state === "error" ? "bg-[#C8102E]" : state === "pending" ? "bg-[#D99A00] animate-pulse" : "bg-[#1E8E4A]";
  return (
    <div id="save-status" role="status" aria-live="polite" className={`flex min-h-12 items-center gap-2 rounded-xl px-3 font-body text-sm font-bold ${tone}`}>
      <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <span className="flex-1">{labels[state]}</span>
      {state === "error" ? (
        <button
          type="button"
          onClick={onRetry}
          className="h-10 shrink-0 rounded-lg bg-black px-3 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          {labels.retry}
        </button>
      ) : null}
    </div>
  );
};
