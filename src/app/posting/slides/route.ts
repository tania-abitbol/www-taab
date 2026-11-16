import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SLIDE_MAX_BYTES, SLIDE_PART_BYTES, cleanSlideName, cleanSlideType, slideDateOk, slideImageIdOk, slidePartCount, slideStorageOk } from "~/config/slideBoard";
import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { saveSlideUpload } from "~/server/postingSlides";

const integer = (value: string | null) => {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

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
  const part = integer(request.headers.get("x-slide-part")) ?? 0;
  const parts = integer(request.headers.get("x-slide-parts")) ?? 1;
  if (!slideDateOk(date) || !slideStorageOk(storageId) || !slideImageIdOk(id)) {
    return NextResponse.json({ error: "card" }, { status: 400 });
  }
  if (!Number.isSafeInteger(size) || size < 1 || size > SLIDE_MAX_BYTES || parts !== slidePartCount(size) || part < 0 || part >= parts) {
    return NextResponse.json({ error: "size" }, { status: 413 });
  }

  const body = new Uint8Array(await request.arrayBuffer());
  const expected = part === parts - 1 ? size - part * SLIDE_PART_BYTES : SLIDE_PART_BYTES;
  if (body.byteLength !== expected || body.byteLength > SLIDE_PART_BYTES) {
    return NextResponse.json({ error: "size" }, { status: 400 });
  }

  try {
    await saveSlideUpload(id, part, parts, size, body);
  } catch {
    return NextResponse.json({ error: "store" }, { status: 502 });
  }
  if (part < parts - 1) return NextResponse.json({ ok: true });

  return NextResponse.json({ ok: true, id, name: cleanSlideName(rawName), type: cleanSlideType(request.headers.get("x-slide-type") ?? "") });
}
