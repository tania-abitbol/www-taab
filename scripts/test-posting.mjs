import assert from "node:assert/strict";

const {
  CALENDAR_START,
  CALENDAR_END,
  DAY_PLANS,
  checksFor,
  dayReady,
  emptyDayState,
  othersValidated,
  slideshowSplit,
} = await import("../src/config/posting.ts");

assert.equal(CALENDAR_START, "2026-11-05");
assert.equal(CALENDAR_END, "2026-11-15");
assert.equal(DAY_PLANS[0].date, "2026-11-06");
assert.equal(DAY_PLANS[0].kind, "warmup");
assert.equal(DAY_PLANS[2].kind, "warmup-profile");
assert.equal(DAY_PLANS[3].kind, "slideshow");
assert.equal(DAY_PLANS[4].kind, "two-publish");
assert.equal(DAY_PLANS[6].date, "2026-11-12");
assert.equal(DAY_PLANS.at(-1).date, "2026-11-15");
assert.equal(DAY_PLANS.at(-1).repeatsDay7, true);

const day1 = checksFor(DAY_PLANS[0], emptyDayState(), 1);
assert.ok(day1.some((item) => item.label === "20 min · Compte 1"));
assert.ok(day1.some((item) => item.label === "20 min · Compte 2"));
assert.ok(day1.some((item) => item.label === "20 min · Compte 3"));
assert.equal(day1.some((item) => /lien/i.test(item.label)), false);

const profile = checksFor(DAY_PLANS[2], emptyDayState(), 1);
assert.ok(profile.some((item) => item.label.includes("Pas générée par IA")));
assert.ok(profile.some((item) => item.label.includes("Bio dans ta langue")));

assert.deepEqual(slideshowSplit(1), { remaining: 40, each: 20 });
assert.deepEqual(slideshowSplit(0), { remaining: 0, each: 0 });
const slide = checksFor(DAY_PLANS[3], { ...emptyDayState(), slideshowAccount: "es-1" }, 1);
assert.ok(slide.some((item) => item.label === "10 min d'échauffement avant la publication"));
assert.ok(slide.some((item) => item.label === "20 min d'échauffement · Compte 2"));
assert.ok(slide.some((item) => item.label === "20 min d'échauffement · Compte 3"));

const two = checksFor(DAY_PLANS[4], { ...emptyDayState(), publishers: ["es-1", "es-3"] }, 1);
assert.deepEqual(
  two.map((item) => item.label),
  ["Publier · Compte 1", "Publier · Compte 3", "Échauffement seulement · Compte 2"]
);
assert.equal(checksFor(DAY_PLANS[6], emptyDayState(), 0).length, 3);

const state = emptyDayState();
state.proofName = "session.mp4";
for (const check of day1) state.checks[check.id] = true;
assert.equal(dayReady(DAY_PLANS[0], state, 1), true);
state.proofName = null;
assert.equal(dayReady(DAY_PLANS[0], state, 1), false);

const desk = {
  people: [
    { id: "p1", name: "A" },
    { id: "p2", name: "B" },
  ],
  weekValidated: { p1: true },
};
assert.equal(othersValidated(desk), false);
desk.weekValidated.p2 = true;
assert.equal(othersValidated(desk), true);
console.log("posting plan ok");
