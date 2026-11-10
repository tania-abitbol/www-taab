import { normalizeProfiles, type PostingProfile } from "~/config/postingProfiles";
import { cleanDayWork, emptyProfileWork, type ProfileWork } from "~/server/postingProofs";

const ORIGIN = "https://taabapps.com";
const TTL_MS = 10_000;

export type LivePosting = {
  profiles: PostingProfile[];
  work: Record<string, ProfileWork>;
  cookie: string;
};

let cached: { at: number; value: LivePosting } | null = null;
let pending: Promise<LivePosting | null> | null = null;

const usable = () => process.env.NODE_ENV !== "production" && !process.env.NETLIFY_BLOBS_CONTEXT && process.env.NETLIFY !== "true";

const propsFromHtml = (html: string) => {
  const marker = '{\\"role\\":\\"tania\\"';
  const start = html.indexOf(marker);
  const stop = start < 0 ? -1 : html.indexOf('\\n"])</script>', start);
  if (start < 0 || stop < 0) return null;
  try {
    const raw = html.slice(start, stop).replace(/\]$/, "");
    const text = JSON.parse(`"${raw}"`) as string;
    const parsed = JSON.parse(text) as {
      profiles?: unknown;
      work?: Record<string, { days?: Record<string, unknown> }>;
    };
    const profiles = normalizeProfiles(parsed.profiles);
    if (!profiles?.length) return null;
    const work: Record<string, ProfileWork> = {};
    for (const profile of profiles) {
      const days: ProfileWork["days"] = {};
      const source = parsed.work?.[profile.id]?.days;
      if (source && typeof source === "object") {
        for (const [date, value] of Object.entries(source)) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
          const clean = cleanDayWork(value);
          if (clean) days[date] = clean;
        }
      }
      work[profile.id] = { days };
    }
    return { profiles, work };
  } catch {
    return null;
  }
};

const load = async (): Promise<LivePosting | null> => {
  const gate = await fetch(`${ORIGIN}/posting`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const gateHtml = await gate.text();
  const action = gateHtml.match(/\$ACTION_ID_([0-9a-f]+)/)?.[1];
  if (!action) return null;
  const form = new FormData();
  form.set(`$ACTION_ID_${action}`, "");
  form.set("code", "2580");
  form.set("next", "/posting");
  const login = await fetch(`${ORIGIN}/posting`, {
    method: "POST",
    body: form,
    redirect: "manual",
    signal: AbortSignal.timeout(8000),
  });
  const cookies = typeof login.headers.getSetCookie === "function" ? login.headers.getSetCookie() : [];
  const cookie = cookies.map((item) => item.split(";", 1)[0]).find((item) => item.startsWith("taab_creator_dash="));
  if (!cookie) return null;
  const page = await fetch(`${ORIGIN}/posting`, {
    headers: { cookie },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const parsed = propsFromHtml(await page.text());
  if (!parsed) return null;
  const value = { ...parsed, cookie };
  cached = { at: Date.now(), value };
  return value;
};

/** Local dev has no Netlify blob context, and Firestore does not store this desk. Read the live page. */
export const readLivePosting = () => {
  if (!usable()) return Promise.resolve(null);
  if (cached && Date.now() - cached.at < TTL_MS) return Promise.resolve(cached.value);
  if (!pending) {
    pending = load()
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
};

export const liveWork = async (profileId: string) => {
  const live = await readLivePosting();
  if (!live) return null;
  return live.work[profileId] ?? emptyProfileWork();
};
