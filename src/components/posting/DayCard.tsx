import { useState, type ReactNode } from "react";

const isVideo = (file: File) => file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm|3gp)$/i.test(file.name);

export type DayCardProps = {
  date: string;
  heading: string;
  title: string;
  isToday: boolean;
  labels: {
    today: string;
    noTasks: string;
    noTasksBody: string;
    proof: string;
    proofBody: string;
    proofDrop: string;
    proofDropHint: string;
    proofDropReplace: string;
    proofDropActive: string;
    proofDropWrong: string;
    validate: string;
    validated: string;
    progress: (done: number, total: number) => string;
  };
  done: number;
  total: number;
  validated: boolean;
  hasProof: boolean;
  proofName: string | null;
  uploading: boolean;
  canValidate: boolean;
  hint: string;
  slots: ReactNode;
  checklist: ReactNode | null;
  proofExtra: ReactNode;
  onProofFile: (file: File | undefined) => void;
  onValidate: () => void;
};

/** A worker day. Collapsed it is a one-line summary; open it holds the whole session. */
export const DayCard = ({
  open,
  onToggle,
  ...day
}: DayCardProps & { open: boolean; onToggle: () => void }) => {
  const { labels } = day;
  const [dragging, setDragging] = useState(false);
  const [wrongFile, setWrongFile] = useState(false);
  const takeFile = (file: File | undefined) => {
    if (!file) return;
    if (!isVideo(file)) {
      setWrongFile(true);
      return;
    }
    setWrongFile(false);
    day.onProofFile(file);
  };
  const hasTasks = day.checklist !== null;
  const chip = day.validated
    ? { text: labels.validated, className: "bg-[#E7F6EC] text-[#146C36]" }
    : !hasTasks
      ? { text: labels.noTasks, className: "bg-gray-100 text-gray-700" }
      : { text: labels.progress(day.done, day.total), className: "bg-[#FFF3C4] text-black" };
  return (
    <section
      id={`day-${day.date}`}
      aria-current={day.isToday ? "date" : undefined}
      className={`rounded-3xl bg-white shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] ${day.isToday ? "ring-2 ring-black" : ""}`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`day-body-${day.date}`}
        onClick={onToggle}
        className="flex min-h-16 w-full items-center gap-3 rounded-3xl px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 font-body text-sm text-gray-700">
            {day.heading}
            {day.isToday ? <span className="rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">{labels.today}</span> : null}
          </span>
          <span className="font-title text-2xl leading-tight tracking-tight">{day.title}</span>
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 font-body text-xs font-bold ${chip.className}`}>{chip.text}</span>
        <span aria-hidden className={`shrink-0 font-body text-lg transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      <div id={`day-body-${day.date}`} hidden={!open} className="px-4 pb-4">
        {day.slots}
        {hasTasks ? (
          <>
            <div className="mt-5">{day.checklist}</div>
            <div className="mt-4 rounded-2xl bg-gray-100 p-3">
              <h3 className="font-body text-base font-bold">{labels.proof}</h3>
              <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">{labels.proofBody}</p>
              <label
                htmlFor={`proof-drop-${day.date}`}
                id={`proof-zone-${day.date}`}
                aria-disabled={day.uploading || undefined}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  if (!day.uploading) takeFile(event.dataTransfer.files?.[0]);
                }}
                className={`mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-5 text-center font-body focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2 ${
                  dragging ? "border-black bg-[#FFF3C4]" : "border-gray-400 bg-white hover:border-black"
                } ${day.uploading ? "pointer-events-none opacity-40" : ""}`}
              >
                <span aria-hidden className="text-3xl leading-none">
                  🎥
                </span>
                <span className="text-base font-bold leading-snug">
                  {dragging ? labels.proofDropActive : day.hasProof ? labels.proofDropReplace : labels.proofDrop}
                </span>
                <span className="text-sm leading-relaxed text-gray-700">{labels.proofDropHint}</span>
                <input
                  id={`proof-drop-${day.date}`}
                  type="file"
                  accept="video/*"
                  disabled={day.uploading}
                  onChange={(event) => {
                    takeFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>
              {wrongFile ? <p className="mt-2 font-body text-sm text-[#C8102E]">{labels.proofDropWrong}</p> : null}
              {day.proofName ? <p className="mt-2 break-all font-body text-sm font-bold">{day.proofName}</p> : null}
              {day.proofExtra}
            </div>
            <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-gray-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
                <button
                  id={`validate-day-${day.date}`}
                  type="button"
                  disabled={!day.canValidate || day.validated}
                  onClick={day.onValidate}
                  className="h-12 w-full rounded-xl bg-black px-2 font-body text-sm font-bold leading-tight text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
                >
                  {day.validated ? labels.validated : labels.validate}
                </button>
              {!day.validated ? <p className="mt-2 font-body text-sm text-gray-700">{day.hint}</p> : null}
            </div>
          </>
        ) : (
          <div id={`no-tasks-${day.date}`} className="mt-5 rounded-2xl bg-gray-100 px-3 py-4">
            <p className="font-body text-base font-bold">{labels.noTasks}</p>
            <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">{labels.noTasksBody}</p>
          </div>
        )}
      </div>
    </section>
  );
};
