import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { proofAllowed } from "~/server/postingProofs";
import { loadProofFile, readProofRange, signProofRead } from "~/server/postingProofStore";

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

export async function GET(request: Request, { params }: { params: { profileId: string; date: string } }) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  if (!session) return new NextResponse("Non autorisé", { status: 401 });
  if (session.role !== "tania" && session.role !== params.profileId) return new NextResponse("Non autorisé", { status: 403 });
  if (!proofAllowed(params.profileId, params.date, 1)) return new NextResponse("Introuvable", { status: 404 });

  const file = await loadProofFile(params.profileId, params.date).catch(() => null);
  if (file) {
    const bounds = sliceBounds(request.headers.get("range"), file.size);
    if (!bounds) {
      return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${file.size}` } });
    }
    try {
      const bytes = await readProofRange(params.profileId, params.date, file, bounds.start, bounds.end);
      const headers: Record<string, string> = {
        "content-type": file.type,
        "content-length": String(bytes.length),
        "accept-ranges": "bytes",
        "cache-control": "private, no-store",
      };
      if (request.headers.get("range") || bounds.partial) {
        headers["content-range"] = `bytes ${bounds.start}-${bounds.start + bytes.length - 1}/${file.size}`;
        return new NextResponse(new Uint8Array(bytes), { status: 206, headers });
      }
      return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
    } catch {
      return new NextResponse("Introuvable", { status: 404 });
    }
  }

  const url = await signProofRead(params.profileId, params.date);
  if (!url) return new NextResponse("Introuvable", { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "cache-control": "private, no-store" } });
}
