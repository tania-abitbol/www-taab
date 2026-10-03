import type { Metadata } from "next";

import { CreatorsLanding } from "~/components/creators/CreatorsLanding";
import { DEFAULT_CREATOR_COUNTRY, creatorPrograms } from "~/config/creatorProgram";

const title = "Become an Etha Creator | Etha";
const description =
  "Join Etha's creator network. Create authentic TikToks around our apps and get rewarded when your content performs.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/creators" },
  openGraph: { title, description, type: "website", url: "/creators", siteName: "Etha" },
  twitter: { card: "summary", title, description },
};

export default function CreatorsPage() {
  return <CreatorsLanding content={creatorPrograms[DEFAULT_CREATOR_COUNTRY]} />;
}
