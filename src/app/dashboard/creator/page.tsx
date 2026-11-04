import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DashboardGate } from "~/components/dashboard/DashboardGate";
import { DASHBOARD_COOKIE, verifySession } from "~/server/dashboardSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi des vues | TAAB",
  robots: { index: false, follow: false },
};

export default async function CreatorDashboardPage({
  searchParams,
}: {
  searchParams: { refus?: string };
}) {
  if (!verifySession(cookies().get(DASHBOARD_COOKIE)?.value)) {
    return <DashboardGate refused={searchParams.refus === "1"} />;
  }
  const { CreatorDashboard } = await import("~/components/dashboard/CreatorDashboard");
  return <CreatorDashboard />;
}
