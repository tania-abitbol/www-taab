import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DashboardGate } from "~/components/dashboard/DashboardGate";
import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { loadAllWork, loadWork } from "~/server/postingProofStore";
import { listProfiles } from "~/server/postingProfileStore";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const profiles = await listProfiles();
  if (session.role !== "tania" && !profiles.some((profile) => profile.id === session.role)) redirect("/posting/logout");
  const { PostingDashboard } = await import("~/components/posting/PostingDashboard");
  const visible =
    session.role === "tania"
      ? profiles
      : profiles.filter((profile) => profile.id === session.role).map(({ id, name }) => ({ id, name }));
  const work =
    session.role === "tania"
      ? await loadAllWork(profiles.map((profile) => profile.id)).catch(() => ({}))
      : { [session.role]: await loadWork(session.role).catch(() => ({ days: {} })) };
  const retrySunday =
    session.role !== "tania" && profiles.some((profile) => profile.id === session.role && profile.code === "333330");
  return <PostingDashboard role={session.role} profiles={visible} work={work} retrySunday={retrySunday} />;
}
