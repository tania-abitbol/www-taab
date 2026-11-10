import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  type DayWork,
  type ProfileWork,
  type ProofFile,
  cleanDayWork,
  cleanProofFile,
  emptyDayWork,
  emptyProfileWork,
  proofAllowed,
  proofFileName,
  proofMetaKey,
  proofObjectKey,
  proofPartKey,
  proofWindow,
} from "~/server/postingProofs";
import { liveWork } from "~/server/postingLive";
import { deleteLocalProof, localProofNames } from "~/server/postingLocalProof";

const PROOFS = "posting-proofs";
const WORK = "posting-work";

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

const endpoint = (context: BlobsContext, store: string, key: string) =>
  new URL(`/api/v1/blobs/${context.siteID}/${store}/${key}`, context.apiURL || "https://api.netlify.com");

const sign = async (store: string, key: string, method: "GET" | "PUT") => {
  const context = blobsContext();
  if (!context?.siteID || !context.token) return null;
  const response = await fetch(endpoint(context, store, key), {
    method,
    headers: { authorization: `Bearer ${context.token}`, accept: "application/json;type=signed-url" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("proof-sign");
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new Error("proof-sign");
  return body.url;
};

const readJson = async (store: string, key: string) => {
  const url = await sign(store, key, "GET");
  if (!url) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const writeJson = async (store: string, key: string, value: unknown) => {
  const url = await sign(store, key, "PUT");
  if (!url) throw new Error("proof-sign");
  const response = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("proof-write");
};

/** Netlify deletes a blob on the API itself. DELETE does not return a signed URL. */
const discard = async (store: string, key: string, signal?: AbortSignal) => {
  if (signal?.aborted) return;
  const context = blobsContext();
  if (!context?.siteID || !context.token) return;
  const response = await fetch(endpoint(context, store, key), {
    method: "DELETE",
    headers: { authorization: `Bearer ${context.token}` },
    signal,
  });
  if (response.status === 200 || response.status === 204 || response.status === 404) return;
  throw new Error("proof-delete");
};

const runPool = async (jobs: Array<() => Promise<void>>, limit: number, signal?: AbortSignal) => {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (!signal?.aborted && cursor < jobs.length) {
      const job = jobs[cursor];
      cursor += 1;
      await job?.().catch(() => undefined);
    }
  });
  await Promise.all(workers);
};

let queue = Promise.resolve();

const enqueue = <T>(job: () => Promise<T>) => {
  const run = queue.then(job);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

export const proofStorageReady = () => {
  const context = blobsContext();
  return Boolean(context?.siteID && context.token);
};

export const signProofRead = (profileId: string, date: string) => sign(PROOFS, proofObjectKey(profileId, date), "GET");

export const writeProofPart = async (profileId: string, date: string, generation: string, part: number, bytes: Uint8Array) => {
  const url = await sign(PROOFS, proofPartKey(profileId, date, generation, part), "PUT");
  if (!url) throw new Error("proof-sign");
  const response = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream" },
    body: bytes,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`proof-write-${response.status}`);
};

export const saveProofFile = (profileId: string, date: string, file: ProofFile) =>
  writeJson(PROOFS, proofMetaKey(profileId, date), file);

export const loadProofFile = async (profileId: string, date: string) => cleanProofFile(await readJson(PROOFS, proofMetaKey(profileId, date)));

export const readProofRange = async (profileId: string, date: string, file: ProofFile, start: number, end: number) => {
  const { first, last } = proofWindow(file.partSize, file.parts, start, end);
  const chunks: Buffer[] = [];
  for (let part = first; part <= last; part += 1) {
    const url = await sign(PROOFS, proofPartKey(profileId, date, file.generation, part), "GET");
    if (!url) throw new Error("proof-read");
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error("proof-read");
    const bytes = Buffer.from(await response.arrayBuffer());
    const partStart = part * file.partSize;
    const from = Math.max(0, start - partStart);
    const to = Math.min(bytes.length, end - partStart + 1);
    chunks.push(bytes.subarray(from, to));
  }
  return Buffer.concat(chunks);
};

const storedWork = async (profileId: string): Promise<ProfileWork> => {
  const raw = (await readJson(WORK, `work-${profileId}`)) as { days?: Record<string, unknown> } | null;
  const days: Record<string, DayWork> = {};
  if (raw?.days && typeof raw.days === "object") {
    for (const [date, value] of Object.entries(raw.days)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const clean = cleanDayWork(value);
      if (clean) days[date] = clean;
    }
  }
  return { days };
};

const withLocalProofs = async (profileId: string, work: ProfileWork): Promise<ProfileWork> => {
  if (proofStorageReady()) return work;
  const names = await localProofNames(profileId);
  if (!names) return work;
  const days = { ...work.days };
  for (const [date, name] of Object.entries(names)) {
    const previous = days[date] ?? emptyDayWork();
    days[date] = { ...previous, proofName: name };
  }
  return { days };
};

export const loadWork = async (profileId: string): Promise<ProfileWork> => {
  const live = await liveWork(profileId);
  return withLocalProofs(profileId, live ?? (await storedWork(profileId)));
};

export const loadAllWork = async (profileIds: string[]) => {
  const entries = await Promise.all(profileIds.map(async (id) => [id, await loadWork(id)] as const));
  return Object.fromEntries(entries);
};

export const saveWorkDay = (profileId: string, date: string, day: DayWork) =>
  enqueue(async () => {
    const current = await loadWork(profileId);
    const previous = current.days[date] ?? emptyDayWork();
    current.days[date] = { ...day, proofName: day.proofName ?? previous.proofName };
    await writeJson(WORK, `work-${profileId}`, current);
  });

export const rememberProof = (profileId: string, date: string, name: string) =>
  enqueue(async () => {
    const current = await loadWork(profileId);
    const previous = current.days[date] ?? emptyDayWork();
    current.days[date] = { ...previous, proofName: proofFileName(name) };
    await writeJson(WORK, `work-${profileId}`, current);
  });

export const deleteStoredProof = async (profileId: string, date: string, signal?: AbortSignal) => {
  if (!proofAllowed(profileId, date, 1) || signal?.aborted) return;
  await deleteLocalProof(profileId, date);
  if (!proofStorageReady() || signal?.aborted) return;
  const file = await loadProofFile(profileId, date);
  if (file) {
    const jobs = Array.from({ length: file.parts }, (_, part) => () =>
      discard(PROOFS, proofPartKey(profileId, date, file.generation, part), signal),
    );
    await runPool(jobs, 32, signal);
  }
  if (signal?.aborted) return;
  await discard(PROOFS, proofMetaKey(profileId, date), signal).catch(() => undefined);
  await discard(PROOFS, proofObjectKey(profileId, date), signal).catch(() => undefined);
};

/** Hide the day before touching its videos. A Friday proof can be thousands of parts. */
export const forgetPostedDay = async (profileIds: string[], date: string) => {
  await rememberRemovedDay(date);
  await Promise.all(profileIds.map((profileId) => clearDayProof(profileId, date).catch(() => undefined)));
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 5000);
  try {
    await Promise.race([
      Promise.all(profileIds.map((profileId) => deleteStoredProof(profileId, date, stop.signal).catch(() => undefined))),
      new Promise<void>((resolve) => stop.signal.addEventListener("abort", () => resolve(), { once: true })),
    ]);
  } finally {
    clearTimeout(timer);
    stop.abort();
  }
};

export const clearDayProof = (profileId: string, date: string) =>
  enqueue(async () => {
    if (!proofStorageReady() || !proofAllowed(profileId, date, 1)) return;
    const current = await storedWork(profileId);
    const day = current.days[date];
    if (!day?.proofName) return;
    current.days[date] = { ...day, proofName: null };
    await writeJson(WORK, `work-${profileId}`, current);
  });

const removedPath = path.join(process.cwd(), ".data", "posting-removed-days.json");
const REMOVED_KEY = "removed-days";

const cleanDates = (value: unknown) => {
  if (!value || typeof value !== "object") return [];
  const dates = (value as { dates?: unknown }).dates;
  if (!Array.isArray(dates)) return [];
  return Array.from(new Set(dates.filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))));
};

export const loadRemovedDays = async () => {
  if (proofStorageReady()) return cleanDates(await readJson(WORK, REMOVED_KEY));
  try {
    return cleanDates(JSON.parse(await readFile(removedPath, "utf8")));
  } catch {
    return [];
  }
};

export const rememberRemovedDay = (date: string) =>
  enqueue(async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const current = await loadRemovedDays();
    if (current.includes(date)) return;
    const next = { dates: [...current, date] };
    if (proofStorageReady()) {
      await writeJson(WORK, REMOVED_KEY, next);
      return;
    }
    await mkdir(path.dirname(removedPath), { recursive: true });
    await writeFile(removedPath, JSON.stringify(next));
  });

export const listProofs = async (profileId?: string) => {
  const ids = profileId ? [profileId] : [];
  if (!profileId) return [];
  const work = await loadWork(profileId);
  return Object.entries(work.days)
    .filter((entry): entry is [string, DayWork & { proofName: string }] => Boolean(entry[1].proofName))
    .map(([date, day]) => ({ profileId, date, name: day.proofName }));
};

export { emptyProfileWork };
