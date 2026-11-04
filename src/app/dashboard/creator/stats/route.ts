import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_COOKIE, verifySession } from "~/server/dashboardSession";
import { fetchPublicVideo, PublicVideoError } from "~/server/publicVideo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!verifySession(cookies().get(DASHBOARD_COOKIE)?.value)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let url = "";
  try {
    const body = (await request.json()) as { url?: unknown };
    url = typeof body.url === "string" ? body.url : "";
  } catch {
    return NextResponse.json({ error: "unsupported" }, { status: 400 });
  }

  try {
    const video = await fetchPublicVideo(url);
    return NextResponse.json({ ...video, fetchedAt: Date.now() });
  } catch (error) {
    const code = error instanceof PublicVideoError ? error.code : "unavailable";
    const status = code === "unsupported" || code === "not-video" ? 400 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
