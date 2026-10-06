import type { FOLLOWER_OPTIONS } from "./creatorApplication";

export type CreatorLocale = "en" | "fr";

type Labels<T extends readonly { value: string }[]> = Record<T[number]["value"], string>;

export interface CreatorFormCopy {
  steps: Record<"about" | "tiktok", { title: string; description: string }>;
  progress: {
    step: (current: number, total: number) => [string, string];
    next: (title: string) => string;
    finalStep: string;
    ariaLabel: string;
    ariaValue: (current: number, total: number, title: string) => string;
    complete: (percent: number) => string;
  };
  fields: {
    name: string;
    email: string;
    emailPlaceholder: string;
    country: string;
    ageConfirmed: string;
    tiktokUsername: string;
    tiktokUsernamePlaceholder: string;
    checkProfile: (username: string) => string;
    followers: string;
    followersHint: string;
    informationConfirmed: string;
    privacyNote: string;
  };
  options: {
    followers: Labels<typeof FOLLOWER_OPTIONS>;
  };
  errors: {
    nameEmpty: string;
    emailEmpty: string;
    emailInvalid: string;
    country: string;
    tooLong: (max: number) => string;
    ageConfirmed: string;
    usernameEmpty: string;
    usernameInvalid: string;
    pickRange: string;
    informationConfirmed: string;
    submit: string;
  };
  buttons: {
    back: string;
    continue: string;
    submit: string;
    sending: string;
  };
}

const followerLabels = {
  "1k_10k": "1K – 10K",
  "10k_50k": "10K – 50K",
  "50k_100k": "50K – 100K",
  "100k_500k": "100K – 500K",
  "500k_plus": "500K+",
};

const en: CreatorFormCopy = {
  steps: {
    about: { title: "About you", description: "Name, email, and country." },
    tiktok: { title: "Your TikTok", description: "Your username and a follower range." },
  },
  progress: {
    step: (current, total) => [`Step ${current}`, `of ${total}`],
    next: (title) => `Next: ${title}`,
    finalStep: "Final step",
    ariaLabel: "Application progress",
    ariaValue: (current, total, title) => `Step ${current} of ${total}: ${title}`,
    complete: (percent) => `${percent}% complete`,
  },
  fields: {
    name: "Name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    country: "Country",
    ageConfirmed: "I'm 18 or older.",
    tiktokUsername: "TikTok username",
    tiktokUsernamePlaceholder: "yourname",
    checkProfile: (username) => `Check it's you: tiktok.com/@${username} ↗`,
    followers: "Followers",
    followersHint: "Any follower count is welcome.",
    informationConfirmed:
      "I confirm this information is accurate and that TAAB can contact me by email about the creator program.",
    privacyNote: "Your information is only used to review your application.",
  },
  options: {
    followers: { ...followerLabels, under_1k: "Under 1K" },
  },
  errors: {
    nameEmpty: "What should we call you?",
    emailEmpty: "We need an email to get back to you.",
    emailInvalid: "That email doesn't look right.",
    country: "Pick the country you're based in.",
    tooLong: (max) => `Keep it under ${max} characters.`,
    ageConfirmed: "You need to be 18 or older to apply.",
    usernameEmpty: "Add your TikTok username.",
    usernameInvalid: "Usernames use letters, numbers, periods and underscores (2–24 characters).",
    pickRange: "Pick a range.",
    informationConfirmed: "Please confirm to submit your application.",
    submit:
      "Something went wrong while sending your application. Your answers are saved, so please try again.",
  },
  buttons: {
    back: "Back",
    continue: "Continue",
    submit: "Submit application",
    sending: "Sending…",
  },
};

const fr: CreatorFormCopy = {
  steps: {
    about: { title: "À propos de toi", description: "Nom, email et pays." },
    tiktok: { title: "Ton TikTok", description: "Ton pseudo et une tranche d'abonnés." },
  },
  progress: {
    step: (current, total) => [`Étape ${current}`, `sur ${total}`],
    next: (title) => `Ensuite : ${title}`,
    finalStep: "Dernière étape",
    ariaLabel: "Progression de la candidature",
    ariaValue: (current, total, title) => `Étape ${current} sur ${total} : ${title}`,
    complete: (percent) => `${percent} % terminé`,
  },
  fields: {
    name: "Nom",
    email: "Email",
    emailPlaceholder: "toi@exemple.com",
    country: "Pays",
    ageConfirmed: "J'ai 18 ans ou plus.",
    tiktokUsername: "Pseudo TikTok",
    tiktokUsernamePlaceholder: "tonpseudo",
    checkProfile: (username) => `C'est bien toi : tiktok.com/@${username} ↗`,
    followers: "Abonnés",
    followersHint: "Tous les profils sont les bienvenus.",
    informationConfirmed:
      "Je confirme que ces informations sont exactes et que TAAB peut me contacter par email au sujet du programme créateurs.",
    privacyNote: "Tes informations servent uniquement à étudier ta candidature.",
  },
  options: {
    followers: { ...followerLabels, under_1k: "Moins de 1K" },
  },
  errors: {
    nameEmpty: "Comment on t'appelle ?",
    emailEmpty: "On a besoin d'un email pour te répondre.",
    emailInvalid: "Cet email n'a pas l'air valide.",
    country: "Choisis le pays où tu vis.",
    tooLong: (max) => `${max} caractères maximum.`,
    ageConfirmed: "Tu dois avoir 18 ans ou plus pour postuler.",
    usernameEmpty: "Ajoute ton pseudo TikTok.",
    usernameInvalid: "Lettres, chiffres, points et underscores uniquement (2 à 24 caractères).",
    pickRange: "Choisis une tranche.",
    informationConfirmed: "Confirme pour envoyer ta candidature.",
    submit: "Un problème est survenu pendant l'envoi. Tes réponses sont sauvegardées, réessaie.",
  },
  buttons: {
    back: "Retour",
    continue: "Continuer",
    submit: "Envoyer ma candidature",
    sending: "Envoi…",
  },
};

export const CREATOR_FORM_COPY: Record<CreatorLocale, CreatorFormCopy> = { en, fr };
