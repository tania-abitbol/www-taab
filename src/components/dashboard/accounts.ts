export type AccountVideo = {
  id: string;
  url: string;
  platform: "tiktok" | "instagram";
};

export type AccountRef = {
  /** Stable per platform and handle. A video with no handle stays on its own. */
  key: string;
  handle: string | null;
};

const RESERVED_INSTAGRAM = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts"]);

/** TikTok and Instagram accounts are the @handle, not the display name. */
export const accountRef = (video: AccountVideo): AccountRef => {
  let handle: string | null = null;
  try {
    const parsed = new URL(video.url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const at = parts.find((part) => part.startsWith("@") && part.length > 1);
      handle = at ? decodeURIComponent(at.slice(1)) : null;
    } else if (host === "instagram.com" || host === "instagr.am" || host.endsWith(".instagram.com")) {
      const first = parts[0] ? decodeURIComponent(parts[0]) : "";
      if (first && !RESERVED_INSTAGRAM.has(first.toLowerCase())) handle = first;
    }
  } catch {
    handle = null;
  }
  if (!handle) return { key: `video:${video.id}`, handle: null };
  return { key: `${video.platform}:${handle.toLowerCase()}`, handle };
};
