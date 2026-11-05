import assert from "node:assert/strict";

const {
  ACCOUNTS,
  DAY_PLANS,
  FRIDAY_ACCOUNT_MINUTES,
  FRIDAY_CONNECT_MINUTES,
  PROFILES,
  SATURDAY_ACCOUNT_MINUTES,
  SUNDAY_BIO_MINUTES,
  SUNDAY_PHOTO_MINUTES,
  SUNDAY_WARM_MINUTES,
  accountRole,
  checksFor,
  chooseSlot,
  dayReady,
  emptyDayState,
  formatMinutes,
} = await import("../src/config/posting.ts");
const { createSessionValue, readSession, verifySession } = await import("../src/server/dashboardSession.ts");
const { DEFAULT_PROFILES, addProfile, deleteProfile, profileIdForCode, updateProfile } = await import(
  "../src/config/postingProfiles.ts"
);

assert.equal(profileIdForCode(DEFAULT_PROFILES, "1111"), "p1");
assert.equal(profileIdForCode(DEFAULT_PROFILES, "2222"), "p2");
assert.equal(profileIdForCode(DEFAULT_PROFILES, "3333"), "p3");
assert.equal(profileIdForCode(DEFAULT_PROFILES, "0000"), null);
const renamed = updateProfile(DEFAULT_PROFILES, "p1", "Léa", "4444");
assert.equal(renamed.ok, true);
assert.equal(renamed.ok && renamed.profiles[0].name, "Léa");
assert.equal(renamed.ok && profileIdForCode(renamed.profiles, "1111"), null);
assert.equal(updateProfile(DEFAULT_PROFILES, "p1", "Léa", "2580").ok, false);
const added = addProfile(DEFAULT_PROFILES, "Essai", "9999");
assert.equal(added.ok, true);
assert.equal(added.ok && added.profiles.length, 4);
const removed = deleteProfile(DEFAULT_PROFILES, "p3");
assert.equal(removed.ok && removed.profiles.some((profile) => profile.id === "p3"), false);
assert.deepEqual(
  PROFILES.map((person) => person.name),
  ["Profil 1", "Profil 2", "Profil 3"]
);

const tania = createSessionValue("tania", 1_000);
const worker = createSessionValue("p1", 1_000);
assert.equal(verifySession(tania, 1_000), true);
assert.equal(verifySession(worker, 1_000), false);
assert.equal(readSession(worker, 1_000)?.role, "p1");
assert.equal(readSession(createSessionValue("p-essai", 1_000), 1_000)?.role, "p-essai");

assert.equal(FRIDAY_CONNECT_MINUTES, 10);
assert.equal(formatMinutes(FRIDAY_ACCOUNT_MINUTES), "16 min");
assert.equal(formatMinutes(SATURDAY_ACCOUNT_MINUTES), "20 min");
assert.equal(FRIDAY_CONNECT_MINUTES + FRIDAY_ACCOUNT_MINUTES * 3, 58);
assert.ok(FRIDAY_CONNECT_MINUTES + FRIDAY_ACCOUNT_MINUTES * 3 <= 60);

const friday = checksFor(DAY_PLANS[0]);
assert.equal(friday[0].label, "10 min · Se connecter au compte reçu sur WhatsApp");
assert.equal(friday[1].label.startsWith("16 min · Compte 1"), true);
assert.equal(friday[2].label.startsWith("16 min · Compte 2"), true);
assert.equal(friday[3].label.startsWith("16 min · Compte 3"), true);
assert.equal(friday.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
assert.equal(friday.some((item) => item.label.includes("16 min 40")), false);
assert.ok(friday[1].label.includes("s'abonner à des gens intéressants"));
assert.equal(friday.some((item) => /lien tiktok/i.test(item.label)), false);

const saturday = checksFor(DAY_PLANS[1]);
assert.equal(saturday.length, 3);
assert.ok(saturday.every((item) => item.label.startsWith("20 min")));
assert.deepEqual(
  saturday.map((item) => item.label.split(" (")[0]),
  ["20 min · Compte 1", "20 min · Compte 2", "20 min · Compte 3"]
);
assert.equal(saturday.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
assert.equal(saturday.some((item) => item.id === "connect"), false);
assert.equal(saturday.some((item) => /whatsapp/i.test(item.label)), false);

const sunday = checksFor(DAY_PLANS[2]);
assert.equal(sunday.some((item) => item.id === "connect"), false);
assert.equal(sunday.some((item) => /whatsapp|Se connecter/i.test(item.label)), false);
assert.equal(sunday.filter((item) => item.id.startsWith("photo-")).length, 1);
assert.equal(sunday.filter((item) => item.id.startsWith("bio-")).length, 1);
assert.equal(sunday[0].label.startsWith("5 min · Photo de profil · Compte 1"), true);
assert.ok(sunday[0].label.includes("fille normale"));
assert.ok(sunday[0].label.includes("Pinterest"));
assert.ok(sunday[0].label.includes("pas de photo IA"));
assert.equal(sunday[1].label.startsWith("5 min · Bio · Compte 1"), true);
assert.ok(sunday[1].label.includes("gentille et sympathique"));
assert.deepEqual(
  sunday.slice(2).map((item) => item.label.split(" (")[0]),
  ["17 min · Compte 1", "17 min · Compte 2", "16 min · Compte 3"]
);
assert.equal(SUNDAY_PHOTO_MINUTES + SUNDAY_BIO_MINUTES + SUNDAY_WARM_MINUTES.reduce((sum, minutes) => sum + minutes, 0), 60);
assert.equal(sunday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);

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
assert.deepEqual(chooseSlot([], "17-18"), ["17-18"]);
assert.deepEqual(chooseSlot(["17-18"], "18-19"), ["18-19"]);
assert.deepEqual(chooseSlot(["17-18", "19-20"], "20-21"), ["20-21"]);
assert.deepEqual(chooseSlot(["18-19"], "18-19"), []);
assert.equal(ACCOUNTS.map((account) => account.name).join(","), "FR,ES,US");
assert.equal(ACCOUNTS.map((account) => account.task).join(","), "Compte 1,Compte 2,Compte 3");
assert.equal(checksFor(DAY_PLANS[3]).some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
console.log("posting codes ok");
