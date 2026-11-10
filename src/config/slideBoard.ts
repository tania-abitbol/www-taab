export const SLIDE_MAX_BYTES = 5 * 1024 * 1024;
export const SLIDE_FROM = "2026-11-10";
export const SLIDE_UNTIL = "2026-11-15";

export type SlideImage = { id: string; name: string; type: string };

export type SlideBoard = {
  files: Record<string, Record<string, SlideImage[]>>;
  captions: Record<string, Record<string, string>>;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STORAGE = /^p[a-z0-9-]{1,40}__(fr|es|us)$/;
const IMAGE_ID = /^[a-f0-9]{16}$/;
const PROFILE = /^p[a-z0-9-]{1,40}$/;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif"]);

export const emptySlideBoard = (): SlideBoard => ({ files: {}, captions: {} });

export const slideDateOk = (date: string) => DATE.test(date) && date >= SLIDE_FROM && date <= SLIDE_UNTIL;

export const slideStorageOk = (storageId: string) => STORAGE.test(storageId);

export const slideImageIdOk = (id: string) => IMAGE_ID.test(id);

export const cleanSlideName = (name: string) => {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const trimmed = base.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
  return trimmed || "image";
};

export const cleanSlideType = (type: string) => (TYPES.has(type) ? type : "image/jpeg");

const cleanImages = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is SlideImage => {
      if (!item || typeof item !== "object") return false;
      const image = item as Partial<SlideImage>;
      return typeof image.id === "string" && IMAGE_ID.test(image.id) && typeof image.name === "string" && typeof image.type === "string";
    })
    .slice(0, 12)
    .map((image) => ({ id: image.id, name: cleanSlideName(image.name), type: cleanSlideType(image.type) }));
};

export const cleanSlideBoard = (value: unknown): SlideBoard => {
  const board = emptySlideBoard();
  if (!value || typeof value !== "object") return board;
  const source = value as { files?: unknown; captions?: unknown };
  if (source.files && typeof source.files === "object") {
    for (const [date, byStorage] of Object.entries(source.files)) {
      if (!slideDateOk(date) || !byStorage || typeof byStorage !== "object") continue;
      for (const [storageId, images] of Object.entries(byStorage)) {
        if (!slideStorageOk(storageId)) continue;
        const clean = cleanImages(images);
        if (!clean.length) continue;
        board.files[date] = { ...(board.files[date] ?? {}), [storageId]: clean };
      }
    }
  }
  if (source.captions && typeof source.captions === "object") {
    for (const [date, byStorage] of Object.entries(source.captions)) {
      if (!slideDateOk(date) || !byStorage || typeof byStorage !== "object") continue;
      for (const [storageId, text] of Object.entries(byStorage)) {
        if (!slideStorageOk(storageId) || typeof text !== "string") continue;
        board.captions[date] = { ...(board.captions[date] ?? {}), [storageId]: text.slice(0, 500) };
      }
    }
  }
  return board;
};

export const replaceCard = (board: SlideBoard, date: string, storageId: string, images: SlideImage[]): SlideBoard => {
  const next = cleanSlideBoard(board);
  if (!slideDateOk(date) || !slideStorageOk(storageId)) return next;
  const files = { ...(next.files[date] ?? {}) };
  const clean = cleanImages(images);
  if (clean.length) files[storageId] = clean;
  else delete files[storageId];
  const all = { ...next.files };
  if (Object.keys(files).length) all[date] = files;
  else delete all[date];
  return { files: all, captions: next.captions };
};

export const removeAt = (board: SlideBoard, date: string, storageId: string, index: number): SlideBoard => {
  const current = cleanSlideBoard(board).files[date]?.[storageId] ?? [];
  if (!current[index]) return cleanSlideBoard(board);
  return replaceCard(board, date, storageId, current.filter((_, item) => item !== index));
};

export const setCaption = (board: SlideBoard, date: string, storageId: string, caption: string): SlideBoard => {
  const next = cleanSlideBoard(board);
  if (!slideDateOk(date) || !slideStorageOk(storageId)) return next;
  return {
    files: next.files,
    captions: { ...next.captions, [date]: { ...(next.captions[date] ?? {}), [storageId]: caption.slice(0, 500) } },
  };
};

export const visibleBoard = (board: SlideBoard, role: string): SlideBoard => {
  const next = cleanSlideBoard(board);
  if (role === "tania") return next;
  if (!PROFILE.test(role)) return emptySlideBoard();
  const prefix = `${role}__`;
  const files: SlideBoard["files"] = {};
  const captions: SlideBoard["captions"] = {};
  for (const [date, byStorage] of Object.entries(next.files)) {
    for (const [storageId, images] of Object.entries(byStorage)) {
      if (!storageId.startsWith(prefix)) continue;
      files[date] = { ...(files[date] ?? {}), [storageId]: images };
    }
  }
  for (const [date, byStorage] of Object.entries(next.captions)) {
    for (const [storageId, text] of Object.entries(byStorage)) {
      if (!storageId.startsWith(prefix)) continue;
      captions[date] = { ...(captions[date] ?? {}), [storageId]: text };
    }
  }
  return { files, captions };
};

export const findSlide = (board: SlideBoard, id: string) => {
  if (!slideImageIdOk(id)) return null;
  for (const [date, byStorage] of Object.entries(board.files)) {
    for (const [storageId, images] of Object.entries(byStorage)) {
      const image = images.find((item) => item.id === id);
      if (image) return { date, storageId, image };
    }
  }
  return null;
};
