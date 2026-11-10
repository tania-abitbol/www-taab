import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SLIDE_MAX_BYTES, cleanSlideName, cleanSlideType, slideDateOk, slideImageIdOk, slideStorageOk } from "~/config/slideBoard";
import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { saveSlideImage } from "~/server/postingSlides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (session?.role !== "tania") return NextResponse.json({ error: "denied" }, { status: 401 });

  const date = request.headers.get("x-slide-date") ?? "";
  const storageId = request.headers.get("x-slide-storage") ?? "";
  const id = request.headers.get("x-slide-id") ?? "";
  let rawName = "image";
  try {
    rawName = decodeURIComponent(request.headers.get("x-slide-name") ?? "");
  } catch {
    return NextResponse.json({ error: "name" }, { status: 400 });
  }
  const size = Number(request.headers.get("x-slide-size"));
  if (!slideDateOk(date) || !slideStorageOk(storageId) || !slideImageIdOk(id)) {
    return NextResponse.json({ error: "card" }, { status: 400 });
  }
  if (!Number.isSafeInteger(size) || size < 1 || size > SLIDE_MAX_BYTES) {
    return NextResponse.json({ error: "size" }, { status: 413 });
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength !== size) return NextResponse.json({ error: "size" }, { status: 400 });

  try {
    await saveSlideImage(id, body);
  } catch {
    return NextResponse.json({ error: "store" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id, name: cleanSlideName(rawName), type: cleanSlideType(request.headers.get("x-slide-type") ?? "") });
}
