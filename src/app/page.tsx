import type { Metadata } from "next";

import { HomeLanding } from "~/components/home/HomeLanding";

export const metadata: Metadata = {
  title: { absolute: "TAAB Studio | Entertainment apps for couples and friends" },
  description:
    "TAAB is a mobile studio building entertainment apps for couples and friends, including Bae: Couple Game and Truth or Truth. 1M+ downloads in 50+ countries.",
};

export default function Home() {
  return <HomeLanding />;
}
