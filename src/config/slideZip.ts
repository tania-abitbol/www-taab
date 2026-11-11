export type ZipSource = { name: string; bytes: Uint8Array };

export type ZipEntry = { name: string; bytes: Uint8Array };

const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  CRC_TABLE[index] = crc >>> 0;
}

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const concat = (parts: Uint8Array[]) => {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const u16 = (value: number) => {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
};

const u32 = (value: number) => {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
};

/** One stored file name, unique inside the archive, with no path. */
const entryName = (raw: string, used: Set<string>) => {
  const base = (raw.replace(/\\/g, "/").split("/").pop() ?? "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
  const simple = base.replace(/^\.+/, "") || "image";
  let name = simple;
  let count = 2;
  while (used.has(name.toLowerCase())) {
    const dot = simple.lastIndexOf(".");
    const stem = dot > 0 ? simple.slice(0, dot) : simple;
    const ext = dot > 0 ? simple.slice(dot) : "";
    name = `${stem}-${count}${ext}`.slice(0, 80);
    count += 1;
  }
  used.add(name.toLowerCase());
  return name;
};

/** Zip of one card's images. Stored, not deflated, so the bytes come back unchanged. */
export const zipStoredFiles = (files: ZipSource[]): Uint8Array => {
  const used = new Set<string>();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const nameBytes = new TextEncoder().encode(entryName(file.name, used));
    const crc = crc32(file.bytes);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0x800),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.bytes.length),
      u32(file.bytes.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      file.bytes,
    ]);
    locals.push(local);
    centrals.push(
      concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0x800),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(file.bytes.length),
        u32(file.bytes.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes,
      ]),
    );
    offset += local.length;
  }
  const central = concat(centrals);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);
  return concat([...locals, central, end]);
};

/** Read stored entries back. Used to check a card's archive has every image. */
export const readZipEntries = (zip: Uint8Array): ZipEntry[] => {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entries: ZipEntry[] = [];
  let offset = 0;
  while (offset + 30 <= zip.length && view.getUint32(offset, true) === 0x04034b50) {
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const size = view.getUint32(offset + 22, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = new TextDecoder().decode(zip.subarray(nameStart, nameStart + nameLength));
    entries.push({ name, bytes: zip.slice(dataStart, dataStart + size) });
    offset = dataStart + size;
  }
  return entries;
};
