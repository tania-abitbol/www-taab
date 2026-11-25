import { capPercent, proofIsComplete, type StoredProofStatus } from "~/config/proofResume";
import { SLIDE_MAX_BYTES, SLIDE_PART_BYTES, slidePartCount, type SlideImage } from "~/config/slideBoard";
import { ackAttempt, attemptStart, markAttemptDone, readAttempt } from "~/components/posting/proofSend";
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

const mintGeneration = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}abcdefghijkl`).replace(/-/g, "").slice(0, 12);

const retryableStatus = (status: number) => status === 0 || status === 408 || status === 502 || status === 503 || status === 504;

type PartResume = {
  generation: string;
  begin: number;
  confirm: () => Promise<boolean>;
  onAck: (index: number) => void;
};

/** Sends a video in PROOF_PART_BYTES pieces; the route reads `x-{prefix}-*` headers. Resolves with the generation id. */
const sendVideoParts = (
  url: string,
  prefix: string,
  file: File,
  extra: Record<string, string>,
  onProgress: (percent: number) => void,
  resume?: PartResume,
) =>
  new Promise<string>((resolve, reject) => {
    const parts = Math.max(1, proofPartCount(file.size));
    const generation = resume?.generation || mintGeneration();
    let floor = 0;
    let ticket = 0;
    const report = (sent: number, done = false) => {
      if (done) {
        floor = 100;
        onProgress(100);
        return;
      }
      floor = capPercent(sent, file.size, floor);
      onProgress(floor);
    };
    const send = (index: number, tries: number) => {
      const mine = ++ticket;
      const start = index * PROOF_PART_BYTES;
      const blob = file.slice(start, Math.min(file.size, start + PROOF_PART_BYTES));
      const request = new XMLHttpRequest();
      let opened = true;
      request.open("POST", url);
      request.timeout = 120_000;
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
      let bodySent = false;
      request.upload.onprogress = (event) => {
        if (!opened || mine !== ticket || !event.lengthComputable) return;
        if (event.loaded >= blob.size) bodySent = true;
        report(start + event.loaded);
      };
      request.upload.onload = () => {
        bodySent = true;
      };
      const fail = (status: number) => {
        if (!opened || mine !== ticket) return;
        opened = false;
        const retry = Boolean(resume) && retryableStatus(status) && tries < 2;
        if (retry) {
          try {
            request.abort();
          } catch {
            // The failed request is already closed.
          }
          send(index, tries + 1);
          return;
        }
        const lost = Boolean(resume) && retryableStatus(status) && (bodySent || index + 1 >= parts);
        if (!lost || !resume) {
          reject(new Error(status ? String(status) : "upload"));
          return;
        }
        void resume.confirm().then(
          (done) => {
            if (mine !== ticket) return;
            if (done) {
              report(file.size, true);
              resolve(generation);
              return;
            }
            reject(new Error(status ? String(status) : "upload"));
          },
          () => {
            if (mine === ticket) reject(new Error(status ? String(status) : "upload"));
          },
        );
      };
      request.onload = () => {
        if (!opened || mine !== ticket) return;
        if (request.status < 200 || request.status >= 300) {
          fail(request.status);
          return;
        }
        opened = false;
        resume?.onAck(index);
        if (index + 1 >= parts) {
          report(file.size, true);
          resolve(generation);
          return;
        }
        send(index + 1, 0);
      };
      request.onerror = () => fail(0);
      request.ontimeout = () => fail(408);
      request.send(blob);
    };
    const begin = Math.min(parts - 1, Math.max(0, resume?.begin ?? 0));
    void (async () => {
      if (resume && (await resume.confirm().catch(() => false))) {
        report(file.size, true);
        resolve(generation);
        return;
      }
      if (begin > 0) report(begin * PROOF_PART_BYTES);
      else onProgress(0);
      send(begin, 0);
    })();
  });

const confirmProof = async (date: string, file: File) => {
  const response = await fetch(`/posting/upload?date=${encodeURIComponent(date)}`, { cache: "no-store" });
  if (!response.ok) return false;
  return proofIsComplete((await response.json()) as StoredProofStatus, file);
};

export const uploadProof = async (file: File, date: string, onProgress: (percent: number) => void, attemptKey?: string) => {
  const attempt = attemptKey ? readAttempt(attemptKey) : null;
  if (attempt && attemptStart(attempt) === "done") {
    onProgress(100);
    return;
  }
  const start = attempt ? attemptStart(attempt) : 0;
  await sendVideoParts("/posting/upload", "proof", file, { date }, onProgress, {
    generation: attempt?.generation || mintGeneration(),
    begin: start === "done" ? 0 : start,
    confirm: () => confirmProof(date, file),
    onAck: (index) => {
      if (attemptKey) ackAttempt(attemptKey, index);
    },
  });
  if (attemptKey) markAttemptDone(attemptKey);
};

export const uploadBilan = (file: File, onProgress: (percent: number) => void) =>
  sendVideoParts("/posting/bilan", "bilan", file, {}, onProgress);
