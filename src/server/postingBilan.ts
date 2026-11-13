import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { bilanPartKey, cleanBilanFile, type BilanFile } from "~/config/bilanVideo";
import { mirrorPosting, productionCookie } from "~/server/postingLive";
import { proofWindow } from "~/server/postingProofs";

const STORE = "posting-work";
const META_KEY = "bilan-meta";
const ORIGIN = "https://taabapps.com";

type BlobsContext = {
  siteID?: string;
  token?: string;
  apiURL?: string;
};

const blobsContext = (): BlobsContext | null => {
  const raw = (globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext ?? process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) return null;
  if (typeof raw === "object") {
    const context = raw as BlobsContext;
    return context.siteID && context.token ? context : null;
  }
  if (typeof raw !== "string") return null;
  try {
    const context = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as BlobsContext;
    return context.siteID && context.token ? context : null;
  } catch {
    return null;
  }
};

const remote = () => Boolean(blobsContext()?.siteID && blobsContext()?.token);

const dir = () => process.env.POSTING_BILAN_DIR || path.join(process.cwd(), ".data", "posting-bilan");

const endpoint = (context: BlobsContext, key: string) =>
  new URL(`/api/v1/blobs/${context.siteID}/${STORE}/${key}`, context.apiURL || "https://api.netlify.com");

const sign = async (key: string, method: "GET" | "PUT") => {
  const context = blobsContext();
  if (!context?.siteID || !context.token) return null;
  const response = await fetch(endpoint(context, key), {
    method,
    headers: { authorization: `Bearer ${context.token}`, accept: "application/json;type=signed-url" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("bilan-sign");
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new Error("bilan-sign");
  return body.url;
};

const readStored = async (): Promise<BilanFile | null> => {
  if (remote()) {
    const url = await sign(META_KEY, "GET");
    if (!url) return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (response.status === 404 || !response.ok) return null;
    try {
      return cleanBilanFile(await response.json());
    } catch {
      return null;
    }
  }
  try {
    return cleanBilanFile(JSON.parse(await readFile(path.join(dir(), "meta.json"), "utf8")));
  } catch {
    return null;
  }
};

export const loadBilanFile = async (): Promise<BilanFile | null> => {
  if (mirrorPosting()) {
    const response = await fetch(`${ORIGIN}/posting/bilan?meta=1`, {
      headers: { cookie: productionCookie() },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return cleanBilanFile(await response.json());
  }
  return readStored();
};

export const writeBilanPart = async (generation: string, part: number, bytes: Uint8Array) => {
  if (mirrorPosting()) throw new Error("bilan-write");
  const key = bilanPartKey(generation, part);
  if (!remote()) {
    await mkdir(dir(), { recursive: true });
    await writeFile(path.join(dir(), key), bytes);
    return;
  }
  const url = await sign(key, "PUT");
  if (!url) throw new Error("bilan-sign");
  const response = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream" },
    body: bytes,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("bilan-write");
};

export const saveBilanFile = async (file: BilanFile) => {
  const clean = cleanBilanFile(file);
  if (!clean) throw new Error("bilan-meta");
  if (mirrorPosting()) throw new Error("bilan-write");
  if (remote()) {
    const url = await sign(META_KEY, "PUT");
    if (!url) throw new Error("bilan-sign");
    const response = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(clean),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("bilan-write");
    return clean;
  }
  await mkdir(dir(), { recursive: true });
  await writeFile(path.join(dir(), "meta.json"), JSON.stringify(clean));
  return clean;
};

const readPart = async (generation: string, part: number) => {
  if (!remote()) return readFile(path.join(dir(), bilanPartKey(generation, part)));
  const url = await sign(bilanPartKey(generation, part), "GET");
  if (!url) throw new Error("bilan-read");
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("bilan-read");
  return Buffer.from(await response.arrayBuffer());
};

export const readBilanRange = async (file: BilanFile, start: number, end: number) => {
  const { first, last } = proofWindow(file.partSize, file.parts, start, end);
  const chunks: Buffer[] = [];
  for (let part = first; part <= last; part += 1) {
    const bytes = await readPart(file.generation, part);
    const partStart = part * file.partSize;
    const from = Math.max(0, start - partStart);
    const to = Math.min(bytes.length, end - partStart + 1);
    chunks.push(bytes.subarray(from, to));
  }
  return Buffer.concat(chunks);
};
