import assert from "node:assert/strict";

process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(
  JSON.stringify({ siteID: "site", token: "token", apiURL: "https://api.example.test" }),
).toString("base64");

const calls = [];
const meta = {
  name: "friday.mp4",
  size: 6 * 1024 * 1024,
  parts: 2,
  partSize: 3 * 1024 * 1024,
  type: "video/mp4",
  generation: "abcd1234",
};

globalThis.fetch = async (url, init = {}) => {
  const method = init.method || "GET";
  const target = String(url);
  calls.push({ url: target, method, at: calls.length });
  if (method === "GET" && target.includes("/posting-proofs/meta-")) {
    return new Response(JSON.stringify({ url: "https://signed.example/meta" }), { status: 200 });
  }
  if (target === "https://signed.example/meta") return new Response(JSON.stringify(meta), { status: 200 });
  if (method === "GET") return new Response(null, { status: 404 });
  if (method === "PUT" && target.includes("api.example.test")) {
    return new Response(JSON.stringify({ url: "https://signed.example/put" }), { status: 200 });
  }
  if (target === "https://signed.example/put") return new Response(null, { status: 200 });
  if (method === "DELETE" && target.endsWith("-p1")) {
    return new Promise((_, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    });
  }
  if (method === "DELETE") return new Response(null, { status: 204 });
  return new Response("unexpected", { status: 500 });
};

const { forgetPostedDay } = await import("../src/server/postingProofStore.ts");
const started = Date.now();
await forgetPostedDay(["p1"], "2020-01-01");
const elapsed = Date.now() - started;

const removed = calls.find((call) => call.method === "PUT" && call.url === "https://signed.example/put");
const firstDelete = calls.find((call) => call.method === "DELETE");
assert.ok(removed, "the day is recorded");
assert.ok(firstDelete, "a proof delete was attempted");
assert.ok(removed.at < firstDelete.at, "the day is recorded before the video parts are deleted");
assert.ok(elapsed < 8000, `returned while a part was still hanging (${elapsed}ms)`);

console.log("blob delete ok");
