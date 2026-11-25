import { ackCursor, cursorFor, partToSend, type ProofCursor } from "~/config/proofResume";

export type LiveAttempt = ProofCursor & {
  key: string;
  file: File;
  release: () => Promise<void>;
};

const attempts = new Map<string, LiveAttempt>();
const jobs = new Map<string, Promise<unknown>>();
const failedAt = new Map<string, number>();

const RETRY_GAP_MS = 1500;

export const proofFileKey = (date: string, file: { name: string; size: number; lastModified: number }) =>
  `${date}:${file.size}:${file.lastModified}:${file.name}`;

export const readAttempt = (key: string) => attempts.get(key) ?? null;

/** Keeps the generation and the compressed file. A second call for the same video does not mint a new upload. */
export const rememberAttempt = (key: string, file: File, release: () => Promise<void>, mint: () => string) => {
  const existing = attempts.get(key);
  if (existing) return existing;
  const created: LiveAttempt = { key, file, release, ...cursorFor(file.size, mint) };
  attempts.set(key, created);
  return created;
};

export const ackAttempt = (key: string, index: number) => {
  const attempt = attempts.get(key);
  if (!attempt) return null;
  const next = { ...attempt, ...ackCursor(attempt, index), file: attempt.file, release: attempt.release, key: attempt.key };
  attempts.set(key, next);
  return next;
};

export const markAttemptDone = (key: string) => {
  const attempt = attempts.get(key);
  if (!attempt) return;
  attempts.set(key, { ...attempt, done: true, next: attempt.parts });
};

export const dropAttempt = async (key: string) => {
  const attempt = attempts.get(key);
  attempts.delete(key);
  await attempt?.release();
};

export const attemptStart = (attempt: LiveAttempt) => partToSend(attempt);

/** One in-flight send per video. A second change event waits on the same work instead of starting at byte 0. */
export const joinProofJob = <T>(key: string, job: () => Promise<T>): Promise<T> => {
  const current = jobs.get(key) as Promise<T> | undefined;
  if (current) return current;
  const next = job().finally(() => {
    if (jobs.get(key) === next) jobs.delete(key);
  });
  jobs.set(key, next);
  return next;
};

export const blockProofRetry = (key: string, now = Date.now()) => {
  failedAt.set(key, now);
};

export const clearProofRetry = (key: string) => {
  failedAt.delete(key);
};

/** The phone re-fires the file input when the bar clears. Ignore that echo; a later tap still works. */
export const proofRetryBlocked = (key: string, now = Date.now()) => now - (failedAt.get(key) ?? 0) < RETRY_GAP_MS;

export const resetProofSends = () => {
  attempts.clear();
  jobs.clear();
  failedAt.clear();
};
