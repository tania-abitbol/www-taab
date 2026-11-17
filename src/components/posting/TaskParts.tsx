import { useState } from "react";

import { accountWord, formatMinutes, type CheckItem, type PostingLang } from "~/config/posting";
import { ACCOUNT_TONE, accountGroups, actionLabel } from "~/components/posting/accountTone";

export type SlideLineActions = {
  date: string;
  downloadLabel: string;
  downloadLine: string;
  namesCount: number;
  onDownload: () => void;
  busy?: boolean;
  busyLabel?: string;
  copyLabel: string;
  copiedLabel: string;
  copyLine: string;
  caption: string;
  emptyCaption: string;
  waiting: string;
};

export const emojiFont = { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' };

export const taskEmoji = (id: string) => {
  if (id === "create") return "👩‍💻";
  if (id === "username") return "🏷️";
  if (id === "no-profile") return "🚫";
  if (id.startsWith("photo-")) return "📸";
  if (id.startsWith("bio-")) return "✍️";
  if (id.startsWith("profile-")) return "👤";
  if (id.startsWith("post-")) return "🚀";
  if (id === "bilan") return "📊";
  return "🔥";
};

export const TimeBadge = ({ minutes }: { minutes: number }) => {
  const tone = minutes >= 30 ? "bg-bae-primaryLight" : minutes >= 20 ? "bg-[#FFF3C4]" : "bg-vouv-primaryLight";
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 font-body text-xs font-bold text-black ${tone}`}>
      <span aria-hidden className="text-sm leading-none" style={emojiFont}>
        ⏱️
      </span>
      {formatMinutes(minutes)}
    </span>
  );
};

export const lineClass = (line: string, index: number, large?: boolean) =>
  line.startsWith("•")
    ? "text-sm leading-relaxed"
    : index === 0
      ? `${large ? "text-lg" : ""} font-bold leading-snug`
      : "text-sm leading-relaxed";

export const CopyCaptionButton = ({ id, text, copy, copied }: { id: string; text: string; copy: string; copied: string }) => {
  const [done, setDone] = useState(false);
  const value = text.trim();
  const onCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setDone(true);
  };
  return (
    <button
      id={id}
      type="button"
      disabled={!value}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void onCopy();
      }}
      className="inline-flex h-10 shrink-0 items-center rounded-xl border border-black bg-white px-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
    >
      {done && value ? copied : copy}
    </button>
  );
};

export const TaskCopy = ({
  label,
  large,
  slides,
  copy,
}: {
  label: string;
  large?: boolean;
  slides?: SlideLineActions;
  copy?: { id: string; text: string; copy: string; copied: string };
}) => {
  const lines = label.split("\n").map((line) => line.trim()).filter(Boolean);
  return (
    <span className="flex flex-col gap-1.5">
      {lines.map((line, index) => {
        const key = `${index}-${line.slice(0, 24)}`;
        const plain = line.replace(/^•\s*/, "");
        const textClass = lineClass(line, index, large);
        if (slides && plain === slides.downloadLine) {
          return (
            <span key={key} className="flex flex-wrap items-center gap-2">
              <span className={textClass}>{line}</span>
              {slides.namesCount > 0 ? (
                <button
                  id={`download-slides-${slides.date}`}
                  type="button"
                  disabled={slides.busy}
                  aria-busy={slides.busy || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    slides.onDownload();
                  }}
                  className="inline-flex h-10 shrink-0 items-center rounded-xl bg-black px-3 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
                >
                  {slides.busy ? slides.busyLabel : slides.downloadLabel}
                </button>
              ) : (
                <span className="font-body text-sm font-normal leading-relaxed text-gray-700">{slides.waiting}</span>
              )}
            </span>
          );
        }
        const captionStart = slides?.copyLine.replace(/\.$/, "") ?? "";
        if (slides && captionStart && (plain === slides.copyLine || plain.startsWith(captionStart))) {
          return (
            <span key={key} className="flex flex-wrap items-center gap-2">
              <span className={textClass}>{line}</span>
              <span className="flex min-w-[12rem] flex-1 items-center gap-2">
                <span className="min-w-0 flex-1 rounded-xl bg-gray-100 px-3 py-2 font-body text-sm font-normal leading-relaxed">
                  {slides.caption.trim() || slides.emptyCaption}
                </span>
                {slides.caption.trim() ? (
                  <CopyCaptionButton id={`copy-caption-${slides.date}`} text={slides.caption} copy={slides.copyLabel} copied={slides.copiedLabel} />
                ) : null}
              </span>
            </span>
          );
        }
        if (copy && plain === copy.text) {
          return (
            <span key={key} className="flex flex-wrap items-center gap-2">
              <span className={textClass}>{line}</span>
              <CopyCaptionButton id={copy.id} text={copy.text} copy={copy.copy} copied={copy.copied} />
            </span>
          );
        }
        return (
          <span key={key} className={textClass}>
            {line}
          </span>
        );
      })}
    </span>
  );
};

export const AccountChecks = ({
  checks,
  lang,
  date,
  item,
  clip,
}: {
  checks: CheckItem[];
  lang: PostingLang;
  date: string;
  item: (check: CheckItem, label: string) => JSX.Element;
  clip?: JSX.Element | null;
}) => (
  <div className="mt-4 flex flex-col gap-4">
    {accountGroups(checks).map((group) => {
      const tone = group.account === null ? null : ACCOUNT_TONE[group.account];
      const title = group.account === null ? null : accountWord(group.account, lang);
      return (
        <div
          key={group.items[0].id}
          className={tone ? "rounded-2xl border-2 px-3 py-3" : undefined}
          style={tone ? { borderColor: tone.frame } : undefined}
        >
          {title && tone ? (
            <p className="font-title text-2xl leading-none tracking-tight" style={{ color: tone.ink }}>
              {title}
            </p>
          ) : null}
          <ul className={title ? "mt-3 flex flex-col gap-5" : "flex flex-col gap-5"}>
            {group.items.map((check) =>
              check.banner ? (
                <li key={check.id}>
                  <div className="rounded-2xl border-2 border-black bg-[#FFF3C4] px-3 py-3">
                    <TaskCopy label={check.label} large />
                  </div>
                </li>
              ) : check.id === "bilan" ? (
                <li key={check.id}>
                  <div className="rounded-2xl border-2 border-black bg-[#FFF3C4] px-3 py-3">
                    {item(check, actionLabel(check.label, title))}
                    {clip}
                  </div>
                </li>
              ) : (
                <li key={check.id} className={check.parent ? "ml-8" : ""}>
                  {item(check, actionLabel(check.label, title))}
                </li>
              )
            )}
          </ul>
          {tone && group.items.some((check) => check.goal) ? (
            <p
              id={`session-goal-${date}-${group.account}`}
              className="mt-4 rounded-xl px-3 py-2 font-body text-base font-bold leading-relaxed"
              style={{ backgroundColor: tone.frame, color: tone.ink }}
            >
              {group.items.find((check) => check.goal)?.goal}
            </p>
          ) : null}
        </div>
      );
    })}
  </div>
);

export const TaskFace = ({
  check,
  label,
  large,
  slides,
  copy,
}: {
  check: CheckItem;
  label: string;
  large?: boolean;
  slides?: SlideLineActions;
  copy?: { id: string; text: string; copy: string; copied: string };
}) => (
  <>
    <span aria-hidden className="mt-0.5 text-[1.35rem] leading-none" style={emojiFont}>
      {taskEmoji(check.id)}
    </span>
    <span className="flex min-w-0 flex-1 flex-col gap-2">
      {typeof check.minutes === "number" ? <TimeBadge minutes={check.minutes} /> : null}
      <TaskCopy label={label} large={large} slides={slides} copy={copy} />
      {check.note ? (
        <span className="rounded-xl bg-[#E7F6EC] px-3 py-2 font-body text-sm font-normal leading-relaxed text-[#146C36]">
          {check.note}
        </span>
      ) : null}
    </span>
  </>
);
