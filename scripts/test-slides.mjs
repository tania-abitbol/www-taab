import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

delete process.env.NETLIFY_BLOBS_CONTEXT;
const dir = await mkdtemp(path.join(tmpdir(), "taab-slides-"));
process.env.POSTING_SLIDES_DIR = dir;

const { loadSlideBoard, readSlideBytes, replaceSlideCard, saveSlideImage, hideSlideAt } = await import(
  "../src/server/postingSlides.ts"
);

const first = new Uint8Array([1, 2, 3, 4]);
const second = new Uint8Array([9, 9]);
await saveSlideImage("0123456789abcdef", first);
await saveSlideImage("fedcba9876543210", second);
const board = await replaceSlideCard("2026-11-10", "p1__fr", [
  { id: "0123456789abcdef", name: "une.png", type: "image/png" },
  { id: "fedcba9876543210", name: "deux.png", type: "image/png" },
]);
assert.deepEqual(
  board.files["2026-11-10"]["p1__fr"].map((image) => image.name),
  ["une.png", "deux.png"],
);
const again = await loadSlideBoard();
assert.equal(again.files["2026-11-10"]["p1__fr"][0].id, "0123456789abcdef");
assert.deepEqual(Array.from((await readSlideBytes("0123456789abcdef")) ?? []), [1, 2, 3, 4]);

const hidden = await hideSlideAt("2026-11-10", "p1__fr", 0);
assert.equal(hidden.files["2026-11-10"]["p1__fr"][0].id, "fedcba9876543210");
assert.deepEqual(Array.from((await readSlideBytes("0123456789abcdef")) ?? []), [1, 2, 3, 4]);
assert.equal(JSON.parse(await readFile(path.join(dir, "board.json"), "utf8")).files["2026-11-10"]["p1__fr"].length, 1);

await rm(dir, { recursive: true, force: true });
console.log("slides ok");
