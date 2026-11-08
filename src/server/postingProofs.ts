/** A one-hour screen recording. The upload stops past 10 GB. */
export const PROOF_MAX_BYTES = 10 * 1024 * 1024 * 1024;

/** Each piece stays under the hosting request limit. The browser never talks to storage directly. */
export const PROOF_PART_BYTES = 3 * 1024 * 1024;

const PROFILE = /^p[a-z0-9-]{1,40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ProofRecord = { profileId: string; date: string; name: string };

export type DayWork = {
  slot: string | null;
  checks: Record<string, boolean>;
  validated: boolean;
  proofName: string | null;
};

export type ProfileWork = { days: Record<string, DayWork> };

const SLOT = /^(17-18|18-19|19-20|20-21)$/;

export const emptyDayWork = (): DayWork => ({ slot: null, checks: {}, validated: false, proofName: null });

export const emptyProfileWork = (): ProfileWork => ({ days: {} });

export const cleanDayWork = (value: unknown): DayWork | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<DayWork>;
  const checks: Record<string, boolean> = {};
  if (raw.checks && typeof raw.checks === "object") {
    for (const [key, on] of Object.entries(raw.checks)) {
      if (on === true && /^[a-z0-9-]{1,40}$/.test(key) && Object.keys(checks).length < 40) checks[key] = true;
    }
  }
  return {
    slot: typeof raw.slot === "string" && SLOT.test(raw.slot) ? raw.slot : null,
    checks,
    validated: raw.validated === true,
    proofName: typeof raw.proofName === "string" && raw.proofName.trim() ? proofFileName(raw.proofName) : null,
  };
};

export const proofObjectKey = (profileId: string, date: string) => `file-${profileId}-${date}`;

export const proofPartCount = (size: number) => Math.ceil(size / PROOF_PART_BYTES);

export const proofPartKey = (profileId: string, date: string, generation: string, part: number) =>
  `${proofObjectKey(profileId, date)}-${generation}-p${part}`;

export const proofMetaKey = (profileId: string, date: string) => `meta-${profileId}-${date}`;

export type ProofFile = {
  name: string;
  size: number;
  parts: number;
  partSize: number;
  type: string;
  generation: string;
};

export const proofWindow = (partSize: number, partCount: number, start: number, end: number) => ({
  first: Math.max(0, Math.floor(start / partSize)),
  last: Math.min(partCount - 1, Math.floor(end / partSize)),
});

export const proofAllowed = (profileId: string, date: string, size: number) =>
  PROFILE.test(profileId) && DATE.test(date) && Number.isFinite(size) && size > 0 && size <= PROOF_MAX_BYTES;

export const proofFileName = (name: string) => {
  const base = name.split(/[/\\]/).pop()?.replace(/\s+/g, " ").trim() || "video.mp4";
  return base.slice(0, 120);
};

const GENERATION = /^[a-z0-9]{8,16}$/;

export const cleanProofFile = (value: unknown): ProofFile | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<ProofFile>;
  if (typeof raw.size !== "number" || !Number.isSafeInteger(raw.size) || raw.size <= 0 || raw.size > PROOF_MAX_BYTES) return null;
  if (raw.partSize !== PROOF_PART_BYTES) return null;
  if (raw.parts !== proofPartCount(raw.size)) return null;
  if (typeof raw.generation !== "string" || !GENERATION.test(raw.generation)) return null;
  if (typeof raw.name !== "string" || !raw.name.trim()) return null;
  const type = typeof raw.type === "string" && raw.type.startsWith("video/") ? raw.type : "video/mp4";
  return { name: proofFileName(raw.name), size: raw.size, parts: raw.parts, partSize: raw.partSize, type, generation: raw.generation };
};
