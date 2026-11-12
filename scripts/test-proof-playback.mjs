import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const { prepareFastStart, readFastStartRange } = await import("../src/server/proofFastStart.ts");

const be32 = (value) => Buffer.from([(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
const be64 = (value) => {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(value));
  return bytes;
};
const box = (type, body) => Buffer.concat([be32(8 + body.length), Buffer.from(type), body]);
const reader = (file) => async (start, end) => file.subarray(start, end + 1);

const u32 = (bytes, offset) => bytes.readUInt32BE(offset);
const text = (bytes, offset, length) => Buffer.from(bytes.subarray(offset, offset + length)).toString("ascii");

const rebuilt = async (layout, file) => {
  const read = reader(file);
  const chunks = [];
  for (let start = 0; start < file.length; start += 64) {
    const end = Math.min(file.length - 1, start + 63);
    chunks.push(Buffer.from(await readFastStartRange(layout, start, end, read)));
  }
  return Buffer.concat(chunks);
};

const synthetic = async () => {
  const ftyp = box("ftyp", Buffer.concat([Buffer.from("qt  "), be32(0), Buffer.from("qt  ")]));
  const free = box("free", Buffer.alloc(16, 0x22));
  const payload = Buffer.concat([Buffer.from("ABCDEFGH"), Buffer.alloc(9000, 0x11)]);
  const mdat = box("mdat", payload);
  const markerAt = ftyp.length + free.length + 8;
  const co64 = box("co64", Buffer.concat([be32(0), be32(1), be64(markerAt)]));
  const moov = box("moov", box("trak", box("mdia", box("minf", box("stbl", co64)))));
  const tail = Buffer.from("TAILDATA-KEEP-ME-AT-THE-END");
  const file = Buffer.concat([ftyp, free, mdat, moov, tail]);
  const layout = await prepareFastStart(file.length, "video/quicktime", reader(file));
  assert.equal(layout.identity, false);
  assert.equal(layout.headSize, ftyp.length);
  assert.equal(layout.moovOffset, ftyp.length + free.length + mdat.length);
  const virtual = await rebuilt(layout, file);
  assert.equal(virtual.length, file.length);
  assert.equal(text(virtual, 4, 4), "ftyp");
  assert.equal(text(virtual, ftyp.length + 4, 4), "moov");
  const findCo64 = (start, end) => {
    let cursor = start;
    while (cursor + 8 <= end) {
      const boxSize = u32(virtual, cursor);
      const type = text(virtual, cursor + 4, 4);
      if (type === "co64") return cursor;
      if (["moov", "trak", "mdia", "minf", "stbl"].includes(type)) {
        const found = findCo64(cursor + 8, cursor + boxSize);
        if (found >= 0) return found;
      }
      cursor += boxSize;
    }
    return -1;
  };
  const co64At = findCo64(ftyp.length, ftyp.length + u32(virtual, ftyp.length));
  assert.ok(co64At > 0);
  const patched = Number(virtual.readBigUInt64BE(co64At + 16));
  assert.equal(patched, markerAt + moov.length);
  assert.equal(virtual[patched], "A".charCodeAt(0));
  assert.equal(virtual.subarray(virtual.length - tail.length).toString(), tail.toString());
};

const decoded = (file) =>
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-ss", "0.4", "-i", file, "-frames:v", "1", "-f", "framehash", "-"],
    { encoding: "utf8" }
  );

const roundTrip = async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "proof-play-"));
  try {
    const source = path.join(dir, "end.mp4");
    const fast = path.join(dir, "fast.mp4");
    const virtualPath = path.join(dir, "virtual.mp4");
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "testsrc=size=160x120:rate=15:duration=2",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:sample_rate=44100:duration=2",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-g",
        "15",
        "-c:a",
        "aac",
        source,
      ],
      { stdio: "inherit" }
    );
    const original = readFileSync(source);
    const layout = await prepareFastStart(original.length, "video/mp4", reader(original));
    assert.equal(layout.identity, false);
    const virtual = await rebuilt(layout, original);
    assert.equal(text(virtual, layout.headSize + 4, 4), "moov");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(virtualPath, virtual);
    assert.equal(decoded(virtualPath), decoded(source));
    execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", source, "-c", "copy", "-movflags", "+faststart", fast], {
      stdio: "inherit",
    });
    const ready = readFileSync(fast);
    const untouched = await prepareFastStart(ready.length, "video/mp4", reader(ready));
    assert.equal(untouched.identity, true);
    const same = Buffer.from(await readFastStartRange(untouched, 0, 99, reader(ready)));
    assert.deepEqual(same, ready.subarray(0, 100));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const ignored = async () => {
  let reads = 0;
  const layout = await prepareFastStart(32, "image/png", async () => {
    reads += 1;
    return new Uint8Array(32);
  });
  assert.equal(layout.identity, true);
  assert.equal(reads, 0);
};

await synthetic();
await roundTrip();
await ignored();
console.log("proof playback ok");
