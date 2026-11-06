import assert from "node:assert/strict";

const {
  ACCOUNTS,
  DAY_PLANS,
  FRIDAY_CREATE_MINUTES,
  FRIDAY_WARM_MINUTES,
  MONDAY_BIO_MINUTES,
  MONDAY_COMPTE2_MINUTES,
  MONDAY_COMPTE3_MINUTES,
  MONDAY_PHOTO_MINUTES,
  MONDAY_POST_MINUTES,
  MONDAY_WARM_AFTER,
  MONDAY_WARM_BEFORE,
  TUESDAY_COMPTE2_POST,
  TUESDAY_COMPTE2_PROFILE,
  TUESDAY_COMPTE2_WARM,
  TUESDAY_COMPTE2_WARM_AFTER,
  TUESDAY_COMPTE3_MINUTES,
  TUESDAY_POST_MINUTES,
  TUESDAY_WARM_AFTER,
  TUESDAY_WARM_BEFORE,
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

const monday = checksFor(DAY_PLANS[3]);
assert.equal(monday[0].label.startsWith("5 min · Mettre une photo de profil au Compte 1"), true);
assert.ok(monday[0].label.includes("pas de photo IA"));
assert.equal(monday[1].label.startsWith("5 min · Mettre une bio au Compte 1"), true);
assert.ok(monday[1].label.includes("bio courte"));
assert.ok(monday[2].label.startsWith("8 min · Compte 1"));
assert.ok(monday[2].label.includes("Avant de poster"));
assert.ok(monday[3].label.includes("Appuie sur Publier"));
assert.ok(monday[4].label.includes("Juste après avoir posté"));
assert.ok(monday[5].label.startsWith("14 min · Compte 2"));
assert.ok(monday[5].label.includes("Tu ne postes pas"));
assert.ok(monday[6].label.startsWith("15 min · Compte 3"));
assert.equal(monday.some((item) => /échauffement/i.test(item.label)), false);
assert.ok(monday[2].label.includes("Ça doit rester naturel"));
assert.ok(monday[2].label.includes("tu ne regardes pas chaque vidéo jusqu'au bout"));
assert.equal(
  MONDAY_PHOTO_MINUTES +
    MONDAY_BIO_MINUTES +
    MONDAY_WARM_BEFORE +
    MONDAY_POST_MINUTES +
    MONDAY_WARM_AFTER +
    MONDAY_COMPTE2_MINUTES +
    MONDAY_COMPTE3_MINUTES,
  60
);
assert.equal(monday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);

assert.equal(accountRole(DAY_PLANS[3], "fr"), "publie");
assert.equal(accountRole(DAY_PLANS[3], "es"), "échauffement");
const tuesday = checksFor(DAY_PLANS[4]);
assert.ok(tuesday[0].label.startsWith("8 min · Compte 1"));
assert.ok(tuesday[1].label.includes("Appuie sur Publier"));
assert.ok(tuesday[2].label.includes("Juste après avoir posté"));
assert.ok(tuesday[3].label.startsWith("5 min · Compte 2"));
assert.ok(tuesday[3].label.includes("Avant de poster"));
assert.ok(tuesday[4].label.includes("Change la photo et la bio"));
assert.ok(tuesday[5].label.includes("Appuie sur Publier"));
assert.ok(tuesday[6].label.includes("Juste après avoir posté"));
assert.ok(tuesday[7].label.startsWith("19 min · Compte 3"));
assert.ok(tuesday[7].label.includes("Tu ne postes pas"));
assert.ok(tuesday[4].label.includes("gentille et sympathique"));
assert.ok(tuesday[4].label.includes("fille normale"));
assert.ok(tuesday[4].label.includes("Pinterest"));
assert.ok(tuesday[4].label.includes("pas de photo IA"));
assert.equal(tuesday.some((item) => /échauffement/i.test(item.label)), false);
assert.equal(
  TUESDAY_WARM_BEFORE +
    TUESDAY_POST_MINUTES +
    TUESDAY_WARM_AFTER +
    TUESDAY_COMPTE2_WARM +
    TUESDAY_COMPTE2_PROFILE +
    TUESDAY_COMPTE2_POST +
    TUESDAY_COMPTE2_WARM_AFTER +
    TUESDAY_COMPTE3_MINUTES,
  60
);
assert.equal(tuesday.filter((item) => item.label.includes("Appuie sur Publier")).length, 2);
assert.equal(tuesday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);
assert.deepEqual(DAY_PLANS[2].publishers, []);
assert.deepEqual(DAY_PLANS[3].publishers, ["fr"]);
assert.deepEqual(DAY_PLANS[4].publishers, ["fr", "es"]);
assert.deepEqual(DAY_PLANS[5].publishers, ["fr", "es"]);
assert.deepEqual(DAY_PLANS[6].publishers, ["fr", "es", "us"]);
assert.equal(DAY_PLANS[9].date, "2026-11-15");
assert.equal(DAY_PLANS[7].repeatsDay7 && DAY_PLANS[8].repeatsDay7 && DAY_PLANS[9].repeatsDay7, true);
const wednesday = checksFor(DAY_PLANS[5]);
assert.ok(wednesday[0].label.startsWith("8 min · Compte 1"));
assert.ok(wednesday[0].label.includes("Avant de poster"));
assert.ok(wednesday[1].label.includes("Appuie sur Publier"));
assert.ok(wednesday[4].label.includes("Appuie sur Publier"));
assert.ok(wednesday[6].label.startsWith("18 min · Compte 3"));
assert.ok(wednesday[6].label.includes("Tu ne postes pas"));
assert.equal(wednesday.some((item) => /échauffement/i.test(item.label) || /\b(FR|ES|US)\b/.test(item.label)), false);
const thursday = checksFor(DAY_PLANS[6]);
const sundayNext = checksFor(DAY_PLANS[9]);
assert.equal(thursday.filter((item) => item.label.includes("Appuie sur Publier")).length, 3);
assert.equal(sundayNext.map((item) => item.label).join("|"), thursday.map((item) => item.label).join("|"));
assert.equal(thursday.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
const saturdayOpen = openDates("2026-11-07");
assert.equal(saturdayOpen.includes("2026-11-06"), false);
assert.equal(saturdayOpen[0], "2026-11-07");
assert.equal(saturdayOpen[saturdayOpen.length - 1], "2026-11-15");
assert.equal(WORKER_VISIBLE_THROUGH, "2026-11-08");
assert.equal(openPlans("2026-11-06").some((plan) => plan.date === "2026-11-15"), true);
assert.equal(
  openPlans("2026-11-06").filter((plan) => plan.date <= WORKER_VISIBLE_THROUGH).some((plan) => plan.date > "2026-11-08"),
  false
);

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
console.log("posting codes ok");
