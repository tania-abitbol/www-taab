import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { postingUi } from "~/config/postingCopy";

type Labels = {
  play: string;
  close: string;
  loading: string;
  error: string;
  download: string;
  downloading: (percent: number) => string;
  downloadFail: string;
};

const fr = postingUi("fr");
const FRENCH: Labels = {
  play: fr.proofPlay,
  close: fr.proofClose,
  loading: fr.proofLoading,
  error: fr.proofError,
  download: fr.proofDownload,
  downloading: fr.proofDownloading,
  downloadFail: fr.proofDownloadFail,
};

/** The proof route answers in 5 MB slices, so the file is fetched slice by slice. */
const fetchWhole = async (url: string, onProgress: (percent: number) => void) => {
  const parts: BlobPart[] = [];
  let start = 0;
  for (;;) {
    const response = await fetch(url, { cache: "no-store", headers: { range: `bytes=${start}-` } });
    if (!response.ok) throw new Error("download");
    const type = response.headers.get("content-type") || "video/mp4";
    const listed = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") ?? "");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength === 0) throw new Error("download");
    parts.push(bytes);
    if (!listed) return new Blob(parts, { type });
    const total = Number(listed[3]);
    start = Number(listed[2]) + 1;
    onProgress(Math.min(100, Math.round((start / total) * 100)));
    if (start >= total) return new Blob(parts, { type });
  }
};

/** Opens the proof in a sheet. Loading and failure are spelled out, and the file can always be downloaded. */
export const ProofPlayer = ({
  src,
  label,
  fileName,
  labels = {},
}: {
  src: string;
  label: string;
  fileName: string;
  labels?: Partial<Labels>;
}) => {
  const text = { ...FRENCH, ...labels };
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  const mediaSrc = src.startsWith("blob:") || src.startsWith("data:") ? src : `${src}${src.includes("?") ? "&" : "?"}v=2`;
  const download = async () => {
    if (saving !== null) return;
    setSaveError(false);
    try {
      let href = mediaSrc;
      let made = false;
      if (!mediaSrc.startsWith("blob:") && !mediaSrc.startsWith("data:")) {
        setSaving(0);
        const blob = await fetchWhole(mediaSrc, setSaving);
        href = URL.createObjectURL(blob);
        made = true;
      }
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (made) window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(null);
    }
  };
  const downloadButton = (className: string) => (
    <button type="button" onClick={() => void download()} disabled={saving !== null} aria-busy={saving !== null || undefined} className={className}>
      {saving !== null ? text.downloading(saving) : text.download}
    </button>
  );
  const start = () => {
    setState("loading");
    flushSync(() => setOpen(true));
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });
  };
  const stop = () => {
    videoRef.current?.pause();
    setOpen(false);
  };
  return (
    <>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={start}
          aria-label={`${text.play} ${label}`}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-black px-4 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          <span aria-hidden>▶</span>
          {text.play}
        </button>
        {downloadButton(
          "inline-flex h-12 items-center rounded-xl border border-black bg-white px-4 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-60",
        )}
      </div>
      {saveError ? <p className="mt-2 font-body text-sm text-[#C8102E]">{text.downloadFail}</p> : null}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={label}>
          <button type="button" className="absolute inset-0 z-0 cursor-default" aria-label={text.close} onClick={stop} />
          <div className="relative z-10 w-full max-w-sm">
            <div className="relative">
              <video
                ref={videoRef}
                src={mediaSrc}
                controls
                playsInline
                preload="auto"
                onLoadStart={() => setState("loading")}
                onWaiting={() => setState((now) => (now === "error" ? now : "loading"))}
                onCanPlay={() => setState("ready")}
                onPlaying={() => setState("ready")}
                onError={() => setState("error")}
                className={`max-h-[70vh] w-full rounded-2xl bg-black ${state === "error" ? "invisible h-40" : ""}`}
              />
              {state === "loading" ? (
                <p role="status" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-body text-sm font-bold text-white">
                  {text.loading}
                </p>
              ) : null}
              {state === "error" ? (
                <p role="alert" className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#2A1215] px-4 text-center font-body text-sm font-bold text-white">
                  {text.error}
                </p>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {downloadButton(
                "flex h-12 items-center justify-center rounded-xl bg-white px-2 font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60",
              )}
              <button
                type="button"
                onClick={stop}
                className="h-12 rounded-xl border-2 border-white font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {text.close}
              </button>
            </div>
            {saveError ? <p className="mt-2 text-center font-body text-sm font-bold text-white">{text.downloadFail}</p> : null}
          </div>
        </div>
      )}
    </>
  );
};
