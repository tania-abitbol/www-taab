export const BilanPlayer = ({ file }: { file: { name: string; generation: string } }) => (
  <video
    key={file.generation}
    src={`/posting/bilan?v=${file.generation}`}
    controls
    playsInline
    preload="metadata"
    aria-label={file.name}
    className="mt-3 block h-auto max-h-60 w-auto max-w-[200px] rounded-xl bg-black object-contain"
  />
);

export const ProofFeedback = ({
  active,
  percent,
  text,
  error,
}: {
  active: boolean;
  percent: number;
  text: string;
  error: string | null;
}) => {
  if (!active && !error) return null;
  return (
    <div className="mt-2">
      {active && (
        <>
          <p className="font-body text-sm text-gray-700">{text}</p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={text}
            className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200"
          >
            <div className="h-full bg-black" style={{ width: `${percent}%` }} />
          </div>
        </>
      )}
      {error && <p className="mt-2 font-body text-sm text-[#C8102E]">{error}</p>}
    </div>
  );
};
