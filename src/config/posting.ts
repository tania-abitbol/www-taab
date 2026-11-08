/** Posting desk, 5–15 Nov 2026. Three profiles plus Tania. Proof is the recording, never a link. */

export const CALENDAR_START = "2026-11-05";
export const CALENDAR_END = "2026-11-15";
/** Workers only see the current list. The rest stays on Tania's screen. */
export const WORKER_VISIBLE_THROUGH = "2026-11-08";
export const FRIDAY_CREATE_MINUTES = 30;
export const FRIDAY_WARM_MINUTES = 10;
export const SATURDAY_ACCOUNT_MINUTES = 20;
export const SUNDAY_WARM_MINUTES = 20;
export const MONDAY_PHOTO_MINUTES = 5;
export const MONDAY_BIO_MINUTES = 5;
export const MONDAY_WARM_BEFORE = 8;
export const MONDAY_POST_MINUTES = 5;
export const MONDAY_WARM_AFTER = 8;
export const MONDAY_COMPTE2_MINUTES = 14;
export const MONDAY_COMPTE3_MINUTES = 15;
export const TUESDAY_WARM_BEFORE = 8;
export const TUESDAY_POST_MINUTES = 5;
export const TUESDAY_WARM_AFTER = 8;
export const TUESDAY_COMPTE2_WARM = 5;
export const TUESDAY_COMPTE2_PROFILE = 5;
export const TUESDAY_COMPTE2_POST = 5;
export const TUESDAY_COMPTE2_WARM_AFTER = 5;
export const TUESDAY_COMPTE3_MINUTES = 19;
/** Wednesday: the one account that does not post, then 8 + 5 + 8 on each of the other two. */
export const WEDNESDAY_WARM_ONLY = 18;
export const WEDNESDAY_WARM_BEFORE = 8;
export const WEDNESDAY_POST_MINUTES = 5;
export const WEDNESDAY_WARM_AFTER = 8;
/** Thursday through Sunday: every account posts, 8 + 5 + 7. */
export const ALL_WARM_BEFORE = 8;
export const ALL_POST_MINUTES = 5;
export const ALL_WARM_AFTER = 7;

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

export type CheckItem = { id: string; label: string; parent?: string };

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

/** Days Tania reviews, including ones the worker no longer sees. */
export const suiviDates = (today: string) => calendarDates().filter((date) => date >= "2026-11-06" && date <= today);

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
  post("2026-11-10", 5, ["fr", "es"]),
  post("2026-11-11", 6, ["fr", "es"]),
  post("2026-11-12", 7, ["fr", "es", "us"]),
  post("2026-11-13", 7, ["fr", "es", "us"], true),
  post("2026-11-14", 7, ["fr", "es", "us"], true),
  post("2026-11-15", 7, ["fr", "es", "us"], true),
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

const line = (minutes: number, text: string) => `${formatMinutes(minutes)} · ${text}`;

export const checksFor = (plan: DayPlan, lang: PostingLang = "fr"): CheckItem[] => {
  const say = taskPhrases(lang);
  const name = (index: number) => accountWord(index, lang);
  if (plan.kind === "friday") {
    return [
      { id: "create", label: line(FRIDAY_CREATE_MINUTES, say.create(name(0), name(1), name(2))) },
      { id: "username", label: say.username, parent: "create" },
      { id: "no-profile", label: say.noProfile, parent: "create" },
      ...ACCOUNTS.map((account, index) => ({ id: `min-${account.id}`, label: line(FRIDAY_WARM_MINUTES, say.warm(name(index))) })),
    ];
  }
  if (plan.kind === "sunday") {
    return ACCOUNTS.map((account, index) => ({
      id: `min-${account.id}`,
      label: line(SUNDAY_WARM_MINUTES, say.warm(name(index), say.noPostToday)),
    }));
  }
  if (plan.date === "2026-11-09") {
    const compte1 = name(0);
    return [
      { id: `photo-${ACCOUNTS[0].id}`, label: line(MONDAY_PHOTO_MINUTES, say.sundayPhoto(compte1)) },
      { id: `bio-${ACCOUNTS[0].id}`, label: line(MONDAY_BIO_MINUTES, say.sundayBio(compte1)) },
      { id: "warm-before", label: line(MONDAY_WARM_BEFORE, say.warm(name(0), say.beforePost)) },
      { id: "post", label: line(MONDAY_POST_MINUTES, say.post(name(0))) },
      { id: "warm-after", label: line(MONDAY_WARM_AFTER, say.warm(name(0), say.afterPost)) },
      { id: "warm-2", label: line(MONDAY_COMPTE2_MINUTES, say.warm(name(1), say.noPostToday)) },
      { id: "warm-3", label: line(MONDAY_COMPTE3_MINUTES, say.warm(name(2), say.noPostToday)) },
    ];
  }
  if (plan.date === "2026-11-10") {
    return [
      { id: "warm-before-1", label: line(TUESDAY_WARM_BEFORE, say.warm(name(0), say.beforePost)) },
      { id: "post-1", label: line(TUESDAY_POST_MINUTES, say.post(name(0))) },
      { id: "warm-after-1", label: line(TUESDAY_WARM_AFTER, say.warm(name(0), say.afterPost)) },
      { id: "warm-before-2", label: line(TUESDAY_COMPTE2_WARM, say.warm(name(1), say.beforePost)) },
      { id: "profile-2", label: line(TUESDAY_COMPTE2_PROFILE, say.tuesdayProfile(name(1))) },
      { id: "post-2", label: line(TUESDAY_COMPTE2_POST, say.post(name(1))) },
      { id: "warm-after-2", label: line(TUESDAY_COMPTE2_WARM_AFTER, say.warm(name(1), say.afterPost)) },
      { id: "warm-3", label: line(TUESDAY_COMPTE3_MINUTES, say.warm(name(2), say.noChange)) },
    ];
  }
  if (plan.kind === "saturday") {
    return ACCOUNTS.map((account, index) => ({
      id: `min-${account.id}`,
      label: line(SATURDAY_ACCOUNT_MINUTES, say.warm(name(index))),
    }));
  }
  if (plan.publishers.length === 2) {
    return ACCOUNTS.flatMap((account, index) =>
      plan.publishers.includes(account.id)
        ? [
            { id: `warm-before-${account.id}`, label: line(WEDNESDAY_WARM_BEFORE, say.warm(name(index), say.beforePost)) },
            { id: `post-${account.id}`, label: line(WEDNESDAY_POST_MINUTES, say.post(name(index))) },
            { id: `warm-after-${account.id}`, label: line(WEDNESDAY_WARM_AFTER, say.warm(name(index), say.afterPost)) },
          ]
        : [{ id: `warm-${account.id}`, label: line(WEDNESDAY_WARM_ONLY, say.warm(name(index), say.noPostToday)) }]
    );
  }
  if (plan.publishers.length === 3) {
    return ACCOUNTS.flatMap((account, index) => [
      { id: `warm-before-${account.id}`, label: line(ALL_WARM_BEFORE, say.warm(name(index), say.beforePost)) },
      { id: `post-${account.id}`, label: line(ALL_POST_MINUTES, say.post(name(index))) },
      { id: `warm-after-${account.id}`, label: line(ALL_WARM_AFTER, say.warm(name(index), say.afterPost)) },
    ]);
  }
  return ACCOUNTS.map((account, index) =>
    plan.publishers.includes(account.id)
      ? { id: `pub-${account.id}`, label: line(ALL_POST_MINUTES, say.post(name(index))) }
      : { id: `warm-${account.id}`, label: line(WEDNESDAY_WARM_ONLY, say.warm(name(index), say.noPostToday)) }
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
  sundayPhoto: (account: string) => string;
  sundayBio: (account: string) => string;
  tuesdayProfile: (account: string) => string;
  beforePost: string;
  afterPost: string;
  noPostToday: string;
  noPost: string;
  afterProfile: string;
  noChange: string;
};

const phrases: Record<PostingLang, Phrases> = {
  fr: {
    create: (first, second, third) =>
      `Crée 3 comptes TikTok neufs : un pour le ${first}, un pour le ${second}, un pour le ${third}. Chacun part de zéro. N'utilise pas un compte déjà ouvert. Pour chaque compte, prends un e-mail et/ou un numéro de téléphone de ton pays. Ça peut être les tiens. Le compte se crée dans ton pays : je ne suis pas dans le bon pays, je ne peux pas le faire à ta place. Le compte t'appartient, ce sont tes informations. Je ne le reprendrai jamais pour moi. À la fin de cette mission, tu peux supprimer les comptes sans souci. Tu n'enregistres pas cette partie : il peut y avoir des mots de passe. Tu filmes seulement les 30 minutes où tu fais défiler.`,
    username:
      "Nom d'utilisateur. Pour chaque compte, choisis un nom cohérent : un prénom courant de fille, dans le pays où tu postes. C'est toi qui choisis. Pas un nom en rapport avec mes applications.",
    noProfile: "Pas de photo et pas de bio. Pour le moment, tu ne mets ni photo de profil ni bio. Tu crées seulement les comptes.",
    warm: (account, before = "") =>
      `${account}. ${before}Ouvre ce compte et reste dessus, comme si c'était ton TikTok. Passe un bon moment. Fais défiler, regarde ce qui t'intéresse, et passe le reste. Tu n'aimes pas tout, tu ne commentes pas tout, tu ne regardes pas chaque vidéo jusqu'au bout. De temps en temps, un like, un petit commentaire ou un abonnement, seulement quand ça te plaît vraiment. Ça doit rester naturel. Tu ne postes rien.`,
    post: (account) =>
      `${account}. C'est maintenant que tu postes. Ouvre le diaporama. Choisis une musique dans TikTok. Appuie sur Publier. Attends de voir la vidéo sur le profil.`,
    sundayPhoto: (account) =>
      `Mettre une photo de profil au ${account}. Va sur le profil, appuie sur la photo, et change-la. Photo d'une fille normale, Pinterest ou une photo que tu as déjà, pas de photo IA. Seulement le ${account}.`,
    sundayBio: (account) =>
      `Mettre une bio au ${account}. Appuie sur Modifier le profil, puis sur Bio. Écris une bio courte, personnelle, normale, gentille et sympathique. Deux lignes suffisent. Seulement le ${account}.`,
    tuesdayProfile: (account) =>
      `${account}. Change la photo et la bio, puis tu postes. Photo : appuie sur la photo, mets une fille normale, Pinterest ou une photo que tu as déjà, pas de photo IA. Bio : appuie sur Modifier le profil, écris une bio courte, personnelle, normale, gentille et sympathique.`,
    beforePost: "Avant de poster. ",
    afterPost: "Juste après avoir posté. ",
    noPostToday: "Tu ne postes pas aujourd'hui. ",
    noPost: "Tu ne postes pas. ",
    afterProfile: "La photo et la bio sont faites. ",
    noChange: "Tu ne postes pas. Tu ne changes ni la photo ni la bio. ",
  },
  es: {
    create: (first, second, third) =>
      `Crea 3 cuentas de TikTok nuevas: una para ${first}, una para ${second} y una para ${third}. Cada una empieza de cero. No uses una cuenta que ya esté abierta. Para cada cuenta, usa un correo y/o un número de teléfono de tu país. Pueden ser los tuyos. La cuenta se crea en tu país: yo no estoy en el país correcto, no puedo hacerlo por ti. La cuenta es tuya, son tus datos. Nunca me la quedaré. Al final de esta misión, puedes borrar las cuentas sin problema. No grabes esta parte: puede haber contraseñas. Graba solo los 30 minutos en los que deslizas.`,
    username:
      "Nombre de usuario. Para cada cuenta, elige un nombre coherente: un nombre común de chica, del país donde publicas. Lo eliges tú. Nada relacionado con mis aplicaciones.",
    noProfile: "Sin foto y sin bio. Por ahora no pongas foto de perfil ni bio. Solo creas las cuentas.",
    warm: (account, before = "") =>
      `${account}. ${before}Abre esta cuenta y quédate ahí, como si fuera tu TikTok. Pasa un buen rato. Desliza, mira lo que te interesa y salta el resto. No des like a todo, no comentes todo, no mires cada vídeo hasta el final. De vez en cuando, un like, un comentario corto o un seguimiento, solo cuando de verdad te guste. Tiene que parecer natural. No publicas nada.`,
    post: (account) =>
      `${account}. Ahora sí publicas. Abre el carrusel. Elige una música en TikTok. Pulsa Publicar. Espera a ver el vídeo en el perfil.`,
    sundayPhoto: (account) =>
      `Pon una foto de perfil en ${account}. Ve al perfil, pulsa la foto y cámbiala. Una chica normal: de Pinterest o una foto que ya tengas. Nada de foto hecha por IA. Solo ${account}.`,
    sundayBio: (account) =>
      `Pon una bio en ${account}. Pulsa Editar perfil y luego Bio. Escribe una bio corta, personal, normal, amable y simpática. Dos líneas bastan. Solo ${account}.`,
    tuesdayProfile: (account) =>
      `${account}. Cambia la foto y la bio, y luego publicas. Foto: pulsa la foto y pon una chica normal, de Pinterest o una foto que ya tengas, nada de IA. Bio: pulsa Editar perfil y escribe una bio corta, personal, normal, amable y simpática.`,
    beforePost: "Antes de publicar. ",
    afterPost: "Justo después de publicar. ",
    noPostToday: "Hoy no publicas. ",
    noPost: "No publicas. ",
    afterProfile: "La foto y la bio ya están. ",
    noChange: "No publicas. No cambies ni la foto ni la bio. ",
  },
  en: {
    create: (first, second, third) =>
      `Create 3 new TikTok accounts: one for ${first}, one for ${second}, and one for ${third}. Each one starts from zero. Do not use an account that is already open. For each account, use an email and/or a phone number from your country. They can be your own. The account has to be created in your country: I am not in the right country, so I cannot do it for you. The account belongs to you, because it uses your details. I will never take it for myself. At the end of this mission, you can delete the accounts without any problem. Do not record this part: there may be passwords. Record only the 30 minutes when you scroll.`,
    username:
      "Username. For each account, pick a normal name: a common girl's name, from the country you post in. You choose it. Nothing related to my apps.",
    noProfile: "No photo and no bio. For now, do not add a profile photo or a bio. You only create the accounts.",
    warm: (account, before = "") =>
      `${account}. ${before}Open this account and stay on it, as if it were your TikTok. Have a good time. Scroll, watch what you like, and skip the rest. Do not like everything, do not comment on everything, and do not watch every video all the way through. Now and then, a like, a short comment, or a follow, only when you really like it. It has to feel natural. You do not post anything.`,
    post: (account) =>
      `${account}. Now you post. Open the slideshow. Pick a song in TikTok. Tap Post. Wait until you see the video on the profile.`,
    sundayPhoto: (account) =>
      `Put a profile photo on ${account}. Go to the profile, tap the photo, and change it. A normal girl: from Pinterest, or a photo you already have. No AI photo. Only ${account}.`,
    sundayBio: (account) =>
      `Put a bio on ${account}. Tap Edit profile, then Bio. Write a short, personal, normal, kind bio. Two lines is enough. Only ${account}.`,
    tuesdayProfile: (account) =>
      `${account}. Change the photo and the bio, then you post. Photo: tap the photo and use a normal girl, from Pinterest or a photo you already have, no AI. Bio: tap Edit profile and write a short, personal, normal, kind bio.`,
    beforePost: "Before you post. ",
    afterPost: "Right after you post. ",
    noPostToday: "You do not post today. ",
    noPost: "You do not post. ",
    afterProfile: "The photo and the bio are done. ",
    noChange: "You do not post. Do not change the photo or the bio. ",
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
      proofBody: "Enregistrement filmé de la session. Tu as juste à enregistrer ton écran pendant toute ton heure de travail.",
      proofScroll: "Enregistrement des 30 minutes où tu fais défiler. Tu ne filmes pas la création des comptes : il peut y avoir des mots de passe.",
      validateDay: "Valider la journée",
      dayDone: "Journée validée",
      ready: "Cases et preuve sont là.",
      missing: "Il manque des cases ou la preuve.",
      local: "Les heures et les cases restent dans ce navigateur. La vidéo est envoyée.",
      files: "Les fichiers de ce navigateur ne se sont pas ouverts.",
      proofSending: (percent: number) => `Envoi… ${percent} %`,
      proofFail: "La vidéo n'est pas partie. Laisse la page ouverte et réessaie.",
      proofTooBig: "Cette vidéo dépasse 3 Go.",
      opening: "Ouverture…",
    },
    es: {
      switchProfile: "Cambiar de perfil",
      range: (start: string, end: string) => `Del ${start} al ${end}.`,
      slots: "Tus horas",
      slotsHelp: "Elige una sola hora por día. La hora en negro es la tuya. Para cambiar, pulsa otra.",
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
      proofBody: "Grabación de la sesión. Solo tienes que grabar tu pantalla durante toda tu hora de trabajo.",
      proofScroll: "Grabación de los 30 minutos en los que deslizas. No grabes la creación de las cuentas: puede haber contraseñas.",
      validateDay: "Validar el día",
      dayDone: "Día validado",
      ready: "Las casillas y la prueba están.",
      missing: "Faltan casillas o la prueba.",
      local: "Los horarios y las casillas se quedan en este navegador. El vídeo se envía.",
      files: "No se han podido abrir los archivos de este navegador.",
      proofSending: (percent: number) => `Enviando… ${percent} %`,
      proofFail: "El vídeo no se ha enviado. Deja la página abierta y vuelve a intentarlo.",
      proofTooBig: "Este vídeo pasa de 3 GB.",
      opening: "Abriendo…",
    },
    en: {
      switchProfile: "Switch profile",
      range: (start: string, end: string) => `From ${start} to ${end}.`,
      slots: "Your hours",
      slotsHelp: "Pick one hour each day. The black hour is yours. To change it, tap another hour.",
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
      proofBody: "A recording of the session. Just screen-record your whole hour of work.",
      proofScroll: "A recording of the 30 minutes when you scroll. Do not record while you create the accounts: there may be passwords.",
      validateDay: "Validate the day",
      dayDone: "Day validated",
      ready: "The boxes and the proof are here.",
      missing: "Some boxes or the proof are missing.",
      local: "Time slots and boxes stay in this browser. The video is sent.",
      files: "The files in this browser did not open.",
      proofSending: (percent: number) => `Sending… ${percent}%`,
      proofFail: "The video did not send. Keep this page open and try again.",
      proofTooBig: "This video is over 3 GB.",
      opening: "Opening…",
    },
  })[lang];
