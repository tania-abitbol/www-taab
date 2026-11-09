import { mkdir, open, readFile, writeFile } from "fs/promises";
import path from "path";

import { proofFileName } from "~/server/postingProofs";

const root = path.join(process.cwd(), ".data", "posting-proofs");

const folder = (profileId: string, date: string) => path.join(root, profileId, date);

type Index = Record<string, Record<string, string>>;

const readIndex = async (): Promise<Index> => {
  try {
    const raw = JSON.parse(await readFile(path.join(root, "index.json"), "utf8")) as Index;
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
};

export const writeLocalProofPart = async (
  profileId: string,
  date: string,
  part: number,
  parts: number,
  bytes: Uint8Array,
  name: string,
  type: string
) => {
  const dir = folder(profileId, date);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `part-${part}`), bytes);
  if (part !== parts - 1) return;
  const chunks: Buffer[] = [];
  for (let index = 0; index < parts; index += 1) chunks.push(await readFile(path.join(dir, `part-${index}`)));
  await writeFile(path.join(dir, "video"), Buffer.concat(chunks));
  const clean = proofFileName(name);
  const media = type.startsWith("video/") ? type : "video/mp4";
  await writeFile(path.join(dir, "meta.json"), JSON.stringify({ name: clean, type: media }));
  const index = await readIndex();
  index[profileId] = { ...(index[profileId] ?? {}), [date]: clean };
  await writeFile(path.join(root, "index.json"), JSON.stringify(index));
};

export const localProofNames = async (profileId: string) => {
  const names = (await readIndex())[profileId];
  if (!names || typeof names !== "object") return null;
  const clean: Record<string, string> = {};
  for (const [date, name] of Object.entries(names)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && typeof name === "string" && name.trim()) clean[date] = proofFileName(name);
  }
  return Object.keys(clean).length ? clean : null;
};

export const localProofStat = async (profileId: string, date: string) => {
  try {
    const handle = await open(path.join(folder(profileId, date), "video"), "r");
    const info = await handle.stat();
    await handle.close();
    const meta = JSON.parse(await readFile(path.join(folder(profileId, date), "meta.json"), "utf8")) as {
      type?: string;
    };
    if (!info.size) return null;
    return { size: info.size, type: typeof meta.type === "string" && meta.type.startsWith("video/") ? meta.type : "video/mp4" };
  } catch {
    return null;
  }
};

export const readLocalProofRange = async (profileId: string, date: string, start: number, end: number) => {
  const handle = await open(path.join(folder(profileId, date), "video"), "r");
  try {
    const length = end - start + 1;
    const bytes = Buffer.alloc(length);
    await handle.read(bytes, 0, length, start);
    return bytes;
  } finally {
    await handle.close();
  }
};
