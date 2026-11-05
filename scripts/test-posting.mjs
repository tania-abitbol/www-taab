import assert from "node:assert/strict";

const {
  ACCOUNTS,
  DAY_PLANS,
  FRIDAY_ACCOUNT_MINUTES,
  FRIDAY_CONNECT_MINUTES,
  PROFILES,
  SATURDAY_ACCOUNT_MINUTES,
  accountRole,
  checksFor,
  dayReady,
  emptyDayState,
  formatMinutes,
} = await import("../src/config/posting.ts");
const { createSessionValue, readSession, roleForCode, verifySession } = await import("../src/server/dashboardSession.ts");

assert.equal(roleForCode("2580"), "tania");
assert.equal(roleForCode("1111"), "p1");
assert.equal(roleForCode("2222"), "p2");
assert.equal(roleForCode("3333"), "p3");
assert.equal(roleForCode("0000"), null);
assert.deepEqual(
  PROFILES.map((person) => person.name),
  ["Profil 1", "Profil 2", "Profil 3"]
);

const tania = createSessionValue("tania", 1_000);
const worker = createSessionValue("p1", 1_000);
assert.equal(verifySession(tania, 1_000), true);
assert.equal(verifySession(worker, 1_000), false);
assert.equal(readSession(worker, 1_000)?.role, "p1");

assert.equal(FRIDAY_CONNECT_MINUTES, 10);
assert.equal(formatMinutes(FRIDAY_ACCOUNT_MINUTES), "16 min 40");
assert.equal(formatMinutes(SATURDAY_ACCOUNT_MINUTES), "20 min");
assert.equal(FRIDAY_CONNECT_MINUTES + FRIDAY_ACCOUNT_MINUTES * 3, 60);

const friday = checksFor(DAY_PLANS[0]);
assert.equal(friday[0].label, "10 min · Se connecter au compte reçu");
assert.equal(friday.filter((item) => item.label.startsWith("16 min 40")).length, 3);
assert.ok(friday[1].label.includes("s'abonner à des gens intéressants"));
assert.equal(friday.some((item) => /lien tiktok/i.test(item.label)), false);

const saturday = checksFor(DAY_PLANS[1]);
assert.equal(saturday.length, 3);
assert.ok(saturday.every((item) => item.label.startsWith("20 min")));
assert.equal(saturday.some((item) => item.id === "connect"), false);

const sunday = checksFor(DAY_PLANS[2]);
assert.ok(sunday.some((item) => item.id === "connect"));
assert.ok(sunday.some((item) => item.id === "photo-fr"));

assert.equal(accountRole(DAY_PLANS[3], "fr"), "publie");
assert.equal(accountRole(DAY_PLANS[3], "es"), "échauffement");
assert.deepEqual(
  DAY_PLANS[4].publishers,
  ["fr", "es"]
);
assert.deepEqual(DAY_PLANS[5].publishers, ["es", "us"]);
assert.equal(DAY_PLANS.find((plan) => plan.date === "2026-11-15")?.publishers.length, 3);

const state = emptyDayState();
state.proofName = "session.mp4";
for (const check of friday) state.checks[check.id] = true;
assert.equal(dayReady(DAY_PLANS[0], state), true);
state.proofName = null;
assert.equal(dayReady(DAY_PLANS[0], state), false);
assert.equal(ACCOUNTS.map((account) => account.name).join(","), "FR,ES,US");
console.log("posting codes ok");
