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

const { readZipEntries, zipStoredFiles } = await import("../src/config/slideZip.ts");
const { replaceCard, slideshowOf } = await import("../src/config/slideBoard.ts");
const five = ["a", "b", "c", "d", "e"].map((letter, index) => ({
  id: `0123456789abcde${index}`,
  name: `0${index + 1}.png`,
  type: "image/png",
  bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, index]),
}));
const other = { id: "fedcba9876543210", name: "other.png", type: "image/png", bytes: new Uint8Array([1, 2, 3]) };
const fiveBoard = replaceCard(
  replaceCard(
    { files: {}, captions: {} },
    "2026-11-11",
    "p3__fr",
    five.map(({ id, name, type }) => ({ id, name, type })),
  ),
  "2026-11-11",
  "p3__es",
  [{ id: other.id, name: other.name, type: other.type }],
);
const card = slideshowOf(fiveBoard, "2026-11-11", "p3__fr");
assert.equal(card.length, 5);
assert.equal(slideshowOf(fiveBoard, "2026-11-11", "p3__es").length, 1);
const zipped = zipStoredFiles(card.map((image) => ({ name: image.name, bytes: five.find((item) => item.id === image.id).bytes })));
const entries = readZipEntries(zipped);
assert.deepEqual(
  entries.map((entry) => entry.name),
  ["01.png", "02.png", "03.png", "04.png", "05.png"],
);
assert.equal(entries.length, 5);
assert.equal(entries.some((entry) => entry.name === "other.png"), false);
assert.deepEqual(Array.from(entries[4].bytes), [0x89, 0x50, 0x4e, 0x47, 4]);
console.log("slides ok");
