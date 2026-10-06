import type { Metadata } from "next";
import { headers } from "next/headers";

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

export const dynamic = "force-dynamic";

const programs = Object.values(creatorPrograms).map(({ country, locale, path, picker }) => ({
  country,
  locale,
  path,
  picker,
}));

const rankedLanguages = (acceptLanguage: string) =>
  acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((item) => item.tag && item.tag !== "*")
    .sort((a, b) => b.q - a.q)
    .map((item) => item.tag);

const orderPrograms = (acceptLanguage: string | null) => {
  const languages = rankedLanguages(acceptLanguage ?? "");
  const match = languages
    .map((language) =>
      programs.find(
        (program) => language === program.locale || language.startsWith(`${program.locale}-`)
      )
    )
    .find((program) => program !== undefined);
  if (!match) return { ordered: programs, suggested: null as string | null };
  return {
    ordered: [match, ...programs.filter((program) => program.country !== match.country)],
    suggested: match.country,
  };
};

const toQuery = (searchParams: Record<string, string | string[] | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
};

export default function JoinPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { ordered, suggested } = orderPrograms(headers().get("accept-language"));
  return <CountryPicker programs={ordered} suggested={suggested} query={toQuery(searchParams)} />;
}
