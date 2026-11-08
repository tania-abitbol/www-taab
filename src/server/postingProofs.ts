/** A one-hour screen recording fits here. Netlify Blobs stop at 5 GB per object. */
export const PROOF_MAX_BYTES = 3 * 1024 * 1024 * 1024;

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

export const proofAllowed = (profileId: string, date: string, size: number) =>
  PROFILE.test(profileId) && DATE.test(date) && Number.isFinite(size) && size > 0 && size <= PROOF_MAX_BYTES;

export const proofFileName = (name: string) => {
  const base = name.split(/[/\\]/).pop()?.replace(/\s+/g, " ").trim() || "video.mp4";
  return base.slice(0, 120);
};
