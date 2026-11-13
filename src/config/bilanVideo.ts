import { PROOF_PART_BYTES, proofFileName, proofPartCount } from "~/server/postingProofs";

/** One tutorial, left by Tania for the Sunday review. Stops past 1 GB. */
export const BILAN_MAX_BYTES = 1024 * 1024 * 1024;

export type BilanFile = {
  name: string;
  size: number;
  parts: number;
  partSize: number;
  type: string;
  generation: string;
};

const GENERATION = /^[a-z0-9]{8,16}$/;

export const cleanBilanFile = (value: unknown): BilanFile | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<BilanFile>;
  if (typeof raw.size !== "number" || !Number.isSafeInteger(raw.size) || raw.size <= 0 || raw.size > BILAN_MAX_BYTES) return null;
  if (raw.partSize !== PROOF_PART_BYTES) return null;
  if (raw.parts !== proofPartCount(raw.size)) return null;
  if (typeof raw.generation !== "string" || !GENERATION.test(raw.generation)) return null;
  if (typeof raw.name !== "string" || !raw.name.trim()) return null;
  const type = typeof raw.type === "string" && raw.type.startsWith("video/") ? raw.type : "video/mp4";
  return { name: proofFileName(raw.name), size: raw.size, parts: raw.parts, partSize: raw.partSize, type, generation: raw.generation };
};

export const bilanPartKey = (generation: string, part: number) => `bilan-part-${generation}-${part}`;
