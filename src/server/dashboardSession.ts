import { createHmac, timingSafeEqual } from "crypto";

export const DASHBOARD_COOKIE = "taab_creator_dash";
const ACCESS_CODE = "2580";
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const SECRET = "taab-creator-dashboard-gate-v1";

const signature = (payload: string) =>
  createHmac("sha256", SECRET).update(payload).digest("base64url");

export const codeMatches = (code: string) => code.trim() === ACCESS_CODE;

export const createSessionValue = (now = Date.now()) => {
  const payload = `v1.${now + SESSION_MS}`;
  return `${payload}.${signature(payload)}`;
};

export const verifySession = (value: string | undefined, now = Date.now()) => {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [version, expRaw, sig] = parts;
  const payload = `${version}.${expRaw}`;
  const exp = Number(expRaw);
  if (version !== "v1" || !Number.isFinite(exp) || exp <= now) return false;
  const expected = signature(payload);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};
