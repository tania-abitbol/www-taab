import type { Metadata } from "next";

import { CountryPicker } from "~/components/creators/CountryPicker";
import { creatorPrograms } from "~/config/creatorProgram";

const title = "TAAB Creator Network · Post TikToks. Get paid.";
const description =
  "Pick your country to join the TAAB Creator Network. Choisis ton pays pour rejoindre le réseau de créateurs TAAB.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/join" },
  openGraph: { title, description, type: "website", url: "/join", siteName: "TAAB" },
  twitter: { card: "summary", title, description },
};

const programs = Object.values(creatorPrograms).map(({ country, locale, path, picker }) => ({
  country,
  locale,
  path,
  picker,
}));

export default function JoinPage() {
  return <CountryPicker programs={programs} />;
}
