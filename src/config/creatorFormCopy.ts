import type { FOLLOWER_OPTIONS } from "./creatorApplication";

export type CreatorLocale = "en" | "fr";

type Labels<T extends readonly { value: string }[]> = Record<T[number]["value"], string>;

export interface CreatorFormCopy {
  title: string;
  fields: {
    name: string;
    email: string;
    emailPlaceholder: string;
    ageConfirmed: string;
    instagramUsername: string;
    instagramUsernamePlaceholder: string;
    tiktokUsername: string;
    tiktokUsernamePlaceholder: string;
    optional: string;
    handlesHint: string;
    checkProfile: (username: string) => string;
    followers: string;
    followersHint: string;
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
    handlesEmpty: string;
    instagramInvalid: string;
    usernameInvalid: string;
    pickRange: string;
    submit: string;
  };
  buttons: {
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
  title: "Your application",
  fields: {
    name: "Name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    ageConfirmed: "I'm 18 or older.",
    instagramUsername: "Instagram",
    instagramUsernamePlaceholder: "yourname",
    tiktokUsername: "TikTok",
    tiktokUsernamePlaceholder: "yourname",
    optional: "(optional)",
    handlesHint: "Instagram, TikTok, or both.",
    checkProfile: (username) => `Check it's you: tiktok.com/@${username} ↗`,
    followers: "Followers",
    followersHint: "Any follower count is welcome.",
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
    handlesEmpty: "Add your Instagram or your TikTok.",
    instagramInvalid: "Instagram usernames use letters, numbers, periods and underscores (1–30 characters).",
    usernameInvalid: "Usernames use letters, numbers, periods and underscores (2–24 characters).",
    pickRange: "Pick a range.",
    submit:
      "Something went wrong while sending your application. Your answers are saved, so please try again.",
  },
  buttons: {
    submit: "Submit application",
    sending: "Sending…",
  },
};

const fr: CreatorFormCopy = {
  title: "Ta candidature",
  fields: {
    name: "Nom",
    email: "Email",
    emailPlaceholder: "toi@exemple.com",
    ageConfirmed: "J'ai 18 ans ou plus.",
    instagramUsername: "Instagram",
    instagramUsernamePlaceholder: "tonpseudo",
    tiktokUsername: "TikTok",
    tiktokUsernamePlaceholder: "tonpseudo",
    optional: "(facultatif)",
    handlesHint: "Instagram, TikTok, ou les deux.",
    checkProfile: (username) => `C'est bien toi : tiktok.com/@${username} ↗`,
    followers: "Abonnés",
    followersHint: "Tous les profils sont les bienvenus.",
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
    handlesEmpty: "Ajoute ton Instagram ou ton TikTok.",
    instagramInvalid: "Lettres, chiffres, points et underscores uniquement (1 à 30 caractères).",
    usernameInvalid: "Lettres, chiffres, points et underscores uniquement (2 à 24 caractères).",
    pickRange: "Choisis une tranche.",
    submit: "Un problème est survenu pendant l'envoi. Tes réponses sont sauvegardées, réessaie.",
  },
  buttons: {
    submit: "Envoyer ma candidature",
    sending: "Envoi…",
  },
};

export const CREATOR_FORM_COPY: Record<CreatorLocale, CreatorFormCopy> = { en, fr };
