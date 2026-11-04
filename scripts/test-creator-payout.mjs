import assert from "node:assert/strict";

const { applyObservation, eurosForViews, monthIndex, monthRows, PAYOUT_WINDOW_MS, VIEWS_PER_EURO } =
  await import("../src/config/creatorPayout.ts");
const { fetchPublicVideo, instagramShortcodePostedAt } = await import("../src/server/publicVideo.ts");

const day = 24 * 60 * 60 * 1000;
const postedAt = Date.parse("2026-01-01T00:00:00Z");

const obs = (over = {}) => ({
  id: "tiktok:1",
  url: "https://www.tiktok.com/@a/video/1",
  platform: "tiktok",
  author: "A",
  caption: null,
  postedAt,
  dateSource: "page",
  views: 1000,
  likes: 10,
  comments: 2,
  shares: null,
  saves: null,
  missing: [],
  fetchedAt: postedAt + 10 * day,
  ...over,
});

assert.equal(VIEWS_PER_EURO, 1000);
assert.equal(eurosForViews(594600), 594.6);
assert.equal(PAYOUT_WINDOW_MS, 30 * day);
assert.equal(monthIndex(postedAt, postedAt + 29 * day), 1);
assert.equal(monthIndex(postedAt, postedAt + 30 * day), 2);

let ledger = applyObservation(null, obs({ views: 594600 }));
let rows = monthRows(ledger, ledger.updatedAt);
assert.equal(rows.length, 1);
assert.equal(rows[0].views, null);
assert.equal(rows[0].euros, null);
assert.equal(ledger.views, 594600);
assert.equal(eurosForViews(ledger.views), 594.6);

const at75 = postedAt + 75 * day;
assert.equal(monthIndex(postedAt, at75), 3);
ledger = applyObservation(null, obs({ views: 500000, fetchedAt: at75 }));
rows = monthRows(ledger, at75);
assert.deepEqual(
  rows.map((row) => [row.month, row.views, row.euros]),
  [
    [1, null, null],
    [2, null, null],
    [3, null, null],
  ]
);

ledger = applyObservation(ledger, obs({ views: 501000, fetchedAt: at75 + day }));
rows = monthRows(ledger, at75 + day);
assert.equal(rows[0].views, null);
assert.equal(rows[1].views, null);
assert.equal(rows[2].views, 1000);
assert.equal(rows[2].euros, 1);
assert.equal(ledger.views, 501000);

const atMonth4 = postedAt + 95 * day;
ledger = applyObservation(ledger, obs({ views: 503000, fetchedAt: atMonth4 }));
rows = monthRows(ledger, atMonth4);
assert.equal(rows[2].views, 1000);
assert.equal(rows[3].views, null);
assert.equal(ledger.unassignedViews, 2000);
assert.equal(ledger.views, 503000);

assert.equal(new Date(instagramShortcodePostedAt("C401dSkpAH8")).toISOString().slice(0, 10), "2024-03-22");

const emilie = await fetchPublicVideo("https://www.tiktok.com/@emilielevira/video/7368509803095772449");
const now = Date.parse("2026-11-04T16:30:00Z");
const emilieLedger = applyObservation(null, { ...emilie, fetchedAt: now });
const emilieRows = monthRows(emilieLedger, now);
const open = emilieRows.find((row) => row.open);
assert.equal(emilie.author, "Emilie");
assert.ok(emilie.views > 500000);
assert.equal(emilie.dateSource, "page");
assert.equal(new Date(emilie.postedAt).toISOString().slice(0, 10), "2024-05-13");
assert.equal(open.month, 31);
assert.equal(open.views, null);
assert.ok(emilieRows.every((row) => row.views == null && row.euros == null));
assert.equal(emilieRows.length, 31);

const newer = await fetchPublicVideo(
  "https://www.tiktok.com/@eg.mountain.services/video/7700822762402680095"
);
const newerLedger = applyObservation(null, { ...newer, fetchedAt: now });
const newerRows = monthRows(newerLedger, now);
assert.ok(newer.views != null && newer.views > 0);
assert.equal(newerRows.length, 1);
assert.equal(newerRows[0].month, 1);
assert.equal(newerRows[0].views, null);
assert.equal(newerRows[0].euros, null);

console.log(
  JSON.stringify({
    emilie: {
      views: emilie.views,
      likes: emilie.likes,
      comments: emilie.comments,
      shares: emilie.shares,
      saves: emilie.saves,
      euros: eurosForViews(emilie.views),
      months: emilieRows.length,
      openMonth: open.month,
      measuredMonths: emilieRows.filter((row) => row.views != null).length,
      postedAt: new Date(emilie.postedAt).toISOString(),
    },
    newer: {
      author: newer.author,
      views: newer.views,
      likes: newer.likes,
      months: newerRows.length,
      postedAt: new Date(newer.postedAt).toISOString(),
      measured: newerRows.filter((row) => row.views != null).length,
    },
  })
);
