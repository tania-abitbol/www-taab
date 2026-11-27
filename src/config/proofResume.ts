import { proofFileName, proofPartCount } from "~/server/postingProofs";

/** What the upload route reports for this day. `size` is null only when the copy has no length stored. */
export type StoredProofStatus = {
  done?: boolean;
  name?: string | null;
  size?: number | null;
};

export type ProofCursor = {
  generation: string;
  parts: number;
  /** Next part index to send. `parts` means every part was acknowledged. */
  next: number;
  done: boolean;
};

/** Compression UI must not run backwards when a track finishes ahead of the other. */
export const nextCompressPercent = (last: number, progress: number) => {
  const percent = Math.min(99, Math.max(0, Math.round((Number.isFinite(progress) ? progress : 0) * 100)));
  return percent < last ? last : percent;
};

/** Bar percent for bytes already handed to the network. Never below `floor`, never 100 — 100 is the saved file. */
export const capPercent = (sentBytes: number, fileSize: number, floor: number) => {
  if (!Number.isFinite(fileSize) || fileSize <= 0) return Math.min(99, Math.max(0, floor));
  const raw = Math.round((Math.max(0, sentBytes) / fileSize) * 100);
  return Math.max(Math.min(99, Math.max(0, floor)), Math.min(99, raw));
};

/**
 * A stored proof matches this file when the name and, when known, the length match.
 * A different length is a different video and must upload.
 */
export const proofIsComplete = (remote: StoredProofStatus | null, file: { name: string; size: number }) => {
  if (!remote?.done || !remote.name) return false;
  if (proofFileName(remote.name) !== proofFileName(file.name)) return false;
  if (typeof remote.size === "number" && remote.size !== file.size) return false;
  return true;
};

export const cursorFor = (fileSize: number, mint: () => string): ProofCursor => ({
  generation: mint(),
  parts: Math.max(1, proofPartCount(fileSize)),
  next: 0,
  done: false,
});

/** Part index to send. `"done"` when this attempt is already finished. The last part is sent again when every part was acknowledged but the attempt was not closed. */
export const partToSend = (cursor: ProofCursor): number | "done" => {
  if (cursor.done) return "done";
  if (cursor.next >= cursor.parts) return cursor.parts - 1;
  return cursor.next;
};

export const ackCursor = (cursor: ProofCursor, index: number): ProofCursor => {
  if (index < 0 || index >= cursor.parts) return cursor;
  return { ...cursor, next: Math.max(cursor.next, index + 1) };
};
