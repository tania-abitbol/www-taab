import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { findSlide, slideImageIdOk } from "~/config/slideBoard";
import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { loadSlideBoard, readSlideBytes } from "~/server/postingSlides";

/** Stay under the hosting response limit. The browser asks for the next piece. */
const WINDOW = 5 * 1024 * 1024;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: { id: string } }) {
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
  const total = bytes.byteLength;
  const header = request.headers.get("range");
  let start = 0;
  let end = total - 1;
  if (header) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(header);
    if (!match) return new NextResponse("Plage invalide", { status: 416 });
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : total - 1;
    if (!Number.isSafeInteger(start) || start >= total || end < start) return new NextResponse("Plage invalide", { status: 416 });
  }
  end = Math.min(end, start + WINDOW - 1, total - 1);
  const slice = bytes.subarray(start, end + 1);
  const partial = header !== null || end < total - 1;
  return new NextResponse(Buffer.from(slice), {
    status: partial ? 206 : 200,
    headers: {
      "content-type": found.image.type,
      "content-length": String(slice.byteLength),
      "content-range": `bytes ${start}-${end}/${total}`,
      "accept-ranges": "bytes",
      "cache-control": "private, no-store",
    },
  });
}
