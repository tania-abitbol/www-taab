import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import {
  type SlideBoard,
  type SlideImage,
  SLIDE_MAX_BYTES,
  cleanSlideBoard,
  emptySlideBoard,
  removeAt,
  replaceCard,
  setCaption,
  slideImageIdOk,
} from "~/config/slideBoard";
import { callProductionAction, mirrorPosting, readLivePosting, readProductionSlide } from "~/server/postingLive";

const STORE = "posting-work";
const BOARD_KEY = "slides";

type BlobsContext = {
  siteID?: string;
  token?: string;
  apiURL?: string;
};

const blobsContext = (): BlobsContext | null => {
  const raw = (globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext ?? process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) return null;
  if (typeof raw === "object") {
    const context = raw as BlobsContext;
    return context.siteID && context.token ? context : null;
  }
  if (typeof raw !== "string") return null;
  try {
    const context = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as BlobsContext;
    return context.siteID && context.token ? context : null;
  } catch {
    return null;
  }
};

const remote = () => Boolean(blobsContext()?.siteID && blobsContext()?.token);

const dir = () => process.env.POSTING_SLIDES_DIR || path.join(process.cwd(), ".data", "posting-slides");

const endpoint = (context: BlobsContext, key: string) =>
  new URL(`/api/v1/blobs/${context.siteID}/${STORE}/${key}`, context.apiURL || "https://api.netlify.com");

const sign = async (key: string, method: "GET" | "PUT") => {
  const context = blobsContext();
  if (!context?.siteID || !context.token) return null;
  const response = await fetch(endpoint(context, key), {
    method,
    headers: { authorization: `Bearer ${context.token}`, accept: "application/json;type=signed-url" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("slide-sign");
  const body = (await response.json()) as { url?: string };
  if (!body.url) throw new Error("slide-sign");
  return body.url;
};

const readBoard = async (): Promise<SlideBoard> => {
  if (mirrorPosting()) {
    const live = await readLivePosting();
    if (!live) throw new Error("live-posting");
    return live.slides;
  }
  if (remote()) {
    const url = await sign(BOARD_KEY, "GET");
    if (!url) return emptySlideBoard();
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (response.status === 404 || !response.ok) return emptySlideBoard();
    try {
      return cleanSlideBoard(await response.json());
    } catch {
      return emptySlideBoard();
    }
  }
  try {
    return cleanSlideBoard(JSON.parse(await readFile(path.join(dir(), "board.json"), "utf8")));
  } catch {
    return emptySlideBoard();
  }
};

const writeBoard = async (board: SlideBoard) => {
  const clean = cleanSlideBoard(board);
  if (remote()) {
    const url = await sign(BOARD_KEY, "PUT");
    if (!url) throw new Error("slide-sign");
    const response = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(clean),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("slide-write");
    return;
  }
  await mkdir(dir(), { recursive: true });
  await writeFile(path.join(dir(), "board.json"), JSON.stringify(clean));
};

let queue = Promise.resolve();

const enqueue = <T>(job: () => Promise<T>) => {
  const run = queue.then(job);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

export const loadSlideBoard = () => readBoard();

export const saveSlideImage = async (id: string, bytes: Uint8Array) => {
  if (!slideImageIdOk(id) || bytes.byteLength < 1 || bytes.byteLength > SLIDE_MAX_BYTES) throw new Error("slide-size");
  if (mirrorPosting()) throw new Error("slide-write");
  if (!remote()) {
    await mkdir(dir(), { recursive: true });
    await writeFile(path.join(dir(), `img-${id}`), bytes);
    return;
  }
  const url = await sign(`slide-img-${id}`, "PUT");
  if (!url) throw new Error("slide-sign");
  const response = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream" },
    body: bytes,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("slide-write");
};

export const readSlideBytes = async (id: string) => {
  if (!slideImageIdOk(id)) return null;
  if (mirrorPosting()) return readProductionSlide(id);
  if (!remote()) {
    try {
      return new Uint8Array(await readFile(path.join(dir(), `img-${id}`)));
    } catch {
      return null;
    }
  }
  const url = await sign(`slide-img-${id}`, "GET");
  if (!url) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) return null;
  return new Uint8Array(await response.arrayBuffer());
};

export const replaceSlideCard = (date: string, storageId: string, images: SlideImage[]) =>
  enqueue(async () => {
    const clean = replaceCard(emptySlideBoard(), date, storageId, images).files[date]?.[storageId] ?? [];
    if (clean.length !== images.length) throw new Error("slide-images");
    if (mirrorPosting()) {
      const result = await callProductionAction("publishSlides", [date, storageId, clean]);
      if (!result.ok || !result.board) throw new Error("slide-write");
      return cleanSlideBoard(result.board);
    }
    const next = replaceCard(await readBoard(), date, storageId, clean);
    await writeBoard(next);
    return next;
  });

export const captionSlideCard = (date: string, storageId: string, caption: string) =>
  enqueue(async () => {
    const text = caption.slice(0, 500);
    if (mirrorPosting()) {
      const result = await callProductionAction("publishSlideCaption", [date, storageId, text]);
      const board = result.board ? cleanSlideBoard(result.board) : null;
      if (!result.ok || board?.captions[date]?.[storageId] !== text) throw new Error("slide-caption");
      return board;
    }
    const current = await readBoard();
    const next = setCaption(current, date, storageId, text);
    if (next.captions[date]?.[storageId] !== text) throw new Error("slide-caption");
    await writeBoard(next);
    return next;
  });

/** Drops the image from the shared list. The stored bytes stay. */
export const hideSlideAt = (date: string, storageId: string, index: number) =>
  enqueue(async () => {
    if (mirrorPosting()) {
      const result = await callProductionAction("dropSharedSlide", [date, storageId, index]);
      if (!result.ok || !result.board) throw new Error("slide-index");
      return cleanSlideBoard(result.board);
    }
    const current = await readBoard();
    if (!current.files[date]?.[storageId]?.[index]) throw new Error("slide-index");
    const next = removeAt(current, date, storageId, index);
    await writeBoard(next);
    return next;
  });
