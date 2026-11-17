/** Posting desk. The week of 16–22 Nov starts empty. Proof is the recording, never a link. */
import { block, taskPhrases } from "~/config/postingCopy";

export { postingUi, taskPhrases } from "~/config/postingCopy";

export const CALENDAR_START = "2026-11-05";
/** Monday 16 Nov. Days before this stay off the desk. Their tasks remain in the file. */
export const ACTIVE_WEEK_START = "2026-11-16";
export const FRIDAY_CREATE_MINUTES = 30;
export const FRIDAY_WARM_MINUTES = 10;
export const SATURDAY_ACCOUNT_MINUTES = 20;
export const SUNDAY_WARM_MINUTES = 20;
/** From Monday 9 Nov, each account is 20 minutes. A bio day splits that account into 10 + 10. */
export const PROFILE_SETUP_MINUTES = 10;
export const PROFILE_WARM_MINUTES = 10;
export const ACCOUNT_BLOCK_MINUTES = 20;
/** A posting account, from Tuesday 10 Nov, splits its 20 minutes into a warm-up, the slideshow, then a warm-up. */
export const POST_WARM_BEFORE_MINUTES = 8;
export const POST_PUBLISH_MINUTES = 5;
export const POST_WARM_AFTER_MINUTES = 7;

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
  /** Account ids that publish. The others only warm up. Empty on Friday and Saturday. */
  publishers: string[];
};

export type CheckItem = {
  id: string;
  label: string;
  parent?: string;
  minutes?: number;
  note?: string;
  copyText?: string;
  goal?: string;
  /** Shown above the tasks. Not a box the girl ticks. */
  banner?: boolean;
};

export type DayState = {
  checks: Record<string, boolean>;
  proofName: string | null;
  validated: boolean;
};

export type Desk = {
  people: Person[];
  slots: Record<string, Record<string, SlotId[]>>;
  days: Record<string, Record<string, DayState>>;
  taniaFiles: Record<string, Record<string, string[]>>;
  captions: Record<string, Record<string, string>>;
};

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const isIsoDate = (value: string) => {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const openDates = (today: string) => calendarDates().filter((date) => date >= today);

/** Days Tania reviews, including ones the worker no longer sees. */
export const suiviDates = (today: string) => calendarDates().filter((date) => date >= "2026-11-06" && date <= today);

export const CATCHUP_DATES = ["2026-11-06", "2026-11-07"] as const;

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

type WeekStep = { account: 0 | 1 | 2; kind: "profile" | "post" | "warm" };

/** Order matches the brief: bio account first when that is how the day was described. */
const WEEK_STEPS: Record<string, WeekStep[]> = {
  "2026-11-09": [
    { account: 0, kind: "profile" },
    { account: 1, kind: "warm" },
    { account: 2, kind: "warm" },
  ],
  "2026-11-10": [
    { account: 0, kind: "post" },
    { account: 1, kind: "profile" },
    { account: 2, kind: "warm" },
  ],
  "2026-11-11": [
    { account: 0, kind: "post" },
    { account: 1, kind: "post" },
    { account: 2, kind: "warm" },
  ],
  "2026-11-12": [
    { account: 0, kind: "post" },
    { account: 1, kind: "post" },
    { account: 2, kind: "warm" },
  ],
  "2026-11-13": [
    { account: 2, kind: "profile" },
    { account: 0, kind: "post" },
    { account: 1, kind: "post" },
  ],
  "2026-11-14": [
    { account: 0, kind: "post" },
    { account: 1, kind: "post" },
    { account: 2, kind: "post" },
  ],
  "2026-11-15": [
    { account: 0, kind: "post" },
    { account: 1, kind: "post" },
    { account: 2, kind: "post" },
  ],
  "2026-11-16": [
    { account: 0, kind: "post" },
    { account: 1, kind: "post" },
    { account: 2, kind: "post" },
  ],
};

const publishersOn = (date: string) =>
  (WEEK_STEPS[date] ?? []).filter((step) => step.kind === "post").map((step) => ACCOUNTS[step.account].id);

const previousIso = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** End-of-session totals, in account order. Tuesday uses the long callout. */
const SESSION_TOTALS: Record<string, readonly [number, number, number]> = {
  "2026-11-10": [20, 25, 30],
  "2026-11-11": [25, 30, 35],
  "2026-11-12": [35, 35, 35],
  "2026-11-13": [45, 45, 45],
  "2026-11-14": [55, 55, 55],
  "2026-11-15": [65, 65, 65],
  "2026-11-16": [65, 65, 65],
};

const post = (date: string, index: number): DayPlan => ({
  date,
  index,
  kind: "post",
  repeatsDay7: false,
  publishers: publishersOn(date),
});

const addDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

const FIRST_POST_DAY = "2026-11-09";
/** The active week runs Monday to Sunday. */
const ACTIVE_WEEK_END = addDays(ACTIVE_WEEK_START, 6);

export const DAY_PLANS: DayPlan[] = [
  { date: "2026-11-06", index: 1, kind: "friday", repeatsDay7: false, publishers: [] },
  { date: "2026-11-07", index: 2, kind: "saturday", repeatsDay7: false, publishers: [] },
  { date: "2026-11-08", index: 3, kind: "sunday", repeatsDay7: false, publishers: [] },
  ...Array.from({ length: (Date.parse(`${ACTIVE_WEEK_END}T00:00:00Z`) - Date.parse(`${FIRST_POST_DAY}T00:00:00Z`)) / 86_400_000 + 1 }, (_, offset) =>
    post(addDays(FIRST_POST_DAY, offset), offset + 4),
  ),
];

export const CALENDAR_END = DAY_PLANS[DAY_PLANS.length - 1].date;
/** Workers see the current list through the last planned day. Past days stay off their screen. */
export const WORKER_VISIBLE_THROUGH = CALENDAR_END;
/** Day tasks are written through the last day that has steps. */
export const PLANNED_THROUGH = Object.keys(WEEK_STEPS).sort().reverse()[0] ?? CALENDAR_START;
/** Sunday 15 Nov only. The week-end review lives on this day. */
export const BILAN_DATE = "2026-11-15";

export const planFor = (date: string) => DAY_PLANS.find((plan) => plan.date === date) ?? null;

export const isSlotId = (value: string): value is SlotId => SLOTS.some((slot) => slot.id === value);

export const emptyDayState = (): DayState => ({ checks: {}, proofName: null, validated: false });

export const emptyDesk = (): Desk => ({
  people: PROFILES.map((person) => ({ ...person })),
  slots: {},
  days: {},
  taniaFiles: {},
  captions: {},
});

export const formatDay = (iso: string, lang: PostingLang = "fr") => {
  const label = new Intl.DateTimeFormat(dateLocale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatShortDay = (iso: string, lang: PostingLang = "fr") =>
  new Intl.DateTimeFormat(dateLocale(lang), { weekday: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`)
  );

/** Tuesday 10 Nov and Wednesday 11 Nov only. Later days stay quiet. */
export const showHoursVary = (date: string) => date === "2026-11-10" || date === "2026-11-11";

export const madridToday = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

/** Whole minutes only, as in “16 min” or “17 min”. */
export const formatMinutes = (minutes: number) => `${Math.round(minutes)} min`;

const task = (id: string, label: string, minutes?: number, parent?: string, note?: string, copyText?: string): CheckItem => ({
  id,
  label,
  ...(typeof minutes === "number" ? { minutes } : {}),
  ...(parent ? { parent } : {}),
  ...(note ? { note } : {}),
  ...(copyText ? { copyText } : {}),
});

export const checksFor = (plan: DayPlan, lang: PostingLang = "fr"): CheckItem[] => {
  const say = taskPhrases(lang);
  const name = (index: number) => accountWord(index, lang);
  if (plan.kind === "friday") {
    return [
      task("create", say.create(name(0), name(1), name(2)), FRIDAY_CREATE_MINUTES),
      task("username", say.username, undefined, "create"),
      task("no-profile", say.noProfile, undefined, "create"),
      ...ACCOUNTS.map((account, index) => task(`min-${account.id}`, say.warm(name(index)), FRIDAY_WARM_MINUTES)),
    ];
  }
  if (plan.kind === "sunday") {
    return ACCOUNTS.map((account, index) =>
      task(`min-${account.id}`, say.warm(name(index), say.noPostToday), SUNDAY_WARM_MINUTES)
    );
  }
  const steps = WEEK_STEPS[plan.date];
  if (steps) {
    const hard = (plan.date >= "2026-11-12" && plan.date <= "2026-11-15") || plan.date === "2026-11-16";
    const total = (accountIndex: number) => SESSION_TOTALS[plan.date]?.[accountIndex] ?? 0;
    const engage = plan.date === "2026-11-09" ? say.engageMore : undefined;
    const checks = [
      ...(hard ? [{ ...task("rules", say.hardRules), banner: true }] : []),
      ...[...steps]
      .sort((a, b) => a.account - b.account)
      .flatMap((step) => {
      const account = name(step.account);
      const id = ACCOUNTS[step.account].id;
      if (step.kind === "profile") {
        return [
          task(`profile-${id}`, say.profile(account), PROFILE_SETUP_MINUTES),
          task(
            `photo-${id}`,
            plan.date === "2026-11-09" || plan.date === "2026-11-10" ? say.photoMonday : say.photoRule,
            undefined,
            `profile-${id}`,
          ),
          task(
            `bio-${id}`,
            plan.date === "2026-11-10" ? block(say.bioTitle, say.bioTuesday) : say.bioRule,
            undefined,
            `profile-${id}`,
            undefined,
            plan.date === "2026-11-10" ? say.bioTuesday : undefined,
          ),
          task(
            `warm-${id}`,
            plan.date === "2026-11-10"
              ? say.tuesdayStay(account)
              : hard
                ? say.hardProfileWarm(account, total(step.account), publishersOn(previousIso(plan.date)).includes(id))
                : plan.date >= "2026-11-11" && plan.date <= "2026-11-13"
                  ? say.tuesdayFocus(account)
                  : say.warm(account, say.thenWarm),
            PROFILE_WARM_MINUTES,
            undefined,
            engage,
          ),
        ];
      }
      if (step.kind === "post") {
        if (hard) {
          const count = total(step.account);
          const reply = publishersOn(previousIso(plan.date)).includes(id);
          const closing = plan.date === BILAN_DATE;
          return [
            task(
              `before-${id}`,
              closing ? say.sundayBefore(account) : say.hardBefore(account),
              closing ? (id === "us" ? 7 : 6) : POST_WARM_BEFORE_MINUTES,
            ),
            task(
              `post-${id}`,
              plan.date >= ACTIVE_WEEK_START && id === "us" ? say.videoPost(account) : say.hardPost(account),
              POST_PUBLISH_MINUTES,
            ),
            task(
              `after-${id}`,
              closing ? say.sundayAfter(account, reply) : say.hardAfter(account, count, reply),
              POST_WARM_AFTER_MINUTES,
            ),
          ];
        }
        const precise = plan.date >= "2026-11-10" && plan.date <= "2026-11-15";
        return [
          task(
            `before-${id}`,
            plan.date === "2026-11-10"
              ? say.tuesdayWarmBefore(account, undefined, say.tuesdayForYou)
              : precise
                ? say.forYouWarmBefore(account)
                : say.postWarmBefore(account),
            POST_WARM_BEFORE_MINUTES,
          ),
          task(
            `post-${id}`,
            plan.date >= "2026-11-10" && plan.date <= "2026-11-15" ? say.tuesdayPost(account) : say.post(account),
            POST_PUBLISH_MINUTES,
          ),
          task(
            `after-${id}`,
            plan.date === "2026-11-10"
              ? say.tuesdayClose(account)
              : precise
                ? say.tuesdayWarmAfter(account)
                : say.postWarmAfter(account),
            POST_WARM_AFTER_MINUTES,
          ),
        ];
      }
      if (hard) {
        return [task(`warm-${id}`, say.hardWarm(account, total(step.account), publishersOn(previousIso(plan.date)).includes(id)), ACCOUNT_BLOCK_MINUTES)];
      }
      if (plan.date >= "2026-11-10" && plan.date <= "2026-11-15") {
        return [task(`warm-${id}`, say.tuesdayFocus(account), ACCOUNT_BLOCK_MINUTES)];
      }
      return [task(`warm-${id}`, say.warm(account, say.noPostToday), ACCOUNT_BLOCK_MINUTES, undefined, engage)];
    }),
    ];
    const totals = SESSION_TOTALS[plan.date];
    if (!totals) return checks;
    const last = new Map<string, number>();
    checks.forEach((check, index) => {
      const owner = check.id.endsWith("-fr") ? "fr" : check.id.endsWith("-es") ? "es" : check.id.endsWith("-us") ? "us" : "";
      if (owner) last.set(owner, index);
    });
    const withGoals = checks.map((check, index) => {
      const owner = check.id.endsWith("-fr") ? "fr" : check.id.endsWith("-es") ? "es" : check.id.endsWith("-us") ? "us" : "";
      if (owner !== "fr" && owner !== "es" && owner !== "us") return check;
      if (last.get(owner) !== index) return check;
      const count = totals[owner === "fr" ? 0 : owner === "es" ? 1 : 2];
      return { ...check, goal: plan.date === "2026-11-10" ? say.followTotalLong(count) : say.followTotal(count) };
    });
    if (plan.date !== BILAN_DATE) return withGoals;
    return [...withGoals, task("bilan", say.bilan, 5)];
  }
  if (plan.kind === "saturday") {
    return ACCOUNTS.map((account, index) => task(`min-${account.id}`, say.warm(name(index)), SATURDAY_ACCOUNT_MINUTES));
  }
  return [];
};

export const dayReady = (plan: DayPlan, state: DayState) => {
  if (!state.proofName) return false;
  const checks = checksFor(plan).filter((check) => !check.banner);
  return checks.length > 0 && checks.every((check) => state.checks[check.id] === true);
};

/** Account suffix on a task id. Shared tasks have none. */
export const checkAccountId = (id: string) => (id.endsWith("-fr") ? "fr" : id.endsWith("-es") ? "es" : id.endsWith("-us") ? "us" : "");

/** A girl validates her own account, plus any task that is not tied to an account. */
export const taskIsHers = (id: string, accountId: string) => {
  const owner = checkAccountId(id);
  return !owner || owner === accountId;
};

/** A shared day can be removed once every profile that worked it has validated. */
export const dayIsValidated = (
  days: Record<string, { checks?: Record<string, boolean>; proofName?: string | null; validated?: boolean } | undefined>
) => {
  const concerned = Object.values(days).filter(
    (day): day is NonNullable<(typeof days)[string]> => {
      if (!day) return false;
      return day.validated === true || Boolean(day.proofName) || Object.values(day.checks ?? {}).some(Boolean);
    },
  );
  return concerned.length > 0 && concerned.every((day) => day.validated === true);
};

export const slotsFor = (desk: Desk, personId: string, date: string): SlotId[] => {
  const chosen = desk.slots[personId]?.[date] ?? [];
  return SLOTS.map((slot) => slot.id).filter((id) => chosen.includes(id));
};

/** One slot per day. Picking another replaces the previous one; picking the same one clears it. */
export const chooseSlot = (chosen: SlotId[], slotId: SlotId): SlotId[] =>
  chosen.length === 1 && chosen[0] === slotId ? [] : [slotId];

export const dayHeading = (plan: DayPlan, lang: PostingLang = "fr") => {
  if (plan.repeatsDay7) {
    if (lang === "es") return "Mismo programa que el día 7";
    if (lang === "en") return "Same plan as day 7";
    return "Même programme que le jour 7";
  }
  if (lang === "es") return `Día ${plan.index}`;
  if (lang === "en") return `Day ${plan.index}`;
  return `Jour ${plan.index}`;
};

export const accountRole = (plan: DayPlan, accountId: string) =>
  plan.publishers.includes(accountId) ? "publie" : "échauffement";

export const personMark = (person: Person) => {
  const profile = person.name.match(/^Profil\s+(\d+)$/);
  if (profile) return profile[1];
  return person.name.slice(0, 2);
};

/** Each girl hides a past day when that date is already over where she is. */
export const timeZoneForGirl = (name: string) => {
  const key = displayName(name).toLowerCase().split(/[\s-–—]/)[0];
  if (key === "ghada") return "Europe/Paris";
  if (key === "peches") return "Europe/Madrid";
  if (key === "karol") return "America/New_York";
  const lang = langFromName(name);
  if (lang === "es") return "Europe/Madrid";
  if (lang === "en") return "America/New_York";
  return "Europe/Paris";
};

/** Calendar day in that timezone, as YYYY-MM-DD. */
export const calendarDate = (timeZone: string, now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

/** Days still on a girl's screen. This week stays from Monday 16 so the video can still be downloaded. */
export const workerVisiblePlans = (name: string, now = new Date()) => {
  const today = calendarDate(timeZoneForGirl(name), now);
  const from = today >= ACTIVE_WEEK_START && today <= WORKER_VISIBLE_THROUGH ? ACTIVE_WEEK_START : today;
  return DAY_PLANS.filter((plan) => plan.date >= from && plan.date <= WORKER_VISIBLE_THROUGH);
};

export const shiftIsoDate = (iso: string, days: number) => {
  if (!isIsoDate(iso) || !Number.isInteger(days)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
};

/** The planned day that just closed on her clock, once it has left her screen. */
export const missedProofDate = (name: string, now = new Date()) => {
  const previous = shiftIsoDate(calendarDate(timeZoneForGirl(name), now), -1);
  if (!planFor(previous)) return null;
  if (workerVisiblePlans(name, now).some((plan) => plan.date === previous)) return null;
  return previous;
};

/** Locale sits at the end of the profile name: "Ghada - FR". */
export type PostingLang = "fr" | "es" | "en";

const LOCALE = /\s[-–—]\s*(fr|es|us)\s*$/i;

export const langFromName = (name: string): PostingLang => {
  const match = name.match(LOCALE);
  if (!match) return "fr";
  if (match[1].toLowerCase() === "es") return "es";
  if (match[1].toLowerCase() === "us") return "en";
  return "fr";
};

export const displayName = (name: string) => name.replace(LOCALE, "").trim() || name;

/** One label per market: FR, ES, US. */
export const marketLabel = (name: string) => {
  const lang = langFromName(name);
  return lang === "es" ? "ES" : lang === "en" ? "US" : "FR";
};

export const girlLabel = (name: string) => `${displayName(name)} · ${marketLabel(name)}`;

/** Karol alone can still send Sunday 15 November after that day has left the desk. */
export const sundayCatchupFor = (name: string) => {
  const key = displayName(name).toLowerCase().split(/[\s-–—]/)[0];
  if (key !== "karol") return null;
  return BILAN_DATE;
};

export const accountWord = (index: number, lang: PostingLang) => {
  const number = index + 1;
  if (lang === "es") return `Cuenta ${number}`;
  if (lang === "en") return `Account ${number}`;
  return `Compte ${number}`;
};

export const dateLocale = (lang: PostingLang) => (lang === "es" ? "es-ES" : lang === "en" ? "en-US" : "fr-FR");
