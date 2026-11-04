export type PublicVideo = {
  id: string;
  url: string;
  platform: "tiktok" | "instagram";
  author: string | null;
  caption: string | null;
  postedAt: number | null;
  dateSource: "page" | "media-id" | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  cover: string | null;
  missing: string[];
};

export class PublicVideoError extends Error {
  code: "unsupported" | "unavailable" | "not-video";

  constructor(code: "unsupported" | "unavailable" | "not-video") {
    super(code);
    this.code = code;
  }
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

const allowedHost = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (host.includes(":") || /^\d+$/.test(host.split(".").pop() ?? "")) return false;
  return (
    host === "tiktok.com" ||
    host.endsWith(".tiktok.com") ||
    host === "instagram.com" ||
    host.endsWith(".instagram.com") ||
    host === "instagr.am" ||
    host.endsWith(".instagr.am")
  );
};

const parseHttpUrl = (value: string) => {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new PublicVideoError("unsupported");
  }
  if (url.protocol !== "https:" || url.username || url.password || !allowedHost(url.hostname)) {
    throw new PublicVideoError("unsupported");
  }
  return url;
};

const fetchAllowed = async (start: URL, userAgent = BROWSER_UA) => {
  let current = start;
  for (let hop = 0; hop < 5; hop += 1) {
    if (!allowedHost(current.hostname)) throw new PublicVideoError("unsupported");
    const response = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/json",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new PublicVideoError("unavailable");
      current = parseHttpUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new PublicVideoError("unavailable");
    return { url: current, html: await response.text() };
  }
  throw new PublicVideoError("unavailable");
};

const count = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.round(value);
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  return null;
};

const preferCount = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = count(value);
    if (parsed != null) return parsed;
  }
  return null;
};

const missingOf = (video: Omit<PublicVideo, "missing">) => {
  const missing: string[] = [];
  if (video.views == null) missing.push("views");
  if (video.likes == null) missing.push("likes");
  if (video.comments == null) missing.push("comments");
  if (video.postedAt == null) missing.push("postedAt");
  if (video.author == null) missing.push("author");
  return missing;
};

const readTikTok = (html: string, pageUrl: URL): PublicVideo => {
  const match = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/
  );
  if (!match) throw new PublicVideoError("unavailable");
  let detail: {
    statusCode?: number;
    itemInfo?: { itemStruct?: Record<string, unknown> };
  };
  try {
    const data = JSON.parse(match[1]) as {
      __DEFAULT_SCOPE__?: { "webapp.video-detail"?: typeof detail };
    };
    detail = data.__DEFAULT_SCOPE__?.["webapp.video-detail"] ?? {};
  } catch {
    throw new PublicVideoError("unavailable");
  }
  const item = detail.itemInfo?.itemStruct;
  if (!item || detail.statusCode !== 0) throw new PublicVideoError("not-video");

  const statsV2 = (item.statsV2 ?? {}) as Record<string, unknown>;
  const stats = (item.stats ?? {}) as Record<string, unknown>;
  const author = item.author as { uniqueId?: string; nickname?: string } | undefined;
  const video = item.video as { cover?: string; originCover?: string } | undefined;
  const created = count(item.createTime);
  const handle = author?.uniqueId || null;
  const id = String(item.id ?? "");
  if (!/^\d{8,}$/.test(id)) throw new PublicVideoError("not-video");

  const cover = [video?.cover, video?.originCover].find(
    (value) => typeof value === "string" && value.startsWith("https://")
  );
  const partial = {
    id: `tiktok:${id}`,
    url: handle ? `https://www.tiktok.com/@${handle}/video/${id}` : pageUrl.toString(),
    platform: "tiktok" as const,
    author: author?.nickname || handle,
    caption: typeof item.desc === "string" && item.desc.trim() ? item.desc.trim() : null,
    postedAt: created == null ? null : created > 1e12 ? created : created * 1000,
    dateSource: created != null ? ("page" as const) : null,
    views: preferCount(statsV2.playCount, stats.playCount),
    likes: preferCount(statsV2.diggCount, stats.diggCount),
    comments: preferCount(statsV2.commentCount, stats.commentCount),
    shares: preferCount(statsV2.shareCount, stats.shareCount),
    saves: preferCount(statsV2.collectCount, stats.collectCount),
    cover: cover ?? null,
  };
  return { ...partial, missing: missingOf(partial) };
};

const IG_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Instagram media ids encode the creation time. The embed page does not print it. */
export const instagramShortcodePostedAt = (shortcode: string) => {
  if (!/^[A-Za-z0-9_-]{5,30}$/.test(shortcode)) return null;
  let mediaId = BigInt(0);
  for (const char of shortcode) {
    const index = IG_ALPHABET.indexOf(char);
    if (index < 0) return null;
    mediaId = mediaId * BigInt(64) + BigInt(index);
  }
  const millis = (mediaId >> BigInt(23)) + BigInt("1314220021721");
  const postedAt = Number(millis);
  const year = new Date(postedAt).getUTCFullYear();
  if (!Number.isFinite(postedAt) || year < 2010 || year > 2100) return null;
  return postedAt;
};

const unescapeEmbed = (value: string) =>
  value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/");

const readInstagram = (html: string, shortcode: string, pageUrl: URL): PublicVideo => {
  const views = html.match(/video_view_count\\?":(\d+)/);
  const likes = html.match(/edge_liked_by\\?":\{\\?"count\\?":(\d+)/);
  const comments = html.match(/edge_media_to_comment\\?":\{\\?"count\\?":(\d+)/);
  const captionMatch = html.match(/edge_media_to_caption\\?":\{\\?"edges\\?":\[\{\\?"node\\?":\{\\?"text\\?":\\?"([\s\S]*?)\\?"/);
  const pathAuthor = pageUrl.pathname.split("/").filter(Boolean)[0];
  const reserved = new Set(["p", "reel", "reels", "tv", "stories"]);
  const authorFromPath = pathAuthor && !reserved.has(pathAuthor.toLowerCase()) ? pathAuthor : null;
  const authorFromEmbed = html.match(/instagram\.com\/([A-Za-z0-9._]+)\/\?/)?.[1];
  const author =
    authorFromPath ||
    (authorFromEmbed && !reserved.has(authorFromEmbed.toLowerCase()) ? authorFromEmbed : null);
  const postedAt = instagramShortcodePostedAt(shortcode);
  const partial = {
    id: `instagram:${shortcode}`,
    url: pageUrl.toString().split("?")[0],
    platform: "instagram" as const,
    author,
    caption: captionMatch ? unescapeEmbed(captionMatch[1]).trim() || null : null,
    postedAt,
    dateSource: postedAt != null ? ("media-id" as const) : null,
    views: views ? Number(views[1]) : null,
    likes: likes ? Number(likes[1]) : null,
    comments: comments ? Number(comments[1]) : null,
    shares: null,
    saves: null,
    cover: null,
  };
  return { ...partial, missing: missingOf(partial) };
};

const instagramTarget = (url: URL) => {
  const parts = url.pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((part) => ["reel", "reels", "p", "tv"].includes(part.toLowerCase()));
  const shortcode = marker >= 0 ? parts[marker + 1] : null;
  if (!shortcode || !/^[A-Za-z0-9_-]{5,30}$/.test(shortcode)) return null;
  const kind = parts[marker].toLowerCase() === "p" || parts[marker].toLowerCase() === "tv" ? "p" : "reel";
  return {
    shortcode,
    embed: new URL(`https://www.instagram.com/${kind}/${shortcode}/embed/captioned/`),
  };
};

export const fetchPublicVideo = async (raw: string): Promise<PublicVideo> => {
  const url = parseHttpUrl(raw);
  const host = url.hostname.toLowerCase();
  const isInstagram = host === "instagram.com" || host.endsWith(".instagram.com") || host.endsWith("instagr.am");

  if (isInstagram) {
    const target = instagramTarget(url);
    if (!target) throw new PublicVideoError("not-video");
    target.embed.searchParams.set("cr", "1");
    target.embed.searchParams.set("v", "14");
    target.embed.searchParams.set("wp", "540");
    const [page, oembed] = await Promise.all([
      fetchAllowed(target.embed, IPHONE_UA).catch(() => null),
      fetchAllowed(
        new URL(`https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url.toString())}`)
      ).catch(() => null),
    ]);
    if (!page && !oembed) throw new PublicVideoError("unavailable");
    const video = readInstagram(page?.html ?? "", target.shortcode, url);
    let author = video.author;
    let caption = video.caption;
    let cover = video.cover;
    if (oembed) {
      try {
        const meta = JSON.parse(oembed.html) as {
          author_name?: string;
          title?: string;
          thumbnail_url?: string;
        };
        author = author ?? meta.author_name ?? null;
        caption = caption ?? (meta.title?.trim() || null);
        if (!cover && typeof meta.thumbnail_url === "string" && meta.thumbnail_url.startsWith("https://")) {
          cover = meta.thumbnail_url;
        }
      } catch {
        // The embed counts still stand when oEmbed is not JSON.
      }
    }
    if (video.views == null && video.likes == null && video.comments == null && !caption) {
      throw new PublicVideoError("unavailable");
    }
    const merged = { ...video, author, caption, cover };
    return { ...merged, missing: missingOf(merged) };
  }

  const page = await fetchAllowed(url);
  if (!/\/(video|photo)\/\d+/.test(page.url.pathname) && !/\/(video|photo)\/\d+/.test(url.pathname)) {
    throw new PublicVideoError("not-video");
  }
  return readTikTok(page.html, page.url);
};
