import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DashboardGate } from "~/components/dashboard/DashboardGate";
import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publication | TAAB",
  robots: { index: false, follow: false },
};

export default async function PostingPage({ searchParams }: { searchParams: { refus?: string } }) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (!session) {
    return (
      <DashboardGate
        refused={searchParams.refus === "1"}
        next="/posting"
        title="Publication"
        lede="Entre ton code."
      />
    );
  }
  const { PostingDashboard } = await import("~/components/posting/PostingDashboard");
  return <PostingDashboard role={session.role} />;
}
