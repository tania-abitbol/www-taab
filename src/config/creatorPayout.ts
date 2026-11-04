/** 30-day windows. 1 € per 1 000 views gained inside a window we actually measured. */

export const PAYOUT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const VIEWS_PER_EURO = 1000;

export type MonthCell = {
  /** Views gained between two snapshots that both fell in this month. */
  views: number;
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
  /** Last public total already used as the baseline for a later diff. */
  watermark: number | null;
  watermarkMonth: number | null;
  /** Measured gains only. Months with no entry were never measured. */
  months: Record<string, MonthCell>;
  /** Gain observed across a month boundary. Not assigned to a month. */
  unassignedViews: number;
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
  /** null when this month has no measurement. Never a stand-in zero. */
  views: number | null;
  euros: number | null;
};

export const eurosForViews = (views: number) => views / VIEWS_PER_EURO;

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

/**
 * The public page only exposes a lifetime total. The first snapshot records
 * that total and leaves every month unmeasured. A later snapshot adds only
 * the views gained since then, and only when both snapshots sit in the same
 * 30-day window. A gain that crosses a window is kept aside, not painted
 * onto the current month.
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
    months: {},
    unassignedViews: 0,
    updatedAt: null,
  };

  const next = fillIdentity(base, obs);
  if (obs.views == null) return next;
  next.views = obs.views;
  if (next.postedAt == null) return next;

  const current = monthIndex(next.postedAt, obs.fetchedAt);
  if (next.watermark == null) {
    next.watermark = obs.views;
    next.watermarkMonth = current;
    return next;
  }

  if (obs.views > next.watermark) {
    const delta = obs.views - next.watermark;
    if (next.watermarkMonth === current) {
      const key = String(current);
      const already = next.months[key]?.views ?? 0;
      next.months = { ...next.months, [key]: { views: already + delta } };
    } else {
      next.unassignedViews += delta;
    }
    next.watermark = obs.views;
    next.watermarkMonth = current;
  }

  return next;
};

export const elapsedMonthCount = (ledger: VideoLedger, now: number) =>
  ledger.postedAt == null ? 0 : monthIndex(ledger.postedAt, now);

export const monthRows = (ledger: VideoLedger, now: number): MonthRow[] => {
  const count = elapsedMonthCount(ledger, now);
  if (ledger.postedAt == null || count === 0) return [];
  const rows: MonthRow[] = [];
  for (let month = 1; month <= count; month += 1) {
    const cell = ledger.months[String(month)];
    const { start, end } = monthWindow(ledger.postedAt, month);
    rows.push({
      month,
      start,
      end,
      open: now >= start && now < end,
      views: cell ? cell.views : null,
      euros: cell ? eurosForViews(cell.views) : null,
    });
  }
  return rows;
};
