/** Posting desk, 5–15 Nov 2026. Three profiles plus Tania. Proof is the recording, never a link. */

export const CALENDAR_START = "2026-11-05";
export const CALENDAR_END = "2026-11-15";
/** Workers see the current list, through Sunday 15 Nov. Past days stay off their screen. */
export const WORKER_VISIBLE_THROUGH = "2026-11-15";
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
};

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
};

const publishersOn = (date: string) =>
  (WEEK_STEPS[date] ?? []).filter((step) => step.kind === "post").map((step) => ACCOUNTS[step.account].id);

/** End-of-session totals, in account order. Tuesday uses the long callout. */
const SESSION_TOTALS: Record<string, readonly [number, number, number]> = {
  "2026-11-10": [20, 25, 30],
  "2026-11-11": [25, 30, 35],
  "2026-11-12": [35, 35, 35],
  "2026-11-13": [45, 45, 45],
  "2026-11-14": [55, 55, 55],
  "2026-11-15": [65, 65, 65],
};

const post = (date: string, index: number): DayPlan => ({
  date,
  index,
  kind: "post",
  repeatsDay7: false,
  publishers: publishersOn(date),
});

export const DAY_PLANS: DayPlan[] = [
  { date: "2026-11-06", index: 1, kind: "friday", repeatsDay7: false, publishers: [] },
  { date: "2026-11-07", index: 2, kind: "saturday", repeatsDay7: false, publishers: [] },
  { date: "2026-11-08", index: 3, kind: "sunday", repeatsDay7: false, publishers: [] },
  post("2026-11-09", 4),
  post("2026-11-10", 5),
  post("2026-11-11", 6),
  post("2026-11-12", 7),
  post("2026-11-13", 8),
  post("2026-11-14", 9),
  post("2026-11-15", 10),
];

/** Day tasks are written through this date. */
export const PLANNED_THROUGH = "2026-11-15";

export const planFor = (date: string) => DAY_PLANS.find((plan) => plan.date === date) ?? null;

export const isSlotId = (value: string): value is SlotId => SLOTS.some((slot) => slot.id === value);

export const emptyDayState = (): DayState => ({ checks: {}, proofName: null, validated: false });

export const emptyDesk = (): Desk => ({
  people: PROFILES.map((person) => ({ ...person })),
  slots: {},
  weekValidated: {},
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
    const engage = plan.date === "2026-11-09" ? say.engageMore : undefined;
    const checks = [...steps]
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
      if (plan.date >= "2026-11-10" && plan.date <= "2026-11-15") {
        return [task(`warm-${id}`, say.tuesdayFocus(account), ACCOUNT_BLOCK_MINUTES)];
      }
      return [task(`warm-${id}`, say.warm(account, say.noPostToday), ACCOUNT_BLOCK_MINUTES, undefined, engage)];
    });
    const totals = SESSION_TOTALS[plan.date];
    if (!totals) return checks;
    const last = new Map<string, number>();
    checks.forEach((check, index) => {
      const owner = check.id.endsWith("-fr") ? "fr" : check.id.endsWith("-es") ? "es" : check.id.endsWith("-us") ? "us" : "";
      if (owner) last.set(owner, index);
    });
    return checks.map((check, index) => {
      const owner = check.id.endsWith("-fr") ? "fr" : check.id.endsWith("-es") ? "es" : check.id.endsWith("-us") ? "us" : "";
      if (owner !== "fr" && owner !== "es" && owner !== "us") return check;
      if (last.get(owner) !== index) return check;
      const count = totals[owner === "fr" ? 0 : owner === "es" ? 1 : 2];
      return { ...check, goal: plan.date === "2026-11-10" ? say.followTotalLong(count) : say.followTotal(count) };
    });
  }
  if (plan.kind === "saturday") {
    return ACCOUNTS.map((account, index) => task(`min-${account.id}`, say.warm(name(index)), SATURDAY_ACCOUNT_MINUTES));
  }
  return [];
};

export const dayReady = (plan: DayPlan, state: DayState) => {
  if (!state.proofName) return false;
  const checks = checksFor(plan);
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

/** Days still on a girl's screen: from her local today through Sunday 15 Nov. */
export const workerVisiblePlans = (name: string, now = new Date()) => {
  const today = calendarDate(timeZoneForGirl(name), now);
  return DAY_PLANS.filter((plan) => plan.date >= today && plan.date <= WORKER_VISIBLE_THROUGH);
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

export const accountWord = (index: number, lang: PostingLang) => {
  const number = index + 1;
  if (lang === "es") return `Cuenta ${number}`;
  if (lang === "en") return `Account ${number}`;
  return `Compte ${number}`;
};

export const dateLocale = (lang: PostingLang) => (lang === "es" ? "es-ES" : lang === "en" ? "en-US" : "fr-FR");

type Phrases = {
  create: (first: string, second: string, third: string) => string;
  username: string;
  noProfile: string;
  warm: (account: string, before?: string) => string;
  post: (account: string) => string;
  postWarmBefore: (account: string, goal?: string) => string;
  postWarmAfter: (account: string) => string;
  tuesdayWarmBefore: (account: string, goal?: string, forYou?: string) => string;
  tuesdayForYou: string;
  forYouWarmBefore: (account: string) => string;
  tuesdayPost: (account: string) => string;
  tuesdayWarmAfter: (account: string) => string;
  tuesdayClose: (account: string) => string;
  tuesdayStay: (account: string) => string;
  tuesdayFocus: (account: string) => string;
  followTotal: (count: number) => string;
  followTotalLong: (count: number) => string;
  focusGoal: (count: number) => string;
  focusNoPost: (account: string, count: number) => string;
  profile: (account: string) => string;
  photoRule: string;
  photoMonday: string;
  bioTitle: string;
  bioTuesday: string;
  bioRule: string;
  thenWarm: string;
  noPostToday: string;
  engageMore: string;
};

const block = (...parts: Array<string | undefined>) => parts.filter((part) => part && part.trim()).join("\n");

const phrases: Record<PostingLang, Phrases> = {
  fr: {
    create: (first, second, third) =>
      block(
        "Crée 3 comptes TikTok neufs.",
        `Un pour le ${first}, un pour le ${second}, un pour le ${third}.`,
        "• Chacun part de zéro",
        "• Pas un compte déjà ouvert",
        "• Un e-mail ou un numéro de téléphone de ton pays",
        "• Le compte t'appartient",
        "• Je ne le reprendrai jamais",
        "• Tu peux supprimer les comptes sans souci",
        "• Tu n'enregistres pas cette partie",
        "• Il peut y avoir des mots de passe"
      ),
    username: block(
      "Nom d'utilisateur",
      "• Un prénom courant de fille",
      "• Dans le pays où tu postes",
      "• C'est toi qui choisis",
      "• Pas un nom en rapport avec mes applications"
    ),
    noProfile: block("Pas de photo et pas de bio", "• Tu ne mets ni photo de profil ni bio", "• Tu crées seulement les comptes"),
    warm: (account, before = "") =>
      block(
        account,
        before.trim(),
        "Reste dessus, comme si c'était ton TikTok.",
        "Passe un bon moment.",
        "• Fais défiler, regarde ce qui t'intéresse",
        "• Tu n'aimes pas tout",
        "• Un like, seulement quand ça te plaît vraiment",
        "• Tu ne postes rien"
      ),
    postWarmBefore: (account, goal) =>
      block(
        account,
        "Échauffement.",
        goal,
        "Reste dessus, comme si c'était ton TikTok.",
        "• Fais défiler, regarde ce qui t'intéresse",
        "• Un like, seulement quand ça te plaît vraiment"
      ),
    post: (account) =>
      block(
        account,
        "Tu postes le diaporama du jour.",
        "• Il est sur cette page, tu le télécharges",
        "• Choisis une musique dans TikTok",
        "• Appuie sur Publier",
        "• Attends de voir la vidéo sur le profil"
      ),
    postWarmAfter: (account) =>
      block(
        account,
        "Échauffement après.",
        "Reste dessus, comme si c'était ton TikTok.",
        "• Fais défiler, regarde ce qui t'intéresse",
        "• Tu ne postes plus"
      ),
    tuesdayWarmBefore: (account, goal, forYou) =>
      block(
        account,
        "Échauffement précis.",
        goal,
        "• Va sur 5 comptes d'influenceurs de ton pays que tu connais. Abonne-toi, regarde leurs vidéos, et réponds à des commentaires déjà là.",
        forYou ?? "• Retourne sur le Pour toi. Défile, abonne-toi et commente au moins 5 vidéos."
      ),
    tuesdayForYou:
      "• Retourne sur le Pour toi. Défile, comporte-toi normalement et interagis avec les vidéos (likes, commentaires, abonnements) quand ça t'intéresse et que c'est du contenu de ton pays.",
    forYouWarmBefore: (account) =>
      block(
        account,
        "Échauffement précis.",
        "• Va sur la page Pour toi. Défile, comporte-toi normalement et interagis avec les vidéos (likes, commentaires, abonnements) quand ça t'intéresse et que c'est du contenu de ton pays."
      ),
    tuesdayPost: (account) =>
      block(
        account,
        "Tu postes le diaporama du jour.",
        "• Tu le télécharges ici.",
        "• Choisis une musique TikTok du moment, une que tu connais et que tu entends souvent.",
        "• Copie cette description.",
        "• Appuie sur Publier.",
        "• Attends de voir la vidéo sur le profil."
      ),
    tuesdayWarmAfter: (account) =>
      block(
        account,
        "Échauffement après.",
        "• Retourne sur le Pour toi.",
        "• Fais défiler, regarde ce qui t'intéresse.",
        "• Tu ne postes plus.",
        "• Interagis de façon naturelle."
      ),
    tuesdayClose: (account) =>
      block(
        account,
        "• Retourne sur le Pour toi.",
        "• Fais défiler, regarde ce qui t'intéresse.",
        "• Tu ne postes plus.",
        "• Interagis de façon naturelle.",
        "• Abonne-toi à des comptes de ton pays quand le contenu te plaît."
      ),
    tuesdayStay: (account) =>
      block(
        account,
        "Reste dessus, comme si c'était ton TikTok.",
        "Passe un bon moment.",
        "• Défile, regarde ce qui t'intéresse.",
        "• Un like, seulement quand ça te plaît vraiment.",
        "• Abonne-toi à des créateurs de ton pays quand une vidéo te plaît, puis montre le profil.",
        "• Tu ne postes rien."
      ),
    tuesdayFocus: (account) =>
      block(
        account,
        "• Défile comme si c'était ton TikTok. Passe un bon moment. Commente, et réponds à des commentaires déjà là.",
        "• Va sur des influenceurs que tu connais, pas trop connus, pour que TikTok voie que tu es du pays.",
        "• Tu n'aimes pas tout.",
        "• Un like seulement quand ça te plaît vraiment."
      ),
    followTotal: (count) => `Tu dois avoir ${count} abonnements ou plus au total sur le compte.`,
    followTotalLong: (count) =>
      `Tu dois avoir ${count} abonnements ou plus au total sur le compte. À la fin de la session de ce compte, montre-moi le profil pour valider qu'il y a bien ${count} abonnements ou plus.`,
    focusGoal: (count) =>
      `Objectif : au moins ${count} abonnements à la fin, et montrer à TikTok que tu es une vraie personne.`,
    focusNoPost: (account, count) =>
      block(
        account,
        "Focus objectif.",
        `Objectif : au moins ${count} abonnements à la fin, et montrer à TikTok que tu es une vraie personne.`,
        "• Défile comme si c'était ton TikTok. Passe un bon moment. Commente, et réponds à des commentaires déjà là.",
        "• Va sur des influenceurs que tu connais, pas trop connus, pour que TikTok voie que tu es du pays.",
        "• Tu n'aimes pas tout.",
        `• Abonne-toi jusqu'à au moins ${count} abonnements.`,
        "• Un like seulement quand ça te plaît vraiment."
      ),
    profile: (account) => block(account, "Écris une bio et mets une photo de profil."),
    photoRule: block("La photo", "• Elle vient de Pinterest, ou c'est une photo que tu as déjà", "• Pas d'image générée par IA"),
    photoMonday: block(
      "La photo",
      "• Un screen d'une fille sur Pinterest, ou une photo que tu as déjà",
      "• Pas d'image générée par IA"
    ),
    bioTitle: "La bio",
    bioTuesday: "conseils amitié & meilleures amies 🫶 toujours avec le jeu vérité ou vérité",
    bioRule: block("La bio", "• Naturelle, écrite par toi", "• Elle ne parle pas des applications", "• Pas de texte généré par IA"),
    thenWarm: "Ensuite.",
    noPostToday: "Tu ne postes pas aujourd'hui.",
    engageMore:
      "Aujourd'hui, abonne-toi un peu plus, like et commente un peu plus. Engage-toi un peu plus dans les vidéos. Tu peux en swiper plein si elles ne t'intéressent pas.",
  },
  es: {
    create: (first, second, third) =>
      block(
        "Crea 3 cuentas de TikTok nuevas.",
        `Una para ${first}, una para ${second} y una para ${third}.`,
        "• Cada una empieza de cero",
        "• No uses una cuenta ya abierta",
        "• Un correo o un número de tu país",
        "• La cuenta es tuya",
        "• Nunca me la quedaré",
        "• Puedes borrar las cuentas sin problema",
        "• No grabes esta parte",
        "• Puede haber contraseñas"
      ),
    username: block(
      "Nombre de usuario",
      "• Un nombre común de chica",
      "• Del país donde publicas",
      "• Lo eliges tú",
      "• Nada relacionado con mis aplicaciones"
    ),
    noProfile: block("Sin foto y sin bio", "• Ni foto de perfil ni bio", "• Solo creas las cuentas"),
    warm: (account, before = "") =>
      block(
        account,
        before.trim(),
        "Como si fuera tu TikTok.",
        "Pasa un buen rato.",
        "• Desliza, mira lo que te interesa",
        "• No des like a todo",
        "• Un like, solo cuando de verdad te guste",
        "• No publicas nada"
      ),
    postWarmBefore: (account, goal) =>
      block(
        account,
        "Calentamiento.",
        goal,
        "Como si fuera tu TikTok.",
        "• Desliza, mira lo que te interesa",
        "• Un like, solo cuando de verdad te guste"
      ),
    post: (account) =>
      block(
        account,
        "Publicas el carrusel del día.",
        "• Está en esta página, lo descargas",
        "• Elige una música en TikTok",
        "• Pulsa Publicar",
        "• Espera a ver el vídeo en el perfil"
      ),
    postWarmAfter: (account) =>
      block(
        account,
        "Calentamiento después.",
        "Como si fuera tu TikTok.",
        "• Desliza, mira lo que te interesa",
        "• Ya no publicas"
      ),
    tuesdayWarmBefore: (account, goal, forYou) =>
      block(
        account,
        "Calentamiento preciso.",
        goal,
        "• Entra en 5 cuentas de influencers de tu país que conoces. Síguelas, mira sus vídeos y responde a comentarios que ya están ahí.",
        forYou ?? "• Vuelve al Para ti. Desliza, suscríbete y comenta al menos 5 vídeos."
      ),
    tuesdayForYou:
      "• Vuelve al Para ti. Desliza, compórtate con normalidad e interactúa con los vídeos (likes, comentarios, seguimientos) cuando te interese y sea contenido de tu país.",
    forYouWarmBefore: (account) =>
      block(
        account,
        "Calentamiento preciso.",
        "• Ve a la página Para ti. Desliza, compórtate con normalidad e interactúa con los vídeos (likes, comentarios, seguimientos) cuando te interese y sea contenido de tu país."
      ),
    tuesdayPost: (account) =>
      block(
        account,
        "Publicas el carrusel del día.",
        "• Lo descargas aquí.",
        "• Elige una música de TikTok del momento, una que conoces y que oyes a menudo.",
        "• Copia esta descripción.",
        "• Pulsa Publicar.",
        "• Espera a ver el vídeo en el perfil."
      ),
    tuesdayWarmAfter: (account) =>
      block(
        account,
        "Calentamiento después.",
        "• Vuelve al Para ti.",
        "• Desliza, mira lo que te interesa.",
        "• Ya no publicas.",
        "• Interactúa con naturalidad."
      ),
    tuesdayClose: (account) =>
      block(
        account,
        "• Vuelve al Para ti.",
        "• Desliza, mira lo que te interesa.",
        "• Ya no publicas.",
        "• Interactúa con naturalidad.",
        "• Sigue cuentas de tu país cuando el contenido te guste."
      ),
    tuesdayStay: (account) =>
      block(
        account,
        "Quédate, como si fuera tu TikTok.",
        "Pasa un buen rato.",
        "• Desliza, mira lo que te interesa.",
        "• Un like, solo cuando de verdad te guste.",
        "• Sigue a creadores de tu país cuando un vídeo te guste, y luego muestra el perfil.",
        "• No publicas nada."
      ),
    tuesdayFocus: (account) =>
      block(
        account,
        "• Desliza como si fuera tu TikTok. Pasa un buen rato. Comenta y responde a comentarios que ya están ahí.",
        "• Entra en influencers que conoces, no muy conocidos, para que TikTok vea que eres del país.",
        "• No le des like a todo.",
        "• Un like solo cuando de verdad te guste."
      ),
    followTotal: (count) => `Tienes que tener ${count} seguidos o más en total en la cuenta.`,
    followTotalLong: (count) =>
      `Tienes que tener ${count} seguidos o más en total en la cuenta. Al final de la sesión de esta cuenta, muéstrame el perfil para comprobar que hay ${count} seguidos o más.`,
    focusGoal: (count) => `Objetivo: al menos ${count} seguidos al final, y mostrarle a TikTok que eres una persona real.`,
    focusNoPost: (account, count) =>
      block(
        account,
        "Focus objetivo.",
        `Objetivo: al menos ${count} seguidos al final, y mostrarle a TikTok que eres una persona real.`,
        "• Desliza como si fuera tu TikTok. Pasa un buen rato. Comenta y responde a comentarios que ya están ahí.",
        "• Entra en influencers que conoces, no muy conocidos, para que TikTok vea que eres del país.",
        "• No le des like a todo.",
        `• Sigue cuentas hasta tener al menos ${count} seguidos.`,
        "• Un like solo cuando de verdad te guste."
      ),
    profile: (account) => block(account, "Escribe una bio y pon una foto de perfil."),
    photoRule: block("La foto", "• Sale de Pinterest, o es una foto que ya tienes", "• Nada de imagen generada por IA"),
    photoMonday: block(
      "La foto",
      "• Un screen de una chica en Pinterest, o una foto que ya tienes",
      "• Nada de imagen generada por IA"
    ),
    bioTitle: "La bio",
    bioTuesday: "consejos de amistad 🫶 siempre con el juego verdad o verdad",
    bioRule: block("La bio", "• Natural, escrita por ti", "• No habla de las aplicaciones", "• Nada de texto generado por IA"),
    thenWarm: "Después.",
    noPostToday: "Hoy no publicas.",
    engageMore:
      "Hoy, suscríbete un poco más, dale like y comenta un poco más. Implícate un poco más en los vídeos. Puedes deslizar muchas si no te interesan.",
  },
  en: {
    create: (first, second, third) =>
      block(
        "Create 3 new TikTok accounts.",
        `One for ${first}, one for ${second}, and one for ${third}.`,
        "• Each one starts from zero",
        "• Do not use an account that is already open",
        "• An email or a phone number from your country",
        "• The account belongs to you",
        "• I will never take it for myself",
        "• You can delete the accounts without any problem",
        "• Do not record this part",
        "• There may be passwords"
      ),
    username: block(
      "Username",
      "• A common girl's name",
      "• From the country you post in",
      "• You choose it",
      "• Nothing related to my apps"
    ),
    noProfile: block("No photo and no bio", "• No profile photo and no bio", "• You only create the accounts"),
    warm: (account, before = "") =>
      block(
        account,
        before.trim(),
        "As if it were your TikTok.",
        "Have a good time.",
        "• Scroll, watch what you like",
        "• Do not like everything",
        "• A like, only when you really like it",
        "• You do not post anything"
      ),
    postWarmBefore: (account, goal) =>
      block(
        account,
        "Warm-up.",
        goal,
        "As if it were your TikTok.",
        "• Scroll, watch what you like",
        "• A like, only when you really like it"
      ),
    post: (account) =>
      block(
        account,
        "You post the day's slideshow.",
        "• It is on this page, you download it",
        "• Pick a song in TikTok",
        "• Tap Post",
        "• Wait until you see the video on the profile"
      ),
    postWarmAfter: (account) =>
      block(
        account,
        "Warm-up after.",
        "As if it were your TikTok.",
        "• Scroll, watch what you like",
        "• You do not post anymore"
      ),
    tuesdayWarmBefore: (account, goal, forYou) =>
      block(
        account,
        "Precise warm-up.",
        goal,
        "• Go to 5 influencer accounts from your country that you know. Follow them, watch their videos, and reply to comments that are already there.",
        forYou ?? "• Go back to For You. Scroll, follow, and comment on at least 5 videos."
      ),
    tuesdayForYou:
      "• Go back to For You. Scroll, act normally, and interact with the videos (likes, comments, follows) when it interests you and it is content from your country.",
    forYouWarmBefore: (account) =>
      block(
        account,
        "Precise warm-up.",
        "• Go to the For You page. Scroll, act normally, and interact with the videos (likes, comments, follows) when it interests you and it is content from your country."
      ),
    tuesdayPost: (account) =>
      block(
        account,
        "You post today's slideshow.",
        "• Download it here.",
        "• Pick a TikTok song of the moment, one you know and hear often.",
        "• Copy this caption.",
        "• Tap Post.",
        "• Wait until you see the video on the profile."
      ),
    tuesdayWarmAfter: (account) =>
      block(
        account,
        "Warm-up after.",
        "• Go back to For You.",
        "• Scroll, watch what interests you.",
        "• You do not post anymore.",
        "• Interact in a natural way."
      ),
    tuesdayClose: (account) =>
      block(
        account,
        "• Go back to For You.",
        "• Scroll, and watch what interests you.",
        "• You do not post anymore.",
        "• Interact in a natural way.",
        "• Follow accounts from your country when the content appeals to you."
      ),
    tuesdayStay: (account) =>
      block(
        account,
        "Stay on it, as if it were your TikTok.",
        "Have a good time.",
        "• Scroll, and watch what interests you.",
        "• A like only when you really like it.",
        "• Follow creators from your country when a video appeals to you, then show the profile.",
        "• You do not post anything."
      ),
    tuesdayFocus: (account) =>
      block(
        account,
        "• Scroll as if it were your TikTok. Have a good time. Comment, and reply to comments that are already there.",
        "• Go to influencers you know, not too well known, so TikTok sees that you are from the country.",
        "• You do not like everything.",
        "• A like only when you really like it."
      ),
    followTotal: (count) => `You need ${count} or more follows in total on the account.`,
    followTotalLong: (count) =>
      `You need ${count} or more follows in total on the account. At the end of this account's session, show me the profile to confirm there are ${count} or more follows.`,
    focusGoal: (count) =>
      `Goal: at least ${count} accounts you follow by the end, and show TikTok that you are a real person.`,
    focusNoPost: (account, count) =>
      block(
        account,
        "Focus: the goal.",
        `Goal: at least ${count} accounts you follow by the end, and show TikTok that you are a real person.`,
        "• Scroll as if it were your TikTok. Have a good time. Comment, and reply to comments that are already there.",
        "• Go to influencers you know, not too well known, so TikTok sees that you are from the country.",
        "• You do not like everything.",
        `• Keep following until you follow at least ${count} accounts.`,
        "• A like only when you really like it."
      ),
    profile: (account) => block(account, "Write a bio and add a profile photo."),
    photoRule: block("The photo", "• It comes from Pinterest, or it is a photo you already have", "• No AI-generated image"),
    photoMonday: block(
      "The photo",
      "• A screenshot of a girl on Pinterest, or a photo you already have",
      "• No AI-generated image"
    ),
    bioTitle: "The bio",
    bioTuesday: "bestie advice & friendship tips 🫶 always with the truth or truth game",
    bioRule: block("The bio", "• Natural, written by you", "• It does not mention the apps", "• No AI-generated text"),
    thenWarm: "Then.",
    noPostToday: "You do not post today.",
    engageMore:
      "Today, follow a bit more, like and comment a bit more. Engage a bit more with the videos. You can swipe through plenty if they don't interest you.",
  },
};

export const taskPhrases = (lang: PostingLang) => phrases[lang];

export const postingUi = (lang: PostingLang) =>
  ({
    fr: {
      switchProfile: "Changer de profil",
      range: (start: string, end: string) => `Du ${start} au ${end}.`,
      slots: "Tes heures",
      slotsHelp: "Choisis une seule heure par jour. L'heure en noir est la tienne. Pour changer, appuie sur une autre.",
      slotsVary: "Ne fais pas toujours la même heure. Varie, pour que l'algorithme comprenne que tu n'es pas un robot en automatique.",
      pickOne: "Aucune heure pour l'instant.",
      picked: (hour: string) => `Tu as choisi ${hour}.`,
      missingHours: (days: string) => `Il manque encore : ${days}.`,
      missingCount: (count: number) => `Il manque encore une heure sur ${count} jours.`,
      readyHours: "Chaque jour a une heure.",
      validateWeek: "Enregistrer mes heures",
      weekDone: "Tes heures sont enregistrées.",
      weekEdit: "Tu peux encore changer une heure. Appuie sur une autre.",
      todayWord: "aujourd'hui",
      proof: "Preuve du jour",
      proofPlay: "Lire",
      proofClose: "Fermer",
      proofBody: "Enregistrement filmé de la session. Tu as juste à enregistrer ton écran pendant toute ton heure de travail.",
      proofScroll: "Enregistrement des 30 minutes où tu fais défiler. Tu ne filmes pas la création des comptes : il peut y avoir des mots de passe.",
      validateDay: "Valider la journée",
      dayDone: "Journée validée",
      ready: "Cases et preuve sont là.",
      missing: "Il manque des cases ou la preuve.",
      local: "Les heures et les cases restent dans ce navigateur. Les images du diaporama et la vidéo sont envoyées.",
      files: "Les fichiers de ce navigateur ne se sont pas ouverts.",
      proofSending: (percent: number) => `Envoi… ${percent} %`,
      proofFail: "La vidéo n'est pas partie. Laisse la page ouverte et réessaie.",
      proofTooBig: "Cette vidéo dépasse 10 Go.",
      imagesMissing: "Les images ne sont pas encore là.",
      catchupTitle: "Vidéos à envoyer",
      catchupBody: "Vendredi et samedi sont passés. Envoie la vidéo de chaque jour. Une heure, jusqu'à 10 Go. Laisse la page ouverte.",
      catchupFriday: "Vidéo du vendredi 6 novembre",
      catchupSaturday: "Vidéo du samedi 7 novembre",
      opening: "Ouverture…",
    },
    es: {
      switchProfile: "Cambiar de perfil",
      range: (start: string, end: string) => `Del ${start} al ${end}.`,
      slots: "Tus horas",
      slotsHelp: "Elige una sola hora por día. La hora en negro es la tuya. Para cambiar, pulsa otra.",
      slotsVary: "No hagas siempre la misma hora. Varía, para que el algoritmo entienda que no eres un robot en automático.",
      pickOne: "Todavía no hay hora.",
      picked: (hour: string) => `Has elegido ${hour}.`,
      missingHours: (days: string) => `Todavía falta: ${days}.`,
      missingCount: (count: number) => `Todavía falta una hora en ${count} días.`,
      readyHours: "Cada día tiene una hora.",
      validateWeek: "Guardar mis horas",
      weekDone: "Tus horas están guardadas.",
      weekEdit: "Todavía puedes cambiar una hora. Pulsa otra.",
      todayWord: "hoy",
      proof: "Prueba del día",
      proofPlay: "Ver",
      proofClose: "Cerrar",
      proofBody: "Grabación de la sesión. Solo tienes que grabar tu pantalla durante toda tu hora de trabajo.",
      proofScroll: "Grabación de los 30 minutos en los que deslizas. No grabes la creación de las cuentas: puede haber contraseñas.",
      validateDay: "Validar el día",
      dayDone: "Día validado",
      ready: "Las casillas y la prueba están.",
      missing: "Faltan casillas o la prueba.",
      local: "Los horarios y las casillas se quedan en este navegador. Las imágenes del carrusel y el vídeo se envían.",
      files: "No se han podido abrir los archivos de este navegador.",
      proofSending: (percent: number) => `Enviando… ${percent} %`,
      proofFail: "El vídeo no se ha enviado. Deja la página abierta y vuelve a intentarlo.",
      proofTooBig: "Este vídeo pasa de 10 GB.",
      imagesMissing: "Las imágenes todavía no están.",
      catchupTitle: "Vídeos por enviar",
      catchupBody: "El viernes y el sábado ya pasaron. Envía el vídeo de cada día. Una hora, hasta 10 GB. Deja la página abierta.",
      catchupFriday: "Vídeo del viernes 6 de noviembre",
      catchupSaturday: "Vídeo del sábado 7 de noviembre",
      opening: "Abriendo…",
    },
    en: {
      switchProfile: "Switch profile",
      range: (start: string, end: string) => `From ${start} to ${end}.`,
      slots: "Your hours",
      slotsHelp: "Pick one hour each day. The black hour is yours. To change it, tap another hour.",
      slotsVary: "Don't always pick the same hour. Switch it up, so the algorithm sees you're not a robot on autopilot.",
      pickOne: "No hour yet.",
      picked: (hour: string) => `You picked ${hour}.`,
      missingHours: (days: string) => `Still missing: ${days}.`,
      missingCount: (count: number) => `An hour is still missing on ${count} days.`,
      readyHours: "Every day has an hour.",
      validateWeek: "Save my hours",
      weekDone: "Your hours are saved.",
      weekEdit: "You can still change an hour. Tap another one.",
      todayWord: "today",
      proof: "Proof of the day",
      proofPlay: "Play",
      proofClose: "Close",
      proofBody: "A recording of the session. Just screen-record your whole hour of work.",
      proofScroll: "A recording of the 30 minutes when you scroll. Do not record while you create the accounts: there may be passwords.",
      validateDay: "Validate the day",
      dayDone: "Day validated",
      ready: "The boxes and the proof are here.",
      missing: "Some boxes or the proof are missing.",
      local: "Time slots and boxes stay in this browser. The slideshow images and the video are sent.",
      files: "The files in this browser did not open.",
      proofSending: (percent: number) => `Sending… ${percent}%`,
      proofFail: "The video did not send. Keep this page open and try again.",
      proofTooBig: "This video is over 10 GB.",
      imagesMissing: "The images are not here yet.",
      catchupTitle: "Videos to send",
      catchupBody: "Friday and Saturday have passed. Send the video for each day. One hour, up to 10 GB. Keep this page open.",
      catchupFriday: "Friday, November 6 video",
      catchupSaturday: "Saturday, November 7 video",
      opening: "Opening…",
    },
  })[lang];
