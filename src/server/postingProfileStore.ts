import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { getStore } from "@netlify/blobs";

import {
  DEFAULT_PROFILES,
  PostingProfile,
  addProfile,
  deleteProfile,
  normalizeProfiles,
  profileIdForCode,
  updateProfile,
} from "~/config/postingProfiles";

const FILE = path.join(process.cwd(), ".data", "posting-profiles.json");
const STORE = "posting-profiles";
const KEY = "directory";

const onNetlify = () => process.env.NETLIFY === "true" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

const readBlobs = async (): Promise<PostingProfile[] | null | undefined> => {
  try {
    const store = getStore(STORE);
    const value = await store.get(KEY, { type: "json" });
    if (value == null) return null;
    return normalizeProfiles(value) ?? DEFAULT_PROFILES.map((profile) => ({ ...profile }));
  } catch {
    return undefined;
  }
};

const readFileStore = async (): Promise<PostingProfile[] | null> => {
  try {
    const raw = await readFile(FILE, "utf8");
    return normalizeProfiles(JSON.parse(raw)) ?? DEFAULT_PROFILES.map((profile) => ({ ...profile }));
  } catch {
    return null;
  }
};

export const listProfiles = async (): Promise<PostingProfile[]> => {
  const blobs = await readBlobs();
  if (blobs) return blobs;
  if (blobs === null && onNetlify()) return DEFAULT_PROFILES.map((profile) => ({ ...profile }));
  const file = await readFileStore();
  return file ?? DEFAULT_PROFILES.map((profile) => ({ ...profile }));
};

const saveProfiles = async (profiles: PostingProfile[]) => {
  try {
    const store = getStore(STORE);
    await store.setJSON(KEY, profiles);
    return;
  } catch (error) {
    if (onNetlify()) throw error;
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(profiles));
};

let queue = Promise.resolve();

const mutate = (recipe: (profiles: PostingProfile[]) => ReturnType<typeof updateProfile>) => {
  const run = queue.then(async () => {
    const current = await listProfiles();
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
