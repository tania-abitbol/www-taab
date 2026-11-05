/** Posting desk, 5–15 Nov 2026. Slots are chosen per person. A day is proven by its checks and the recording. */

export const CALENDAR_START = "2026-11-05";
export const CALENDAR_END = "2026-11-15";

export const SLOTS = [
  { id: "17-18", label: "17:00–18:00" },
  { id: "18-19", label: "18:00–19:00" },
  { id: "19-20", label: "19:00–20:00" },
  { id: "20-21", label: "20:00–21:00" },
] as const;

export type SlotId = (typeof SLOTS)[number]["id"];

export type AccountName = { id: string; name: string };

export const ACCOUNTS: AccountName[] = [
  { id: "es-1", name: "Compte 1" },
  { id: "es-2", name: "Compte 2" },
  { id: "es-3", name: "Compte 3" },
];

export type Person = { id: string; name: string };

export type DayKind = "warmup" | "warmup-profile" | "slideshow" | "two-publish" | "all-publish";

export type DayPlan = {
  date: string;
  index: number;
  kind: DayKind;
  /** Days after jour 7 repeat that programme. */
  repeatsDay7: boolean;
};

export type CheckItem = { id: string; label: string };

export type DayState = {
  checks: Record<string, boolean>;
  proofName: string | null;
  validated: boolean;
  slideshowAccount: string | null;
  publishers: string[];
};

export type Desk = {
  people: Person[];
  slots: Record<string, Record<string, SlotId[]>>;
  weekValidated: Record<string, boolean>;
  taniaValidated: boolean;
  days: Record<string, Record<string, DayState>>;
  taniaFileName: string | null;
};

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isIsoDate = (value: string) => {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const calendarDates = () => {
  const dates: string[] = [];
  let cursor = Date.parse(`${CALENDAR_START}T00:00:00Z`);
  const end = Date.parse(`${CALENDAR_END}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += 86_400_000;
  }
  return dates;
};

export const DAY_PLANS: DayPlan[] = [
  { date: "2026-11-06", index: 1, kind: "warmup", repeatsDay7: false },
  { date: "2026-11-07", index: 2, kind: "warmup", repeatsDay7: false },
  { date: "2026-11-08", index: 3, kind: "warmup-profile", repeatsDay7: false },
  { date: "2026-11-09", index: 4, kind: "slideshow", repeatsDay7: false },
  { date: "2026-11-10", index: 5, kind: "two-publish", repeatsDay7: false },
  { date: "2026-11-11", index: 6, kind: "two-publish", repeatsDay7: false },
  { date: "2026-11-12", index: 7, kind: "all-publish", repeatsDay7: false },
  { date: "2026-11-13", index: 7, kind: "all-publish", repeatsDay7: true },
  { date: "2026-11-14", index: 7, kind: "all-publish", repeatsDay7: true },
  { date: "2026-11-15", index: 7, kind: "all-publish", repeatsDay7: true },
];

export const planFor = (date: string) => DAY_PLANS.find((plan) => plan.date === date) ?? null;

export const isSlotId = (value: string): value is SlotId => SLOTS.some((slot) => slot.id === value);

export const emptyDayState = (): DayState => ({
  checks: {},
  proofName: null,
  validated: false,
  slideshowAccount: null,
  publishers: [],
});

export const emptyDesk = (): Desk => ({
  people: [{ id: "p1", name: "Personne 1" }],
  slots: {},
  weekValidated: {},
  taniaValidated: false,
  days: {},
  taniaFileName: null,
});

export const formatDay = (iso: string) => {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const madridToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

/** Minutes left for the two accounts that do not post the slideshow, after 10 min before and 10 min after. */
export const slideshowSplit = (slotCount: number) => {
  const remaining = Math.max(0, slotCount * 60 - 20);
  return { remaining, each: remaining / 2 };
};

const warmupChecks = (withProfile: boolean): CheckItem[] => {
  const items: CheckItem[] = [
    { id: "connect", label: "Se connecter au compte reçu" },
    { id: "comment", label: "Échauffement : commenter des TikToks" },
    { id: "watch", label: "Regarder les TikToks en entier, sauf si ça ne m'intéresse pas" },
    ...ACCOUNTS.map((account) => ({ id: `min-${account.id}`, label: `20 min · ${account.name}` })),
  ];
  if (withProfile) {
    for (const account of ACCOUNTS) {
      items.push({
        id: `photo-${account.id}`,
        label: `Photo de profil · ${account.name}. Pas générée par IA, une autre source convient`,
      });
      items.push({
        id: `bio-${account.id}`,
        label: `Bio dans ta langue, sur le thème du compte · ${account.name}`,
      });
    }
  }
  return items;
};

export const checksFor = (plan: DayPlan, state: DayState, slotCount: number): CheckItem[] => {
  if (plan.kind === "warmup") return warmupChecks(false);
  if (plan.kind === "warmup-profile") return warmupChecks(true);
  if (plan.kind === "slideshow") {
    const poster = ACCOUNTS.find((account) => account.id === state.slideshowAccount);
    const others = ACCOUNTS.filter((account) => account.id !== poster?.id);
    const { each } = slideshowSplit(slotCount);
    const warmLabel = (account: AccountName) =>
      slotCount > 0 ? `${each} min d'échauffement · ${account.name}` : `Échauffement du temps restant · ${account.name}`;
    return [
      { id: "music", label: "Choisir la musique" },
      { id: "publish", label: poster ? `Publier le diaporama · ${poster.name}` : "Publier le diaporama" },
      { id: "before", label: "10 min d'échauffement avant la publication" },
      { id: "after", label: "10 min d'échauffement après la publication" },
      ...others.map((account) => ({ id: `warm-${account.id}`, label: warmLabel(account) })),
    ];
  }
  if (plan.kind === "two-publish") {
    const publishers = ACCOUNTS.filter((account) => state.publishers.includes(account.id));
    const warming = ACCOUNTS.filter((account) => !state.publishers.includes(account.id));
    if (publishers.length !== 2) return [];
    return [
      ...publishers.map((account) => ({ id: `pub-${account.id}`, label: `Publier · ${account.name}` })),
      ...warming.map((account) => ({ id: `warm-${account.id}`, label: `Échauffement seulement · ${account.name}` })),
    ];
  }
  return ACCOUNTS.map((account) => ({ id: `pub-${account.id}`, label: `Publier · ${account.name}` }));
};

export const dayReady = (plan: DayPlan, state: DayState, slotCount: number) => {
  if (!state.proofName) return false;
  if (plan.kind === "slideshow" && !ACCOUNTS.some((account) => account.id === state.slideshowAccount)) return false;
  if (plan.kind === "two-publish" && state.publishers.length !== 2) return false;
  const checks = checksFor(plan, state, slotCount);
  return checks.length > 0 && checks.every((check) => state.checks[check.id] === true);
};

export const slotsFor = (desk: Desk, personId: string, date: string): SlotId[] => {
  const chosen = desk.slots[personId]?.[date] ?? [];
  return SLOTS.map((slot) => slot.id).filter((id) => chosen.includes(id));
};

export const othersValidated = (desk: Desk) =>
  desk.people.length > 0 && desk.people.every((person) => desk.weekValidated[person.id] === true);

export const dayHeading = (plan: DayPlan) =>
  plan.repeatsDay7 ? "Même programme que le jour 7" : `Jour ${plan.index}`;
