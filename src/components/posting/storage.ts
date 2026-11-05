import { DayRecord, PostingMeta, emptyMeta, isIsoDate, isSlotId } from "~/config/posting";

export const POSTING_STORAGE_KEY = "taab:posting:v1";
const DB_NAME = "taab-posting";
const STORE = "blobs";

const emptyDay = (): DayRecord => ({ slot: null, tasks: {}, proofName: null });

const asRecord = (value: unknown): DayRecord => {
  const source = value && typeof value === "object" ? (value as Partial<DayRecord>) : {};
  const tasks = source.tasks && typeof source.tasks === "object" ? source.tasks : {};
  return {
    slot: typeof source.slot === "string" && isSlotId(source.slot) ? source.slot : null,
    tasks,
    proofName: typeof source.proofName === "string" && source.proofName ? source.proofName : null,
  };
};

export const parseMeta = (raw: string | null): PostingMeta => {
  const base = emptyMeta();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<PostingMeta>;
    const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
    const named = base.accounts.map((account) => {
      const found = accounts.find((item) => item && item.id === account.id && typeof item.name === "string");
      const name = found?.name.trim();
      return { id: account.id, name: name || account.name };
    });
    const days: PostingMeta["days"] = {};
    if (parsed.days && typeof parsed.days === "object") {
      for (const [date, record] of Object.entries(parsed.days)) {
        if (isIsoDate(date)) days[date] = asRecord(record);
      }
    }
    const videos = Array.isArray(parsed.videos)
      ? parsed.videos.filter(
          (video) =>
            video &&
            typeof video.id === "string" &&
            typeof video.accountId === "string" &&
            typeof video.date === "string" &&
            isIsoDate(video.date) &&
            named.some((account) => account.id === video.accountId)
        )
      : [];
    return { accounts: named, days, videos };
  } catch {
    return base;
  }
};

export const readMeta = (): PostingMeta => {
  try {
    return parseMeta(localStorage.getItem(POSTING_STORAGE_KEY));
  } catch {
    return emptyMeta();
  }
};

export const writeMeta = (meta: PostingMeta) => {
  localStorage.setItem(POSTING_STORAGE_KEY, JSON.stringify(meta));
};

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveBlob = async (key: string, blob: Blob) => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

export const loadBlob = async (key: string) => {
  const db = await openDb();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return blob;
};

export { emptyDay };
