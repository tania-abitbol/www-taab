/** Daily TikTok posting desk for the three Spain accounts. J1 is 6 Nov 2026, Europe/Madrid. */

export const POSTING_START = "2026-11-06";

export const SLOTS = [
  { id: "17-18", label: "17:00–18:00" },
  { id: "18-19", label: "18:00–19:00" },
  { id: "19-20", label: "19:00–20:00" },
  { id: "20-21", label: "20:00–21:00" },
] as const;

export type SlotId = (typeof SLOTS)[number]["id"];

export type AccountName = {
  id: string;
  name: string;
};

export const DEFAULT_ACCOUNTS: AccountName[] = [
  { id: "es-1", name: "Compte 1" },
  { id: "es-2", name: "Compte 2" },
  { id: "es-3", name: "Compte 3" },
];

export type AccountTask = {
  browsed: boolean;
  engaged: boolean;
  published: boolean;
  link: string;
};

export type DayRecord = {
  slot: SlotId | null;
  tasks: Record<string, AccountTask>;
  proofName: string | null;
};

export type PreparedVideo = {
  id: string;
  accountId: string;
  date: string;
  caption: string;
  hashtags: string;
  sourceUrl: string;
  fileName: string | null;
  createdAt: number;
};

export type PostingMeta = {
  accounts: AccountName[];
  days: Record<string, DayRecord>;
  videos: PreparedVideo[];
};

export const emptyTask = (): AccountTask => ({
  browsed: false,
  engaged: false,
  published: false,
  link: "",
});

export const emptyMeta = (): PostingMeta => ({
  accounts: DEFAULT_ACCOUNTS.map((account) => ({ ...account })),
  days: {},
  videos: [],
});

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isIsoDate = (value: string) => {
  if (!ISO.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const madridToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export const diffDays = (from: string, to: string) => {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
};

export type DayPhase = {
  id: "before" | "j1" | "j2" | "j3" | "routine";
  label: string;
  minutes: number;
};

/** J1, J2 and J3 take 40 minutes. From J4 the day is routine and takes 1 hour. */
export const phaseFor = (date: string): DayPhase => {
  const delta = diffDays(POSTING_START, date);
  if (delta < 0) return { id: "before", label: "Avant J1", minutes: 40 };
  if (delta === 0) return { id: "j1", label: "J1", minutes: 40 };
  if (delta === 1) return { id: "j2", label: "J2", minutes: 40 };
  if (delta === 2) return { id: "j3", label: "J3", minutes: 40 };
  return { id: "routine", label: "Routine", minutes: 60 };
};

export const durationLabel = (phase: DayPhase) => (phase.minutes === 60 ? "1 h" : `${phase.minutes} min`);

export const formatDay = (iso: string) => {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatShortDay = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));

/** Monday–Sunday week that contains the date. Weekends stay on the board. */
export const weekOf = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dow = utc.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(utc);
    next.setUTCDate(utc.getUTCDate() + mondayOffset + index);
    return next.toISOString().slice(0, 10);
  });
};

export const isSlotId = (value: string): value is SlotId => SLOTS.some((slot) => slot.id === value);

export const slotLabel = (id: SlotId | null) => SLOTS.find((slot) => slot.id === id)?.label ?? "";

export const isTikTokLink = (value: string) => {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return host === "tiktok.com" || host.endsWith(".tiktok.com");
  } catch {
    return false;
  }
};

export const taskFor = (record: DayRecord | undefined, accountId: string): AccountTask => {
  const raw = record?.tasks[accountId];
  return {
    browsed: Boolean(raw?.browsed),
    engaged: Boolean(raw?.engaged),
    published: Boolean(raw?.published),
    link: typeof raw?.link === "string" ? raw.link : "",
  };
};

export const dayProgress = (record: DayRecord | undefined, accounts: AccountName[]) => {
  const links = accounts.filter((account) => isTikTokLink(taskFor(record, account.id).link)).length;
  const slot = Boolean(record?.slot);
  const proof = Boolean(record?.proofName);
  return {
    links,
    total: accounts.length,
    slot,
    proof,
    done: slot && links === accounts.length && accounts.length > 0,
  };
};

export const videosFor = (videos: PreparedVideo[], date: string, accountId: string) =>
  videos.filter((video) => video.date === date && video.accountId === accountId).sort((a, b) => a.createdAt - b.createdAt);

export const groupVideos = (videos: PreparedVideo[], accounts: AccountName[]) => {
  const dates = Array.from(new Set(videos.map((video) => video.date))).filter(isIsoDate).sort();
  return dates
    .map((date) => ({
      date,
      rows: accounts
        .map((account) => ({ account, videos: videosFor(videos, date, account.id) }))
        .filter((row) => row.videos.length > 0),
    }))
    .filter((group) => group.rows.length > 0);
};
