/** 30-day payout windows. 1 € per view gained while that window is open. */

export const PAYOUT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const EUROS_PER_VIEW = 1;

export type MonthBasis = "unmeasured" | "opening" | "delta" | "boundary";

export type MonthCell = {
  views: number;
  basis: MonthBasis;
};

export type VideoLedger = {
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
  missing: string[];
  /** Highest view count already assigned, so a later dip is not counted twice. */
  watermark: number | null;
  watermarkMonth: number | null;
  /** True once an opening dump has been placed on the then-current month. */
  openingPlaced: boolean;
  months: Record<string, MonthCell>;
  updatedAt: number | null;
};

export type VideoObservation = {
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
  missing: string[];
  fetchedAt: number;
};

export type MonthRow = {
  month: number;
  start: number;
  end: number;
  open: boolean;
  views: number;
  euros: number;
  basis: MonthBasis;
};

/** Month 1 is days 0–29 after the post, month 2 is days 30–59, and so on. */
export const monthIndex = (postedAt: number, at: number) => {
  const elapsed = at - postedAt;
  if (elapsed < 0) return 1;
  return Math.floor(elapsed / PAYOUT_WINDOW_MS) + 1;
};

export const monthWindow = (postedAt: number, month: number) => {
  const start = postedAt + (month - 1) * PAYOUT_WINDOW_MS;
  return { start, end: start + PAYOUT_WINDOW_MS };
};

const fillIdentity = (base: VideoLedger, obs: VideoObservation): VideoLedger => ({
  ...base,
  url: obs.url,
  author: obs.author ?? base.author,
  caption: obs.caption ?? base.caption,
  postedAt: base.postedAt ?? obs.postedAt,
  dateSource: base.dateSource ?? obs.dateSource,
  likes: obs.likes ?? base.likes,
  comments: obs.comments ?? base.comments,
  shares: obs.shares ?? base.shares,
  saves: obs.saves ?? base.saves,
  missing: obs.missing,
  updatedAt: obs.fetchedAt,
});

const ensureUnmeasured = (months: Record<string, MonthCell>, through: number) => {
  for (let month = 1; month < through; month += 1) {
    const key = String(month);
    if (!months[key]) months[key] = { views: 0, basis: "unmeasured" };
  }
};

/**
 * First observation: the public total cannot be split across past months, so it
 * lands on the month that is open now. Earlier months stay at 0.
 * Later observations add only the views gained since the previous watermark.
 * A gain that crosses a month boundary cannot be split, so it lands on the
 * month open at the new observation.
 */
export const applyObservation = (
  previous: VideoLedger | null,
  obs: VideoObservation
): VideoLedger => {
  const base: VideoLedger = previous ?? {
    id: obs.id,
    url: obs.url,
    platform: obs.platform,
    author: null,
    caption: null,
    postedAt: null,
    dateSource: null,
    views: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    missing: [],
    watermark: null,
    watermarkMonth: null,
    openingPlaced: false,
    months: {},
    updatedAt: null,
  };

  const next = fillIdentity(base, obs);
  if (obs.views == null || next.postedAt == null) {
    if (obs.views != null) next.views = obs.views;
    return next;
  }

  const current = monthIndex(next.postedAt, obs.fetchedAt);
  const months = { ...next.months };
  ensureUnmeasured(months, current);

  if (!next.openingPlaced || next.watermark == null) {
    months[String(current)] = { views: obs.views, basis: "opening" };
    next.openingPlaced = true;
    next.watermark = obs.views;
    next.watermarkMonth = current;
  } else if (obs.views > next.watermark) {
    const delta = obs.views - next.watermark;
    const key = String(current);
    const cell = months[key] ?? { views: 0, basis: "unmeasured" };
    const crossed = next.watermarkMonth != null && next.watermarkMonth !== current;
    months[key] = {
      views: cell.views + delta,
      basis: crossed ? "boundary" : cell.basis === "opening" ? "opening" : "delta",
    };
    next.watermark = obs.views;
    next.watermarkMonth = current;
  }

  next.months = months;
  next.views = obs.views;
  return next;
};

export const monthRows = (ledger: VideoLedger, now: number): MonthRow[] => {
  if (ledger.postedAt == null) return [];
  const count = monthIndex(ledger.postedAt, now);
  const rows: MonthRow[] = [];
  for (let month = 1; month <= count; month += 1) {
    const cell = ledger.months[String(month)] ?? { views: 0, basis: "unmeasured" as const };
    const { start, end } = monthWindow(ledger.postedAt, month);
    rows.push({
      month,
      start,
      end,
      open: now >= start && now < end,
      views: cell.views,
      euros: cell.views * EUROS_PER_VIEW,
      basis: cell.basis,
    });
  }
  return rows;
};
