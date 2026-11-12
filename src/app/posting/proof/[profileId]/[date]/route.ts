import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { readLivePosting } from "~/server/postingLive";
import { proofAllowed } from "~/server/postingProofs";
import { localProofStat, readLocalProofRange } from "~/server/postingLocalProof";
import { loadProofFile, readProofRange, signProofRead } from "~/server/postingProofStore";
import { fastStartFor, identityFastStart, readFastStartRange, type RangeReader } from "~/server/proofFastStart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Screen-recording indexes sit at the front and run past 3 MB. A 2 MB slice leaves the player black. */
const WINDOW = 5 * 1024 * 1024;

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

const serveProof = async (request: Request, cacheKey: string, size: number, type: string, read: RangeReader) => {
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

export async function GET(request: Request, { params }: { params: { profileId: string; date: string } }) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (!session) return new NextResponse("Non autorisé", { status: 401 });
  if (session.role !== "tania" && session.role !== params.profileId) return new NextResponse("Non autorisé", { status: 403 });
  if (!proofAllowed(params.profileId, params.date, 1)) return new NextResponse("Introuvable", { status: 404 });

  const local = await localProofStat(params.profileId, params.date);
  if (local) {
    const read: RangeReader = (start, end) => readLocalProofRange(params.profileId, params.date, start, end);
    return serveProof(request, `local:${params.profileId}:${params.date}:${local.size}`, local.size, local.type, read);
  }

  const file = await loadProofFile(params.profileId, params.date).catch(() => null);
  if (file) {
    const read: RangeReader = (start, end) => readProofRange(params.profileId, params.date, file, start, end);
    return serveProof(request, `blob:${params.profileId}:${params.date}:${file.generation}:${file.size}`, file.size, file.type, read);
  }

  const url = await signProofRead(params.profileId, params.date);
  if (url) return NextResponse.redirect(url, { status: 302, headers: { "cache-control": "private, no-store" } });

  const live = await readLivePosting();
  if (!live?.cookie) return new NextResponse("Introuvable", { status: 404 });
  return proxyProof(request, params.profileId, params.date, live.cookie);
}

const INDEX_CAP = 8 * 1024 * 1024;
const UPSTREAM_WINDOW = 2 * 1024 * 1024;

type ProofSlice = { bytes: Buffer; start: number; end: number; total: number; type: string };

const clientRange = (header: string | null) => {
  if (!header) return { start: 0, end: null as number | null, open: true };
  const suffix = /^bytes=-(\d+)$/i.exec(header.trim());
  if (suffix) {
    const length = Number(suffix[1]);
    if (!Number.isSafeInteger(length) || length <= 0) return null;
    return { suffix: length };
  }
  const match = /^bytes=(\d+)-(\d*)$/i.exec(header.trim());
  if (!match) return null;
  const start = Number(match[1]);
  if (!Number.isSafeInteger(start)) return null;
  if (!match[2]) return { start, end: null as number | null, open: true };
  const end = Number(match[2]);
  if (!Number.isSafeInteger(end) || end < start) return null;
  return { start, end, open: false };
};

/** Last byte of moov when it sits at the front. Null when this is not that layout. */
const moovLastByte = (bytes: Buffer) => {
  let offset = 0;
  while (offset + 8 <= bytes.length && offset < INDEX_CAP) {
    let size = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (!/^[ -~]{4}$/.test(type)) return null;
    if (size === 1) {
      if (offset + 16 > bytes.length) return { have: false, end: Math.min(INDEX_CAP - 1, offset + 15) };
      const big = bytes.readBigUInt64BE(offset + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) return null;
      size = Number(big);
    } else if (size === 0) return null;
    if (!Number.isSafeInteger(size) || size < 8) return null;
    const end = offset + size - 1;
    if (end >= INDEX_CAP) return null;
    if (type === "moov") return { have: end < bytes.length, end };
    if (end >= bytes.length) return { have: false, end };
    offset += size;
  }
  return bytes.length < 32 ? { have: false, end: Math.min(INDEX_CAP - 1, 65535) } : null;
};

const proofUpstream = async (profileId: string, date: string, cookie: string, start: number, end: number): Promise<ProofSlice | null> => {
  const range = `bytes=${start}-${end}`;
  const upstream = await fetch(`https://taabapps.com/posting/proof/${profileId}/${date}`, {
    headers: { cookie, range },
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  const location = upstream.headers.get("location");
  const media =
    (upstream.status === 301 || upstream.status === 302) && location
      ? await fetch(location, { headers: { range }, signal: AbortSignal.timeout(20000) })
      : upstream;
  if (!media.ok && media.status !== 206) return null;
  const bytes = Buffer.from(await media.arrayBuffer());
  const listed = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(media.headers.get("content-range") ?? "");
  const gotStart = listed ? Number(listed[1]) : start;
  const total = listed ? Number(listed[3]) : gotStart + bytes.length;
  if (!bytes.length || gotStart !== start || !Number.isSafeInteger(total) || total <= start) return null;
  return { bytes, start: gotStart, end: gotStart + bytes.length - 1, total, type: media.headers.get("content-type") || "video/mp4" };
};

const readProofSpan = async (profileId: string, date: string, cookie: string, start: number, end: number) => {
  const parts: Buffer[] = [];
  let cursor = start;
  let total = 0;
  let type = "video/mp4";
  for (let step = 0; step < 8 && cursor <= end; step += 1) {
    const slice = await proofUpstream(profileId, date, cookie, cursor, Math.min(end, cursor + UPSTREAM_WINDOW - 1));
    if (!slice || slice.end < cursor) return null;
    parts.push(slice.bytes.subarray(0, slice.end - cursor + 1));
    total = slice.total;
    type = slice.type;
    cursor = slice.end + 1;
  }
  if (cursor <= end || !total) return null;
  return { bytes: Buffer.concat(parts).subarray(0, end - start + 1), total, type };
};

const proofBody = (bytes: Buffer, start: number, total: number, type: string, ranged: boolean) => {
  const end = start + bytes.length - 1;
  const headers: Record<string, string> = {
    "content-type": type,
    "content-length": String(bytes.length),
    "accept-ranges": "bytes",
    "cache-control": "private, no-store",
  };
  const partial = ranged || end < total - 1;
  if (partial) headers["content-range"] = `bytes ${start}-${end}/${total}`;
  return new NextResponse(new Uint8Array(bytes), { status: partial ? 206 : 200, headers });
};

/** Local dev reads the published files. Their 2 MB slices stop inside the index, so keep asking until moov is whole. */
const proxyProof = async (request: Request, profileId: string, date: string, cookie: string) => {
  const asked = clientRange(request.headers.get("range"));
  if (!asked) return new NextResponse(null, { status: 416, headers: { "content-range": "bytes */*" } });

  if ("suffix" in asked) {
    const probe = await proofUpstream(profileId, date, cookie, 0, 0);
    if (!probe) return new NextResponse("Introuvable", { status: 404 });
    const length = Math.min(asked.suffix, probe.total, INDEX_CAP);
    const start = Math.max(0, probe.total - length);
    const span = await readProofSpan(profileId, date, cookie, start, probe.total - 1);
    if (!span) return new NextResponse("Introuvable", { status: 404 });
    return proofBody(span.bytes, start, probe.total, span.type, true);
  }

  const firstEnd = asked.open ? asked.start + UPSTREAM_WINDOW - 1 : Math.min(asked.end, asked.start + INDEX_CAP - 1);
  const first = await proofUpstream(profileId, date, cookie, asked.start, firstEnd);
  if (!first) return new NextResponse("Introuvable", { status: 404 });
  if (asked.start >= first.total) {
    return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${first.total}` } });
  }

  let end = asked.open ? Math.min(first.total - 1, asked.start + UPSTREAM_WINDOW - 1) : Math.min(asked.end, first.total - 1, asked.start + INDEX_CAP - 1);
  if (asked.start === 0) {
    const moov = moovLastByte(first.bytes);
    if (moov && (asked.open || asked.end >= moov.end)) end = asked.open ? moov.end : Math.min(asked.end, first.total - 1, Math.max(moov.end, end));
  }
  end = Math.min(end, first.total - 1);

  let bytes = first.bytes.subarray(0, Math.max(0, Math.min(first.bytes.length, end - asked.start + 1)));
  let type = first.type;
  if (end > first.end) {
    const rest = await readProofSpan(profileId, date, cookie, first.end + 1, end);
    if (!rest) return new NextResponse("Introuvable", { status: 404 });
    bytes = Buffer.concat([bytes, rest.bytes]);
    type = rest.type;
  }
  if (asked.start === 0) {
    const moov = moovLastByte(bytes);
    if (moov && !moov.have) return new NextResponse("Introuvable", { status: 404 });
  }
  return proofBody(bytes, asked.start, first.total, type, Boolean(request.headers.get("range")));
};
