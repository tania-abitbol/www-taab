/** Screen recordings keep their index after the picture data. A player stays black until it has that index, which is several gigabytes in, and each response is only a short slice. Present the same bytes with the index first and shift the sample offsets to match. */

export type RangeReader = (start: number, end: number) => Promise<Uint8Array>;

export type FastStart = {
  size: number;
  identity: boolean;
  headSize: number;
  moovOffset: number;
  moov: Uint8Array | null;
};

const CONTAINERS = new Set(["trak", "edts", "mdia", "minf", "dinf", "stbl"]);
const MOOV_LIMIT = 8 * 1024 * 1024;

export const identityFastStart = (size: number): FastStart => ({
  size,
  identity: true,
  headSize: 0,
  moovOffset: 0,
  moov: null,
});

const cache = new Map<string, Promise<FastStart>>();

export const fastStartFor = (key: string, size: number, type: string, read: RangeReader) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = prepareFastStart(size, type, read).catch((error: unknown) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, pending);
  while (cache.size > 8) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined || oldest === key) break;
    cache.delete(oldest);
  }
  return pending;
};

const readExact = async (read: RangeReader, start: number, end: number) => {
  const bytes = await read(start, end);
  if (bytes.byteLength !== end - start + 1) throw new Error("proof-short");
  return bytes;
};

const boxType = (bytes: Uint8Array, offset: number) => String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);

const headerOf = (bytes: Uint8Array, size: number, offset: number) => {
  if (bytes.byteLength < 8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let boxSize = view.getUint32(0);
  const type = boxType(bytes, 4);
  let headerLen = 8;
  if (boxSize === 1) {
    if (bytes.byteLength < 16) return null;
    const big = view.getBigUint64(8);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    boxSize = Number(big);
    headerLen = 16;
  } else if (boxSize === 0) {
    boxSize = size - offset;
  }
  for (let index = 0; index < type.length; index += 1) {
    const code = type.charCodeAt(index);
    if (code < 32 || code > 126) return null;
  }
  if (!Number.isSafeInteger(boxSize) || boxSize < headerLen || offset + boxSize > size) return null;
  return { type, boxSize, headerLen };
};

const findLayout = async (size: number, read: RangeReader) => {
  const prefixLen = Math.min(size, 8192);
  const prefix = new Uint8Array(await readExact(read, 0, prefixLen - 1));
  let offset = 0;
  let headSize = 0;
  let sawMedia = false;
  let moov: { offset: number; size: number } | null = null;
  for (let step = 0; step < 12 && offset + 8 <= size; step += 1) {
    const need = Math.min(16, size - offset);
    const raw = offset + need <= prefix.byteLength ? prefix.subarray(offset, offset + need) : await readExact(read, offset, offset + need - 1);
    const bytes = new Uint8Array(raw.byteLength);
    bytes.set(raw);
    const box = headerOf(bytes, size, offset);
    if (!box) return null;
    if (step === 0 && box.type !== "ftyp") return null;
    if (step === 0) headSize = box.boxSize;
    if (box.type === "mdat") sawMedia = true;
    if (box.type === "moov") {
      moov = { offset, size: box.boxSize };
      break;
    }
    offset += box.boxSize;
  }
  if (!moov || !sawMedia || moov.offset < headSize || moov.size > MOOV_LIMIT) return null;
  return { headSize, moovOffset: moov.offset, moovSize: moov.size };
};

type SampleOffset = { kind: "stco" | "co64"; at: number; value: number };

const collectOffsets = (view: DataView, bytes: Uint8Array, start: number, end: number, entries: SampleOffset[]): boolean => {
  let cursor = start;
  while (cursor + 8 <= end) {
    let boxSize = view.getUint32(cursor);
    const type = boxType(bytes, cursor + 4);
    let header = 8;
    if (boxSize === 1) {
      if (cursor + 16 > end) return false;
      const big = view.getBigUint64(cursor + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) return false;
      boxSize = Number(big);
      header = 16;
    } else if (boxSize === 0) {
      boxSize = end - cursor;
    }
    if (boxSize < header || cursor + boxSize > end) return false;
    if ((type === "stco" || type === "co64") && header === 8) {
      if (boxSize < 16 || view.getUint8(cursor + 8) !== 0) return false;
      const count = view.getUint32(cursor + 12);
      const width = type === "stco" ? 4 : 8;
      if (16 + count * width > boxSize) return false;
      for (let index = 0; index < count; index += 1) {
        const at = cursor + 16 + index * width;
        const value = type === "stco" ? view.getUint32(at) : Number(view.getBigUint64(at));
        if (!Number.isSafeInteger(value)) return false;
        entries.push({ kind: type, at, value });
      }
    } else if (CONTAINERS.has(type)) {
      if (!collectOffsets(view, bytes, cursor + header, cursor + boxSize, entries)) return false;
    }
    cursor += boxSize;
  }
  return true;
};

const patchMoov = (moov: Uint8Array, delta: number, headSize: number, moovOffset: number) => {
  const view = new DataView(moov.buffer, moov.byteOffset, moov.byteLength);
  const header = view.getUint32(0) === 1 ? 16 : 8;
  const entries: SampleOffset[] = [];
  if (!collectOffsets(view, moov, header, moov.byteLength, entries) || entries.length === 0) return false;
  for (const entry of entries) {
    if (entry.value < headSize || entry.value >= moovOffset) return false;
    if (entry.kind === "stco" && entry.value + delta > 0xffffffff) return false;
  }
  for (const entry of entries) {
    if (entry.kind === "stco") view.setUint32(entry.at, entry.value + delta);
    else view.setBigUint64(entry.at, BigInt(entry.value) + BigInt(delta));
  }
  return true;
};

export const prepareFastStart = async (size: number, type: string, read: RangeReader): Promise<FastStart> => {
  if (!type.startsWith("video/mp4") && !type.startsWith("video/quicktime")) return identityFastStart(size);
  const found = await findLayout(size, read);
  if (!found) return identityFastStart(size);
  const raw = await readExact(read, found.moovOffset, found.moovOffset + found.moovSize - 1);
  const moov = new Uint8Array(raw.byteLength);
  moov.set(raw);
  if (boxType(moov, 4) !== "moov") return identityFastStart(size);
  if (!patchMoov(moov, found.moovSize, found.headSize, found.moovOffset)) return identityFastStart(size);
  return { size, identity: false, headSize: found.headSize, moovOffset: found.moovOffset, moov };
};

export const readFastStartRange = async (layout: FastStart, start: number, end: number, read: RangeReader) => {
  if (layout.identity || !layout.moov) return readExact(read, start, end);
  const moovSize = layout.moov.byteLength;
  const head = layout.headSize;
  const middleStart = head + moovSize;
  const tailStart = layout.moovOffset + moovSize;
  const out = new Uint8Array(end - start + 1);
  let cursor = start;
  while (cursor <= end) {
    if (cursor < head) {
      const sliceEnd = Math.min(end, head - 1);
      const bytes = await readExact(read, cursor, sliceEnd);
      out.set(bytes, cursor - start);
      cursor = sliceEnd + 1;
    } else if (cursor < middleStart) {
      const sliceEnd = Math.min(end, middleStart - 1);
      out.set(layout.moov.subarray(cursor - head, sliceEnd - head + 1), cursor - start);
      cursor = sliceEnd + 1;
    } else if (cursor < tailStart) {
      const sliceEnd = Math.min(end, tailStart - 1);
      const bytes = await readExact(read, cursor - moovSize, sliceEnd - moovSize);
      out.set(bytes, cursor - start);
      cursor = sliceEnd + 1;
    } else {
      const bytes = await readExact(read, cursor, end);
      out.set(bytes, cursor - start);
      cursor = end + 1;
    }
  }
  return out;
};
