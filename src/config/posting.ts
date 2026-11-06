/** Posting desk, 5–15 Nov 2026. Three profiles plus Tania. Proof is the recording, never a link. */

export const CALENDAR_START = "2026-11-05";
export const CALENDAR_END = "2026-11-15";
export const FRIDAY_CONNECT_MINUTES = 10;
export const FRIDAY_ACCOUNT_MINUTES = 16;
export const SATURDAY_ACCOUNT_MINUTES = 20;
export const SUNDAY_PHOTO_MINUTES = 5;
export const SUNDAY_BIO_MINUTES = 5;
/** 50 minutes left in the hour, in whole minutes. */
export const SUNDAY_WARM_MINUTES = [17, 17, 16] as const;
export const MONDAY_WARM_BEFORE = 8;
export const MONDAY_POST_MINUTES = 5;
export const MONDAY_WARM_AFTER = 8;
export const MONDAY_COMPTE2_MINUTES = 19;
export const MONDAY_COMPTE3_MINUTES = 20;
export const TUESDAY_WARM_BEFORE = 8;
export const TUESDAY_POST_MINUTES = 5;
export const TUESDAY_WARM_AFTER = 8;
export const TUESDAY_COMPTE2_WARM = 5;
export const TUESDAY_COMPTE2_PROFILE = 5;
export const TUESDAY_COMPTE2_WARM_AFTER = 5;
export const TUESDAY_COMPTE3_MINUTES = 24;

export const SLOTS = [
  { id: "17-18", label: "17:00–18:00", short: "17–18" },
  { id: "18-19", label: "18:00–19:00", short: "18–19" },
  { id: "19-20", label: "19:00–20:00", short: "19–20" },
  { id: "20-21", label: "20:00–21:00", short: "20–21" },
] as const;

export type SlotId = (typeof SLOTS)[number]["id"];

export type AccountName = { id: string; name: string; task: string };

export const ACCOUNTS: AccountName[] = [
  { id: "fr", name: "FR", task: "Compte 1" },
  { id: "es", name: "ES", task: "Compte 2" },
  { id: "us", name: "US", task: "Compte 3" },
];

export type Person = { id: string; name: string };

export const PROFILES: Person[] = [
  { id: "p1", name: "Profil 1" },
  { id: "p2", name: "Profil 2" },
  { id: "p3", name: "Profil 3" },
];

export type DeskRole = "tania" | "p1" | "p2" | "p3";

export type DayKind = "friday" | "saturday" | "sunday" | "post";

export type DayPlan = {
  date: string;
  index: number;
  kind: DayKind;
  repeatsDay7: boolean;
  /** Account ids that publish. The others only warm up. Empty before Monday. */
  publishers: string[];
};

export type CheckItem = { id: string; label: string };

export type DayState = {
  checks: Record<string, boolean>;
  proofName: string | null;
  validated: boolean;
};

export type Desk = {
  people: Person[];
  slots: Record<string, Record<string, SlotId[]>>;
  weekValidated: Record<string, boolean>;
  days: Record<string, Record<string, DayState>>;
  taniaFiles: Record<string, Record<string, string>>;
};

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isIsoDate = (value: string) => {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const openDates = (today: string) => calendarDates().filter((date) => date >= today);

export const openPlans = (today: string) => DAY_PLANS.filter((plan) => plan.date >= today && plan.date <= PLANNED_THROUGH);

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

const post = (date: string, index: number, publishers: string[], repeatsDay7 = false): DayPlan => ({
  date,
  index,
  kind: "post",
  repeatsDay7,
  publishers,
});

export const DAY_PLANS: DayPlan[] = [
  { date: "2026-11-06", index: 1, kind: "friday", repeatsDay7: false, publishers: [] },
  { date: "2026-11-07", index: 2, kind: "saturday", repeatsDay7: false, publishers: [] },
  { date: "2026-11-08", index: 3, kind: "sunday", repeatsDay7: false, publishers: [] },
  post("2026-11-09", 4, ["fr"]),
  post("2026-11-10", 5, ["fr"]),
];

/** Day tasks are written through this date. Later days stay on the planner only. */
export const PLANNED_THROUGH = "2026-11-10";

export const planFor = (date: string) => DAY_PLANS.find((plan) => plan.date === date) ?? null;

export const isSlotId = (value: string): value is SlotId => SLOTS.some((slot) => slot.id === value);

export const emptyDayState = (): DayState => ({ checks: {}, proofName: null, validated: false });

export const emptyDesk = (): Desk => ({
  people: PROFILES.map((person) => ({ ...person })),
  slots: {},
  weekValidated: {},
  days: {},
  taniaFiles: {},
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

export const formatShortDay = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

export const madridToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

/** Whole minutes only, as in “16 min” or “17 min”. */
export const formatMinutes = (minutes: number) => `${Math.round(minutes)} min`;

/** Plain steps. The person may never have used TikTok this way. */
const warmGuide = (minutes: number, account: string, before = "") =>
  `${formatMinutes(minutes)} · ${account}. ${before}Ouvre ce compte et reste dessus. Fais défiler TikTok. Regarde chaque vidéo jusqu'au bout, sauf si elle ne t'intéresse pas. Écris un petit commentaire sous 2 ou 3 vidéos. Abonne-toi à des profils qui te plaisent. Tu chauffes le compte : tu ne postes rien, tu fais comme si c'était ton téléphone.`;

const postGuide = (minutes: number, account: string) =>
  `${formatMinutes(minutes)} · ${account}. C'est maintenant que tu postes. Ouvre le diaporama. Choisis une musique dans TikTok. Appuie sur Publier. Attends de voir la vidéo sur le profil.`;

export const checksFor = (plan: DayPlan): CheckItem[] => {
  if (plan.kind === "friday") {
    return [
      {
        id: "connect",
        label: `${formatMinutes(FRIDAY_CONNECT_MINUTES)} · Ouvre WhatsApp. Tania t'a envoyé le compte. Connecte-toi avec exactement ce qu'elle a écrit. Quand TikTok s'ouvre, tu t'arrêtes. Ne change pas la photo ni la bio.`,
      },
      ...ACCOUNTS.map((account) => ({ id: `min-${account.id}`, label: warmGuide(FRIDAY_ACCOUNT_MINUTES, account.task) })),
    ];
  }
  if (plan.kind === "sunday") {
    const [compte1] = ACCOUNTS;
    return [
      {
        id: `photo-${compte1.id}`,
        label: `${formatMinutes(SUNDAY_PHOTO_MINUTES)} · Mettre une photo de profil au ${compte1.task}. Va sur le profil, appuie sur la photo, et change-la. Photo d'une fille normale, Pinterest ou une photo que tu as déjà, pas de photo IA. Seulement le ${compte1.task}.`,
      },
      {
        id: `bio-${compte1.id}`,
        label: `${formatMinutes(SUNDAY_BIO_MINUTES)} · Mettre une bio au ${compte1.task}. Appuie sur Modifier le profil, puis sur Bio. Écris une bio courte, personnelle, normale, gentille et sympathique. Deux lignes suffisent. Seulement le ${compte1.task}.`,
      },
      ...ACCOUNTS.map((account, index) => ({
        id: `min-${account.id}`,
        label: warmGuide(SUNDAY_WARM_MINUTES[index], account.task),
      })),
    ];
  }
  if (plan.date === "2026-11-09") {
    const [compte1, compte2, compte3] = ACCOUNTS;
    return [
      { id: "warm-before", label: warmGuide(MONDAY_WARM_BEFORE, compte1.task, "Avant de poster. ") },
      { id: "post", label: postGuide(MONDAY_POST_MINUTES, compte1.task) },
      { id: "warm-after", label: warmGuide(MONDAY_WARM_AFTER, compte1.task, "Juste après avoir posté. ") },
      { id: "warm-2", label: warmGuide(MONDAY_COMPTE2_MINUTES, compte2.task, "Tu ne postes pas aujourd'hui. ") },
      { id: "warm-3", label: warmGuide(MONDAY_COMPTE3_MINUTES, compte3.task, "Tu ne postes pas aujourd'hui. ") },
    ];
  }
  if (plan.date === "2026-11-10") {
    const [compte1, compte2, compte3] = ACCOUNTS;
    return [
      { id: "warm-before-1", label: warmGuide(TUESDAY_WARM_BEFORE, compte1.task, "Avant de poster. ") },
      { id: "post-1", label: postGuide(TUESDAY_POST_MINUTES, compte1.task) },
      { id: "warm-after-1", label: warmGuide(TUESDAY_WARM_AFTER, compte1.task, "Juste après avoir posté. ") },
      { id: "warm-before-2", label: warmGuide(TUESDAY_COMPTE2_WARM, compte2.task, "Tu ne postes pas. ") },
      {
        id: "profile-2",
        label: `${formatMinutes(TUESDAY_COMPTE2_PROFILE)} · ${compte2.task}. Tu ne postes pas. Change la photo et la bio. Photo : appuie sur la photo, mets une fille normale, Pinterest ou une photo que tu as déjà, pas de photo IA. Bio : appuie sur Modifier le profil, écris une bio courte, personnelle, normale, gentille et sympathique.`,
      },
      { id: "warm-after-2", label: warmGuide(TUESDAY_COMPTE2_WARM_AFTER, compte2.task, "La photo et la bio sont faites. ") },
      { id: "warm-3", label: warmGuide(TUESDAY_COMPTE3_MINUTES, compte3.task, "Tu ne postes pas. Tu ne changes ni la photo ni la bio. ") },
    ];
  }
  if (plan.kind === "saturday") {
    return ACCOUNTS.map((account) => ({
      id: `min-${account.id}`,
      label: warmGuide(SATURDAY_ACCOUNT_MINUTES, account.task),
    }));
  }
  return ACCOUNTS.map((account) =>
    plan.publishers.includes(account.id)
      ? { id: `pub-${account.id}`, label: `Publier · ${account.task}` }
      : { id: `warm-${account.id}`, label: `Échauffement seulement · ${account.task}` }
  );
};

export const dayReady = (plan: DayPlan, state: DayState) => {
  if (!state.proofName) return false;
  const checks = checksFor(plan);
  return checks.length > 0 && checks.every((check) => state.checks[check.id] === true);
};

export const slotsFor = (desk: Desk, personId: string, date: string): SlotId[] => {
  const chosen = desk.slots[personId]?.[date] ?? [];
  return SLOTS.map((slot) => slot.id).filter((id) => chosen.includes(id));
};

/** One slot per day. Picking another replaces the previous one; picking the same one clears it. */
export const chooseSlot = (chosen: SlotId[], slotId: SlotId): SlotId[] =>
  chosen.length === 1 && chosen[0] === slotId ? [] : [slotId];

export const dayHeading = (plan: DayPlan) => (plan.repeatsDay7 ? "Même programme que le jour 7" : `Jour ${plan.index}`);

export const accountRole = (plan: DayPlan, accountId: string) =>
  plan.publishers.includes(accountId) ? "publie" : "échauffement";

export const personMark = (person: Person) => {
  const profile = person.name.match(/^Profil\s+(\d+)$/);
  if (profile) return profile[1];
  return person.name.slice(0, 2);
};
