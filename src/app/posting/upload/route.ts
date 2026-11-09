import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import {
  PROOF_PART_BYTES,
  cleanProofFile,
  proofAllowed,
  proofFileName,
  proofPartCount,
} from "~/server/postingProofs";
import { writeLocalProofPart } from "~/server/postingLocalProof";
import { proofStorageReady, rememberProof, saveProofFile, writeProofPart } from "~/server/postingProofStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERATION = /^[a-z0-9]{8,16}$/;

const integer = (value: string | null) => {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

export async function POST(request: Request) {
  const session = readSession(cookies().get(DASHBOARD_COOKIE)?.value);
  const profileId = session?.role && session.role !== "tania" ? session.role : null;
  if (!profileId) return NextResponse.json({ error: "denied" }, { status: 401 });
  const localStore = !proofStorageReady();

  const date = request.headers.get("x-proof-date");
  const generation = request.headers.get("x-proof-generation") ?? "";
  const part = integer(request.headers.get("x-proof-part"));
  const parts = integer(request.headers.get("x-proof-parts"));
  const size = integer(request.headers.get("x-proof-size"));
  let rawName = "video.mp4";
  try {
    rawName = decodeURIComponent(request.headers.get("x-proof-name") ?? "");
  } catch {
    return NextResponse.json({ error: "name" }, { status: 400 });
  }
  const rawType = request.headers.get("x-proof-type") ?? "";
  if (!date || part === null || parts === null || size === null || !GENERATION.test(generation)) {
    return NextResponse.json({ error: "part" }, { status: 400 });
  }
  if (!proofAllowed(profileId, date, size) || parts !== proofPartCount(size) || part < 0 || part >= parts) {
    return NextResponse.json({ error: "size" }, { status: 413 });
  }

  const body = new Uint8Array(await request.arrayBuffer());
  const expected = part === parts - 1 ? size - part * PROOF_PART_BYTES : PROOF_PART_BYTES;
  if (body.byteLength !== expected || body.byteLength > PROOF_PART_BYTES) {
    return NextResponse.json({ error: "part" }, { status: 400 });
  }

  try {
    if (localStore) {
      await writeLocalProofPart(profileId, date, part, parts, body, rawName, rawType);
      return NextResponse.json({ ok: true });
    }
    await writeProofPart(profileId, date, generation, part, body);
    if (part === parts - 1) {
      const file = cleanProofFile({
        name: proofFileName(rawName),
        size,
        parts,
        partSize: PROOF_PART_BYTES,
        type: rawType.startsWith("video/") ? rawType : "video/mp4",
        generation,
      });
      if (!file) return NextResponse.json({ error: "part" }, { status: 400 });
      await saveProofFile(profileId, date, file);
      await rememberProof(profileId, date, file.name);
    }
  } catch (error) {
    const code = error instanceof Error && error.message.startsWith("proof-") ? error.message : "store";
    return NextResponse.json({ error: code }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
