/**
 * Creator application data model. Country-agnostic on purpose: every enum value
 * and size limit here must stay in sync with `firestore.rules`.
 */

export const CREATOR_APPLICATIONS_COLLECTION = "creatorApplications";
export const CREATOR_APPLICATION_SOURCE = "creators_page";

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const FOLLOWER_OPTIONS = [
  { value: "under_1k", label: "Under 1K" },
  { value: "1k_10k", label: "1K – 10K" },
  { value: "10k_50k", label: "10K – 50K" },
  { value: "50k_100k", label: "50K – 100K" },
  { value: "100k_500k", label: "100K – 500K" },
  { value: "500k_plus", label: "500K+" },
] as const satisfies readonly Option[];

export const AVERAGE_VIEWS_OPTIONS = [
  { value: "under_500", label: "Under 500" },
  { value: "500_2k", label: "500 – 2K" },
  { value: "2k_10k", label: "2K – 10K" },
  { value: "10k_50k", label: "10K – 50K" },
  { value: "50k_plus", label: "50K+" },
] as const satisfies readonly Option[];

export const POSTING_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "few_per_week", label: "A few times a week" },
  { value: "weekly", label: "About once a week" },
  { value: "few_per_month", label: "A few times a month" },
  { value: "occasionally", label: "Once in a while" },
] as const satisfies readonly Option[];

export const CONTENT_CATEGORY_OPTIONS = [
  { value: "comedy", label: "Comedy" },
  { value: "storytelling", label: "Storytelling" },
  { value: "relationships", label: "Relationships & dating" },
  { value: "friends", label: "Friends & party" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "pov_skits", label: "POV & skits" },
  { value: "trends", label: "Trends" },
  { value: "beauty_fashion", label: "Beauty & fashion" },
  { value: "gaming", label: "Gaming" },
  { value: "education", label: "Education" },
  { value: "music_dance", label: "Music & dance" },
  { value: "other", label: "Something else" },
] as const satisfies readonly Option[];

export const MAX_CONTENT_CATEGORIES = 4;

export const SHOWS_FACE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "sometimes", label: "Sometimes" },
  { value: "no", label: "No" },
] as const satisfies readonly Option[];

type ValueOf<T extends readonly Option[]> = T[number]["value"];

export const LIMITS = {
  name: 100,
  email: 254,
  state: 100,
  url: 300,
  contentDescription: 500,
  contentDifference: 500,
  whyCreator: 1000,
  minLongText: 10,
} as const;

/** Countries that get a fixed list of regions instead of a free-text field. */
export const REGIONS_BY_COUNTRY: Record<string, { label: string; options: string[] }> = {
  US: {
    label: "State",
    options: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
      "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
      "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
      "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York",
      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
      "West Virginia", "Wisconsin", "Wyoming",
    ],
  },
};

export const DEFAULT_REGION_LABEL = "State / region";

const ISO_COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FO FR GA GB GD GE GF GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MQ MR MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WS XK YE YT ZA ZM ZW".split(
    " "
  );

export const getCountryOptions = (
  pinned: string[],
  locale = "en"
): Option[] => {
  let displayNames: Intl.DisplayNames | undefined;
  try {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    displayNames = undefined;
  }
  const toOption = (code: string): Option => ({
    value: code,
    label: displayNames?.of(code) ?? code,
  });
  const rest = ISO_COUNTRY_CODES.filter((code) => !pinned.includes(code))
    .map(toOption)
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  return [...pinned.map(toOption), ...rest];
};

export interface CreatorApplicationDraft {
  name: string;
  email: string;
  country: string;
  state: string;
  ageConfirmed: boolean;
  tiktokUsername: string;
  followers: ValueOf<typeof FOLLOWER_OPTIONS> | "";
  averageViews: ValueOf<typeof AVERAGE_VIEWS_OPTIONS> | "";
  postingFrequency: ValueOf<typeof POSTING_FREQUENCY_OPTIONS> | "";
  contentCategories: ValueOf<typeof CONTENT_CATEGORY_OPTIONS>[];
  contentDescription: string;
  showsFace: ValueOf<typeof SHOWS_FACE_OPTIONS> | "";
  videoUrl1: string;
  videoUrl2: string;
  videoUrl3: string;
  contentDifference: string;
  whyCreator: string;
  informationConfirmed: boolean;
}

export type DraftField = keyof CreatorApplicationDraft;
export type FieldErrors = Partial<Record<DraftField, string>>;

export const createEmptyDraft = (country: string): CreatorApplicationDraft => ({
  name: "",
  email: "",
  country,
  state: "",
  ageConfirmed: false,
  tiktokUsername: "",
  followers: "",
  averageViews: "",
  postingFrequency: "",
  contentCategories: [],
  contentDescription: "",
  showsFace: "",
  videoUrl1: "",
  videoUrl2: "",
  videoUrl3: "",
  contentDifference: "",
  whyCreator: "",
  informationConfirmed: false,
});

export interface ApplicationStep {
  id: string;
  title: string;
  description: string;
  fields: DraftField[];
}

export const APPLICATION_STEPS: ApplicationStep[] = [
  {
    id: "about",
    title: "About you",
    description: "The basics, so we know who we're talking to.",
    fields: ["name", "email", "country", "state", "ageConfirmed"],
  },
  {
    id: "tiktok",
    title: "Your TikTok",
    description: "Rough numbers are fine. No screenshots needed.",
    fields: [
      "tiktokUsername",
      "followers",
      "averageViews",
      "postingFrequency",
    ],
  },
  {
    id: "content",
    title: "Your content",
    description: "Help us picture what you'd make.",
    fields: ["contentCategories", "contentDescription", "showsFace"],
  },
  {
    id: "examples",
    title: "Your best work",
    description: "Show us the videos you're proudest of.",
    fields: ["videoUrl1", "videoUrl2", "videoUrl3", "contentDifference"],
  },
  {
    id: "motivation",
    title: "Last step",
    description: "Almost done.",
    fields: ["whyCreator", "informationConfirmed"],
  },
];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._]{2,24}$/;
const TIKTOK_URL_PATTERN = /^https:\/\/([a-z]+\.)?tiktok\.com\/.+$/;

export const normalizeUsername = (value: string) =>
  value.trim().replace(/^@+/, "");

export const tiktokProfileUrl = (username: string) =>
  `https://www.tiktok.com/@${normalizeUsername(username)}`;

/** Accepts `tiktok.com/...`, `www.tiktok.com/...` or full URLs and returns an https URL. */
export const normalizeTikTokUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed.replace(/^http:\/\//i, "https://")
    : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    url.hostname = url.hostname.toLowerCase();
    return url.toString();
  } catch {
    return trimmed;
  }
};

const isTikTokUrl = (value: string) => {
  const url = normalizeTikTokUrl(value);
  return url.length <= LIMITS.url && TIKTOK_URL_PATTERN.test(url);
};

const longText = (value: string, max: number, empty: string) => {
  const length = value.trim().length;
  if (length === 0) return empty;
  if (length < LIMITS.minLongText) return "Tell us a bit more (at least a sentence).";
  if (length > max) return `Keep it under ${max} characters.`;
  return undefined;
};

const validators: Record<DraftField, (draft: CreatorApplicationDraft) => string | undefined> = {
  name: ({ name }) => {
    const value = name.trim();
    if (!value) return "What should we call you?";
    if (value.length > LIMITS.name) return `Keep it under ${LIMITS.name} characters.`;
  },
  email: ({ email }) => {
    const value = email.trim();
    if (!value) return "We need an email to get back to you.";
    if (value.length > LIMITS.email || !EMAIL_PATTERN.test(value))
      return "That email doesn't look right.";
  },
  country: ({ country }) =>
    /^[A-Z]{2}$/.test(country) ? undefined : "Pick the country you're based in.",
  state: ({ state, country }) => {
    const value = state.trim();
    if (!value)
      return `Pick your ${(REGIONS_BY_COUNTRY[country]?.label ?? "state or region").toLowerCase()}.`;
    if (value.length > LIMITS.state) return `Keep it under ${LIMITS.state} characters.`;
  },
  ageConfirmed: ({ ageConfirmed }) =>
    ageConfirmed ? undefined : "You need to be 18 or older to apply.",
  tiktokUsername: ({ tiktokUsername }) => {
    const value = normalizeUsername(tiktokUsername);
    if (!value) return "Add your TikTok username.";
    if (!USERNAME_PATTERN.test(value))
      return "Usernames use letters, numbers, periods and underscores (2–24 characters).";
  },
  followers: ({ followers }) => (followers ? undefined : "Pick a range."),
  averageViews: ({ averageViews }) => (averageViews ? undefined : "Pick a range."),
  postingFrequency: ({ postingFrequency }) =>
    postingFrequency ? undefined : "Pick how often you post.",
  contentCategories: ({ contentCategories }) => {
    if (contentCategories.length === 0) return "Pick at least one category.";
    if (contentCategories.length > MAX_CONTENT_CATEGORIES)
      return `Pick up to ${MAX_CONTENT_CATEGORIES}.`;
  },
  contentDescription: ({ contentDescription }) =>
    longText(contentDescription, LIMITS.contentDescription, "Describe the content you usually make."),
  showsFace: ({ showsFace }) => (showsFace ? undefined : "Pick one."),
  videoUrl1: ({ videoUrl1 }) => {
    if (!videoUrl1.trim()) return "Add at least one TikTok you're proud of.";
    if (!isTikTokUrl(videoUrl1)) return "Paste a tiktok.com video link.";
  },
  videoUrl2: ({ videoUrl2 }) =>
    videoUrl2.trim() && !isTikTokUrl(videoUrl2) ? "Paste a tiktok.com video link." : undefined,
  videoUrl3: ({ videoUrl3 }) =>
    videoUrl3.trim() && !isTikTokUrl(videoUrl3) ? "Paste a tiktok.com video link." : undefined,
  contentDifference: ({ contentDifference }) =>
    longText(contentDifference, LIMITS.contentDifference, "Tell us what makes your content yours."),
  whyCreator: ({ whyCreator }) =>
    longText(whyCreator, LIMITS.whyCreator, "Tell us why you'd like to join."),
  informationConfirmed: ({ informationConfirmed }) =>
    informationConfirmed ? undefined : "Please confirm to submit your application.",
};

export const validateFields = (
  draft: CreatorApplicationDraft,
  fields: DraftField[]
): FieldErrors =>
  fields.reduce<FieldErrors>((errors, field) => {
    const error = validators[field](draft);
    if (error) errors[field] = error;
    return errors;
  }, {});

/** Firestore document shape, minus `createdAt` (set with serverTimestamp()). */
export const buildApplicationPayload = (draft: CreatorApplicationDraft) => ({
  name: draft.name.trim(),
  email: draft.email.trim().toLowerCase(),
  country: draft.country,
  state: draft.state.trim(),
  ageConfirmed: true,
  tiktokUsername: normalizeUsername(draft.tiktokUsername),
  tiktokUrl: tiktokProfileUrl(draft.tiktokUsername),
  followers: draft.followers,
  averageViews: draft.averageViews,
  postingFrequency: draft.postingFrequency,
  contentCategories: draft.contentCategories,
  contentDescription: draft.contentDescription.trim(),
  showsFace: draft.showsFace,
  videoUrls: [draft.videoUrl1, draft.videoUrl2, draft.videoUrl3]
    .map(normalizeTikTokUrl)
    .filter(Boolean),
  contentDifference: draft.contentDifference.trim(),
  whyCreator: draft.whyCreator.trim(),
  informationConfirmed: true,
  status: "new" as const,
  source: CREATOR_APPLICATION_SOURCE,
  locale: "en",
});
