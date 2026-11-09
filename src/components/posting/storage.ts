import { DayState, Desk, PROFILES, SlotId, emptyDayState, emptyDesk, isIsoDate, isSlotId } from "~/config/posting";

const DB_NAME = "taab-posting";
const STORE = "blobs";
const PREVIOUS_KEYS = ["taab:posting:v1", "taab:posting:v2", "taab:posting:v3"];
export const POSTING_STORAGE_KEY = "taab:posting:v4";

const dropPreviousDesk = () => {
  let hadPrevious = false;
  for (const key of PREVIOUS_KEYS) {
    if (localStorage.getItem(key)) hadPrevious = true;
    localStorage.removeItem(key);
  }
  if (hadPrevious) indexedDB.deleteDatabase(DB_NAME);
};

const asDay = (value: unknown): DayState => {
  const source = value && typeof value === "object" ? (value as Partial<DayState>) : {};
  const checks: Record<string, boolean> = {};
  if (source.checks && typeof source.checks === "object") {
    for (const [id, on] of Object.entries(source.checks)) if (on === true) checks[id] = true;
  }
  return {
    checks,
    proofName: typeof source.proofName === "string" && source.proofName ? source.proofName : null,
    validated: source.validated === true,
  };
};

export const parseDesk = (raw: string | null): Desk => {
  const base = emptyDesk();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<Desk> & { people?: { id?: string; name?: string }[] };
    const extras = Array.isArray(parsed.people)
      ? parsed.people
          .filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && !PROFILES.some((profile) => profile.id === item.id))
          .map((item) => ({ id: item.id as string, name: item.name?.trim() || "Personne" }))
      : [];
    const people = [...PROFILES.map((person) => ({ ...person })), ...extras];
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
    const taniaFiles: Desk["taniaFiles"] = {};
    if (parsed.taniaFiles && typeof parsed.taniaFiles === "object") {
      for (const [date, files] of Object.entries(parsed.taniaFiles)) {
        if (!isIsoDate(date) || !files || typeof files !== "object") continue;
        taniaFiles[date] = {};
        for (const [accountId, name] of Object.entries(files)) {
          const names = Array.isArray(name)
            ? name.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            : typeof name === "string" && name.trim()
              ? [name]
              : [];
          if (names.length > 0) taniaFiles[date][accountId] = names;
        }
      }
    }
    return { people, slots, weekValidated, days, taniaFiles };
  } catch {
    return base;
  }
};

export const readDesk = (): Desk => {
  try {
    dropPreviousDesk();
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
