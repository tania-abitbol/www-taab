import assert from "node:assert/strict";

const {
  ACCOUNTS,
  CATCHUP_DATES,
  DAY_PLANS,
  FRIDAY_CREATE_MINUTES,
  FRIDAY_WARM_MINUTES,
  ACCOUNT_BLOCK_MINUTES,
  POST_PUBLISH_MINUTES,
  POST_WARM_AFTER_MINUTES,
  POST_WARM_BEFORE_MINUTES,
  PROFILE_SETUP_MINUTES,
  PROFILE_WARM_MINUTES,
  PROFILES,
  SATURDAY_ACCOUNT_MINUTES,
  SUNDAY_WARM_MINUTES,
  accountRole,
  checksFor,
  chooseSlot,
  dayIsValidated,
  dayReady,
  emptyDayState,
  formatMinutes,
  langFromName,
  calendarDate,
  missedProofDate,
  shiftIsoDate,
  timeZoneForGirl,
  workerVisiblePlans,
  WORKER_VISIBLE_THROUGH,
  openDates,
  openPlans,
  suiviDates,
  postingUi,
  showHoursVary,
  taskIsHers,
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
assert.equal(friday[0].minutes, 30);
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
assert.equal(friday[3].minutes, 10);
assert.equal(friday[4].minutes, 10);
assert.equal(friday[5].minutes, 10);
assert.ok(friday[3].label.startsWith("Compte 1"));
assert.ok(friday[4].label.startsWith("Compte 2"));
assert.ok(friday[5].label.startsWith("Compte 3"));
assert.ok(friday[3].label.includes("comme si c'était ton TikTok"));
assert.ok(friday[3].label.includes("Tu n'aimes pas tout"));
assert.ok(friday[3].label.includes("seulement quand ça te plaît vraiment"));
assert.ok(friday[3].label.includes("Tu ne postes rien"));
assert.equal(friday.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
assert.equal(friday.some((item) => item.label.includes("16 min 40")), false);
assert.equal(friday.some((item) => /lien tiktok/i.test(item.label)), false);

const saturday = checksFor(DAY_PLANS[1]);
assert.equal(saturday.length, 3);
assert.ok(saturday.every((item) => item.minutes === 20));
assert.deepEqual(
  saturday.map((item) => item.label.split("\n")[0]),
  ["Compte 1", "Compte 2", "Compte 3"]
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
assert.ok(sunday.every((item) => item.minutes === 20));
assert.ok(sunday[0].label.includes("Tu ne postes pas aujourd'hui"));
assert.equal(SUNDAY_WARM_MINUTES * 3, 60);
assert.equal(sunday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);

const timedMinutes = (checks) =>
  checks.filter((item) => !item.parent).reduce((sum, item) => sum + (item.minutes ?? 0), 0);

const monday = checksFor(DAY_PLANS[3]);
assert.equal(monday[0].minutes, 10);
assert.ok(monday[0].label.startsWith("Compte 1"));
assert.ok(monday[0].label.includes("Écris une bio"));
assert.equal(monday[1].parent, "profile-fr");
assert.equal(monday[2].parent, "profile-fr");
assert.ok(monday[1].label.includes("Pinterest"));
assert.ok(monday[1].label.includes("screen d'une fille sur Pinterest"));
assert.ok(monday[1].label.includes("que tu as déjà"));
assert.equal(monday[1].label.includes("qu'elles ont déjà"), false);
assert.ok(monday[1].label.includes("Pas d'image générée par IA"));
assert.ok(monday[2].label.includes("écrite par toi"));
assert.ok(monday[2].label.includes("ne parle pas des applications"));
assert.ok(monday[2].label.includes("Pas de texte généré par IA"));
assert.equal(monday[3].minutes, 10);
assert.ok(monday[3].label.startsWith("Compte 1"));
assert.ok(monday[3].label.includes("Ensuite"));
assert.ok(monday[3].label.includes("Tu ne postes rien"));
assert.equal(monday[4].minutes, 20);
assert.ok(monday[4].label.startsWith("Compte 2"));
assert.ok(monday[4].label.includes("Tu ne postes pas aujourd'hui"));
assert.equal(monday[5].minutes, 20);
assert.ok(monday[5].label.startsWith("Compte 3"));
assert.equal(monday.filter((item) => item.note).map((item) => item.id).join(","), "warm-fr,warm-es,warm-us");
assert.ok(monday.find((item) => item.id === "warm-fr").note.includes("abonne-toi un peu plus"));
assert.equal(monday.find((item) => item.id === "profile-fr").note, undefined);
assert.equal(checksFor(DAY_PLANS[4]).some((item) => item.note), false);
assert.ok(checksFor(DAY_PLANS[3], "es").find((item) => item.id === "warm-es").note.includes("un poco más"));
assert.ok(checksFor(DAY_PLANS[3], "en").find((item) => item.id === "warm-us").note.includes("a bit more"));
assert.equal(timedMinutes(monday), 60);
assert.equal(monday.some((item) => /échauffement|Appuie sur Publier/i.test(item.label)), false);
assert.equal(monday.some((item) => /\b(FR|ES|US)\b|16 min 40/.test(item.label)), false);
assert.equal(PROFILE_SETUP_MINUTES + PROFILE_WARM_MINUTES + ACCOUNT_BLOCK_MINUTES * 2, 60);

assert.equal(accountRole(DAY_PLANS[3], "fr"), "échauffement");
assert.equal(accountRole(DAY_PLANS[3], "es"), "échauffement");
assert.equal(POST_WARM_BEFORE_MINUTES + POST_PUBLISH_MINUTES + POST_WARM_AFTER_MINUTES, ACCOUNT_BLOCK_MINUTES);
const tuesday = checksFor(DAY_PLANS[4]);
assert.equal(tuesday[0].minutes, 8);
assert.ok(tuesday[0].label.startsWith("Compte 1"));
assert.ok(tuesday[0].label.includes("Échauffement précis."));
assert.ok(tuesday[0].label.includes("5 comptes d'influenceurs"));
assert.equal(tuesday[1].minutes, 5);
assert.ok(tuesday[1].label.includes("diaporama du jour"));
assert.ok(tuesday[1].label.includes("Tu le télécharges ici."));
assert.ok(tuesday[1].label.includes("musique TikTok du moment"));
assert.ok(tuesday[1].label.includes("Copie cette description."));
assert.ok(tuesday[1].label.includes("Appuie sur Publier"));
assert.equal(tuesday[2].minutes, 7);
assert.ok(tuesday[0].label.includes("comporte-toi normalement"));
assert.equal(tuesday[0].label.includes("commente au moins 5 vidéos"), false);
assert.ok(tuesday[2].label.includes("Retourne sur le Pour toi."));
assert.ok(tuesday[2].label.includes("Tu ne postes plus."));
assert.ok(tuesday[2].label.includes("Interagis de façon naturelle."));
assert.equal(tuesday[2].label.includes("20 abonnements"), false);
assert.equal(tuesday[2].label.includes("ouvre le profil"), false);
assert.equal(
  tuesday[2].goal,
  "Tu dois avoir 20 abonnements ou plus au total sur le compte. À la fin de la session de ce compte, montre-moi le profil pour valider qu'il y a bien 20 abonnements ou plus.",
);
assert.equal(tuesday[0].goal, undefined);
assert.equal(tuesday[1].goal, undefined);
assert.equal(tuesday[2].label.includes("Échauffement après"), false);
const tuesdayEs = checksFor(DAY_PLANS[4], "es");
assert.ok(tuesdayEs[0].label.includes("Calentamiento preciso."));
assert.ok(tuesdayEs[1].label.includes("Lo descargas aquí."));
assert.ok(tuesdayEs[1].label.includes("Copia esta descripción."));
assert.ok(tuesdayEs[0].label.includes("compórtate con normalidad"));
assert.equal(tuesdayEs[0].label.includes("comenta al menos 5 vídeos"), false);
assert.ok(tuesdayEs[2].label.includes("Interactúa con naturalidad."));
assert.equal(tuesdayEs[2].label.includes("20 seguidos"), false);
assert.equal(tuesdayEs[2].label.includes("abre el perfil"), false);
assert.equal(
  tuesdayEs[2].goal,
  "Tienes que tener 20 seguidos o más en total en la cuenta. Al final de la sesión de esta cuenta, muéstrame el perfil para comprobar que hay 20 seguidos o más.",
);
const tuesdayEn = checksFor(DAY_PLANS[4], "en");
assert.ok(tuesdayEn[0].label.includes("Precise warm-up."));
assert.ok(tuesdayEn[1].label.includes("Download it here."));
assert.ok(tuesdayEn[1].label.includes("Copy this caption."));
assert.ok(tuesdayEn[0].label.includes("act normally"));
assert.equal(tuesdayEn[0].label.includes("at least 5 videos"), false);
assert.ok(tuesdayEn[2].label.includes("Interact in a natural way."));
assert.equal(tuesdayEn[2].label.includes("20 or more follows"), false);
assert.equal(tuesdayEn[2].label.includes("open the profile"), false);
assert.equal(
  tuesdayEn[2].goal,
  "You need 20 or more follows in total on the account. At the end of this account's session, show me the profile to confirm there are 20 or more follows.",
);
assert.equal(checksFor(DAY_PLANS[5]).find((item) => item.id === "before-fr").label === tuesday[0].label, false);
assert.equal(checksFor(DAY_PLANS[5]).find((item) => item.id === "before-fr").label.includes("commente au moins 5 vidéos"), false);
assert.ok(checksFor(DAY_PLANS[5]).find((item) => item.id === "before-fr").label.includes("Va sur la page Pour toi."));
assert.equal((tuesday[0].label.match(/•/g) || []).length, 2);
assert.equal((checksFor(DAY_PLANS[5]).find((item) => item.id === "before-fr").label.match(/•/g) || []).length, 1);
assert.ok(checksFor(DAY_PLANS[5]).find((item) => item.id === "after-fr").label.includes("Échauffement après"));
assert.equal(checksFor(DAY_PLANS[5]).find((item) => item.id === "after-fr").label.includes("20 abonnements"), false);
assert.equal(tuesday[3].minutes, 10);
assert.ok(tuesday[3].label.startsWith("Compte 2"));
assert.ok(tuesday[3].label.includes("Écris une bio"));
assert.equal(tuesday[3].label.includes("Focus objectif."), false);
assert.equal(tuesday[4].id, "photo-es");
assert.equal(tuesday[4].label, monday.find((item) => item.id === "photo-fr").label);
assert.equal(tuesday[5].id, "bio-es");
assert.equal(tuesday[5].copyText, "conseils amitié & meilleures amies 🫶 toujours avec le jeu vérité ou vérité");
assert.ok(tuesday[5].label.includes(tuesday[5].copyText));
assert.equal(tuesday[5].label.includes("écrite par toi"), false);
assert.equal(monday.find((item) => item.id === "bio-fr").copyText, undefined);
assert.equal(tuesday[6].minutes, 10);
assert.ok(tuesday[6].label.startsWith("Compte 2"));
assert.ok(tuesday[6].label.includes("Reste dessus, comme si c'était ton TikTok."));
assert.ok(tuesday[6].label.includes("Tu ne postes rien."));
assert.equal(tuesday[6].label.includes("30 abonnements"), false);
assert.equal(tuesday[6].label.includes("25 abonnements"), false);
assert.equal(
  tuesday[6].goal,
  "Tu dois avoir 25 abonnements ou plus au total sur le compte. À la fin de la session de ce compte, montre-moi le profil pour valider qu'il y a bien 25 abonnements ou plus.",
);
assert.equal(tuesday[6].label.includes("Focus objectif."), false);
assert.equal(tuesday[6].label.includes("Ensuite"), false);
assert.equal(tuesday[0].label.includes("Focus objectif."), false);
assert.equal(tuesday[7].minutes, 20);
assert.ok(tuesday[7].label.startsWith("Compte 3"));
assert.equal(tuesday[7].label.includes("Focus objectif."), false);
assert.equal(tuesday[7].label.includes("30 abonnements"), false);
assert.equal(tuesday[7].label.includes("vraie personne"), false);
assert.equal(
  tuesday[7].goal,
  "Tu dois avoir 30 abonnements ou plus au total sur le compte. À la fin de la session de ce compte, montre-moi le profil pour valider qu'il y a bien 30 abonnements ou plus.",
);
assert.equal(tuesday[7].label.includes("Appuie sur Publier"), false);
assert.equal(tuesday.filter((item) => item.label.includes("Appuie sur Publier")).length, 1);
assert.equal(tuesday[0].label.includes("30 abonnements"), false);
assert.equal(checksFor(DAY_PLANS[5]).some((item) => item.label.includes("30 abonnements")), false);
assert.equal(tuesdayEs.find((item) => item.id === "photo-es").label, checksFor(DAY_PLANS[3], "es").find((item) => item.id === "photo-fr").label);
assert.equal(tuesdayEs.find((item) => item.id === "bio-es").copyText, "consejos de amistad 🫶 siempre con el juego verdad o verdad");
assert.equal(tuesdayEs.find((item) => item.id === "bio-es").label.includes("escrita por ti"), false);
assert.ok(tuesdayEs.find((item) => item.id === "warm-es").label.includes("Quédate, como si fuera tu TikTok."));
assert.equal(tuesdayEs.find((item) => item.id === "warm-es").label.includes("30 seguidos"), false);
assert.ok(tuesdayEs.find((item) => item.id === "warm-es").goal.includes("25 seguidos o más"));
assert.ok(tuesdayEs.find((item) => item.id === "warm-es").goal.includes("muéstrame el perfil"));
assert.ok(tuesdayEs.find((item) => item.id === "warm-es").label.includes("No publicas nada."));
assert.equal(tuesdayEs.find((item) => item.id === "warm-es").label.includes("Focus objetivo."), false);
assert.equal(tuesdayEs.find((item) => item.id === "warm-es").label.includes("Después"), false);
assert.equal(tuesdayEs.find((item) => item.id === "warm-es").label.includes("Hoy no publicas."), false);
assert.equal(tuesdayEs.find((item) => item.id === "warm-us").label.includes("Focus objetivo."), false);
assert.equal(tuesdayEs.find((item) => item.id === "warm-us").label.includes("30 seguidos"), false);
assert.equal(tuesdayEs.find((item) => item.id === "warm-us").label.includes("persona real"), false);
assert.ok(tuesdayEs.find((item) => item.id === "warm-us").goal.includes("30 seguidos o más"));
assert.ok(tuesdayEs.find((item) => item.id === "warm-us").goal.includes("muéstrame el perfil"));
assert.equal(tuesdayEs.find((item) => item.id === "warm-es").label.includes("Pulsa Publicar"), false);
assert.equal(tuesdayEn.find((item) => item.id === "photo-es").label, checksFor(DAY_PLANS[3], "en").find((item) => item.id === "photo-fr").label);
assert.equal(
  tuesdayEn.find((item) => item.id === "bio-es").copyText,
  "bestie advice & friendship tips 🫶 always with the truth or truth game",
);
assert.equal(tuesdayEn.find((item) => item.id === "bio-es").label.includes("written by you"), false);
assert.ok(checksFor(DAY_PLANS[7]).find((item) => item.id === "bio-us").label.includes("écrite par toi"));
assert.equal(checksFor(DAY_PLANS[7]).find((item) => item.id === "bio-us").copyText, undefined);
assert.ok(tuesdayEn.find((item) => item.id === "warm-es").label.includes("Stay on it, as if it were your TikTok."));
assert.equal(tuesdayEn.find((item) => item.id === "warm-es").label.includes("30"), false);
assert.ok(tuesdayEn.find((item) => item.id === "warm-es").goal.includes("25 or more follows"));
assert.ok(tuesdayEn.find((item) => item.id === "warm-es").goal.includes("show me the profile"));
assert.ok(tuesdayEn.find((item) => item.id === "warm-es").label.includes("You do not post anything."));
assert.equal(tuesdayEn.find((item) => item.id === "warm-es").label.includes("Focus: the goal."), false);
assert.equal(tuesdayEn.find((item) => item.id === "warm-es").label.includes("Then."), false);
assert.equal(tuesdayEn.find((item) => item.id === "warm-us").label.includes("Focus: the goal."), false);
assert.equal(tuesdayEn.find((item) => item.id === "warm-us").label.includes("You do not post today."), false);
assert.equal(tuesdayEn.find((item) => item.id === "warm-us").label.includes("real person"), false);
assert.equal(tuesdayEn.find((item) => item.id === "warm-us").label.includes("30"), false);
assert.ok(tuesdayEn.find((item) => item.id === "warm-us").goal.includes("30 or more follows"));
assert.ok(tuesdayEn.find((item) => item.id === "warm-us").goal.includes("show me the profile"));
assert.equal(tuesdayEn.find((item) => item.id === "warm-us").label.includes("Tap Post"), false);
assert.equal(timedMinutes(tuesday), 60);
assert.equal(tuesday.some((item) => /\b(FR|ES|US)\b|16 min 40|seconde/.test(item.label)), false);
assert.deepEqual(DAY_PLANS[2].publishers, []);
assert.deepEqual(DAY_PLANS[3].publishers, []);
assert.deepEqual(DAY_PLANS[4].publishers, ["fr"]);
assert.deepEqual(DAY_PLANS[5].publishers, ["fr", "es"]);
assert.deepEqual(DAY_PLANS[6].publishers, ["fr", "es"]);
assert.deepEqual(DAY_PLANS[7].publishers, ["fr", "es"]);
assert.deepEqual(DAY_PLANS[8].publishers, ["fr", "es", "us"]);
assert.deepEqual(DAY_PLANS[9].publishers, ["fr", "es", "us"]);
assert.equal(DAY_PLANS[9].date, "2026-11-15");
assert.equal(DAY_PLANS.slice(3).every((plan) => plan.repeatsDay7 === false), true);
const wednesday = checksFor(DAY_PLANS[5]);
assert.equal(wednesday[0].minutes, 8);
assert.ok(wednesday[0].label.startsWith("Compte 1"));
assert.equal(wednesday[1].minutes, 5);
assert.ok(wednesday[1].label.includes("Appuie sur Publier"));
assert.equal(wednesday[2].minutes, 7);
assert.equal(wednesday[3].minutes, 8);
assert.ok(wednesday[3].label.startsWith("Compte 2"));
assert.ok(wednesday[3].label.includes("Échauffement précis."));
assert.equal(wednesday[3].label.includes("5 comptes d'influenceurs"), false);
assert.ok(wednesday[3].label.includes("Va sur la page Pour toi."));
assert.equal((wednesday[3].label.match(/•/g) || []).length, 1);
assert.equal(wednesday[3].label.includes("Écris une bio"), false);
assert.equal(wednesday[3].label.includes("40 abonnements"), false);
assert.equal(wednesday[4].minutes, 5);
assert.ok(wednesday[4].label.includes("Tu le télécharges ici."));
assert.ok(wednesday[4].label.includes("musique TikTok du moment"));
assert.ok(wednesday[4].label.includes("Copie cette description."));
assert.ok(wednesday[4].label.includes("Appuie sur Publier"));
assert.equal(wednesday[5].minutes, 7);
assert.ok(wednesday[5].label.includes("Interagis de façon naturelle."));
assert.equal(wednesday[0].label.includes("Focus objectif."), false);
assert.equal(wednesday[0].label.includes("40 abonnements"), false);
assert.equal(wednesday[6].minutes, 20);
assert.ok(wednesday[6].label.startsWith("Compte 3"));
assert.equal(wednesday[6].label.includes("Focus objectif."), false);
assert.equal(wednesday[6].label.includes("40 abonnements"), false);
assert.equal(wednesday[6].goal, "Tu dois avoir 35 abonnements ou plus au total sur le compte.");
assert.equal(wednesday.find((item) => item.id === "after-fr").goal, "Tu dois avoir 25 abonnements ou plus au total sur le compte.");
assert.equal(wednesday.find((item) => item.id === "after-es").goal, "Tu dois avoir 30 abonnements ou plus au total sur le compte.");
assert.equal(wednesday.find((item) => item.id === "after-fr").goal.includes("montre-moi"), false);
assert.equal(wednesday[6].label.includes("Tu ne postes pas aujourd'hui"), false);
const wednesdayEs = checksFor(DAY_PLANS[5], "es");
assert.ok(wednesdayEs.find((item) => item.id === "before-es").label.includes("Calentamiento preciso."));
assert.ok(wednesdayEs.find((item) => item.id === "post-es").label.includes("Lo descargas aquí."));
assert.ok(wednesdayEs.find((item) => item.id === "post-es").label.includes("Copia esta descripción."));
assert.ok(wednesdayEs.find((item) => item.id === "after-es").label.includes("Interactúa con naturalidad."));
const wednesdayEn = checksFor(DAY_PLANS[5], "en");
assert.ok(wednesdayEn.find((item) => item.id === "before-es").label.includes("Precise warm-up."));
assert.ok(wednesdayEn.find((item) => item.id === "post-es").label.includes("Download it here."));
assert.ok(wednesdayEn.find((item) => item.id === "post-es").label.includes("Copy this caption."));
assert.ok(wednesdayEn.find((item) => item.id === "after-es").label.includes("Interact in a natural way."));
assert.equal(timedMinutes(wednesday), 60);
assert.equal(wednesday.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
const thursday = checksFor(DAY_PLANS[6]);
const fridayNext = checksFor(DAY_PLANS[7]);
const saturdayNext = checksFor(DAY_PLANS[8]);
const sundayNext = checksFor(DAY_PLANS[9]);
assert.equal(thursday.filter((item) => item.label.includes("Appuie sur Publier")).length, 2);
assert.equal(thursday.at(-1).minutes, 20);
assert.ok(thursday.at(-1).label.startsWith("Compte 3"));
assert.equal(thursday.at(-1).label.includes("Focus objectif."), false);
assert.equal(thursday.at(-1).label.includes("50 abonnements"), false);
assert.equal(thursday.at(-1).goal, "Tu dois avoir 35 abonnements ou plus au total sur le compte.");
assert.equal(thursday.find((item) => item.id === "after-fr").goal, "Tu dois avoir 35 abonnements ou plus au total sur le compte.");
assert.equal(thursday.find((item) => item.id === "after-es").goal, "Tu dois avoir 35 abonnements ou plus au total sur le compte.");
assert.equal(thursday.find((item) => item.id === "before-fr").label.includes("50 abonnements"), false);
assert.equal(fridayNext.find((item) => item.id === "profile-us").minutes, 10);
assert.ok(fridayNext.find((item) => item.id === "profile-us").label.startsWith("Compte 3"));
assert.ok(fridayNext.find((item) => item.id === "profile-us").label.includes("Écris une bio"));
assert.equal(fridayNext.find((item) => item.id === "warm-us").label.includes("Focus objectif."), false);
assert.equal(fridayNext.find((item) => item.id === "warm-us").label.includes("60 abonnements"), false);
assert.equal(fridayNext.find((item) => item.id === "warm-us").goal, "Tu dois avoir 45 abonnements ou plus au total sur le compte.");
assert.equal(fridayNext.find((item) => item.id === "after-fr").goal, "Tu dois avoir 45 abonnements ou plus au total sur le compte.");
assert.equal(fridayNext.find((item) => item.id === "after-es").goal, "Tu dois avoir 45 abonnements ou plus au total sur le compte.");
assert.equal(fridayNext.find((item) => item.id === "warm-us").minutes, 10);
assert.equal(fridayNext.find((item) => item.id === "before-fr").label.includes("60 abonnements"), false);
assert.ok(fridayNext.findIndex((item) => item.id === "post-fr") < fridayNext.findIndex((item) => item.id === "post-es"));
assert.ok(fridayNext.findIndex((item) => item.id === "post-es") < fridayNext.findIndex((item) => item.id === "profile-us"));
assert.equal(fridayNext.filter((item) => item.label.includes("Appuie sur Publier")).length, 2);
assert.equal(saturdayNext.filter((item) => item.label.includes("Appuie sur Publier")).length, 3);
assert.equal(saturdayNext.find((item) => item.id === "before-fr").label.includes("70 abonnements"), false);
assert.equal(saturdayNext.find((item) => item.id === "before-es").label.includes("70 abonnements"), false);
assert.equal(saturdayNext.find((item) => item.id === "before-us").label.includes("70 abonnements"), false);
assert.equal(saturdayNext.find((item) => item.id === "after-fr").goal, "Tu dois avoir 55 abonnements ou plus au total sur le compte.");
assert.equal(saturdayNext.find((item) => item.id === "after-es").goal, "Tu dois avoir 55 abonnements ou plus au total sur le compte.");
assert.equal(saturdayNext.find((item) => item.id === "after-us").goal, "Tu dois avoir 55 abonnements ou plus au total sur le compte.");
assert.equal(saturdayNext.find((item) => item.id === "post-fr").label.includes("70 abonnements"), false);
assert.equal(saturdayNext.find((item) => item.id === "after-fr").label.includes("70 abonnements"), false);
assert.equal(saturdayNext.find((item) => item.id === "before-fr").minutes, 8);
assert.equal(sundayNext.find((item) => item.id === "before-fr").label.includes("80 abonnements"), false);
assert.equal(sundayNext.find((item) => item.id === "after-fr").goal, "Tu dois avoir 65 abonnements ou plus au total sur le compte.");
assert.equal(sundayNext.find((item) => item.id === "after-us").goal, "Tu dois avoir 65 abonnements ou plus au total sur le compte.");
assert.equal(sundayNext.find((item) => item.id === "post-us").label.includes("Appuie sur Publier"), true);
for (const plan of DAY_PLANS.filter((item) => item.date >= "2026-11-10" && item.date <= "2026-11-11")) {
  for (const id of ["fr", "es", "us"]) {
    const post = checksFor(plan).find((item) => item.id === `post-${id}`);
    if (!plan.publishers.includes(id)) {
      assert.equal(post, undefined, `${plan.date} ${id}`);
      continue;
    }
    assert.ok(post.label.includes("Tu le télécharges ici."), `${plan.date} ${id}`);
    assert.ok(post.label.includes("musique TikTok du moment"), `${plan.date} ${id}`);
    assert.ok(post.label.includes("Copie cette description."), `${plan.date} ${id}`);
    assert.equal(post.minutes, 5, `${plan.date} ${id}`);
    const before = checksFor(plan).find((item) => item.id === `before-${id}`);
    const after = checksFor(plan).find((item) => item.id === `after-${id}`);
    assert.equal(before.minutes, 8, `${plan.date} ${id}`);
    assert.equal(after.minutes, 7, `${plan.date} ${id}`);
    assert.ok(after.label.includes("Tu ne postes plus."), `${plan.date} ${id}`);
    assert.ok(after.label.includes("Interagis de façon naturelle."), `${plan.date} ${id}`);
    if (plan.date === "2026-11-10") {
      assert.ok(before.label.includes("5 comptes d'influenceurs"), `${plan.date} ${id}`);
      assert.ok(before.label.includes("Retourne sur le Pour toi"), `${plan.date} ${id}`);
      assert.equal((before.label.match(/•/g) || []).length, 2, `${plan.date} ${id}`);
    } else {
      assert.equal(before.label.includes("5 comptes d'influenceurs"), false, `${plan.date} ${id}`);
      assert.ok(before.label.includes("Va sur la page Pour toi."), `${plan.date} ${id}`);
      assert.ok(before.label.includes("comporte-toi normalement"), `${plan.date} ${id}`);
      assert.equal((before.label.match(/•/g) || []).length, 1, `${plan.date} ${id}`);
    }
  }
}
assert.ok(checksFor(DAY_PLANS[6], "es").find((item) => item.id === "before-es").label.includes("Ve a Para ti"));
assert.equal(checksFor(DAY_PLANS[6], "es").find((item) => item.id === "before-es").label.includes("5 cuentas de influencers"), false);
assert.ok(checksFor(DAY_PLANS[6], "es").find((item) => item.id === "after-es").label.includes("Cierre obligatorio"));
assert.equal(checksFor(DAY_PLANS[6]).find((item) => item.id === "warm-us").label.includes("5 comptes d'influenceurs"), false);
assert.ok(checksFor(DAY_PLANS[6], "es").find((item) => item.id === "post-es").label.includes("Lo descargas aquí."));
assert.ok(checksFor(DAY_PLANS[6], "es").find((item) => item.id === "post-es").label.includes("Copia esta descripción, luego pégala."));
assert.equal(checksFor(DAY_PLANS[6], "es").find((item) => item.id === "post-us"), undefined);
assert.ok(checksFor(DAY_PLANS[8], "en").find((item) => item.id === "before-us").label.includes("Go to For You"));
assert.equal(checksFor(DAY_PLANS[8], "en").find((item) => item.id === "before-us").label.includes("5 influencer accounts"), false);
assert.equal(checksFor(DAY_PLANS[8], "en").find((item) => item.id === "before-us").label.includes("at least 70 accounts"), false);
assert.equal(checksFor(DAY_PLANS[8], "en").find((item) => item.id === "after-us").goal, "You need 55 or more follows in total on the account.");
assert.ok(checksFor(DAY_PLANS[8], "en").find((item) => item.id === "after-us").label.includes("Required ending"));
assert.ok(checksFor(DAY_PLANS[8], "en").find((item) => item.id === "post-us").label.includes("Download it here."));
assert.ok(checksFor(DAY_PLANS[8], "en").find((item) => item.id === "post-us").label.includes("Copy this caption, then paste it."));
assert.equal(saturdayNext.find((item) => item.id === "after-us").label.includes("post d'hier"), false);
assert.ok(sundayNext.find((item) => item.id === "after-us").label.includes("post d'hier"));
for (const plan of DAY_PLANS.filter((item) => item.date >= "2026-11-12" && item.date <= "2026-11-15")) {
  const fr = checksFor(plan);
  assert.equal(fr[0].id, "rules", plan.date);
  assert.equal(fr[0].banner, true, plan.date);
  assert.ok(fr[0].label.includes("sans coupure"), plan.date);
  assert.ok(fr[0].label.includes("Coche une tâche seulement si on la voit dans la vidéo."), plan.date);
  assert.ok(fr[0].label.includes("préviens-moi tout de suite"), plan.date);
  assert.equal(fr[0].label.includes("payée"), false, plan.date);
  assert.equal(checksFor(plan, "es")[0].label.includes("no se paga"), false, plan.date);
  assert.equal(checksFor(plan, "en")[0].label.includes("not paid"), false, plan.date);
  assert.ok(checksFor(plan, "es")[0].label.includes("sin cortes"), plan.date);
  assert.ok(checksFor(plan, "en")[0].label.includes("no cuts"), plan.date);
  const count = plan.date === "2026-11-12" ? 35 : plan.date === "2026-11-13" ? 45 : plan.date === "2026-11-14" ? 55 : 65;
  for (const id of ["fr", "es", "us"]) {
    const post = fr.find((item) => item.id === `post-${id}`);
    if (!plan.publishers.includes(id)) {
      assert.equal(post, undefined, `${plan.date} ${id}`);
      continue;
    }
    assert.ok(post.label.includes("Tu le télécharges ici."), `${plan.date} ${id}`);
    assert.ok(post.label.includes("Copie cette description, puis colle-la."), `${plan.date} ${id}`);
    assert.equal((post.label.match(/Copie cette description/g) || []).length, 1, `${plan.date} ${id}`);
    assert.ok(post.label.includes("Appuie sur Publier"), `${plan.date} ${id}`);
    assert.ok(post.label.includes("dans la grille"), `${plan.date} ${id}`);
    assert.equal(post.minutes, 5, `${plan.date} ${id}`);
    const before = fr.find((item) => item.id === `before-${id}`);
    const after = fr.find((item) => item.id === `after-${id}`);
    assert.equal(before.minutes, 8, `${plan.date} ${id}`);
    assert.equal(after.minutes, 7, `${plan.date} ${id}`);
    assert.ok(before.label.includes("nombre d'abonnements de départ"), `${plan.date} ${id}`);
    assert.ok(before.label.includes("3 commentaires"), `${plan.date} ${id}`);
    assert.ok(before.label.includes("2 réponses"), `${plan.date} ${id}`);
    assert.ok(before.label.includes("jamais à la chaîne"), `${plan.date} ${id}`);
    assert.equal(before.label.includes("5 créateurs"), false, `${plan.date} ${id}`);
    assert.ok(after.label.includes("7 minutes sur Pour toi"), `${plan.date} ${id}`);
    assert.ok(after.label.includes("changer de compte"), `${plan.date} ${id}`);
    assert.ok(after.label.includes("Fin obligatoire"), `${plan.date} ${id}`);
    assert.ok(after.label.includes(String(count)), `${plan.date} ${id}`);
    assert.equal(after.label.includes("post d'hier"), plan.date !== "2026-11-14" || id !== "us", `${plan.date} ${id}`);
    assert.equal(after.label.includes("Interagis de façon naturelle."), false, `${plan.date} ${id}`);
    assert.equal(after.label.includes("15 minutes"), false, `${plan.date} ${id}`);
  }
}
assert.equal(thursday.find((item) => item.id === "warm-us").label.includes("photo"), false);
assert.equal(thursday.find((item) => item.id === "warm-us").label.includes("bio"), false);
assert.equal(thursday.find((item) => item.id === "warm-us").label.includes("Publier"), false);
assert.equal(thursday.find((item) => item.id === "warm-us").label.includes("post d'hier"), false);
assert.equal(thursday.find((item) => item.id === "warm-us").label.includes("15 minutes"), false);
assert.ok(thursday.find((item) => item.id === "warm-us").label.includes("3 commentaires"));
assert.ok(fridayNext.find((item) => item.id === "warm-us").label.includes("nouveau compte"));
assert.equal(fridayNext.find((item) => item.id === "warm-us").label.includes("post d'hier"), false);
assert.ok(thursday.find((item) => item.id === "warm-us").label.includes("20 vraies minutes"));
assert.ok(thursday.find((item) => item.id === "warm-us").label.includes("35 abonnements"));
assert.equal(fridayNext.find((item) => item.id === "warm-us").label.includes("20 vraies minutes"), false);
assert.ok(fridayNext.find((item) => item.id === "warm-us").label.includes("45"));
assert.equal(checksFor(DAY_PLANS[5]).some((item) => item.id === "rules"), false);
assert.equal(checksFor(DAY_PLANS[5]).some((item) => item.label.includes("sans coupure")), false);
const hardState = emptyDayState();
hardState.proofName = "session.mp4";
for (const check of thursday) {
  if (!check.banner) hardState.checks[check.id] = true;
}
assert.equal(dayReady(DAY_PLANS[6], hardState), true);
assert.equal(checksFor(DAY_PLANS[5], "es").find((item) => item.id === "warm-us").label.includes("40 seguidos"), false);
assert.equal(checksFor(DAY_PLANS[5], "es").find((item) => item.id === "warm-us").goal, "Tienes que tener 35 seguidos o más en total en la cuenta.");
assert.equal(checksFor(DAY_PLANS[6], "en").find((item) => item.id === "warm-us").label.includes("at least 50 accounts"), false);
assert.equal(checksFor(DAY_PLANS[6], "en").find((item) => item.id === "warm-us").goal, "You need 35 or more follows in total on the account.");
assert.equal(checksFor(DAY_PLANS[9], "es").find((item) => item.id === "before-es").label.includes("80 seguidos"), false);
assert.equal(checksFor(DAY_PLANS[9], "es").find((item) => item.id === "after-es").goal, "Tienes que tener 65 seguidos o más en total en la cuenta.");
assert.equal(checksFor(DAY_PLANS[3]).some((item) => item.goal), false);
assert.equal(checksFor(DAY_PLANS[3]).some((item) => item.label.includes("Focus objectif.")), false);
assert.equal(timedMinutes(thursday) + timedMinutes(fridayNext) + timedMinutes(saturdayNext) + timedMinutes(sundayNext), 240);
for (const plan of DAY_PLANS.filter((item) => item.date >= "2026-11-09")) {
  for (const lang of ["fr", "es", "en"]) {
    const checks = checksFor(plan, lang);
    assert.equal(timedMinutes(checks), 60, `${plan.date} ${lang}`);
    assert.equal(checks.some((item) => /\b(FR|ES|US)\b/.test(item.label)), false);
  }
}
assert.ok(checksFor(DAY_PLANS[3], "es")[1].label.includes("Pinterest"));
assert.ok(checksFor(DAY_PLANS[3], "es")[1].label.includes("que ya tienes"));
assert.equal(checksFor(DAY_PLANS[3], "es")[1].label.includes("ya tienen"), false);
assert.ok(checksFor(DAY_PLANS[3], "en")[1].label.includes("you already have"));
assert.equal(checksFor(DAY_PLANS[3], "en")[1].label.includes("they already have"), false);
assert.ok(checksFor(DAY_PLANS[3], "es")[2].label.includes("aplicaciones"));
assert.ok(checksFor(DAY_PLANS[4], "es").find((item) => item.id === "post-fr").label.includes("Lo descargas aquí."));
assert.ok(checksFor(DAY_PLANS[4], "es")[0].label.includes("Calentamiento"));
assert.ok(checksFor(DAY_PLANS[3], "en")[1].label.includes("No AI-generated image"));
assert.ok(checksFor(DAY_PLANS[3], "en")[2].label.includes("does not mention the apps"));
assert.ok(checksFor(DAY_PLANS[4], "en").find((item) => item.id === "post-fr").label.includes("Download it here."));
assert.ok(checksFor(DAY_PLANS[4], "en")[0].label.includes("Precise warm-up."));
for (const plan of DAY_PLANS.filter((item) => item.date >= "2026-11-09")) {
  for (const lang of ["fr", "es", "en"]) {
    const word = lang === "es" ? "Cuenta" : lang === "en" ? "Account" : "Compte";
    let last = 0;
    for (const item of checksFor(plan, lang)) {
      if (item.parent) continue;
      const rank = Number(item.label.split("\n")[0].replace(word, "").trim());
      if (!rank) continue;
      assert.ok(rank >= last, `${plan.date} ${lang} ${item.id}`);
      last = rank;
    }
  }
}
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
assert.equal(timeZoneForGirl("Ghada - FR"), "Europe/Paris");
assert.equal(timeZoneForGirl("Peches - ES"), "Europe/Madrid");
assert.equal(timeZoneForGirl("Karol - US"), "America/New_York");
assert.equal(timeZoneForGirl("Karol - EN"), "America/New_York");
const stillMondayInNewYork = new Date("2026-11-09T23:30:00Z");
assert.equal(calendarDate("Europe/Paris", stillMondayInNewYork), "2026-11-10");
assert.equal(calendarDate("Europe/Madrid", stillMondayInNewYork), "2026-11-10");
assert.equal(calendarDate("America/New_York", stillMondayInNewYork), "2026-11-09");
const datesFor = (name, now) => workerVisiblePlans(name, now).map((plan) => plan.date);
assert.equal(datesFor("Ghada - FR", stillMondayInNewYork).includes("2026-11-09"), false);
assert.equal(datesFor("Ghada - FR", stillMondayInNewYork)[0], "2026-11-10");
assert.equal(datesFor("Peches - ES", stillMondayInNewYork).includes("2026-11-09"), false);
assert.equal(datesFor("Karol - US", stillMondayInNewYork)[0], "2026-11-09");
assert.equal(datesFor("Karol - EN", stillMondayInNewYork).includes("2026-11-09"), true);
const tuesdayInNewYork = new Date("2026-11-10T05:30:00Z");
assert.equal(calendarDate("America/New_York", tuesdayInNewYork), "2026-11-10");
assert.equal(datesFor("Karol - US", tuesdayInNewYork).includes("2026-11-09"), false);
assert.equal(datesFor("Karol - US", tuesdayInNewYork)[0], "2026-11-10");
assert.equal(shiftIsoDate("2026-11-11", -1), "2026-11-10");
const wednesdayAfternoon = new Date("2026-11-11T18:00:00Z");
assert.equal(missedProofDate("Karol - US", wednesdayAfternoon), "2026-11-10");
assert.equal(missedProofDate("Ghada - FR", wednesdayAfternoon), "2026-11-10");
assert.equal(missedProofDate("Peches - ES", wednesdayAfternoon), "2026-11-10");
assert.equal(missedProofDate("Karol - US", stillMondayInNewYork), "2026-11-08");
assert.equal(missedProofDate("Karol - US", tuesdayInNewYork), "2026-11-09");
assert.equal(missedProofDate("Ghada - FR", new Date("2026-11-06T12:00:00Z")), null);
assert.ok(postingUi("en").lateProofTitle("Tuesday, November 10").includes("Yesterday"));
assert.ok(postingUi("en").lateProofBody.includes("no longer on the page"));
assert.ok(postingUi("fr").lateProofTitle("mardi 10 novembre").includes("hier"));
assert.ok(postingUi("es").lateProofTitle("martes").includes("ayer"));
assert.ok(postingUi("en").downloadPreparing.includes("Preparing"));
assert.equal(DAY_PLANS.some((plan) => plan.date === "2026-11-09"), true);
assert.equal(DAY_PLANS.some((plan) => plan.date === "2026-11-06"), true);
assert.equal(langFromName("Profil 1"), "fr");
assert.ok(postingUi("fr").slotsHelp.includes("une seule heure"));
assert.ok(postingUi("es").slotsHelp.includes("una sola hora"));
assert.ok(postingUi("en").weekEdit.includes("still change"));
assert.equal(postingUi("fr").imagesMissing, "Les images ne sont pas encore là.");
assert.equal(postingUi("es").imagesMissing, "Las imágenes todavía no están.");
assert.equal(postingUi("en").imagesMissing, "The images are not here yet.");
const tuesdayHers = checksFor(DAY_PLANS[4]);
assert.deepEqual(
  tuesdayHers.filter((item) => taskIsHers(item.id, "fr")).map((item) => item.id),
  ["before-fr", "post-fr", "after-fr"],
);
assert.equal(tuesdayHers.filter((item) => taskIsHers(item.id, "es")).some((item) => item.id.endsWith("-fr") || item.id.endsWith("-us")), false);
assert.equal(tuesdayHers.filter((item) => taskIsHers(item.id, "us")).some((item) => item.id.endsWith("-es")), false);
assert.equal(showHoursVary("2026-11-10"), true);
assert.equal(showHoursVary("2026-11-11"), true);
assert.equal(showHoursVary("2026-11-09"), false);
assert.equal(showHoursVary("2026-11-12"), false);
assert.equal(postingUi("fr").hoursVary, "N'hésite pas à varier tes heures, pour que TikTok ne pense pas que tu es un robot.");
assert.equal(postingUi("es").hoursVary, "No dudes en variar tus horas, para que TikTok no piense que eres un robot.");
assert.equal(postingUi("en").hoursVary, "Don't hesitate to vary your hours, so TikTok doesn't think you're a robot.");
assert.equal(postingUi("fr").slotsVary, "Ne fais pas toujours la même heure. Varie, pour que l'algorithme comprenne que tu n'es pas un robot en automatique.");
assert.equal(postingUi("es").slotsVary, "No hagas siempre la misma hora. Varía, para que el algoritmo entienda que no eres un robot en automático.");
assert.equal(postingUi("en").slotsVary, "Don't always pick the same hour. Switch it up, so the algorithm sees you're not a robot on autopilot.");
assert.equal(checksFor(DAY_PLANS[0], "es")[3].minutes, 10);
assert.ok(checksFor(DAY_PLANS[0], "es")[3].label.startsWith("Cuenta 1"));
assert.ok(checksFor(DAY_PLANS[0], "es")[0].label.includes("empieza de cero"));
assert.ok(checksFor(DAY_PLANS[0], "es")[1].label.includes("Nombre de usuario"));
assert.ok(checksFor(DAY_PLANS[0], "en")[1].label.includes("common girl's name"));
assert.equal(checksFor(DAY_PLANS[0], "en")[3].minutes, 10);
assert.ok(checksFor(DAY_PLANS[0], "en")[3].label.startsWith("Account 1"));
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
assert.equal(dayIsValidated({ p1: { validated: true, proofName: "a.mp4", checks: { create: true } } }), true);
assert.equal(
  dayIsValidated({
    p1: { validated: true, proofName: "a.mp4" },
    p2: { validated: false, proofName: "b.mp4" },
  }),
  false
);
assert.equal(dayIsValidated({ p1: { validated: false, checks: {} } }), false);

const { emptySlideBoard, findSlide, removeAt, replaceCard, setCaption, slideshowOf, visibleBoard } = await import("../src/config/slideBoard.ts");
const imageA = { id: "0123456789abcdef", name: "ghada.png", type: "image/png" };
const imageB = { id: "fedcba9876543210", name: "peches.png", type: "image/png" };
const shared = setCaption(replaceCard(replaceCard(emptySlideBoard(), "2026-11-10", "p1__fr", [imageA]), "2026-11-10", "p2__es", [imageB]), "2026-11-10", "p1__fr", "légende");
assert.equal(findSlide(shared, imageA.id)?.storageId, "p1__fr");
assert.equal(visibleBoard(shared, "p2").files["2026-11-10"]?.["p1__fr"], undefined);
assert.equal(visibleBoard(shared, "p2").files["2026-11-10"]?.["p2__es"]?.[0].name, "peches.png");
assert.equal(visibleBoard(shared, "tania").captions["2026-11-10"]?.["p1__fr"], "légende");
const kept = removeAt(shared, "2026-11-10", "p1__fr", 0);
assert.equal(kept.files["2026-11-10"]?.["p1__fr"], undefined);
assert.equal(kept.files["2026-11-10"]?.["p2__es"]?.[0].id, imageB.id);
assert.equal(replaceCard(emptySlideBoard(), "2026-11-06", "p1__fr", [imageA]).files["2026-11-06"], undefined);
const imageC = { id: "abcdef0123456789", name: "suite.png", type: "image/png" };
const twoAccounts = replaceCard(replaceCard(emptySlideBoard(), "2026-11-11", "p1__fr", [imageA, imageC]), "2026-11-11", "p1__es", [imageB]);
assert.deepEqual(
  slideshowOf(twoAccounts, "2026-11-11", "p1__fr").map((image) => image.id),
  [imageA.id, imageC.id]
);
assert.deepEqual(
  slideshowOf(twoAccounts, "2026-11-11", "p1__es").map((image) => image.name),
  ["peches.png"]
);
assert.deepEqual(slideshowOf(twoAccounts, "2026-11-11", "p1__us"), []);
assert.deepEqual(
  slideshowOf(replaceCard(emptySlideBoard(), "2026-11-10", "p1__fr", [imageA]), "2026-11-10", "p1__fr").map((image) => image.id),
  [imageA.id]
);
console.log("posting codes ok");
