import {
  ACCOUNTS,
  DayState,
  Desk,
  Person,
  SlotId,
  emptyDayState,
  emptyDesk,
  isIsoDate,
  isSlotId,
} from "~/config/posting";

export const POSTING_STORAGE_KEY = "taab:posting:v2";
const DB_NAME = "taab-posting";
const STORE = "blobs";

const asPeople = (value: unknown, fallback: Person[]) => {
  if (!Array.isArray(value)) return fallback;
  const people = value
    .filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
    .map((item) => ({ id: item.id, name: item.name.trim() || "Personne" }));
  return people.length > 0 ? people : fallback;
};

const asDay = (value: unknown): DayState => {
  const source = value && typeof value === "object" ? (value as Partial<DayState>) : {};
  const checks: Record<string, boolean> = {};
  if (source.checks && typeof source.checks === "object") {
    for (const [id, on] of Object.entries(source.checks)) if (on === true) checks[id] = true;
  }
  const publishers = Array.isArray(source.publishers)
    ? source.publishers.filter((id): id is string => ACCOUNTS.some((account) => account.id === id))
    : [];
  return {
    checks,
    proofName: typeof source.proofName === "string" && source.proofName ? source.proofName : null,
    validated: source.validated === true,
    slideshowAccount: ACCOUNTS.some((account) => account.id === source.slideshowAccount) ? String(source.slideshowAccount) : null,
    publishers,
  };
};

export const parseDesk = (raw: string | null): Desk => {
  const base = emptyDesk();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<Desk>;
    const people = asPeople(parsed.people, base.people);
    const slots: Desk["slots"] = {};
    if (parsed.slots && typeof parsed.slots === "object") {
      for (const [personId, byDate] of Object.entries(parsed.slots)) {
        if (!people.some((person) => person.id === personId) || !byDate || typeof byDate !== "object") continue;
        slots[personId] = {};
        for (const [date, chosen] of Object.entries(byDate)) {
          if (!isIsoDate(date) || !Array.isArray(chosen)) continue;
          slots[personId][date] = chosen.filter((id): id is SlotId => typeof id === "string" && isSlotId(id));
        }
      }
    }
    const weekValidated: Record<string, boolean> = {};
    if (parsed.weekValidated && typeof parsed.weekValidated === "object") {
      for (const person of people) if (parsed.weekValidated[person.id] === true) weekValidated[person.id] = true;
    }
    const days: Desk["days"] = {};
    if (parsed.days && typeof parsed.days === "object") {
      for (const [personId, byDate] of Object.entries(parsed.days)) {
        if (!people.some((person) => person.id === personId) || !byDate || typeof byDate !== "object") continue;
        days[personId] = {};
        for (const [date, record] of Object.entries(byDate)) {
          if (isIsoDate(date)) days[personId][date] = asDay(record);
        }
      }
    }
    return {
      people,
      slots,
      weekValidated,
      taniaValidated: parsed.taniaValidated === true && people.every((person) => weekValidated[person.id]),
      days,
      taniaFileName: typeof parsed.taniaFileName === "string" && parsed.taniaFileName ? parsed.taniaFileName : null,
    };
  } catch {
    return base;
  }
};

export const readDesk = (): Desk => {
  try {
    return parseDesk(localStorage.getItem(POSTING_STORAGE_KEY));
  } catch {
    return emptyDesk();
  }
};

export const writeDesk = (desk: Desk) => {
  localStorage.setItem(POSTING_STORAGE_KEY, JSON.stringify(desk));
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

export { emptyDayState };
