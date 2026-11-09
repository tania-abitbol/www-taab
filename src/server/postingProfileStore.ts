import path from "path";

import {
  DEFAULT_PROFILES,
  PostingProfile,
  addProfile,
  deleteProfile,
  normalizeProfiles,
  profileIdForCode,
  updateProfile,
} from "~/config/postingProfiles";
import { readLivePosting } from "~/server/postingLive";

const FILE = path.join(process.cwd(), ".data", "posting-profiles.json");
const STORE = "posting-profiles";
const KEY = "directory";

type BlobsContext = {
  siteID?: string;
  token?: string;
  apiURL?: string;
  edgeURL?: string;
  uncachedEdgeURL?: string;
};

const onNetlify = () => process.env.NETLIFY === "true" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

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

const request = async (url: string, init: RequestInit) => {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  return response;
};

const readBlobs = async (): Promise<PostingProfile[] | null | undefined> => {
  const context = blobsContext();
  if (!context?.siteID || !context.token) return undefined;
  const pathName = `/${context.siteID}/${STORE}/${KEY}`;
  const headers = { authorization: `Bearer ${context.token}` };
  try {
    if (context.edgeURL || context.uncachedEdgeURL) {
      const url = new URL(pathName, context.uncachedEdgeURL || context.edgeURL);
      const response = await request(url.toString(), { headers });
      if (response.status === 404) return null;
      if (!response.ok) return undefined;
      return normalizeProfiles(await response.json()) ?? DEFAULT_PROFILES.map((profile) => ({ ...profile }));
    }
    const api = new URL(`/api/v1/blobs${pathName}`, context.apiURL || "https://api.netlify.com");
    const signed = await request(api.toString(), {
      headers: { ...headers, accept: "application/json;type=signed-url" },
    });
    if (signed.status === 404) return null;
    if (!signed.ok) return undefined;
    const body = (await signed.json()) as { url?: string };
    if (!body.url) return undefined;
    const response = await request(body.url, {});
    if (response.status === 404) return null;
    if (!response.ok) return undefined;
    return normalizeProfiles(await response.json()) ?? DEFAULT_PROFILES.map((profile) => ({ ...profile }));
  } catch {
    return undefined;
  }
};

const writeBlobs = async (profiles: PostingProfile[]) => {
  const context = blobsContext();
  if (!context?.siteID || !context.token) throw new Error("blobs");
  const pathName = `/${context.siteID}/${STORE}/${KEY}`;
  const payload = JSON.stringify(profiles);
  const headers = { authorization: `Bearer ${context.token}` };
  if (context.edgeURL) {
    const url = new URL(pathName, context.edgeURL);
    const response = await request(url.toString(), { method: "PUT", headers, body: payload });
    if (!response.ok) throw new Error("blobs");
    return;
  }
  const api = new URL(`/api/v1/blobs${pathName}`, context.apiURL || "https://api.netlify.com");
  const signed = await request(api.toString(), {
    method: "PUT",
    headers: { ...headers, accept: "application/json;type=signed-url" },
  });
  if (!signed.ok) throw new Error("blobs");
  const body = (await signed.json()) as { url?: string };
  if (!body.url) throw new Error("blobs");
  const response = await request(body.url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: payload,
  });
  if (!response.ok) throw new Error("blobs");
};

const readFileStore = async (): Promise<PostingProfile[] | null> => {
  try {
    const { readFile } = await import("fs/promises");
    return normalizeProfiles(JSON.parse(await readFile(FILE, "utf8"))) ?? DEFAULT_PROFILES.map((profile) => ({ ...profile }));
  } catch {
    return null;
  }
};

const writeFileStore = async (profiles: PostingProfile[]) => {
  const { mkdir, writeFile } = await import("fs/promises");
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(profiles));
};

const seeded = () => DEFAULT_PROFILES.map((profile) => ({ ...profile }));

const loadProfiles = async (strict: boolean): Promise<PostingProfile[]> => {
  const live = await readLivePosting();
  if (live?.profiles.length) return live.profiles;
  const blobs = await readBlobs();
  if (Array.isArray(blobs)) return blobs;
  if (blobs === null) return seeded();
  if (blobsContext()) {
    if (strict) throw new Error("blobs");
    return seeded();
  }
  if (onNetlify()) return seeded();
  return (await readFileStore()) ?? seeded();
};

export const listProfiles = () => loadProfiles(false);

const saveProfiles = async (profiles: PostingProfile[]) => {
  if (blobsContext()) {
    await writeBlobs(profiles);
    return;
  }
  if (onNetlify()) throw new Error("blobs");
  await writeFileStore(profiles);
};

let queue = Promise.resolve();

const mutate = (recipe: (profiles: PostingProfile[]) => ReturnType<typeof updateProfile>) => {
  const run = queue.then(async () => {
    const current = await loadProfiles(true);
    const result = recipe(current);
    if (result.ok) await saveProfiles(result.profiles);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

export const changeProfile = (id: string, name: string, code: string) => mutate((profiles) => updateProfile(profiles, id, name, code));

export const removeProfile = (id: string) => mutate((profiles) => deleteProfile(profiles, id));

export const createProfile = (name: string, code: string) => mutate((profiles) => addProfile(profiles, name, code));

export const roleForAccessCode = async (code: string) => {
  const trimmed = code.trim();
  if (trimmed === "2580") return "tania";
  return profileIdForCode(await listProfiles(), trimmed);
};
