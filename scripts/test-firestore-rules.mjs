// Run against the Firestore emulator: `yarn test:rules`
import assert from "node:assert/strict";
import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  setLogLevel,
  terminate,
  updateDoc,
} from "firebase/firestore";

const projectId = process.env.GCLOUD_PROJECT || "demo-etha";
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");

const app = initializeApp({ projectId, apiKey: "demo-key" });
const db = getFirestore(app);
connectFirestoreEmulator(db, host, Number(port));
setLogLevel("silent");

const applications = collection(db, "creatorApplications");

const valid = () => ({
  name: "Jordan Lee",
  email: "jordan@example.com",
  country: "US",
  ageConfirmed: true,
  instagramUsername: "jordan.makes",
  tiktokUsername: "jordan.makes_stuff",
  tiktokUrl: "https://www.tiktok.com/@jordan.makes_stuff",
  followers: "1k_10k",
  status: "new",
  source: "creators_page",
  locale: "en",
  createdAt: serverTimestamp(),
});

const previousTwoStep = () => ({
  name: "Jordan Lee",
  email: "jordan@example.com",
  phone: "+1 415 555 0134",
  country: "US",
  ageConfirmed: true,
  tiktokUsername: "jordan.makes_stuff",
  tiktokUrl: "https://www.tiktok.com/@jordan.makes_stuff",
  followers: "1k_10k",
  informationConfirmed: true,
  status: "new",
  source: "creators_page",
  locale: "en",
  createdAt: serverTimestamp(),
});

const legacy = () => ({
  ...previousTwoStep(),
  state: "California",
  averageViews: "2k_10k",
  postingFrequency: "few_per_week",
  contentCategories: ["comedy", "storytelling"],
  whyCreator: "I love games with friends and want to turn that into content.",
});

const denied = async (promise) => {
  await assert.rejects(promise, (error) => error.code === "permission-denied");
};

const results = [];
const test = async (name, fn) => {
  try {
    await fn();
    results.push(["PASS", name]);
  } catch (error) {
    results.push(["FAIL", name, error.message]);
  }
};

let createdId;

await test("valid application can be created", async () => {
  const ref = await addDoc(applications, valid());
  createdId = ref.id;
});
await test("instagram only, without phone, is accepted", async () => {
  const { tiktokUsername, tiktokUrl, ...rest } = valid();
  await addDoc(applications, rest);
});
await test("tiktok only, without phone, is accepted", async () => {
  const { instagramUsername, ...rest } = valid();
  await addDoc(applications, rest);
});
await test("previous two-step payload with phone and no instagram is accepted", async () => {
  await addDoc(applications, previousTwoStep());
});
await test("non-US country is accepted", async () => {
  await addDoc(applications, { ...valid(), country: "FR" });
});
await test("phone with parentheses is accepted when present", async () => {
  await addDoc(applications, { ...previousTwoStep(), phone: "(415) 555-0134" });
});
await test("previous 3-step payload is still accepted", async () => {
  await addDoc(applications, legacy());
});
await test("earlier form payload (videos + contentDifference) is accepted", async () => {
  await addDoc(applications, {
    ...legacy(),
    videoUrls: ["https://www.tiktok.com/@jordan.makes_stuff/video/1234567890"],
    contentDifference: "I write every skit around a real story from my week.",
  });
});
await test("empty video list is accepted", async () => {
  await addDoc(applications, { ...legacy(), videoUrls: [] });
});
await test("up to 3 video URLs are accepted", async () => {
  const urls = [1, 2, 3].map((i) => `https://www.tiktok.com/@a/video/${i}`);
  await addDoc(applications, { ...legacy(), videoUrls: urls });
});

await test("get is denied", () => denied(getDoc(doc(applications, createdId))));
await test("list is denied", () => denied(getDocs(applications)));
await test("update is denied", () =>
  denied(updateDoc(doc(applications, createdId), { status: "approved" })));
await test("overwrite via set is denied", () =>
  denied(setDoc(doc(applications, createdId), valid())));
await test("delete is denied", () => denied(deleteDoc(doc(applications, createdId))));

const invalidCases = {
  "status other than new": { status: "approved" },
  "client-provided createdAt": { createdAt: new Date() },
  "extra field": { isAdmin: true },
  "age not confirmed": { ageConfirmed: false },
  "final confirmation missing": { informationConfirmed: false },
  "lowercase country code": { country: "us" },
  "invalid email": { email: "not-an-email" },
  "phone with letters": { phone: "call-me-4155550134" },
  "phone too short": { phone: "1234567" },
  "phone too many digits": { phone: "1234567890123456" },
  "phone as number": { phone: 14155550134 },
  "oversized name": { name: "x".repeat(101) },
  "oversized whyCreator": { whyCreator: "x".repeat(1001) },
  "short contentDifference": { contentDifference: "short" },
  "non-TikTok profile URL": { tiktokUrl: "https://evil.example.com/@me" },
  "invalid instagram username": { instagramUsername: "not a handle" },
  "unknown follower bucket": { followers: "1m_plus" },
  "unknown category": { contentCategories: ["crypto"] },
  "too many categories": {
    contentCategories: ["comedy", "storytelling", "trends", "gaming", "other"],
  },
  "legacy contentDescription field": { contentDescription: "Short skits about my week." },
  "legacy showsFace field": { showsFace: "yes" },
  "non-TikTok first video": { videoUrls: ["https://youtube.com/x"] },
  "4 video URLs": {
    videoUrls: [1, 2, 3, 4].map((i) => `https://www.tiktok.com/@a/video/${i}`),
  },
  "non-TikTok second video": {
    videoUrls: ["https://www.tiktok.com/@a/video/1", "https://youtube.com/x"],
  },
  "followers as number": { followers: 5000 },
};

for (const [name, override] of Object.entries(invalidCases)) {
  await test(`create denied: ${name}`, () =>
    denied(addDoc(applications, { ...valid(), ...override })));
}

await test("create denied: neither handle", () => {
  const { instagramUsername, tiktokUsername, tiktokUrl, ...rest } = valid();
  return denied(addDoc(applications, rest));
});
await test("create denied: tiktok username without url", () => {
  const { tiktokUrl, ...rest } = valid();
  return denied(addDoc(applications, rest));
});
await test("create denied: tiktok url without a username", () => {
  const { tiktokUsername, ...rest } = valid();
  return denied(addDoc(applications, rest));
});
await test("create denied: missing followers", () => {
  const { followers, ...rest } = valid();
  return denied(addDoc(applications, rest));
});
await test("create denied: empty legacy state", () =>
  denied(addDoc(applications, { ...valid(), state: "" })));

await test("other collections stay closed", () =>
  denied(setDoc(doc(db, "anything/else"), { a: 1 })));

await terminate(db);

for (const [status, name, detail] of results) {
  console.log(`${status}  ${name}${detail ? ` — ${detail}` : ""}`);
}
const failed = results.filter(([status]) => status === "FAIL").length;
console.log(`\n${results.length - failed}/${results.length} rules tests passed`);
process.exit(failed ? 1 : 0);
