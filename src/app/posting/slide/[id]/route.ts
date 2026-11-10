import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { findSlide, slideImageIdOk } from "~/config/slideBoard";
import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { loadSlideBoard, readSlideBytes } from "~/server/postingSlides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (!session) return new NextResponse("Non autorisé", { status: 401 });
  if (!slideImageIdOk(params.id)) return new NextResponse("Introuvable", { status: 404 });

  const found = findSlide(await loadSlideBoard().catch(() => ({ files: {}, captions: {} })), params.id);
  if (!found) return new NextResponse("Introuvable", { status: 404 });
  if (session.role !== "tania" && !found.storageId.startsWith(`${session.role}__`)) {
    return new NextResponse("Non autorisé", { status: 403 });
  }

  const bytes = await readSlideBytes(params.id);
  if (!bytes) return new NextResponse("Introuvable", { status: 404 });
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "content-type": found.image.type,
      "content-length": String(bytes.byteLength),
      "cache-control": "private, no-store",
    },
  });
}
