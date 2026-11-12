import { createSessionValue, DASHBOARD_COOKIE } from "~/server/dashboardSession";
import { cleanSlideBoard, emptySlideBoard, type SlideBoard } from "~/config/slideBoard";
import { normalizeProfiles, type PostingProfile } from "~/config/postingProfiles";
import { cleanDayWork, emptyProfileWork, type ProfileWork } from "~/server/postingProofs";

const ORIGIN = "https://taabapps.com";
const TTL_MS = 10_000;
const TREE = JSON.stringify([
  "",
  { children: ["posting", { children: ["__PAGE__", {}, null, null] }, null, null] },
  null,
  null,
]);

export type LiveAction =
  | "addManagedProfile"
  | "saveManagedProfile"
  | "deleteManagedProfile"
  | "prepareProofUpload"
  | "saveMyDay"
  | "commitProof"
  | "loadSharedSlides"
  | "publishSlides"
  | "publishSlideCaption"
  | "dropSharedSlide"
  | "deleteValidatedDay";

export type LivePosting = {
  profiles: PostingProfile[];
  work: Record<string, ProfileWork>;
  removedDays: string[];
  slides: SlideBoard;
  cookie: string;
};

/** Local dev has no blob token. It talks to the published site instead of `.data`. */
export const mirrorPosting = () =>
  process.env.NODE_ENV !== "production" &&
  !process.env.NETLIFY_BLOBS_CONTEXT &&
  process.env.NETLIFY !== "true" &&
  !process.env.POSTING_SLIDES_DIR;

export const productionCookie = () => `${DASHBOARD_COOKIE}=${createSessionValue("tania")}`;

let cached: { at: number; value: LivePosting } | null = null;
let pending: Promise<LivePosting | null> | null = null;
let actions: { script: string; ids: Partial<Record<LiveAction, string>> } | null = null;

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
      removedDays?: unknown;
      slides?: unknown;
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
    const removedDays = Array.isArray(parsed.removedDays)
      ? Array.from(new Set(parsed.removedDays.filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))))
      : [];
    return { profiles, work, removedDays, slides: cleanSlideBoard(parsed.slides ?? emptySlideBoard()) };
  } catch {
    return null;
  }
};

const load = async (): Promise<LivePosting | null> => {
  const cookie = productionCookie();
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

export const forgetLivePosting = () => {
  cached = null;
};

/** Local dev has no Netlify blob context. Read the published desk, including its images. */
export const readLivePosting = () => {
  if (!mirrorPosting()) return Promise.resolve(null);
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

export const liveRemovedDays = async () => {
  const live = await readLivePosting();
  return live?.removedDays ?? null;
};

/** The published client keeps action ids next to the calls. Names are stripped, the calls are not. */
export const actionIdsFromBundle = (js: string): Partial<Record<LiveAction, string>> => {
  const bounds = new Map<string, string>();
  for (const match of Array.from(js.matchAll(/([A-Za-z_$][\w$]*)=\(0,[A-Za-z_$][\w$]*\.\$\)\("([0-9a-f]{40})"\)/g))) {
    bounds.set(match[1], match[2]);
  }
  const found: Partial<Record<LiveAction, string>> = {};
  bounds.forEach((id, name) => {
    const calls = new RegExp(`[^\\w$]${name.replace(/\$/g, "\\$")}\\(`, "g");
    const snippets: string[] = [];
    for (const match of Array.from(js.matchAll(calls))) snippets.push(js.slice(match.index, match.index + 180));
    const blob = snippets.join("\n");
    if (!blob) return;
    const kind: LiveAction | null = blob.includes('.profiles),eu(""),eh("")')
      ? "addManagedProfile"
      : blob.includes(".profiles") && /\(\w+,\w+,\w+\)/.test(blob)
        ? "saveManagedProfile"
        : blob.includes(".profiles")
          ? "deleteManagedProfile"
          : blob.includes(".size") && blob.includes(".name")
            ? "prepareProofUpload"
            : blob.includes("{slot:")
              ? "saveMyDay"
              : blob.includes('Error("commit")')
                ? "commitProof"
                : blob.includes("Les images")
                  ? "publishSlides"
                  : blob.includes("La description")
                    ? "publishSlideCaption"
                  : blob.includes("L'image n'a pas")
                    ? "dropSharedSlide"
                    : blob.includes(".includes(") && /!\w+\.ok/.test(blob)
                      ? "deleteValidatedDay"
                      : /\(\s*\)/.test(blob)
                        ? "loadSharedSlides"
                        : null;
    if (!kind) return;
    found[kind] = id;
  });
  return found;
};

const actionIds = async () => {
  const page = await fetch(`${ORIGIN}/posting`, {
    headers: { cookie: productionCookie() },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const html = await page.text();
  const script = html.match(/\/_next\/static\/chunks\/app\/posting\/page-[a-z0-9]+\.js/)?.[0];
  if (!script) throw new Error("live-action");
  if (actions?.script === script && actions.ids.publishSlides && actions.ids.saveMyDay && actions.ids.deleteValidatedDay) {
    return actions.ids;
  }
  const js = await fetch(`${ORIGIN}${script}`, { cache: "no-store", signal: AbortSignal.timeout(8000) }).then((response) => response.text());
  const ids = actionIdsFromBundle(js);
  if (!ids.publishSlides || !ids.publishSlideCaption || !ids.dropSharedSlide || !ids.saveMyDay || !ids.deleteValidatedDay) {
    throw new Error("live-action");
  }
  actions = { script, ids };
  return ids;
};

const actionResult = (text: string) => {
  const line = text.split("\n").find((item) => item.startsWith("1:"));
  if (!line) throw new Error("live-action");
  return JSON.parse(line.slice(2)) as { ok?: boolean; board?: SlideBoard; profiles?: PostingProfile[]; error?: string };
};

export const callProductionAction = async (name: LiveAction, args: unknown[], cookieHeader = productionCookie()) => {
  const id = (await actionIds())[name];
  if (!id) throw new Error("live-action");
  const response = await fetch(`${ORIGIN}/posting`, {
    method: "POST",
    headers: {
      accept: "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": id,
      "next-router-state-tree": encodeURIComponent(TREE),
      cookie: cookieHeader,
    },
    body: JSON.stringify(args),
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  if (!response.ok) throw new Error("live-action");
  forgetLivePosting();
  return actionResult(text);
};

export const readProductionSlide = async (id: string) => {
  const response = await fetch(`${ORIGIN}/posting/slide/${id}`, {
    headers: { cookie: productionCookie() },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) return null;
  return new Uint8Array(await response.arrayBuffer());
};

export const forwardProduction = async (path: string, request: Request, cookieHeader: string) => {
  const headers = new Headers({ cookie: cookieHeader });
  request.headers.forEach((value, key) => {
    if (key === "cookie" || key === "host" || key === "content-length" || key === "connection") return;
    headers.set(key, value);
  });
  return fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers,
    body: await request.arrayBuffer(),
    redirect: "manual",
    signal: AbortSignal.timeout(60000),
  });
};
