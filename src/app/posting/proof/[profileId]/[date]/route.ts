import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { proofAllowed } from "~/server/postingProofs";
import { signProofRead } from "~/server/postingProofStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { profileId: string; date: string } }) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (!session) return new NextResponse("Non autorisé", { status: 401 });
  if (session.role !== "tania" && session.role !== params.profileId) return new NextResponse("Non autorisé", { status: 403 });
  if (!proofAllowed(params.profileId, params.date, 1)) return new NextResponse("Introuvable", { status: 404 });
  const url = await signProofRead(params.profileId, params.date);
  if (!url) return new NextResponse("Introuvable", { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "cache-control": "private, no-store" } });
}
