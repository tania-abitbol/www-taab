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

const WINDOW = 2 * 1024 * 1024;

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
  const headers = new Headers({ cookie: live.cookie });
  const range = request.headers.get("range");
  if (range) headers.set("range", range);
  const upstream = await fetch(`https://taabapps.com/posting/proof/${params.profileId}/${params.date}`, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  const location = upstream.headers.get("location");
  const media =
    (upstream.status === 301 || upstream.status === 302) && location
      ? await fetch(location, { headers: range ? { range } : undefined, signal: AbortSignal.timeout(20000) })
      : upstream;
  if (!media.ok && media.status !== 206) return new NextResponse("Introuvable", { status: 404 });
  const responseHeaders: Record<string, string> = { "cache-control": "private, no-store" };
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const value = media.headers.get(name);
    if (value) responseHeaders[name] = value;
  }
  if (!responseHeaders["content-type"]) responseHeaders["content-type"] = "video/mp4";
  return new NextResponse(media.body, { status: media.status, headers: responseHeaders });
}
