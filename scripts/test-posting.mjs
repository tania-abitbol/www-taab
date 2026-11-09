import assert from "node:assert/strict";

const {
  ACCOUNTS,
  CATCHUP_DATES,
  DAY_PLANS,
  FRIDAY_CREATE_MINUTES,
  FRIDAY_WARM_MINUTES,
  ACCOUNT_BLOCK_MINUTES,
  PROFILE_SETUP_MINUTES,
  PROFILE_WARM_MINUTES,
  PROFILES,
  SATURDAY_ACCOUNT_MINUTES,
  SUNDAY_WARM_MINUTES,
  accountRole,
  checksFor,
  chooseSlot,
  dayReady,
  emptyDayState,
  formatMinutes,
  langFromName,
  WORKER_VISIBLE_THROUGH,
  openDates,
  openPlans,
  suiviDates,
  postingUi,
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

assert.equal(FRIDAY_CREATE_MINUTES, 30);
assert.equal(formatMinutes(FRIDAY_WARM_MINUTES), "10 min");
assert.equal(formatMinutes(SATURDAY_ACCOUNT_MINUTES), "20 min");
assert.equal(FRIDAY_CREATE_MINUTES + FRIDAY_WARM_MINUTES * 3, 60);
assert.ok(FRIDAY_CREATE_MINUTES + FRIDAY_WARM_MINUTES * 3 <= 60);

const friday = checksFor(DAY_PLANS[0]);
assert.ok(friday[0].label.startsWith("30 min"));
assert.ok(friday[0].label.includes("part de zéro"));
assert.equal(friday[1].parent, "create");
assert.equal(friday[2].parent, "create");
assert.ok(friday[1].label.includes("Nom d'utilisateur"));
assert.ok(friday[1].label.includes("prénom courant de fille"));
assert.ok(friday[1].label.includes("pays où tu postes"));
assert.ok(friday[1].label.includes("mes applications"));
assert.ok(friday[2].label.includes("ni photo de profil ni bio"));
assert.ok(friday[2].label.includes("Tu crées seulement les comptes"));
assert.ok(friday[0].label.includes("numéro de téléphone de ton pays"));
assert.ok(friday[0].label.includes("Je ne le reprendrai jamais"));
assert.ok(friday[0].label.includes("supprimer les comptes sans souci"));
assert.ok(friday[0].label.includes("Tu n'enregistres pas cette partie"));
assert.ok(friday[0].label.includes("mots de passe"));
assert.ok(postingUi("fr").proofScroll.includes("30 minutes"));
assert.equal(friday[3].label.startsWith("10 min · Compte 1"), true);
assert.equal(friday[4].label.startsWith("10 min · Compte 2"), true);
assert.equal(friday[5].label.startsWith("10 min · Compte 3"), true);
assert.ok(friday[3].label.includes("comme si c'était ton TikTok"));
assert.ok(friday[3].label.includes("Tu n'aimes pas tout"));
assert.ok(friday[3].label.includes("seulement quand ça te plaît vraiment"));
assert.ok(friday[3].label.includes("Tu ne postes rien"));
assert.equal(friday.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
assert.equal(friday.some((item) => item.label.includes("16 min 40")), false);
assert.equal(friday.some((item) => /lien tiktok/i.test(item.label)), false);

const saturday = checksFor(DAY_PLANS[1]);
assert.equal(saturday.length, 3);
assert.ok(saturday.every((item) => item.label.startsWith("20 min")));
assert.deepEqual(
  saturday.map((item) => item.label.slice(0, 18)),
  ["20 min · Compte 1.", "20 min · Compte 2.", "20 min · Compte 3."]
);
assert.equal(saturday.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
assert.ok(saturday[0].label.includes("Passe un bon moment"));
assert.ok(saturday[0].label.includes("Tu ne postes rien"));
assert.equal(saturday.some((item) => item.id === "connect"), false);
assert.equal(saturday.some((item) => /whatsapp/i.test(item.label)), false);

const sunday = checksFor(DAY_PLANS[2]);
assert.equal(sunday.some((item) => item.id === "connect"), false);
assert.equal(sunday.some((item) => /whatsapp|Se connecter|photo de profil|Appuie sur Publier/i.test(item.label)), false);
assert.equal(sunday.length, 3);
assert.ok(sunday.every((item) => item.label.startsWith("20 min")));
assert.ok(sunday[0].label.includes("Tu ne postes pas aujourd'hui"));
assert.equal(SUNDAY_WARM_MINUTES * 3, 60);
assert.equal(sunday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);

const timedMinutes = (checks) =>
  checks.filter((item) => !item.parent).reduce((sum, item) => sum + Number(item.label.split(" ")[0]), 0);

const monday = checksFor(DAY_PLANS[3]);
assert.equal(monday[0].label.startsWith("10 min · Compte 1. Écris une bio"), true);
assert.equal(monday[1].parent, "profile-fr");
assert.equal(monday[2].parent, "profile-fr");
assert.ok(monday[1].label.includes("Pinterest"));
assert.ok(monday[1].label.includes("Pas d'image générée par IA"));
assert.ok(monday[2].label.includes("écrite par toi"));
assert.ok(monday[2].label.includes("ne parle pas des applications"));
assert.ok(monday[2].label.includes("Pas de texte généré par IA"));
assert.ok(monday[3].label.startsWith("10 min · Compte 1"));
assert.ok(monday[3].label.includes("Ensuite"));
assert.ok(monday[3].label.includes("Tu ne postes rien"));
assert.ok(monday[4].label.startsWith("20 min · Compte 2"));
assert.ok(monday[4].label.includes("Tu ne postes pas aujourd'hui"));
assert.ok(monday[5].label.startsWith("20 min · Compte 3"));
assert.equal(timedMinutes(monday), 60);
assert.equal(monday.some((item) => /échauffement|Appuie sur Publier/i.test(item.label)), false);
assert.equal(monday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);
assert.equal(PROFILE_SETUP_MINUTES + PROFILE_WARM_MINUTES + ACCOUNT_BLOCK_MINUTES * 2, 60);

assert.equal(accountRole(DAY_PLANS[3], "fr"), "échauffement");
assert.equal(accountRole(DAY_PLANS[3], "es"), "échauffement");
const tuesday = checksFor(DAY_PLANS[4]);
assert.ok(tuesday[0].label.startsWith("20 min · Compte 1"));
assert.ok(tuesday[0].label.includes("diaporama du jour"));
assert.ok(tuesday[0].label.includes("tu le télécharges"));
assert.ok(tuesday[0].label.includes("Appuie sur Publier"));
assert.ok(tuesday[1].label.startsWith("20 min · Compte 2"));
assert.ok(tuesday[1].label.includes("Tu ne postes pas aujourd'hui"));
assert.ok(tuesday[2].label.startsWith("20 min · Compte 3"));
assert.equal(tuesday.filter((item) => item.label.includes("Appuie sur Publier")).length, 1);
assert.equal(timedMinutes(tuesday), 60);
assert.equal(tuesday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);
assert.deepEqual(DAY_PLANS[2].publishers, []);
assert.deepEqual(DAY_PLANS[3].publishers, []);
assert.deepEqual(DAY_PLANS[4].publishers, ["fr"]);
assert.deepEqual(DAY_PLANS[5].publishers, ["fr"]);
assert.deepEqual(DAY_PLANS[6].publishers, ["fr", "es"]);
assert.deepEqual(DAY_PLANS[7].publishers, ["fr", "es"]);
assert.deepEqual(DAY_PLANS[8].publishers, ["fr", "es", "us"]);
assert.deepEqual(DAY_PLANS[9].publishers, ["fr", "es", "us"]);
assert.equal(DAY_PLANS[9].date, "2026-11-15");
assert.equal(DAY_PLANS.slice(3).every((plan) => plan.repeatsDay7 === false), true);
const wednesday = checksFor(DAY_PLANS[5]);
assert.ok(wednesday[0].label.startsWith("10 min · Compte 2. Écris une bio"));
assert.equal(wednesday[1].parent, "profile-es");
assert.ok(wednesday[3].label.startsWith("10 min · Compte 2"));
assert.ok(wednesday[4].label.startsWith("20 min · Compte 1"));
assert.ok(wednesday[4].label.includes("Appuie sur Publier"));
assert.ok(wednesday[5].label.startsWith("20 min · Compte 3"));
assert.ok(wednesday[5].label.includes("Tu ne postes pas aujourd'hui"));
assert.equal(timedMinutes(wednesday), 60);
assert.equal(wednesday.some((item) => /échauffement/i.test(item.label) || /\b(FR|ES|US)\b/.test(item.label)), false);
const thursday = checksFor(DAY_PLANS[6]);
const fridayNext = checksFor(DAY_PLANS[7]);
const saturdayNext = checksFor(DAY_PLANS[8]);
const sundayNext = checksFor(DAY_PLANS[9]);
assert.equal(thursday.filter((item) => item.label.includes("Appuie sur Publier")).length, 2);
assert.ok(thursday[2].label.startsWith("20 min · Compte 3"));
assert.ok(fridayNext[0].label.startsWith("10 min · Compte 3. Écris une bio"));
assert.equal(fridayNext.filter((item) => item.label.includes("Appuie sur Publier")).length, 2);
assert.equal(saturdayNext.filter((item) => item.label.includes("Appuie sur Publier")).length, 3);
assert.equal(sundayNext.map((item) => item.label).join("|"), saturdayNext.map((item) => item.label).join("|"));
assert.equal(timedMinutes(thursday) + timedMinutes(fridayNext) + timedMinutes(saturdayNext) + timedMinutes(sundayNext), 240);
for (const plan of DAY_PLANS.filter((item) => item.date >= "2026-11-09")) {
  for (const lang of ["fr", "es", "en"]) {
    const checks = checksFor(plan, lang);
    assert.equal(timedMinutes(checks), 60, `${plan.date} ${lang}`);
    assert.equal(checks.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
  }
}
assert.ok(checksFor(DAY_PLANS[3], "es")[1].label.includes("Pinterest"));
assert.ok(checksFor(DAY_PLANS[3], "es")[2].label.includes("aplicaciones"));
assert.ok(checksFor(DAY_PLANS[4], "es")[0].label.includes("lo descargas"));
assert.ok(checksFor(DAY_PLANS[3], "en")[1].label.includes("No AI-generated image"));
assert.ok(checksFor(DAY_PLANS[3], "en")[2].label.includes("does not mention the apps"));
assert.ok(checksFor(DAY_PLANS[4], "en")[0].label.includes("you download it"));
const saturdayOpen = openDates("2026-11-07");
assert.equal(saturdayOpen.includes("2026-11-06"), false);
assert.equal(saturdayOpen[0], "2026-11-07");
assert.equal(saturdayOpen[saturdayOpen.length - 1], "2026-11-15");
assert.equal(WORKER_VISIBLE_THROUGH, "2026-11-15");
assert.deepEqual(suiviDates("2026-11-08"), ["2026-11-06", "2026-11-07", "2026-11-08"]);
assert.deepEqual(CATCHUP_DATES, ["2026-11-06", "2026-11-07"]);
assert.equal(postingUi("fr").catchupFriday, "Vidéo du vendredi 6 novembre");
assert.ok(postingUi("fr").catchupBody.includes("10 Go"));
assert.ok(postingUi("fr").proofTooBig.includes("10 Go"));
assert.ok(postingUi("es").catchupBody.includes("10 GB"));
assert.ok(postingUi("es").proofTooBig.includes("10 GB"));
assert.ok(postingUi("en").catchupBody.includes("10 GB"));
assert.ok(postingUi("en").proofTooBig.includes("10 GB"));
assert.ok(postingUi("es").catchupSaturday.includes("sábado"));
assert.ok(postingUi("en").catchupTitle.includes("Videos"));
assert.equal(openPlans("2026-11-06").some((plan) => plan.date === "2026-11-15"), true);
assert.equal(openPlans("2026-11-09").some((plan) => plan.date < "2026-11-09"), false);
assert.equal(openPlans("2026-11-09")[0].date, "2026-11-09");
assert.equal(openPlans("2026-11-09").at(-1).date, "2026-11-15");
assert.deepEqual(suiviDates("2026-11-09"), ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"]);

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
assert.equal(langFromName("Ghada - FR"), "fr");
assert.equal(langFromName("Peches - ES"), "es");
assert.equal(langFromName("Karol - US"), "en");
assert.equal(langFromName("Profil 1"), "fr");
assert.ok(postingUi("fr").slotsHelp.includes("une seule heure"));
assert.ok(postingUi("es").slotsHelp.includes("una sola hora"));
assert.ok(postingUi("en").weekEdit.includes("still change"));
assert.ok(checksFor(DAY_PLANS[0], "es")[3].label.startsWith("10 min · Cuenta 1"));
assert.ok(checksFor(DAY_PLANS[0], "es")[0].label.includes("empieza de cero"));
assert.ok(checksFor(DAY_PLANS[0], "es")[1].label.includes("Nombre de usuario"));
assert.ok(checksFor(DAY_PLANS[0], "en")[1].label.includes("common girl's name"));
assert.ok(checksFor(DAY_PLANS[0], "en")[3].label.startsWith("10 min · Account 1"));
assert.ok(checksFor(DAY_PLANS[0], "en")[0].label.includes("starts from zero"));
assert.equal(checksFor(DAY_PLANS[0], "es").some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
assert.equal(checksFor(DAY_PLANS[3]).some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
const { PROOF_MAX_BYTES, PROOF_PART_BYTES, cleanDayWork, cleanProofFile, proofAllowed, proofFileName, proofObjectKey, proofPartCount, proofPartKey, proofWindow } = await import("../src/server/postingProofs.ts");
assert.equal(cleanDayWork({ slot: "19-20", checks: { create: true, nope: false }, validated: true, proofName: "a.mp4" })?.slot, "19-20");
assert.equal(cleanDayWork({ slot: "bad" })?.slot, null);
assert.equal(proofObjectKey("p1", "2026-11-08"), "file-p1-2026-11-08");
assert.equal(PROOF_MAX_BYTES, 10 * 1024 * 1024 * 1024);
assert.equal(proofAllowed("p1", "2026-11-08", PROOF_MAX_BYTES), true);
assert.equal(proofAllowed("p1", "2026-11-08", PROOF_MAX_BYTES + 1), false);
assert.equal(proofAllowed("tania", "2026-11-08", 10), false);
assert.equal(proofPartCount(1), 1);
assert.equal(proofPartCount(PROOF_PART_BYTES + 1), 2);
assert.equal(proofPartKey("p1", "2026-11-06", "abc12345", 0), "file-p1-2026-11-06-abc12345-p0");
assert.deepEqual(proofWindow(PROOF_PART_BYTES, 3, PROOF_PART_BYTES - 1, PROOF_PART_BYTES), { first: 0, last: 1 });
assert.equal(cleanProofFile({ name: "3 - Ambition.mp4", size: 10, parts: 1, partSize: PROOF_PART_BYTES, type: "video/mp4", generation: "abc12345" })?.name, "3 - Ambition.mp4");
assert.equal(cleanProofFile({ name: "a.mp4", size: 10, parts: 2, partSize: PROOF_PART_BYTES, type: "video/mp4", generation: "abc12345" }), null);
assert.equal(proofFileName("../secret.mp4"), "secret.mp4");
console.log("posting codes ok");
