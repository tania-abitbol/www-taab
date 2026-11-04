import assert from "node:assert/strict";

const { applyObservation, monthIndex, monthRows, PAYOUT_WINDOW_MS } = await import(
  "../src/config/creatorPayout.ts"
);
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

let ledger = applyObservation(null, obs());
let rows = monthRows(ledger, ledger.updatedAt);
assert.equal(rows.length, 1);
assert.equal(rows[0].month, 1);
assert.equal(rows[0].views, 1000);
assert.equal(rows[0].euros, 1000);
assert.equal(rows[0].basis, "opening");
assert.equal(rows[0].open, true);

const at75 = postedAt + 75 * day;
assert.equal(monthIndex(postedAt, at75), 3);
ledger = applyObservation(null, obs({ views: 500, fetchedAt: at75 }));
rows = monthRows(ledger, at75);
assert.deepEqual(
  rows.map((row) => [row.month, row.views, row.euros, row.basis]),
  [
    [1, 0, 0, "unmeasured"],
    [2, 0, 0, "unmeasured"],
    [3, 500, 500, "opening"],
  ]
);

ledger = applyObservation(ledger, obs({ views: 540, fetchedAt: at75 + day }));
rows = monthRows(ledger, at75 + day);
assert.equal(rows[2].views, 540);
assert.equal(rows[2].basis, "opening");
assert.equal(rows[0].views, 0);

const atMonth4 = postedAt + 95 * day;
assert.equal(monthIndex(postedAt, atMonth4), 4);
ledger = applyObservation(ledger, obs({ views: 550, fetchedAt: atMonth4 }));
rows = monthRows(ledger, atMonth4);
assert.equal(rows[2].views, 540);
assert.equal(rows[3].views, 10);
assert.equal(rows[3].euros, 10);
assert.equal(rows[3].basis, "boundary");

assert.equal(PAYOUT_WINDOW_MS, 30 * day);
assert.equal(monthIndex(postedAt, postedAt + 29 * day), 1);
assert.equal(monthIndex(postedAt, postedAt + 30 * day), 2);

const igPosted = instagramShortcodePostedAt("C401dSkpAH8");
assert.equal(new Date(igPosted).toISOString().slice(0, 10), "2024-03-22");

const video = await fetchPublicVideo("https://www.tiktok.com/@zachking/video/6768504823336815877");
assert.equal(video.platform, "tiktok");
assert.equal(video.author, "Zach King");
assert.equal(video.views, 2400000000);
assert.ok(video.likes > 0);
assert.ok(video.comments > 0);
assert.equal(video.dateSource, "page");
assert.equal(new Date(video.postedAt).toISOString().slice(0, 10), "2019-12-09");
const live = applyObservation(null, { ...video, fetchedAt: Date.parse("2026-11-04T16:10:00Z") });
const liveRows = monthRows(live, Date.parse("2026-11-04T16:10:00Z"));
const open = liveRows.find((row) => row.open);
assert.equal(liveRows[0].views, 0);
assert.equal(liveRows[0].basis, "unmeasured");
assert.equal(open.basis, "opening");
assert.equal(open.views, 2400000000);
assert.equal(open.euros, 2400000000);
console.log(
  JSON.stringify({
    months: liveRows.length,
    openMonth: open.month,
    openViews: open.views,
    openEuros: open.euros,
    earlierZero: liveRows.filter((row) => row.basis === "unmeasured").length,
    likes: video.likes,
    comments: video.comments,
    shares: video.shares,
    saves: video.saves,
    postedAt: new Date(video.postedAt).toISOString(),
  })
);
