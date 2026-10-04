import type { Metadata } from "next";

import { CreatorProgramContent, creatorPrograms } from "~/config/creatorProgram";

const OG_LOCALES: Record<CreatorProgramContent["locale"], string> = {
  en: "en_US",
  fr: "fr_FR",
};

export const creatorMetadata = (program: CreatorProgramContent): Metadata => {
  const { title, description } = program.meta;
  const languages = Object.fromEntries(
    Object.values(creatorPrograms).map((item) => [
      `${item.locale}-${item.countryIsoCode}`,
      item.path,
    ])
  );

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: program.path, languages },
    openGraph: {
      title,
      description,
      type: "website",
      url: program.path,
      siteName: "TAAB",
      locale: OG_LOCALES[program.locale],
    },
    twitter: { card: "summary", title, description },
  };
};
