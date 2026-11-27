/** Tallest displayed frame kept as-is. Taller proof videos are scaled down before upload. */
export const PROOF_MAX_HEIGHT = 480;

/**
 * Constant rates so one hour of proof lands around 400 MB:
 * (800_000 + 128_000) * 3600 / 8 = 417_600_000 bytes.
 * Width follows the source aspect ratio; only height is capped.
 */
export const PROOF_VIDEO_BPS = 800_000;
export const PROOF_AUDIO_BPS = 128_000;

export const proofNeedsCompress = (displayHeight: number) =>
  Number.isFinite(displayHeight) && displayHeight > PROOF_MAX_HEIGHT;

export const proofEncodedBytes = (seconds: number) =>
  Math.ceil(((PROOF_VIDEO_BPS + PROOF_AUDIO_BPS) * seconds) / 8);

export const proofMp4Name = (name: string) => {
  const leaf = name.split(/[/\\]/).pop()?.replace(/\s+/g, " ").trim() || "video";
  const stem = leaf.replace(/\.[^./\\]+$/, "").trim() || "video";
  return `${stem.slice(0, 114)}.mp4`;
};
