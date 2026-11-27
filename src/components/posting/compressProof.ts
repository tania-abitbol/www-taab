import type { BufferTarget, StreamTarget } from "mediabunny";

import { PROOF_AUDIO_BPS, PROOF_MAX_HEIGHT, PROOF_VIDEO_BPS, proofMp4Name, proofNeedsCompress } from "~/config/proofCompress";
import { nextCompressPercent } from "~/config/proofResume";

export type CompressedProof = {
  file: File;
  /** Drops a temporary transcode. A skipped file has nothing to drop. */
  release: () => Promise<void>;
};

const noop = async () => {};

const kept = (file: File): CompressedProof => ({ file, release: noop });

/** No progress for this long means the transcode is stuck. A moving encode resets it. */
const STALL_MS = 180_000;

const openStall = (onStall: () => void) => {
  let timer = 0;
  let rejectStall: ((error: Error) => void) | null = null;
  const promise = new Promise<never>((_resolve, reject) => {
    rejectStall = reject;
  });
  void promise.catch(() => undefined);
  const arm = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      onStall();
      rejectStall?.(new Error("compress"));
    }, STALL_MS);
  };
  const stop = () => {
    window.clearTimeout(timer);
    rejectStall = null;
  };
  return { promise, arm, stop };
};

const METADATA_MS = 45_000;

/** Display height after rotation, or null when the phone cannot read the file. */
const readDisplayHeight = (file: File) =>
  new Promise<number | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (height: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.removeAttribute("src");
      video.load();
      video.remove();
      resolve(height !== null && height > 0 ? height : null);
    };
    const timer = window.setTimeout(() => finish(null), METADATA_MS);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-hidden", "true");
    video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
    video.onloadedmetadata = () => finish(video.videoHeight);
    video.onerror = () => finish(null);
    document.body.append(video);
    video.src = url;
  });

type TempDir = {
  getFileHandle: (name: string, options: { create: boolean }) => Promise<FileSystemFileHandle>;
  removeEntry: (name: string) => Promise<void>;
  entries?: () => AsyncIterable<[string, unknown]>;
};

const liveTemps = new Set<string>();
let sweepTask: Promise<void> | null = null;

const openDirectory = async (): Promise<TempDir | null> => {
  const storage = navigator.storage as StorageManager & { getDirectory?: () => Promise<TempDir> };
  if (!storage?.getDirectory) return null;
  try {
    return await storage.getDirectory();
  } catch {
    return null;
  }
};

const sweepStale = async () => {
  if (sweepTask) return sweepTask;
  sweepTask = (async () => {
    const root = await openDirectory();
    if (!root?.entries) return;
    for await (const [entryName] of root.entries()) {
      if (entryName.startsWith("proof-tmp-") && !liveTemps.has(entryName)) {
        await root.removeEntry(entryName).catch(() => undefined);
      }
    }
  })();
  return sweepTask;
};

/**
 * Scales a proof video to at most 480p on the phone, before any upload.
 * Width follows the source aspect ratio. A frame already 480 tall or shorter is returned unchanged.
 * Throws when the transcode fails or stalls. The caller then sends the picked file once.
 * A transcode that finishes is the 480p file.
 */
export const compressProof = async (file: File, onProgress: (percent: number) => void): Promise<CompressedProof> => {
  await sweepStale().catch(() => undefined);
  const hinted = await readDisplayHeight(file).catch(() => null);
  if (hinted !== null && !proofNeedsCompress(hinted)) return kept(file);

  const { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output, Quality, StreamTarget } = await import(
    "mediabunny"
  );
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  let release = noop;
  let cancel: () => Promise<void> = noop;
  const clock = openStall(() => {
    void cancel();
  });
  const guard = <T>(work: Promise<T>) => Promise.race([work, clock.promise]);
  try {
    clock.arm();
    const track = await guard(input.getPrimaryVideoTrack());
    const height = track ? await guard(track.getDisplayHeight()) : 0;
    if (!track || !Number.isFinite(height) || height <= 0) throw new Error("compress");
    if (!proofNeedsCompress(height) && (hinted === null || !proofNeedsCompress(hinted))) return kept(file);

    onProgress(0);
    const niceName = proofMp4Name(file.name);
    const tempName = `proof-tmp-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(16)}.mp4`;
    const opened = await guard(openDiskSink(tempName, niceName, StreamTarget));
    const sink = opened ?? openMemorySink(niceName, BufferTarget);
    const target = sink.target;
    const packed = sink.packed;
    release = sink.release;
    cancel = sink.cancel;

    const output = new Output({
      format: new Mp4OutputFormat({ fastStart: false }),
      target,
    });
    clock.arm();
    const conversion = await guard(
      Conversion.init({
        input,
        output,
        tracks: "primary",
        tags: {},
        showWarnings: false,
        video: {
          codec: "avc",
          ...(proofNeedsCompress(height) ? { height: PROOF_MAX_HEIGHT } : {}),
          allowTransformationMetadata: false,
          hardwareAcceleration: "prefer-hardware",
          quality: new Quality({ bitrate: PROOF_VIDEO_BPS, bitrateMode: "constant" }),
        },
        audio: {
          codec: "aac",
          quality: new Quality({ bitrate: PROOF_AUDIO_BPS, bitrateMode: "constant" }),
        },
      }),
    );
    if (!conversion.isValid || !conversion.utilizedTracks.some((item) => item.isVideoTrack())) throw new Error("compress");
    let last = -1;
    conversion.onProgress = (progress: number) => {
      clock.arm();
      const percent = nextCompressPercent(last, progress);
      if (percent === last) return;
      last = percent;
      onProgress(percent);
    };
    const drop = cancel;
    cancel = async () => {
      await conversion.cancel().catch(() => undefined);
      await drop();
    };
    clock.arm();
    await guard(conversion.execute());
    clock.stop();
    const smaller = await packed();
    sink.keep?.();
    onProgress(100);
    const done = release;
    release = noop;
    cancel = noop;
    return { file: smaller, release: done };
  } catch (error) {
    await cancel();
    release = noop;
    throw error instanceof Error ? error : new Error("compress");
  } finally {
    clock.stop();
    try {
      input.dispose();
    } catch {
      // The finished file does not depend on the reader.
    }
  }
};

type Sink = {
  target: BufferTarget | StreamTarget;
  packed: () => Promise<File>;
  release: () => Promise<void>;
  cancel: () => Promise<void>;
  keep?: () => void;
};

const openDiskSink = async (tempName: string, niceName: string, StreamTargetCtor: typeof StreamTarget): Promise<Sink | null> => {
  const root = await openDirectory();
  if (!root) return null;
  try {
    const handle = await root.getFileHandle(tempName, { create: true });
    const writable = await handle.createWritable();
    const release = async () => {
      liveTemps.delete(tempName);
      await root.removeEntry(tempName).catch(() => undefined);
    };
    return {
      target: new StreamTargetCtor(writable as unknown as ConstructorParameters<typeof StreamTarget>[0], {
        chunked: true,
        chunkSize: 8 * 1024 * 1024,
      }),
      packed: async () => {
        const stored = await handle.getFile();
        if (stored.size < 1) throw new Error("compress");
        return new File([stored], niceName, { type: "video/mp4" });
      },
      release,
      cancel: async () => {
        await writable.abort().catch(() => undefined);
        await release();
      },
      keep: () => liveTemps.add(tempName),
    };
  } catch {
    await root.removeEntry(tempName).catch(() => undefined);
    return null;
  }
};

const openMemorySink = (niceName: string, BufferTargetCtor: typeof BufferTarget): Sink => {
  const memory = new BufferTargetCtor();
  return {
    target: memory,
    packed: async () => {
      const buffer = memory.buffer;
      if (!buffer || buffer.byteLength < 1) throw new Error("compress");
      return new File([buffer], niceName, { type: "video/mp4" });
    },
    release: noop,
    cancel: noop,
  };
};
