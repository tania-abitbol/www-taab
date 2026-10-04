import type {
  AVERAGE_VIEWS_OPTIONS,
  CONTENT_CATEGORY_OPTIONS,
  FOLLOWER_OPTIONS,
  POSTING_FREQUENCY_OPTIONS,
} from "./creatorApplication";

export type CreatorLocale = "en" | "fr";

type Labels<T extends readonly { value: string }[]> = Record<T[number]["value"], string>;

export interface CreatorFormCopy {
  steps: Record<"about" | "tiktok" | "motivation", { title: string; description: string }>;
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
    regionLabels: Record<string, string>;
    defaultRegionLabel: string;
    selectRegion: (label: string) => string;
    ageConfirmed: string;
    tiktokUsername: string;
    tiktokUsernamePlaceholder: string;
    checkProfile: (username: string) => string;
    followers: string;
    followersHint: string;
    averageViews: string;
    postingFrequency: string;
    contentCategories: string;
    contentCategoriesHint: (max: number) => string;
    whyCreator: string;
    whyCreatorHint: string;
    whyCreatorPlaceholder: string;
    informationConfirmed: string;
    privacyNote: string;
    optional: string;
  };
  options: {
    followers: Labels<typeof FOLLOWER_OPTIONS>;
    averageViews: Labels<typeof AVERAGE_VIEWS_OPTIONS>;
    postingFrequency: Labels<typeof POSTING_FREQUENCY_OPTIONS>;
    contentCategories: Labels<typeof CONTENT_CATEGORY_OPTIONS>;
  };
  errors: {
    nameEmpty: string;
    emailEmpty: string;
    emailInvalid: string;
    country: string;
    regionEmpty: (label: string) => string;
    tooLong: (max: number) => string;
    tooShort: string;
    ageConfirmed: string;
    usernameEmpty: string;
    usernameInvalid: string;
    pickRange: string;
    postingFrequency: string;
    categoriesEmpty: string;
    categoriesMax: (max: number) => string;
    categoriesSwap: (max: number) => string;
    whyCreatorEmpty: string;
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

const sharedRangeLabels = {
  followers: {
    under_1k: "",
    "1k_10k": "1K – 10K",
    "10k_50k": "10K – 50K",
    "50k_100k": "50K – 100K",
    "100k_500k": "100K – 500K",
    "500k_plus": "500K+",
  },
  averageViews: {
    under_500: "",
    "500_2k": "500 – 2K",
    "2k_10k": "2K – 10K",
    "10k_50k": "10K – 50K",
    "50k_plus": "50K+",
  },
};

const en: CreatorFormCopy = {
  steps: {
    about: { title: "About you", description: "The basics, so we know who we're talking to." },
    tiktok: { title: "Your TikTok", description: "Rough numbers are fine. No screenshots needed." },
    motivation: { title: "Last step", description: "One quick question and you're done." },
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
    regionLabels: { US: "State", FR: "Region" },
    defaultRegionLabel: "State / region",
    selectRegion: (label) => `Select your ${label.toLowerCase()}`,
    ageConfirmed: "I'm 18 or older.",
    tiktokUsername: "TikTok username",
    tiktokUsernamePlaceholder: "yourname",
    checkProfile: (username) => `Check it's you: tiktok.com/@${username} ↗`,
    followers: "Followers",
    followersHint: "Any follower count is welcome.",
    averageViews: "Average views per video",
    postingFrequency: "How often do you post?",
    contentCategories: "What do you post about?",
    contentCategoriesHint: (max) => `Pick up to ${max}.`,
    whyCreator: "Why do you want to become a TAAB Creator, and why you?",
    whyCreatorHint:
      "What makes your content different and why it would work for our apps. A few sentences is perfect.",
    whyCreatorPlaceholder:
      "e.g. I post relatable dating stories that get my audience talking in the comments...",
    informationConfirmed:
      "I confirm this information is accurate and that TAAB can contact me by email about the creator program.",
    privacyNote: "Your information is only used to review your application.",
    optional: "(optional)",
  },
  options: {
    followers: { ...sharedRangeLabels.followers, under_1k: "Under 1K" },
    averageViews: { ...sharedRangeLabels.averageViews, under_500: "Under 500" },
    postingFrequency: {
      daily: "Every day",
      few_per_week: "A few times a week",
      weekly: "About once a week",
      few_per_month: "A few times a month",
      occasionally: "Once in a while",
    },
    contentCategories: {
      comedy: "Comedy",
      storytelling: "Storytelling",
      relationships: "Relationships & dating",
      friends: "Friends & party",
      lifestyle: "Lifestyle",
      pov_skits: "POV & skits",
      trends: "Trends",
      beauty_fashion: "Beauty & fashion",
      gaming: "Gaming",
      education: "Education",
      music_dance: "Music & dance",
      other: "Something else",
    },
  },
  errors: {
    nameEmpty: "What should we call you?",
    emailEmpty: "We need an email to get back to you.",
    emailInvalid: "That email doesn't look right.",
    country: "Pick the country you're based in.",
    regionEmpty: (label) => `Pick your ${label.toLowerCase()}.`,
    tooLong: (max) => `Keep it under ${max} characters.`,
    tooShort: "Tell us a bit more (at least a sentence).",
    ageConfirmed: "You need to be 18 or older to apply.",
    usernameEmpty: "Add your TikTok username.",
    usernameInvalid: "Usernames use letters, numbers, periods and underscores (2–24 characters).",
    pickRange: "Pick a range.",
    postingFrequency: "Pick how often you post.",
    categoriesEmpty: "Pick at least one category.",
    categoriesMax: (max) => `Pick up to ${max}.`,
    categoriesSwap: (max) => `Pick up to ${max}. Unselect one to swap it.`,
    whyCreatorEmpty: "Tell us why you want to join, and why you.",
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
    about: { title: "À propos de toi", description: "L'essentiel, pour savoir à qui on parle." },
    tiktok: { title: "Ton TikTok", description: "Des chiffres approximatifs suffisent. Pas besoin de captures." },
    motivation: { title: "Dernière étape", description: "Une petite question et c'est fini." },
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
    regionLabels: { US: "État", FR: "Région" },
    defaultRegionLabel: "Région / État",
    selectRegion: () => "Sélectionner",
    ageConfirmed: "J'ai 18 ans ou plus.",
    tiktokUsername: "Pseudo TikTok",
    tiktokUsernamePlaceholder: "tonpseudo",
    checkProfile: (username) => `C'est bien toi : tiktok.com/@${username} ↗`,
    followers: "Abonnés",
    followersHint: "Tous les profils sont les bienvenus.",
    averageViews: "Vues moyennes par vidéo",
    postingFrequency: "Tu postes à quelle fréquence ?",
    contentCategories: "Tu postes sur quoi ?",
    contentCategoriesHint: (max) => `${max} maximum.`,
    whyCreator: "Pourquoi tu veux devenir TAAB Creator, et pourquoi toi ?",
    whyCreatorHint:
      "Ce qui rend ton contenu différent et pourquoi ça marcherait avec nos apps. Quelques phrases suffisent.",
    whyCreatorPlaceholder:
      "ex. Je poste des story times sur mes dates ratés qui font réagir ma commu en commentaires...",
    informationConfirmed:
      "Je confirme que ces informations sont exactes et que TAAB peut me contacter par email au sujet du programme créateurs.",
    privacyNote: "Tes informations servent uniquement à étudier ta candidature.",
    optional: "(facultatif)",
  },
  options: {
    followers: { ...sharedRangeLabels.followers, under_1k: "Moins de 1K" },
    averageViews: { ...sharedRangeLabels.averageViews, under_500: "Moins de 500" },
    postingFrequency: {
      daily: "Tous les jours",
      few_per_week: "Plusieurs fois par semaine",
      weekly: "Environ une fois par semaine",
      few_per_month: "Plusieurs fois par mois",
      occasionally: "De temps en temps",
    },
    contentCategories: {
      comedy: "Humour",
      storytelling: "Storytelling",
      relationships: "Couple & dating",
      friends: "Amis & soirées",
      lifestyle: "Lifestyle",
      pov_skits: "POV & sketchs",
      trends: "Trends",
      beauty_fashion: "Beauté & mode",
      gaming: "Gaming",
      education: "Éducation",
      music_dance: "Musique & danse",
      other: "Autre chose",
    },
  },
  errors: {
    nameEmpty: "Comment on t'appelle ?",
    emailEmpty: "On a besoin d'un email pour te répondre.",
    emailInvalid: "Cet email n'a pas l'air valide.",
    country: "Choisis le pays où tu vis.",
    regionEmpty: () => "Indique où tu vis.",
    tooLong: (max) => `${max} caractères maximum.`,
    tooShort: "Dis-nous en un peu plus (au moins une phrase).",
    ageConfirmed: "Tu dois avoir 18 ans ou plus pour postuler.",
    usernameEmpty: "Ajoute ton pseudo TikTok.",
    usernameInvalid: "Lettres, chiffres, points et underscores uniquement (2 à 24 caractères).",
    pickRange: "Choisis une tranche.",
    postingFrequency: "Choisis ta fréquence de publication.",
    categoriesEmpty: "Choisis au moins une catégorie.",
    categoriesMax: (max) => `${max} maximum.`,
    categoriesSwap: (max) => `${max} maximum. Désélectionnes-en une pour changer.`,
    whyCreatorEmpty: "Dis-nous pourquoi tu veux nous rejoindre, et pourquoi toi.",
    informationConfirmed: "Confirme pour envoyer ta candidature.",
    submit:
      "Un problème est survenu pendant l'envoi. Tes réponses sont sauvegardées, réessaie.",
  },
  buttons: {
    back: "Retour",
    continue: "Continuer",
    submit: "Envoyer ma candidature",
    sending: "Envoi…",
  },
};

export const CREATOR_FORM_COPY: Record<CreatorLocale, CreatorFormCopy> = { en, fr };
