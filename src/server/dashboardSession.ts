import { createHmac, timingSafeEqual } from "crypto";

export const DASHBOARD_COOKIE = "taab_creator_dash";
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const SECRET = "taab-creator-dashboard-gate-v1";

const signature = (payload: string) => createHmac("sha256", SECRET).update(payload).digest("base64url");

const signed = (payload: string, sig: string) => {
  const expected = signature(payload);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

const isRole = (role: string) => role === "tania" || /^p[a-z0-9-]{1,40}$/.test(role);

/** Legacy sessions without a role are Tania's. Creator tools stay on 2580. */
export const createSessionValue = (role = "tania", now = Date.now()) => {
  const payload = `v2.${now + SESSION_MS}.${role}`;
  return `${payload}.${signature(payload)}`;
};

export const readSession = (value: string | undefined, now = Date.now()): { role: string } | null => {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length === 3) {
    const [version, expRaw, sig] = parts;
    const exp = Number(expRaw);
    if (version !== "v1" || !Number.isFinite(exp) || exp <= now) return null;
    if (!signed(`${version}.${expRaw}`, sig)) return null;
    return { role: "tania" };
  }
  if (parts.length === 4) {
    const [version, expRaw, role, sig] = parts;
    const exp = Number(expRaw);
    if (version !== "v2" || !Number.isFinite(exp) || exp <= now) return null;
    if (!isRole(role)) return null;
    if (!signed(`${version}.${expRaw}.${role}`, sig)) return null;
    return { role };
  }
  return null;
};

/** Creator dashboard and its stats stay limited to Tania. */
export const verifySession = (value: string | undefined, now = Date.now()) => readSession(value, now)?.role === "tania";
