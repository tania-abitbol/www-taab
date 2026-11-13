import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { BILAN_MAX_BYTES, cleanBilanFile } from "~/config/bilanVideo";
import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { loadBilanFile, readBilanRange, saveBilanFile, writeBilanPart } from "~/server/postingBilan";
import { forwardProduction, mirrorPosting, productionCookie } from "~/server/postingLive";
import { PROOF_PART_BYTES, proofFileName, proofPartCount } from "~/server/postingProofs";
import { fastStartFor, identityFastStart, readFastStartRange, type RangeReader } from "~/server/proofFastStart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GENERATION = /^[a-z0-9]{8,16}$/;
const WINDOW = 5 * 1024 * 1024;

const integer = (value: string | null) => {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

const sliceBounds = (header: string | null, size: number) => {
  let start = 0;
  let end = size - 1;
  if (!header) return { start, end: Math.min(end, WINDOW - 1), partial: size > WINDOW };
  const match = /^bytes=(\d+)-(\d*)$/.exec(header);
  if (!match) return null;
  start = Number(match[1]);
  if (!Number.isSafeInteger(start) || start >= size) return null;
  const asked = match[2] ? Number(match[2]) : Math.min(size - 1, start + WINDOW - 1);
  if (!Number.isSafeInteger(asked) || asked < start) return null;
  end = Math.min(asked, size - 1, start + WINDOW - 1);
  return { start, end, partial: true };
};

const serveVideo = async (request: Request, cacheKey: string, size: number, type: string, read: RangeReader) => {
  const header = request.headers.get("range");
  const bounds = sliceBounds(header, size);
  if (!bounds) return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
  const layout = await fastStartFor(cacheKey, size, type, read).catch(() => identityFastStart(size));
  try {
    const bytes = await readFastStartRange(layout, bounds.start, bounds.end, read);
    const headers: Record<string, string> = {
      "content-type": type,
      "content-length": String(bytes.byteLength),
      "accept-ranges": "bytes",
      "cache-control": "private, no-store",
    };
    if (header || bounds.partial) {
      headers["content-range"] = `bytes ${bounds.start}-${bounds.start + bytes.byteLength - 1}/${size}`;
      return new NextResponse(bytes, { status: 206, headers });
    }
    return new NextResponse(bytes, { status: 200, headers });
  } catch {
    return new NextResponse("Introuvable", { status: 404 });
  }
};

const pipeUpstream = async (request: Request) => {
  const headers = new Headers({ cookie: productionCookie() });
  const range = request.headers.get("range");
  if (range) headers.set("range", range);
  const upstream = await fetch("https://taabapps.com/posting/bilan", {
    headers,
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  const location = upstream.headers.get("location");
  const media =
    (upstream.status === 301 || upstream.status === 302) && location
      ? await fetch(location, { headers: range ? { range } : {}, signal: AbortSignal.timeout(20000) })
      : upstream;
  const kept = new Headers();
  for (const key of ["content-type", "content-length", "content-range", "accept-ranges", "cache-control"]) {
    const value = media.headers.get(key);
    if (value) kept.set(key, value);
  }
  return new NextResponse(media.body, { status: media.status, headers: kept });
};

export async function GET(request: Request) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (!session) return new NextResponse("Non autorisé", { status: 401 });
  const meta = new URL(request.url).searchParams.has("meta");
  if (meta) {
    const file = await loadBilanFile().catch(() => null);
    if (!file) return NextResponse.json({ error: "missing" }, { status: 404 });
    return NextResponse.json(
      { name: file.name, type: file.type, size: file.size, generation: file.generation },
      { headers: { "cache-control": "private, no-store" } },
    );
  }
  if (mirrorPosting()) return pipeUpstream(request);
  const file = await loadBilanFile().catch(() => null);
  if (!file) return new NextResponse("Introuvable", { status: 404 });
  const read: RangeReader = (start, end) => readBilanRange(file, start, end);
  return serveVideo(request, `bilan:${file.generation}:${file.size}`, file.size, file.type, read);
}

export async function POST(request: Request) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (session?.role !== "tania") return NextResponse.json({ error: "denied" }, { status: 401 });
  if (mirrorPosting()) {
    const upstream = await forwardProduction("/posting/bilan", request, productionCookie());
    const type = upstream.headers.get("content-type") || "application/json";
    return new NextResponse(upstream.body, { status: upstream.status, headers: { "content-type": type } });
  }

  const generation = request.headers.get("x-bilan-generation") ?? "";
  const part = integer(request.headers.get("x-bilan-part"));
  const parts = integer(request.headers.get("x-bilan-parts"));
  const size = integer(request.headers.get("x-bilan-size"));
  let rawName = "video.mp4";
  try {
    rawName = decodeURIComponent(request.headers.get("x-bilan-name") ?? "");
  } catch {
    return NextResponse.json({ error: "name" }, { status: 400 });
  }
  const rawType = request.headers.get("x-bilan-type") ?? "";
  if (part === null || parts === null || size === null || !GENERATION.test(generation)) {
    return NextResponse.json({ error: "part" }, { status: 400 });
  }
  if (size > BILAN_MAX_BYTES || parts !== proofPartCount(size) || part < 0 || part >= parts) {
    return NextResponse.json({ error: "size" }, { status: 413 });
  }

  const body = new Uint8Array(await request.arrayBuffer());
  const expected = part === parts - 1 ? size - part * PROOF_PART_BYTES : PROOF_PART_BYTES;
  if (body.byteLength !== expected || body.byteLength > PROOF_PART_BYTES) {
    return NextResponse.json({ error: "part" }, { status: 400 });
  }

  try {
    await writeBilanPart(generation, part, body);
    if (part === parts - 1) {
      const file = cleanBilanFile({
        name: proofFileName(rawName),
        size,
        parts,
        partSize: PROOF_PART_BYTES,
        type: rawType.startsWith("video/") ? rawType : "video/mp4",
        generation,
      });
      if (!file) return NextResponse.json({ error: "part" }, { status: 400 });
      await saveBilanFile(file);
    }
  } catch {
    return NextResponse.json({ error: "store" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
