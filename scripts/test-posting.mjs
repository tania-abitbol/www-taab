import assert from "node:assert/strict";

const {
  POSTING_START,
  dayProgress,
  diffDays,
  durationLabel,
  groupVideos,
  isTikTokLink,
  phaseFor,
  weekOf,
} = await import("../src/config/posting.ts");

assert.equal(POSTING_START, "2026-11-06");
assert.equal(diffDays("2026-11-06", "2026-11-05"), -1);
assert.equal(phaseFor("2026-11-05").label, "Avant J1");
assert.equal(phaseFor("2026-11-06").label, "J1");
assert.equal(phaseFor("2026-11-07").label, "J2");
assert.equal(phaseFor("2026-11-08").label, "J3");
assert.equal(phaseFor("2026-11-09").label, "Routine");
assert.equal(durationLabel(phaseFor("2026-11-06")), "40 min");
assert.equal(durationLabel(phaseFor("2026-11-08")), "40 min");
assert.equal(durationLabel(phaseFor("2026-11-09")), "1 h");

const week = weekOf("2026-11-06");
assert.deepEqual(week, [
  "2026-11-02",
  "2026-11-03",
  "2026-11-04",
  "2026-11-05",
  "2026-11-06",
  "2026-11-07",
  "2026-11-08",
]);

const accounts = [
  { id: "es-1", name: "Compte 1" },
  { id: "es-2", name: "Compte 2" },
  { id: "es-3", name: "Compte 3" },
];
const open = dayProgress(undefined, accounts);
assert.equal(open.done, false);
assert.equal(open.links, 0);
assert.equal(isTikTokLink("https://vm.tiktok.com/Zabc/"), true);
assert.equal(isTikTokLink("https://example.com/a"), false);

const done = dayProgress(
  {
    slot: "18-19",
    proofName: "session.mp4",
    tasks: {
      "es-1": { browsed: true, engaged: true, published: true, link: "https://www.tiktok.com/@a/video/1" },
      "es-2": { browsed: true, engaged: false, published: true, link: "https://www.tiktok.com/@b/video/2" },
      "es-3": { browsed: false, engaged: false, published: true, link: "https://www.tiktok.com/@c/video/3" },
    },
  },
  accounts
);
assert.equal(done.done, true);
assert.equal(done.links, 3);
assert.equal(done.proof, true);

const missingSlot = dayProgress(
  {
    slot: null,
    proofName: null,
    tasks: done.tasks ? {} : {},
  },
  accounts
);
assert.equal(missingSlot.done, false);

const groups = groupVideos(
  [
    {
      id: "1",
      accountId: "es-2",
      date: "2026-11-07",
      caption: "b",
      hashtags: "#b",
      sourceUrl: "",
      fileName: null,
      createdAt: 2,
    },
    {
      id: "2",
      accountId: "es-1",
      date: "2026-11-06",
      caption: "a",
      hashtags: "#a",
      sourceUrl: "https://example.com/a.mp4",
      fileName: "a.mp4",
      createdAt: 1,
    },
  ],
  accounts
);
assert.equal(groups[0].date, "2026-11-06");
assert.equal(groups[0].rows[0].account.id, "es-1");
assert.equal(groups[1].rows[0].account.id, "es-2");
console.log("posting rules ok");
