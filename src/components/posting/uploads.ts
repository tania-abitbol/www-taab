import { SLIDE_MAX_BYTES, SLIDE_PART_BYTES, slidePartCount, type SlideImage } from "~/config/slideBoard";
import { PROOF_PART_BYTES, proofPartCount } from "~/server/postingProofs";

export const slideFileId = () => {
  const raw = globalThis.crypto?.randomUUID?.().replace(/-/g, "") ?? `${Date.now().toString(16)}0000000000000000`;
  return raw.slice(0, 16);
};

const READ_WINDOW = 5 * 1024 * 1024;

export const readSharedFile = async (id: string) => {
  const pieces: Uint8Array[] = [];
  let start = 0;
  let total = 0;
  while (total === 0 || start < total) {
    const response = await fetch(`/posting/slide/${id}`, {
      cache: "no-store",
      headers: { range: `bytes=${start}-${start + READ_WINDOW - 1}` },
    });
    if (response.status !== 206 && !response.ok) throw new Error("download");
    const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get("content-range") ?? "");
    const piece = new Uint8Array(await response.arrayBuffer());
    if (!match) {
      if (piece.byteLength < 1) throw new Error("download");
      return piece;
    }
    total = Number(match[3]);
    pieces.push(piece);
    start += piece.byteLength;
    if (piece.byteLength < 1 || start >= total) break;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const piece of pieces) {
    bytes.set(piece, offset);
    offset += piece.byteLength;
  }
  return bytes;
};

export const uploadSlideFile = async (date: string, storageId: string, file: Blob, name: string, type: string) => {
  if (file.size < 1 || file.size > SLIDE_MAX_BYTES) throw new Error("size");
  const id = slideFileId();
  const parts = slidePartCount(file.size);
  const media = type || (/\.(mp4|m4v|mov|webm)$/i.test(name) ? "video/mp4" : "image/jpeg");
  let saved: Partial<SlideImage> | null = null;
  for (let index = 0; index < parts; index += 1) {
    const start = index * SLIDE_PART_BYTES;
    const response = await fetch("/posting/slides", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-slide-date": date,
        "x-slide-storage": storageId,
        "x-slide-name": encodeURIComponent(name),
        "x-slide-type": media,
        "x-slide-size": String(file.size),
        "x-slide-id": id,
        "x-slide-part": String(index),
        "x-slide-parts": String(parts),
      },
      body: file.slice(start, Math.min(file.size, start + SLIDE_PART_BYTES)),
    });
    if (!response.ok) throw new Error(response.status === 413 ? "size" : "upload");
    if (index === parts - 1) saved = (await response.json()) as Partial<SlideImage>;
  }
  if (!saved?.id || !saved.name || !saved.type) throw new Error("upload");
  return { id: saved.id, name: saved.name, type: saved.type };
};

export const saveDownload = (href: string, name: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = name || "image";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/** Sends a video in PROOF_PART_BYTES pieces; the route reads `x-{prefix}-*` headers. Resolves with the generation id. */
const sendVideoParts = (url: string, prefix: string, file: File, extra: Record<string, string>, onProgress: (percent: number) => void) =>
  new Promise<string>((resolve, reject) => {
    const parts = Math.max(1, proofPartCount(file.size));
    const generation = (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}abcdefghijkl`)
      .replace(/-/g, "")
      .slice(0, 12);
    const send = (index: number) => {
      const start = index * PROOF_PART_BYTES;
      const blob = file.slice(start, Math.min(file.size, start + PROOF_PART_BYTES));
      const request = new XMLHttpRequest();
      request.open("POST", url);
      request.setRequestHeader("content-type", "application/octet-stream");
      const headers: Record<string, string> = {
        ...extra,
        generation,
        part: String(index),
        parts: String(parts),
        size: String(file.size),
        name: encodeURIComponent(file.name),
        type: /^video\/[a-z0-9.+-]+$/i.test(file.type) ? file.type : "video/mp4",
      };
      for (const [key, value] of Object.entries(headers)) request.setRequestHeader(`x-${prefix}-${key}`, value);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.min(99, Math.round(((start + event.loaded) / file.size) * 100)));
      };
      request.onload = () => {
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(String(request.status)));
          return;
        }
        if (index + 1 >= parts) {
          onProgress(100);
          resolve(generation);
          return;
        }
        send(index + 1);
      };
      request.onerror = () => reject(new Error("upload"));
      request.send(blob);
    };
    onProgress(0);
    send(0);
  });

export const uploadProof = async (file: File, date: string, onProgress: (percent: number) => void) => {
  await sendVideoParts("/posting/upload", "proof", file, { date }, onProgress);
};

export const uploadBilan = (file: File, onProgress: (percent: number) => void) =>
  sendVideoParts("/posting/bilan", "bilan", file, {}, onProgress);
