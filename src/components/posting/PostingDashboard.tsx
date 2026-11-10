"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import {
  ACCOUNTS,
  CALENDAR_END,
  CALENDAR_START,
  DAY_PLANS,
  calendarDates,
  chooseSlot,
  DayState,
  Desk,
  SLOTS,
  SlotId,
  checksFor,
  dayHeading,
  emptyDayState,
  CheckItem,
  formatDay,
  formatMinutes,
  formatShortDay,
  isSlotId,
  madridToday,
  PostingLang,
  accountWord,
  displayName,
  langFromName,
  personMark,
  postingUi,
  slotsFor,
  taskIsHers,
} from "~/config/posting";
import { leavePosting } from "~/app/dashboard/creator/actions";
import {   addManagedProfile, commitProof, deleteManagedProfile, deleteValidatedDay, prepareProofUpload, saveManagedProfile, saveMyDay } from "~/app/posting/actions";
import { PROOF_PART_BYTES, proofPartCount, type DayWork, type ProfileWork, type ProofRecord } from "~/server/postingProofs";
import { deleteBlob, loadBlob, readDesk, saveBlob, writeDesk } from "~/components/posting/storage";

type ManagedProfile = { id: string; name: string; code?: string };

const hourText = (short: string) => {
  const [start, end] = short.split("–");
  return `${start}h–${end}h`;
};

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1";

const emojiFont = { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' };

const taskEmoji = (id: string) => {
  if (id === "create") return "👩‍💻";
  if (id === "username") return "🏷️";
  if (id === "no-profile") return "🚫";
  if (id.startsWith("photo-")) return "📸";
  if (id.startsWith("bio-")) return "✍️";
  if (id.startsWith("profile-")) return "👤";
  if (id.startsWith("post-")) return "🚀";
  return "🔥";
};

const TimeBadge = ({ minutes }: { minutes: number }) => {
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

const lineClass = (line: string, index: number, large?: boolean) =>
  line.startsWith("•")
    ? "text-sm leading-relaxed"
    : index === 0
      ? `${large ? "text-lg" : ""} font-bold leading-snug`
      : "text-sm leading-relaxed";

const CopyCaptionButton = ({ id, text, copy, copied }: { id: string; text: string; copy: string; copied: string }) => {
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

const TaskCopy = ({
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
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    slides.onDownload();
                  }}
                  className="inline-flex h-10 shrink-0 items-center rounded-xl bg-black px-3 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {slides.downloadLabel}
                </button>
              ) : (
                <span className="font-body text-sm font-normal leading-relaxed text-gray-700">{slides.waiting}</span>
              )}
            </span>
          );
        }
        if (slides && plain === slides.copyLine) {
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

const ACCOUNT_TONE = [
  { ink: "#1D6FB8", frame: "#9DCEF5" },
  { ink: "#C45C12", frame: "#F3C091" },
  { ink: "#6B3FA0", frame: "#D2B4EE" },
] as const;

const accountIndexFromId = (id: string) => (id.endsWith("-fr") ? 0 : id.endsWith("-es") ? 1 : id.endsWith("-us") ? 2 : null);

const accountGroups = (checks: CheckItem[]) => {
  const groups: { account: number | null; items: CheckItem[] }[] = [];
  for (const check of checks) {
    const account = accountIndexFromId(check.id);
    const last = groups[groups.length - 1];
    if (last && last.account === account) last.items.push(check);
    else groups.push({ account, items: [check] });
  }
  return groups;
};

const actionLabel = (label: string, title: string | null) =>
  title && label.startsWith(`${title}\n`) ? label.slice(title.length + 1) : label;

const AccountChecks = ({
  checks,
  lang,
  item,
}: {
  checks: CheckItem[];
  lang: PostingLang;
  item: (check: CheckItem, label: string) => JSX.Element;
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
            {group.items.map((check) => (
              <li key={check.id} className={check.parent ? "ml-8" : ""}>
                {item(check, actionLabel(check.label, title))}
              </li>
            ))}
          </ul>
        </div>
      );
    })}
  </div>
);

const TaskFace = ({
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

const proofKey = (personId: string, date: string) => `proof:${personId}:${date}`;
const SLIDES_FROM = "2026-11-10";
const SLIDES_UNTIL = "2026-11-15";
const slideKey = (date: string, profileId: string, index = 0) => `tania:${date}:${profileId}:${index}`;
const legacySlideKey = (date: string, accountId: string) => `tania:${date}:${accountId}`;
const accountForLang = (value: PostingLang) => (value === "es" ? "es" : value === "en" ? "us" : "fr");
const slideStorageId = (profileId: string, accountId: string) => `${profileId}__${accountId}`;
const girlRank = (name: string) => {
  const key = displayName(name).toLowerCase();
  if (key === "ghada") return 0;
  if (key === "peches") return 1;
  if (key === "karol") return 2;
  return 3;
};
const slideGirls = (people: { id: string; name: string }[]) =>
  [...people].filter((worker) => girlRank(worker.name) < 3).sort((a, b) => girlRank(a.name) - girlRank(b.name));
const slideCardTitle = (name: string) => {
  const key = displayName(name).toLowerCase();
  if (key === "ghada") return "Ghada - FR";
  if (key === "peches") return "Peches - ES";
  if (key === "karol") return "Karol - EN";
  return displayName(name);
};
const slideCopy = {
  fr: {
    button: "Télécharger toutes les images",
    note: "Tu fais le diaporama avec ces images.",
    download: "Télécharger les images",
    downloadLine: "Tu le télécharges ici.",
    copy: "Copier",
    copyLine: "Copie cette description.",
    copied: "Copié.",
    noCaption: "Pas encore de description.",
  },
  es: {
    button: "Descargar todas las imágenes",
    note: "Haces el carrusel con estas imágenes.",
    download: "Descargar las imágenes",
    downloadLine: "Lo descargas aquí.",
    copy: "Copiar",
    copyLine: "Copia esta descripción.",
    copied: "Copiado.",
    noCaption: "Todavía no hay descripción.",
  },
  en: {
    button: "Download all the images",
    note: "You make the slideshow with these images.",
    download: "Download the images",
    downloadLine: "Download it here.",
    copy: "Copy",
    copyLine: "Copy this caption.",
    copied: "Copied.",
    noCaption: "No caption yet.",
  },
};

type SlideLineActions = {
  date: string;
  downloadLabel: string;
  downloadLine: string;
  namesCount: number;
  onDownload: () => void;
  copyLabel: string;
  copiedLabel: string;
  copyLine: string;
  caption: string;
  emptyCaption: string;
  waiting: string;
};

const uploadProof = (file: File, date: string, onProgress: (percent: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const parts = Math.max(1, proofPartCount(file.size));
    const generation = (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}abcdefghijkl`)
      .replace(/-/g, "")
      .slice(0, 12);
    const send = (index: number) => {
      const start = index * PROOF_PART_BYTES;
      const blob = file.slice(start, Math.min(file.size, start + PROOF_PART_BYTES));
      const request = new XMLHttpRequest();
      request.open("POST", "/posting/upload");
      request.setRequestHeader("content-type", "application/octet-stream");
      request.setRequestHeader("x-proof-date", date);
      request.setRequestHeader("x-proof-generation", generation);
      request.setRequestHeader("x-proof-part", String(index));
      request.setRequestHeader("x-proof-parts", String(parts));
      request.setRequestHeader("x-proof-size", String(file.size));
      request.setRequestHeader("x-proof-name", encodeURIComponent(file.name));
      request.setRequestHeader("x-proof-type", /^video\/[a-z0-9.+-]+$/i.test(file.type) ? file.type : "video/mp4");
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.min(99, Math.round(((start + event.loaded) / file.size) * 100)));
      };
      request.onload = () => {
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(String(request.status)));
          return;
        }
        if (index + 1 >= parts) {
          onProgress(100);
          resolve();
          return;
        }
        send(index + 1);
      };
      request.onerror = () => reject(new Error("upload"));
      request.send(blob);
    };
    onProgress(0);
    send(0);
  });

const ProofFeedback = ({
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

export const PostingDashboard = ({
  role,
  profiles,
  work = {},
  removedDays = [],
}: {
  role: string;
  profiles: ManagedProfile[];
  work?: Record<string, ProfileWork>;
  removedDays?: string[];
}) => {
  const remoteProofs: ProofRecord[] = Object.entries(work).flatMap(([profileId, profile]) =>
    Object.entries(profile.days)
      .filter((entry): entry is [string, DayWork & { proofName: string }] => Boolean(entry[1].proofName))
      .map(([date, day]) => ({ profileId, date, name: day.proofName }))
  );
  const today = madridToday();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [roster, setRoster] = useState(profiles);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [proofNote, setProofNote] = useState<{ date: string; percent: number; text: string; name: string } | null>(null);
  const [proofError, setProofError] = useState<{ date: string; text: string } | null>(null);
  const sending = useRef(new Set<string>());
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [profileError, setProfileError] = useState("");
  const [hiddenDays, setHiddenDays] = useState(removedDays);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  const isTania = role === "tania";
  const lang: PostingLang = isTania ? "fr" : langFromName(profiles.find((item) => item.id === role)?.name ?? "");
  const ui = postingUi(lang);
  const lower = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
  const workerPlans = DAY_PLANS.filter((plan) => plan.date >= "2026-11-09" && plan.date <= "2026-11-15");
  const rangeStart = isTania ? CALENDAR_START : "2026-11-09";
  const rangeEnd = isTania ? CALENDAR_END : "2026-11-15";
  const range =
    lang === "en"
      ? ui.range(formatDay(rangeStart, lang), formatDay(rangeEnd, lang))
      : ui.range(lower(formatDay(rangeStart, lang)), lower(formatDay(rangeEnd, lang)));
  const visibleDates = () => calendarDates();
  const visiblePlans = (forTania: boolean) => (forTania ? DAY_PLANS : workerPlans);

  useEffect(() => {
    const loaded = readDesk();
    if (role === "tania") {
      for (const [profileId, profile] of Object.entries(work)) {
        const slotsForPerson = { ...(loaded.slots[profileId] ?? {}) };
        const daysForPerson = { ...(loaded.days[profileId] ?? {}) };
        for (const [date, remote] of Object.entries(profile.days)) {
          slotsForPerson[date] = remote.slot && isSlotId(remote.slot) ? [remote.slot] : [];
          daysForPerson[date] = {
            checks: remote.checks,
            proofName: remote.proofName,
            validated: remote.validated,
          };
        }
        loaded.slots = { ...loaded.slots, [profileId]: slotsForPerson };
        loaded.days = { ...loaded.days, [profileId]: daysForPerson };
      }
    }
    const mine = role === "tania" ? null : work[role];
    if (mine) {
      const slotsForPerson = { ...(loaded.slots[role] ?? {}) };
      const daysForPerson = { ...(loaded.days[role] ?? {}) };
      const pending: string[] = [];
      const dates = Array.from(new Set([...Object.keys(slotsForPerson), ...Object.keys(daysForPerson), ...Object.keys(mine.days)]));
      for (const date of dates) {
        const remote = mine.days[date];
        if (remote) {
          slotsForPerson[date] = remote.slot ? [remote.slot as SlotId] : [];
          const existing = daysForPerson[date] ?? emptyDayState();
          daysForPerson[date] = {
            checks: remote.checks,
            proofName: remote.proofName ?? existing.proofName,
            validated: remote.validated,
          };
        } else if (slotsForPerson[date]?.length || daysForPerson[date]?.proofName || daysForPerson[date]?.validated || Object.keys(daysForPerson[date]?.checks ?? {}).length) {
          pending.push(date);
        }
      }
      loaded.slots = { ...loaded.slots, [role]: slotsForPerson };
      loaded.days = { ...loaded.days, [role]: daysForPerson };
      for (const date of pending) {
        const existing = daysForPerson[date];
        void saveMyDay(date, {
          slot: slotsForPerson[date]?.[0] ?? null,
          checks: existing?.checks ?? {},
          validated: existing?.validated === true,
          proofName: existing?.proofName ?? null,
        });
      }
    }
    setDesk(loaded);
    let cancelled = false;
    const created: string[] = [];
    const remember = (key: string, blob: Blob) => {
      const url = URL.createObjectURL(blob);
      created.push(url);
      if (!cancelled) setUrls((current) => ({ ...current, [key]: url }));
    };
    void (async () => {
      try {
        for (const person of loaded.people) {
          for (const plan of DAY_PLANS) {
            if (!loaded.days[person.id]?.[plan.date]?.proofName) continue;
            const blob = await loadBlob(proofKey(person.id, plan.date));
            if (blob) remember(proofKey(person.id, plan.date), blob);
          }
        }
        for (const [date, files] of Object.entries(loaded.taniaFiles)) {
          for (const [accountId, names] of Object.entries(files)) {
            for (let index = 0; index < names.length; index += 1) {
              const blob = (await loadBlob(slideKey(date, accountId, index))) ?? (index === 0 ? await loadBlob(legacySlideKey(date, accountId)) : null);
              if (blob) remember(slideKey(date, accountId, index), blob);
            }
          }
        }
      } catch {
        if (!cancelled) setFileError("files");
      }
    })();
    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const update = (recipe: (current: Desk) => Desk) => {
    setDesk((current) => {
      if (!current) return current;
      const next = recipe(current);
      writeDesk(next);
      return next;
    });
  };

  if (!desk) {
    return (
      <main lang={lang} className="min-h-dvh px-4 py-6">
        <p className="font-body text-base text-gray-700">{ui.opening}</p>
      </main>
    );
  }

  const person = isTania ? null : roster.find((item) => item.id === role) ?? null;
  const people = isTania ? roster : [];

  const ownAccount = person ? accountForLang(lang) : "";

  const publishDay = (date: string, desk: Desk) => {
    if (!person) return;
    const record = desk.days[person.id]?.[date];
    void saveMyDay(date, {
      slot: slotsFor(desk, person.id, date)[0] ?? null,
      checks: record?.checks ?? {},
      validated: record?.validated === true,
      proofName: record?.proofName ?? null,
    });
  };

  const toggleSlot = (date: string, slotId: SlotId) => {
    if (!person) return;
    update((current) => {
      const next = {
        ...current,
        slots: {
          ...current.slots,
          [person.id]: { ...current.slots[person.id], [date]: chooseSlot(slotsFor(current, person.id, date), slotId) },
        },
      };
      const day = next.days[person.id]?.[date];
      if (day?.validated && slotsFor(next, person.id, date).length === 0) {
        next.days = {
          ...next.days,
          [person.id]: { ...next.days[person.id], [date]: { ...day, validated: false } },
        };
      }
      publishDay(date, next);
      return next;
    });
  };

  const removeDay = async (date: string) => {
    if (!isTania || deletingDate) return;
    setDayError(null);
    setDeletingDate(date);
    const result = await deleteValidatedDay(date);
    setDeletingDate(null);
    if (!result.ok) {
      setDayError(date);
      return;
    }
    setHiddenDays((current) => (current.includes(date) ? current : [...current, date]));
    await Promise.all(roster.map((worker) => deleteBlob(proofKey(worker.id, date)).catch(() => undefined)));
    setUrls((current) => {
      const next = { ...current };
      for (const worker of roster) delete next[proofKey(worker.id, date)];
      return next;
    });
  };

  const patchDay = (date: string, recipe: (day: DayState) => DayState) => {
    if (!person) return;
    update((current) => {
      const existing = current.days[person.id]?.[date] ?? emptyDayState();
      const next = recipe(existing);
      const plan = DAY_PLANS.find((item) => item.date === date);
      const tasks = plan ? checksFor(plan, lang).filter((check) => taskIsHers(check.id, ownAccount)) : [];
      const checksDone = Boolean(next.proofName) && tasks.length > 0 && tasks.every((check) => next.checks[check.id] === true);
      const validated = Boolean(plan && next.validated && checksDone && slotsFor(current, person.id, date).length > 0);
      const updated = {
        ...current,
        days: { ...current.days, [person.id]: { ...current.days[person.id], [date]: { ...next, validated } } },
      };
      publishDay(date, updated);
      return updated;
    });
  };

  const onProof = async (date: string, file: File | undefined) => {
    if (!file || !person || sending.current.has(date)) return;
    sending.current.add(date);
    setFileError("");
    setProofError(null);
    setProofNote({ date, percent: 0, text: ui.proofSending(0), name: file.name });
    const fail = (text: string) => {
      setProofNote(null);
      setProofError({ date, text });
    };
    try {
      const prepared = await prepareProofUpload(date, file.name, file.size);
      if (!prepared.ok) {
        fail(prepared.error === "size" ? ui.proofTooBig : ui.proofFail);
        return;
      }
      if (prepared.local) await saveBlob(proofKey(person.id, date), file);
      await uploadProof(file, date, (percent) => setProofNote({ date, percent, text: ui.proofSending(percent), name: prepared.name }));
      const saved = await commitProof(date, prepared.name);
      if (!saved.ok && prepared.local) throw new Error("commit");
      setUrls((current) => ({ ...current, [proofKey(person.id, date)]: URL.createObjectURL(file) }));
      patchDay(date, (day) => ({ ...day, proofName: prepared.name }));
      setProofNote(null);
      setProofError(null);
    } catch (error) {
      fail(error instanceof Error && error.message === "413" ? ui.proofTooBig : ui.proofFail);
    } finally {
      sending.current.delete(date);
    }
  };

  const onSlides = async (date: string, accountId: string, list: FileList | null) => {
    const files = list ? Array.from(list).filter((file) => file.type.startsWith("image/")) : [];
    if (files.length === 0) return;
    setFileError("");
    try {
      const nextUrls: Record<string, string> = {};
      for (let index = 0; index < files.length; index += 1) {
        await saveBlob(slideKey(date, accountId, index), files[index]);
        nextUrls[slideKey(date, accountId, index)] = URL.createObjectURL(files[index]);
      }
      setUrls((current) => ({ ...current, ...nextUrls }));
      update((current) => ({
        ...current,
        taniaFiles: {
          ...current.taniaFiles,
          [date]: { ...current.taniaFiles[date], [accountId]: files.map((file) => file.name) },
        },
      }));
      const input = document.getElementById(`upload-${date}-${accountId}`);
      if (input instanceof HTMLInputElement) input.value = "";
    } catch {
      setFileError("Le fichier n'a pas été gardé dans ce navigateur.");
    }
  };

  const removeSlide = async (date: string, storageId: string, index: number) => {
    const names = desk.taniaFiles[date]?.[storageId] ?? [];
    if (!names[index]) return;
    setFileError("");
    try {
      const kept: { name: string; blob: Blob | null }[] = [];
      for (let i = 0; i < names.length; i += 1) {
        if (i === index) continue;
        const blob = (await loadBlob(slideKey(date, storageId, i))) ?? (i === 0 ? await loadBlob(legacySlideKey(date, storageId)) : null);
        kept.push({ name: names[i], blob });
      }
      for (let i = 0; i < names.length; i += 1) await deleteBlob(slideKey(date, storageId, i));
      await deleteBlob(legacySlideKey(date, storageId));
      const nextUrls: Record<string, string> = {};
      for (let i = 0; i < kept.length; i += 1) {
        const blob = kept[i]?.blob;
        if (!blob) continue;
        await saveBlob(slideKey(date, storageId, i), blob);
        nextUrls[slideKey(date, storageId, i)] = URL.createObjectURL(blob);
      }
      setUrls((current) => {
        const next = { ...current };
        for (let i = 0; i < names.length; i += 1) delete next[slideKey(date, storageId, i)];
        return { ...next, ...nextUrls };
      });
      update((current) => {
        const dateFiles = { ...(current.taniaFiles[date] ?? {}) };
        if (kept.length === 0) delete dateFiles[storageId];
        else dateFiles[storageId] = kept.map((item) => item.name);
        return { ...current, taniaFiles: { ...current.taniaFiles, [date]: dateFiles } };
      });
      const input = document.getElementById(`upload-${date}-${storageId}`);
      if (input instanceof HTMLInputElement) input.value = "";
    } catch {
      setFileError("L'image n'a pas été retirée.");
    }
  };

  const saveCaption = (date: string, profileId: string, value: string) => {
    update((current) => ({
      ...current,
        captions: {
        ...(current.captions ?? {}),
        [date]: { ...(current.captions?.[date] ?? {}), [profileId]: value.slice(0, 500) },
      },
    }));
  };

  const downloadSlides = (date: string, accountId: string, names: string[]) => {
    names.forEach((name, index) => {
      const href = urls[slideKey(date, accountId, index)];
      if (!href) return;
      const link = document.createElement("a");
      link.href = href;
      link.download = name || `image-${index + 1}`;
      link.click();
    });
  };

  const addPerson = async (event: FormEvent) => {
    event.preventDefault();
    const result = await addManagedProfile(newName, newCode);
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setRoster(result.profiles);
    setNewName("");
    setNewCode("");
    setProfileError("");
  };

  const savePerson = async (id: string, name: string, code: string) => {
    const result = await saveManagedProfile(id, name, code);
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setRoster(result.profiles);
    setProfileError("");
  };

  const deletePerson = async (id: string) => {
    const result = await deleteManagedProfile(id);
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setRoster(result.profiles);
    setProfileError("");
  };

  return (
    <main lang={lang} className="min-h-dvh px-4 py-6 selection:bg-yellow selection:text-black sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="font-title text-3xl tracking-tight">
            TAAB
          </a>
          <form action={leavePosting}>
            <button
              type="submit"
              className="font-body text-sm font-bold underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              {ui.switchProfile}
            </button>
          </form>
        </div>
        <header>
          <h1 className="font-title text-4xl tracking-tight">{isTania ? "Tania" : displayName(person?.name ?? "")}</h1>
          <p className="mt-2 max-w-prose font-body text-sm leading-relaxed text-gray-700">{range}</p>
        </header>

        {isTania && (
          <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">Créneaux</h2>
            <p className="mt-1 font-body text-xs text-gray-700">
              {people.map((item) => `${personMark(item)} ${item.name}`).join(" · ")}
            </p>
            <div className="mt-4 grid grid-cols-[4.75rem_repeat(4,minmax(0,1fr))] gap-2 font-body text-base">
              <span />
              {SLOTS.map((slot) => (
                <span key={slot.id} className="py-2 text-center text-sm font-bold">
                  {slot.short}
                </span>
              ))}
              {visibleDates().map((date) => (
                <div key={date} className="contents">
                  <span className={`flex items-center text-sm font-bold ${date === today ? "text-black" : "text-gray-700"}`}>
                    {formatShortDay(date)}
                  </span>
                  {SLOTS.map((slot) => {
                    const marks = people
                      .filter((item) => slotsFor(desk, item.id, date).includes(slot.id))
                      .map((item) => personMark(item));
                    const shared = marks.length > 1;
                    return (
                      <span
                        key={slot.id}
                        className={`flex min-h-12 items-center justify-center rounded-lg px-1 py-2 text-center text-base font-bold ${
                          shared ? "bg-[#F8E3B0] text-black" : "bg-gray-100"
                        }`}
                      >
                        {marks.length > 0 ? marks.join(" ") : "·"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            {visibleDates().some((date) =>
              SLOTS.some(
                (slot) => people.filter((item) => slotsFor(desk, item.id, date).includes(slot.id)).length > 1
              )
            ) && <p className="mt-3 font-body text-sm text-gray-700">Deux filles ont la même heure.</p>}
            <div className="mt-5 border-t border-gray-200 pt-4">
              <h3 className="font-body text-base font-bold">Profils</h3>
              <ul className="mt-3 flex flex-col gap-4">
                {people.map((item) => (
                  <li key={item.id}>
                    <ProfileEditor profile={item} onSave={savePerson} onDelete={deletePerson} />
                  </li>
                ))}
              </ul>
              <form onSubmit={(event) => void addPerson(event)} className="mt-4 flex flex-col gap-2">
                <label htmlFor="new-person" className="font-body text-sm font-bold">
                  Nouveau profil
                </label>
                <input
                  id="new-person"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Nom"
                  className={fieldClass}
                />
                <input
                  id="new-code"
                  value={newCode}
                  onChange={(event) => setNewCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Code"
                  className={fieldClass}
                />
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-black px-4 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Ajouter
                </button>
              </form>
              {profileError && <p className="mt-2 font-body text-sm text-[#C8102E]">{profileError}</p>}
            </div>
          </section>
        )}

        {visiblePlans(isTania)
          .filter((plan) => !(isTania && hiddenDays.includes(plan.date)))
          .map((plan) => {
          const checks = checksFor(plan, isTania ? "fr" : lang);
          if (isTania) {
            return (
              <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
                <p className="font-body text-sm text-gray-700">{dayHeading(plan)}</p>
                <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date)}</h2>
                {plan.date >= SLIDES_FROM && plan.date <= SLIDES_UNTIL && (
                  <div className="mt-4 flex flex-col gap-4">
                    {ACCOUNTS.map((account, index) => {
                      if (!plan.publishers.includes(account.id)) return null;
                      const title = accountWord(index, "fr");
                      return (
                        <div key={account.id}>
                          <p className="font-title text-xl leading-none tracking-tight" style={{ color: ACCOUNT_TONE[index].ink }}>
                            {title}
                          </p>
                          <div className="mt-2 grid gap-3 sm:grid-cols-3">
                            {slideGirls(roster).map((worker) => {
                              const storageId = slideStorageId(worker.id, account.id);
                              const names = desk.taniaFiles[plan.date]?.[storageId] ?? [];
                              const label = slideCardTitle(worker.name);
                              return (
                                <div key={storageId} className="rounded-2xl bg-gray-100 p-3">
                                  <label htmlFor={`upload-${plan.date}-${storageId}`} className="block font-body text-base font-bold">
                                    {label}
                                  </label>
                                  <input
                                    id={`upload-${plan.date}-${storageId}`}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    aria-label={`${title} ${label}`}
                                    onChange={(event) => void onSlides(plan.date, storageId, event.target.files)}
                                    className="mt-2 block w-full font-body text-sm"
                                  />
                                  {names.length > 0 && (
                                    <ul className="mt-3 flex flex-col gap-2">
                                      {names.map((name, imageIndex) => {
                                        const preview = urls[slideKey(plan.date, storageId, imageIndex)];
                                        return (
                                          <li key={`${storageId}-${imageIndex}-${name}`} className="flex items-center gap-2">
                                            {preview ? (
                                              <img src={preview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                                            ) : null}
                                            <span className="min-w-0 flex-1 truncate font-body text-sm">{name}</span>
                                            <button
                                              id={`remove-slide-${plan.date}-${storageId}-${imageIndex}`}
                                              type="button"
                                              aria-label={`Retirer ${name}`}
                                              onClick={() => void removeSlide(plan.date, storageId, imageIndex)}
                                              className="inline-flex h-10 shrink-0 items-center rounded-xl border border-black bg-white px-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                                            >
                                              Retirer
                                            </button>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                  <textarea
                                    id={`caption-${plan.date}-${storageId}`}
                                    value={desk.captions?.[plan.date]?.[storageId] ?? ""}
                                    onChange={(event) => saveCaption(plan.date, storageId, event.target.value)}
                                    rows={3}
                                    placeholder="Description du jour"
                                    aria-label={`Description de ${label}, ${title}`}
                                    className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <AccountChecks
                  checks={checks}
                  lang="fr"
                  item={(check, label) => (
                    <label className={`flex items-start gap-3 font-body ${check.parent ? "text-sm text-gray-800" : "text-base"}`}>
                      <input
                        type="checkbox"
                        checked={profiles.every((worker) => work[worker.id]?.days[plan.date]?.checks[check.id] === true)}
                        onClick={(event) => event.preventDefault()}
                        onChange={() => undefined}
                        aria-readonly="true"
                        className={`shrink-0 accent-black ${check.parent ? "mt-0.5 h-4 w-4" : "mt-1 h-5 w-5"}`}
                      />
                      <TaskFace
                        check={check}
                        label={label}
                        large={!check.parent}
                        copy={
                          check.copyText
                            ? { id: `copy-bio-${plan.date}-${check.id}`, text: check.copyText, copy: slideCopy.fr.copy, copied: slideCopy.fr.copied }
                            : undefined
                        }
                      />
                    </label>
                  )}
                />
                <div className="mt-5 flex flex-wrap gap-4">
                  {profiles.map((worker) => {
                    const day = work[worker.id]?.days[plan.date];
                    if (!day?.proofName) return null;
                    const name = displayName(worker.name);
                    return (
                      <div key={worker.id} className="w-[180px]">
                        <ProofThumb src={`/posting/proof/${worker.id}/${plan.date}`} label={name} />
                        <p className="mt-2 text-center font-body text-sm font-bold">{name}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5">
                  <button
                    id={`delete-day-${plan.date}`}
                    type="button"
                    disabled={deletingDate === plan.date}
                    onClick={() => void removeDay(plan.date)}
                    className="h-12 w-full rounded-xl border border-black bg-white px-4 font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
                  >
                    Supprimer ce jour
                  </button>
                  {dayError === plan.date && (
                    <p className="mt-2 font-body text-sm text-[#C8102E]">Le jour n&apos;a pas été supprimé. Réessaie.</p>
                  )}
                </div>
              </section>
            );
          }

          const state = person ? desk.days[person.id]?.[plan.date] ?? emptyDayState() : emptyDayState();
          const hour = person ? slotsFor(desk, person.id, plan.date)[0] : undefined;
          const chosenSlot = SLOTS.find((slot) => slot.id === hour);
          const hers = checks.filter((check) => taskIsHers(check.id, ownAccount));
          const checksDone = Boolean(state.proofName) && hers.length > 0 && hers.every((check) => state.checks[check.id] === true);
          const ready = checksDone && Boolean(hour);
          return (
            <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
              <p className="font-body text-sm text-gray-700">{dayHeading(plan, lang)}</p>
              <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date, lang)}</h2>
              {person && (
                <div className="mt-4">
                  <p className="font-body text-base font-bold">{ui.slots}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SLOTS.map((slot) => {
                      const selected = hour === slot.id;
                      return (
                        <button
                          key={slot.id}
                          id={`slot-${plan.date}-${slot.id}`}
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${formatDay(plan.date, lang)} ${slot.label}`}
                          onClick={() => toggleSlot(plan.date, slot.id)}
                          className={`flex h-12 items-center justify-center rounded-xl px-2 font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                            selected ? "bg-black text-white" : "bg-gray-100 text-black"
                          }`}
                        >
                          {hourText(slot.short)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">
                    {chosenSlot ? ui.picked(hourText(chosenSlot.short)) : ui.pickOne}
                  </p>
                </div>
              )}
              <AccountChecks
                checks={checks}
                lang={lang}
                item={(check, label) => (
                  <label
                    htmlFor={`check-${plan.date}-${check.id}`}
                    className={`flex items-start gap-3 font-body ${check.parent ? "text-sm" : "text-base"}`}
                  >
                    <input
                      id={`check-${plan.date}-${check.id}`}
                      type="checkbox"
                      checked={state.checks[check.id] === true}
                      onChange={(event) =>
                        patchDay(plan.date, (day) => ({ ...day, checks: { ...day.checks, [check.id]: event.target.checked } }))
                      }
                      className={`shrink-0 accent-black ${check.parent ? "mt-0.5 h-4 w-4" : "mt-1 h-5 w-5"}`}
                    />
                    <TaskFace
                      check={check}
                      label={label}
                      large={!check.parent}
                      copy={
                        check.copyText
                          ? {
                              id: `copy-bio-${plan.date}-${check.id}`,
                              text: check.copyText,
                              copy: slideCopy[lang].copy,
                              copied: slideCopy[lang].copied,
                            }
                          : undefined
                      }
                      slides={(() => {
                        const accountId = check.id.startsWith("post-") ? check.id.slice(5) : "";
                        if (!person || !accountId || plan.date < SLIDES_FROM || plan.date > SLIDES_UNTIL || !plan.publishers.includes(accountId)) {
                          return undefined;
                        }
                        const storageId = slideStorageId(person.id, accountId);
                        const names = desk.taniaFiles[plan.date]?.[storageId] ?? [];
                        return {
                          date: `${plan.date}-${accountId}`,
                          downloadLabel: slideCopy[lang].download,
                          downloadLine: slideCopy[lang].downloadLine,
                          namesCount: names.length,
                          onDownload: () => downloadSlides(plan.date, storageId, names),
                          copyLabel: slideCopy[lang].copy,
                          copiedLabel: slideCopy[lang].copied,
                          copyLine: slideCopy[lang].copyLine,
                          caption: desk.captions?.[plan.date]?.[storageId] ?? "",
                          emptyCaption: slideCopy[lang].noCaption,
                          waiting: ui.imagesMissing,
                        };
                      })()}
                    />
                  </label>
                )}
              />
              <div className="mt-4 rounded-2xl bg-gray-100 p-3">
                <h3 className="font-body text-base font-bold">{ui.proof}</h3>
                <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">
                  {plan.kind === "friday" ? ui.proofScroll : ui.proofBody}
                </p>
                <input
                  id={`proof-${plan.date}`}
                  type="file"
                  accept="video/*"
                  onChange={(event) => void onProof(plan.date, event.target.files?.[0])}
                  className="mt-2 font-body text-sm"
                />
                {(state.proofName || (proofNote?.date === plan.date && proofNote.name)) && (
                  <p className="mt-2 font-body text-sm">{state.proofName || proofNote?.name}</p>
                )}
                <ProofFeedback
                  active={proofNote?.date === plan.date}
                  percent={proofNote?.date === plan.date ? proofNote.percent : 0}
                  text={proofNote?.date === plan.date ? proofNote.text : ""}
                  error={proofError?.date === plan.date ? proofError.text : null}
                />
                {person && (urls[proofKey(person.id, plan.date)] || remoteProofs.some((item) => item.profileId === person.id && item.date === plan.date)) && (
                  <ProofThumb
                    src={urls[proofKey(person.id, plan.date)] || `/posting/proof/${person.id}/${plan.date}`}
                    label={displayName(person.name)}
                    play={ui.proofPlay}
                    close={ui.proofClose}
                  />
                )}
              </div>
              <button
                id={`validate-day-${plan.date}`}
                type="button"
                disabled={!ready || state.validated}
                onClick={() => {
                  if (!hour) return;
                  patchDay(plan.date, (day) => ({ ...day, validated: true }));
                }}
                className="mt-4 h-12 w-full rounded-xl bg-black px-4 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
              >
                {state.validated ? ui.dayDone : ui.validateDay}
              </button>
              {!state.validated && (
                <p className="mt-2 font-body text-sm text-gray-700">{!hour ? ui.pickOne : checksDone ? ui.ready : ui.missing}</p>
              )}
            </section>
          );
        })}

        {fileError && <p className="font-body text-sm text-[#C8102E]">{fileError === "files" ? ui.files : fileError}</p>}
        {isTania && <p className="font-body text-sm leading-relaxed text-gray-700">{ui.local}</p>}
      </div>
    </main>
  );
};

const ProofThumb = ({ src, label, play = "Lire", close = "Fermer" }: { src: string; label: string; play?: string; close?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${play} ${label}`}
        className="relative mt-2 block h-[120px] w-[180px] max-w-full overflow-hidden rounded-2xl bg-black text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <video src={src} preload="metadata" muted playsInline className="pointer-events-none block h-full w-full object-cover" />
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 font-body text-xs font-bold">{play}</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={label}>
          <button type="button" className="absolute inset-0 cursor-default" aria-label={close} onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm">
            <video src={src} controls autoPlay playsInline className="max-h-[80vh] w-full rounded-2xl bg-black" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 h-12 w-full rounded-xl bg-white font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const ProfileEditor = ({
  profile,
  onSave,
  onDelete,
}: {
  profile: ManagedProfile;
  onSave: (id: string, name: string, code: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [name, setName] = useState(profile.name);
  const [code, setCode] = useState(profile.code ?? "");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`profile-name-${profile.id}`} className="sr-only">
        Nom de {profile.name}
      </label>
      <input
        id={`profile-name-${profile.id}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        className={fieldClass}
      />
      <label htmlFor={`profile-code-${profile.id}`} className="sr-only">
        Code de {profile.name}
      </label>
      <input
        id={`profile-code-${profile.id}`}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        inputMode="numeric"
        autoComplete="off"
        className={fieldClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void onSave(profile.id, name, code)}
          className="h-12 rounded-xl bg-black px-3 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          Enregistrer
        </button>
        <button
          id={`profile-delete-${profile.id}`}
          type="button"
          onClick={() => void onDelete(profile.id)}
          className="h-12 rounded-xl border border-black bg-white px-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};
