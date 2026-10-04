/**
 * Creator application data model. Country-agnostic on purpose: every enum value
 * and size limit here must stay in sync with `firestore.rules`.
 */

import type { CreatorFormCopy, CreatorLocale } from "./creatorFormCopy";

export const CREATOR_APPLICATIONS_COLLECTION = "creatorApplications";
export const CREATOR_APPLICATION_SOURCE = "creators_page";

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

interface OptionValue {
  value: string;
}

export const FOLLOWER_OPTIONS = [
  { value: "under_1k" },
  { value: "1k_10k" },
  { value: "10k_50k" },
  { value: "50k_100k" },
  { value: "100k_500k" },
  { value: "500k_plus" },
] as const satisfies readonly OptionValue[];

export const AVERAGE_VIEWS_OPTIONS = [
  { value: "under_500" },
  { value: "500_2k" },
  { value: "2k_10k" },
  { value: "10k_50k" },
  { value: "50k_plus" },
] as const satisfies readonly OptionValue[];

export const POSTING_FREQUENCY_OPTIONS = [
  { value: "daily" },
  { value: "few_per_week" },
  { value: "weekly" },
  { value: "few_per_month" },
  { value: "occasionally" },
] as const satisfies readonly OptionValue[];

export const CONTENT_CATEGORY_OPTIONS = [
  { value: "comedy" },
  { value: "storytelling" },
  { value: "relationships" },
  { value: "friends" },
  { value: "lifestyle" },
  { value: "pov_skits" },
  { value: "trends" },
  { value: "beauty_fashion" },
  { value: "gaming" },
  { value: "education" },
  { value: "music_dance" },
  { value: "other" },
] as const satisfies readonly OptionValue[];

export const MAX_CONTENT_CATEGORIES = 4;

type ValueOf<T extends readonly OptionValue[]> = T[number]["value"];

export const LIMITS = {
  name: 100,
  email: 254,
  state: 100,
  whyCreator: 1000,
  minLongText: 10,
} as const;

/** Countries that get a fixed list of regions instead of a free-text field. */
export const REGIONS_BY_COUNTRY: Record<string, string[]> = {
  US: [
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
  FR: [
    "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne",
    "Centre-Val de Loire", "Corse", "Grand Est", "Hauts-de-France",
    "Île-de-France", "Normandie", "Nouvelle-Aquitaine", "Occitanie",
    "Pays de la Loire", "Provence-Alpes-Côte d'Azur", "Guadeloupe", "Guyane",
    "La Réunion", "Martinique", "Mayotte",
  ],
};

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
  whyCreator: "",
  informationConfirmed: false,
});

export interface ApplicationStep {
  id: "about" | "tiktok" | "motivation";
  fields: DraftField[];
}

export const APPLICATION_STEPS: ApplicationStep[] = [
  { id: "about", fields: ["name", "email", "country", "state", "ageConfirmed"] },
  {
    id: "tiktok",
    fields: ["tiktokUsername", "followers", "averageViews", "postingFrequency", "contentCategories"],
  },
  { id: "motivation", fields: ["whyCreator", "informationConfirmed"] },
];

export const regionLabel = (copy: CreatorFormCopy, country: string) =>
  copy.fields.regionLabels[country] ?? copy.fields.defaultRegionLabel;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._]{2,24}$/;

export const normalizeUsername = (value: string) =>
  value.trim().replace(/^@+/, "");

export const tiktokProfileUrl = (username: string) =>
  `https://www.tiktok.com/@${normalizeUsername(username)}`;

const longText = (copy: CreatorFormCopy, value: string, max: number, empty: string) => {
  const length = value.trim().length;
  if (length === 0) return empty;
  if (length < LIMITS.minLongText) return copy.errors.tooShort;
  if (length > max) return copy.errors.tooLong(max);
  return undefined;
};

type Validator = (draft: CreatorApplicationDraft, copy: CreatorFormCopy) => string | undefined;

const validators: Record<DraftField, Validator> = {
  name: ({ name }, copy) => {
    const value = name.trim();
    if (!value) return copy.errors.nameEmpty;
    if (value.length > LIMITS.name) return copy.errors.tooLong(LIMITS.name);
  },
  email: ({ email }, copy) => {
    const value = email.trim();
    if (!value) return copy.errors.emailEmpty;
    if (value.length > LIMITS.email || !EMAIL_PATTERN.test(value)) return copy.errors.emailInvalid;
  },
  country: ({ country }, copy) => (/^[A-Z]{2}$/.test(country) ? undefined : copy.errors.country),
  state: ({ state, country }, copy) => {
    const value = state.trim();
    if (!value) return copy.errors.regionEmpty(regionLabel(copy, country));
    if (value.length > LIMITS.state) return copy.errors.tooLong(LIMITS.state);
  },
  ageConfirmed: ({ ageConfirmed }, copy) => (ageConfirmed ? undefined : copy.errors.ageConfirmed),
  tiktokUsername: ({ tiktokUsername }, copy) => {
    const value = normalizeUsername(tiktokUsername);
    if (!value) return copy.errors.usernameEmpty;
    if (!USERNAME_PATTERN.test(value)) return copy.errors.usernameInvalid;
  },
  followers: ({ followers }, copy) => (followers ? undefined : copy.errors.pickRange),
  averageViews: ({ averageViews }, copy) => (averageViews ? undefined : copy.errors.pickRange),
  postingFrequency: ({ postingFrequency }, copy) =>
    postingFrequency ? undefined : copy.errors.postingFrequency,
  contentCategories: ({ contentCategories }, copy) => {
    if (contentCategories.length === 0) return copy.errors.categoriesEmpty;
    if (contentCategories.length > MAX_CONTENT_CATEGORIES)
      return copy.errors.categoriesMax(MAX_CONTENT_CATEGORIES);
  },
  whyCreator: ({ whyCreator }, copy) =>
    longText(copy, whyCreator, LIMITS.whyCreator, copy.errors.whyCreatorEmpty),
  informationConfirmed: ({ informationConfirmed }, copy) =>
    informationConfirmed ? undefined : copy.errors.informationConfirmed,
};

export const validateFields = (
  draft: CreatorApplicationDraft,
  fields: DraftField[],
  copy: CreatorFormCopy
): FieldErrors =>
  fields.reduce<FieldErrors>((errors, field) => {
    const error = validators[field](draft, copy);
    if (error) errors[field] = error;
    return errors;
  }, {});

/** Firestore document shape, minus `createdAt` (set with serverTimestamp()). */
export const buildApplicationPayload = (draft: CreatorApplicationDraft, locale: CreatorLocale) => ({
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
  whyCreator: draft.whyCreator.trim(),
  informationConfirmed: true,
  status: "new" as const,
  source: CREATOR_APPLICATION_SOURCE,
  locale,
});
