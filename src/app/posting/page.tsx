import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DashboardGate } from "~/components/dashboard/DashboardGate";
import { DASHBOARD_COOKIE, verifySession } from "~/server/dashboardSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publication | TAAB",
  robots: { index: false, follow: false },
};

export default async function PostingPage({ searchParams }: { searchParams: { refus?: string } }) {
  if (!verifySession(cookies().get(DASHBOARD_COOKIE)?.value)) {
    return (
      <DashboardGate
        refused={searchParams.refus === "1"}
        next="/posting"
        title="Publication"
        lede="Entre le code pour ouvrir la journée TikTok."
      />
    );
  }
  const { PostingDashboard } = await import("~/components/posting/PostingDashboard");
  return <PostingDashboard />;
};
