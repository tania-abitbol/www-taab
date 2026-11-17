"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ACCOUNTS,
  ACTIVE_WEEK_START,
  CALENDAR_END,
  DAY_PLANS,
  WORKER_VISIBLE_THROUGH,
  calendarDates,
  workerVisiblePlans,
  chooseSlot,
  DayState,
  Desk,
  SLOTS,
  SlotId,
  checksFor,
  dayHeading,
  emptyDayState,
  CheckItem,
  formatDay,
  formatShortDay,
  isSlotId,
  PostingLang,
  accountWord,
  displayName,
  langFromName,
  personMark,
  postingUi,
  showHoursVary,
  missedProofDate,
  sundayCatchupFor,
  slotsFor,
  taskIsHers,
  BILAN_DATE,
  calendarDate,
  timeZoneForGirl,
  girlLabel,
  type AccountName,
  type DayPlan,
} from "~/config/posting";
import { AdminSummary, type SummaryCell } from "~/components/posting/AdminSummary";
import { ProofPlayer } from "~/components/posting/ProofPlayer";
import { hourText } from "~/components/posting/SlotPicker";
import { ACCOUNT_TONE } from "~/components/posting/accountTone";
import { Checklist } from "~/components/posting/Checklist";
import type { DayCardProps } from "~/components/posting/DayCard";
import { SaveStatus, type SaveState } from "~/components/posting/SaveStatus";
import { SlotPicker } from "~/components/posting/SlotPicker";
import { WorkerView } from "~/components/posting/WorkerView";
import { BILAN_MAX_BYTES } from "~/config/bilanVideo";
import { SLIDE_FROM, SLIDE_UNTIL, slideshowOf, type SlideBoard, type SlideImage } from "~/config/slideBoard";
import { zipStoredFiles } from "~/config/slideZip";
import { leavePosting } from "~/app/dashboard/creator/actions";
import { addManagedProfile, commitProof, deleteManagedProfile, deleteValidatedDay, dropSharedSlide, loadSharedSlides, prepareProofUpload, publishSlideCaption, publishSlides, saveManagedProfile, saveMyDay } from "~/app/posting/actions";
import { type DayWork, type ProfileWork, type ProofRecord } from "~/server/postingProofs";
import { deleteBlob, loadBlob, readDesk, saveBlob, writeDesk } from "~/components/posting/storage";
import { ProfileEditor, fieldClass, type ManagedProfile } from "~/components/posting/ProfileEditor";
import { AccountChecks, TaskCopy, TaskFace, type SlideLineActions } from "~/components/posting/TaskParts";
import { BilanPlayer, ProofFeedback } from "~/components/posting/UploadFeedback";
import { readSharedFile, saveDownload, uploadBilan, uploadProof, uploadSlideFile } from "~/components/posting/uploads";
import { adminCopy, slideCopy, sundayCatchupCopy } from "~/config/postingCopy";

const proofKey = (personId: string, date: string) => `proof:${personId}:${date}`;

const slideKey = (date: string, profileId: string, index = 0) => `tania:${date}:${profileId}:${index}`;
const legacySlideKey = (date: string, accountId: string) => `tania:${date}:${accountId}`;
const accountForLang = (value: PostingLang) => (value === "es" ? "es" : value === "en" ? "us" : "fr");
const slideStorageId = (profileId: string, accountId: string) => `${profileId}__${accountId}`;
const girlRank = (name: string) => {
  const key = displayName(name).toLowerCase();
  if (key === "ghada") return 0;
  if (key === "peches") return 1;
  if (key === "karol") return 2;
  return 3;
};
const slideGirls = (people: { id: string; name: string }[]) =>
  [...people].filter((worker) => girlRank(worker.name) < 3).sort((a, b) => girlRank(a.name) - girlRank(b.name));

export const PostingDashboard = ({
  role,
  profiles,
  work = {},
  removedDays = [],
  slides,
  bilan = null,
}: {
  role: string;
  profiles: ManagedProfile[];
  work?: Record<string, ProfileWork>;
  removedDays?: string[];
  slides: SlideBoard;
  bilan?: { name: string; generation: string } | null;
}) => {
  const remoteProofs: ProofRecord[] = Object.entries(work).flatMap(([profileId, profile]) =>
    Object.entries(profile.days)
      .filter((entry): entry is [string, DayWork & { proofName: string }] => Boolean(entry[1].proofName))
      .map(([date, day]) => ({ profileId, date, name: day.proofName }))
  );
  const [desk, setDesk] = useState<Desk | null>(null);
  const [roster, setRoster] = useState(profiles);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [proofNote, setProofNote] = useState<{ date: string; percent: number; text: string; name: string } | null>(null);
  const [proofError, setProofError] = useState<{ date: string; text: string } | null>(null);
  const sending = useRef(new Set<string>());
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [profileError, setProfileError] = useState("");
  const [hiddenDays, setHiddenDays] = useState(removedDays);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  const [board, setBoard] = useState(slides);
  const [guide, setGuide] = useState(bilan);
  const [guideNote, setGuideNote] = useState<{ percent: number; text: string } | null>(null);
  const [guideError, setGuideError] = useState<string | null>(null);
  const guideSending = useRef(false);
  const [zipping, setZipping] = useState<string | null>(null);
  const zippingRef = useRef<string | null>(null);
  const boardStamp = useRef(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const captionTimers = useRef<Record<string, number>>({});
  const [saveState, setSaveState] = useState<SaveState>("synced");
  const saving = useRef(0);
  const failedDates = useRef(new Set<string>());
  const [girlFilter, setGirlFilter] = useState("all");
  const [adminOpen, setAdminOpen] = useState<string | null>(() => {
    const parisDay = calendarDate("Europe/Paris");
    return parisDay >= ACTIVE_WEEK_START && parisDay <= CALENDAR_END ? parisDay : ACTIVE_WEEK_START;
  });
  const rememberBoard = (next: SlideBoard) => {
    boardStamp.current += 1;
    setBoard(next);
  };
  const isTania = role === "tania";
  const girlName = isTania ? "" : profiles.find((item) => item.id === role)?.name ?? "";
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    if (isTania) return;
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [isTania]);
  const lang: PostingLang = isTania ? "fr" : langFromName(girlName);
  const ui = postingUi(lang);
  const lower = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
  const workerPlans = isTania ? [] : workerVisiblePlans(girlName, clock);
  const rangeStart = isTania ? ACTIVE_WEEK_START : workerPlans[0]?.date ?? ACTIVE_WEEK_START;
  const rangeEnd = isTania ? CALENDAR_END : WORKER_VISIBLE_THROUGH;
  const range =
    lang === "en"
      ? ui.range(formatDay(rangeStart, lang), formatDay(rangeEnd, lang))
      : ui.range(lower(formatDay(rangeStart, lang)), lower(formatDay(rangeEnd, lang)));
  const visibleDates = () => calendarDates().filter((date) => date >= ACTIVE_WEEK_START);
  const visiblePlans = (forTania: boolean) =>
    forTania ? DAY_PLANS.filter((plan) => plan.date >= ACTIVE_WEEK_START) : workerPlans;

  useEffect(() => {
    const loaded = readDesk();
    if (role === "tania") {
      for (const [profileId, profile] of Object.entries(work)) {
        const slotsForPerson = { ...(loaded.slots[profileId] ?? {}) };
        const daysForPerson = { ...(loaded.days[profileId] ?? {}) };
        for (const [date, remote] of Object.entries(profile.days)) {
          slotsForPerson[date] = remote.slot && isSlotId(remote.slot) ? [remote.slot] : [];
          daysForPerson[date] = {
            checks: remote.checks,
            proofName: remote.proofName,
            validated: remote.validated,
          };
        }
        loaded.slots = { ...loaded.slots, [profileId]: slotsForPerson };
        loaded.days = { ...loaded.days, [profileId]: daysForPerson };
      }
    }
    const mine = role === "tania" ? null : work[role];
    if (mine) {
      const slotsForPerson = { ...(loaded.slots[role] ?? {}) };
      const daysForPerson = { ...(loaded.days[role] ?? {}) };
      const pending: string[] = [];
      const dates = Array.from(new Set([...Object.keys(slotsForPerson), ...Object.keys(daysForPerson), ...Object.keys(mine.days)]));
      for (const date of dates) {
        const remote = mine.days[date];
        if (remote) {
          slotsForPerson[date] = remote.slot ? [remote.slot as SlotId] : [];
          const existing = daysForPerson[date] ?? emptyDayState();
          daysForPerson[date] = {
            checks: remote.checks,
            proofName: remote.proofName ?? existing.proofName,
            validated: remote.validated,
          };
        } else if (slotsForPerson[date]?.length || daysForPerson[date]?.proofName || daysForPerson[date]?.validated || Object.keys(daysForPerson[date]?.checks ?? {}).length) {
          pending.push(date);
        }
      }
      loaded.slots = { ...loaded.slots, [role]: slotsForPerson };
      loaded.days = { ...loaded.days, [role]: daysForPerson };
      for (const date of pending) {
        const existing = daysForPerson[date];
        void saveMyDay(date, {
          slot: slotsForPerson[date]?.[0] ?? null,
          checks: existing?.checks ?? {},
          validated: existing?.validated === true,
          proofName: existing?.proofName ?? null,
        });
      }
    }
    setDesk(loaded);
    let cancelled = false;
    const created: string[] = [];
    const remember = (key: string, blob: Blob) => {
      const url = URL.createObjectURL(blob);
      created.push(url);
      if (!cancelled) setUrls((current) => ({ ...current, [key]: url }));
    };
    void (async () => {
      try {
        for (const person of loaded.people) {
          for (const plan of DAY_PLANS) {
            if (!loaded.days[person.id]?.[plan.date]?.proofName) continue;
            const blob = await loadBlob(proofKey(person.id, plan.date));
            if (blob) remember(proofKey(person.id, plan.date), blob);
          }
        }
        let shared = slides;
        if (role === "tania") {
          shared = await loadSharedSlides();
          if (!cancelled) rememberBoard(shared);
        }
        for (const [date, files] of Object.entries(loaded.taniaFiles)) {
          for (const [accountId, names] of Object.entries(files)) {
            const blobs: Blob[] = [];
            for (let index = 0; index < names.length; index += 1) {
              const blob = (await loadBlob(slideKey(date, accountId, index))) ?? (index === 0 ? await loadBlob(legacySlideKey(date, accountId)) : null);
              if (blob) {
                blobs[index] = blob;
                remember(slideKey(date, accountId, index), blob);
              }
            }
            if (role !== "tania" || cancelled) continue;
            if (date < SLIDE_FROM || date > SLIDE_UNTIL || !/^p[a-z0-9-]{1,40}__(fr|es|us)$/.test(accountId)) continue;
            try {
              const caption = loaded.captions?.[date]?.[accountId];
              if (caption && shared.captions[date]?.[accountId] === undefined) {
                const savedCaption = await publishSlideCaption(date, accountId, caption);
                if (savedCaption.ok && !cancelled) {
                  shared = savedCaption.board;
                  rememberBoard(shared);
                }
              }
              if (shared.files[date]?.[accountId]?.length || names.some((_, index) => !blobs[index])) continue;
              const images: SlideImage[] = [];
              for (let index = 0; index < names.length; index += 1) {
                const blob = blobs[index];
                if (!blob) continue;
                images.push(await uploadSlideFile(date, accountId, blob, names[index] || "image", blob.type || "image/jpeg"));
              }
              if (images.length !== names.length || cancelled) continue;
              const published = await publishSlides(date, accountId, images);
              if (!published.ok || cancelled) continue;
              shared = published.board;
              rememberBoard(shared);
            } catch {
              if (!cancelled) setFileError(adminCopy.localSyncFail);
            }
          }
        }
      } catch {
        if (!cancelled) setFileError("files");
      }
    })();
    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const pull = async () => {
      if (document.visibilityState === "hidden") return;
      const response = await fetch("/posting/bilan?meta=1");
      if (!response.ok) return;
      const body = (await response.json()) as { name?: string; generation?: string };
      if (!body.name || !body.generation) return;
      setGuide({ name: body.name, generation: body.generation });
    };
    document.addEventListener("visibilitychange", pull);
    return () => document.removeEventListener("visibilitychange", pull);
  }, []);

  useEffect(() => {
    const pull = async () => {
      if (document.visibilityState === "hidden") return;
      const stamp = boardStamp.current;
      const next = await loadSharedSlides();
      if (stamp !== boardStamp.current) return;
      setBoard(next);
    };
    const timer = window.setInterval(() => void pull(), 8000);
    const onShow = () => {
      if (document.visibilityState === "visible") void pull();
    };
    window.addEventListener("focus", onShow);
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onShow);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, []);

  const update = (recipe: (current: Desk) => Desk) => {
    setDesk((current) => {
      if (!current) return current;
      const next = recipe(current);
      writeDesk(next);
      return next;
    });
  };

  if (!desk) {
    return (
      <main lang={lang} className="min-h-dvh px-4 py-6">
        <p className="font-body text-base text-gray-700">{ui.opening}</p>
      </main>
    );
  }

  const person = isTania ? null : roster.find((item) => item.id === role) ?? null;
  const people = isTania ? roster : [];
  const lateDate = person ? missedProofDate(girlName, clock) : null;
  const lateProofName = lateDate && person ? desk.days[person.id]?.[lateDate]?.proofName ?? null : null;
  const catchupDate = person ? sundayCatchupFor(girlName) : null;
  const catchupProof = catchupDate && person ? desk.days[person.id]?.[catchupDate]?.proofName ?? null : null;
  const showCatchup = Boolean(person && catchupDate && !catchupProof);
  const showLateProof = Boolean(person && lateDate && lateDate !== BILAN_DATE && !lateProofName);

  const ownAccount = person ? accountForLang(lang) : "";

  const publishDay = (date: string, desk: Desk) => {
    if (!person) return;
    const record = desk.days[person.id]?.[date];
    saving.current += 1;
    setSaveState("pending");
    void saveMyDay(date, {
      slot: slotsFor(desk, person.id, date)[0] ?? null,
      checks: record?.checks ?? {},
      validated: record?.validated === true,
      proofName: record?.proofName ?? null,
    })
      .then(
        (result) => result.ok,
        () => false,
      )
      .then((ok) => {
        saving.current -= 1;
        if (ok) failedDates.current.delete(date);
        else failedDates.current.add(date);
        if (saving.current === 0) setSaveState(failedDates.current.size > 0 ? "error" : "synced");
      });
  };

  const retrySave = () => {
    for (const date of Array.from(failedDates.current)) publishDay(date, desk);
  };

  const toggleSlot = (date: string, slotId: SlotId) => {
    if (!person) return;
    update((current) => {
      const next = {
        ...current,
        slots: {
          ...current.slots,
          [person.id]: { ...current.slots[person.id], [date]: chooseSlot(slotsFor(current, person.id, date), slotId) },
        },
      };
      const day = next.days[person.id]?.[date];
      if (day?.validated && slotsFor(next, person.id, date).length === 0) {
        next.days = {
          ...next.days,
          [person.id]: { ...next.days[person.id], [date]: { ...day, validated: false } },
        };
      }
      publishDay(date, next);
      return next;
    });
  };

  const removeDay = async (date: string) => {
    if (!isTania || deletingDate) return;
    setDayError(null);
    setDeletingDate(date);
    const result = await deleteValidatedDay(date);
    setDeletingDate(null);
    if (!result.ok) {
      setDayError(date);
      return;
    }
    setHiddenDays((current) => (current.includes(date) ? current : [...current, date]));
    await Promise.all(roster.map((worker) => deleteBlob(proofKey(worker.id, date)).catch(() => undefined)));
    setUrls((current) => {
      const next = { ...current };
      for (const worker of roster) delete next[proofKey(worker.id, date)];
      return next;
    });
  };

  const patchDay = (date: string, recipe: (day: DayState) => DayState) => {
    if (!person) return;
    update((current) => {
      const existing = current.days[person.id]?.[date] ?? emptyDayState();
      const next = recipe(existing);
      const plan = DAY_PLANS.find((item) => item.date === date);
      const tasks = plan ? checksFor(plan, lang).filter((check) => taskIsHers(check.id, ownAccount) && !check.banner) : [];
      const checksDone = Boolean(next.proofName) && tasks.length > 0 && tasks.every((check) => next.checks[check.id] === true);
      const validated = Boolean(plan && next.validated && checksDone && slotsFor(current, person.id, date).length > 0);
      const updated = {
        ...current,
        days: { ...current.days, [person.id]: { ...current.days[person.id], [date]: { ...next, validated } } },
      };
      publishDay(date, updated);
      return updated;
    });
  };

  const onProof = async (date: string, file: File | undefined) => {
    if (!file || !person || sending.current.has(date)) return;
    sending.current.add(date);
    setFileError("");
    setProofError(null);
    setProofNote({ date, percent: 0, text: ui.proofSending(0), name: file.name });
    const fail = (text: string) => {
      setProofNote(null);
      setProofError({ date, text });
    };
    try {
      const prepared = await prepareProofUpload(date, file.name, file.size);
      if (!prepared.ok) {
        fail(prepared.error === "size" ? ui.proofTooBig : ui.proofFail);
        return;
      }
      if (prepared.local) await saveBlob(proofKey(person.id, date), file);
      await uploadProof(file, date, (percent) => setProofNote({ date, percent, text: ui.proofSending(percent), name: prepared.name }));
      const saved = await commitProof(date, prepared.name);
      if (!saved.ok && prepared.local) throw new Error("commit");
      setUrls((current) => ({ ...current, [proofKey(person.id, date)]: URL.createObjectURL(file) }));
      patchDay(date, (day) => ({ ...day, proofName: prepared.name }));
      setProofNote(null);
      setProofError(null);
    } catch (error) {
      fail(error instanceof Error && error.message === "413" ? ui.proofTooBig : ui.proofFail);
    } finally {
      sending.current.delete(date);
    }
  };

  const onBilan = async (file: File | undefined) => {
    if (!file || !isTania || guideSending.current) return;
    if (file.size > BILAN_MAX_BYTES) {
      setGuideError(adminCopy.bilanTooBig);
      return;
    }
    guideSending.current = true;
    setGuideError(null);
    setGuideNote({ percent: 0, text: ui.proofSending(0) });
    try {
      const generation = await uploadBilan(file, (percent) => setGuideNote({ percent, text: ui.proofSending(percent) }));
      setGuide({ name: file.name, generation });
      setGuideNote(null);
      const input = document.getElementById("bilan-upload");
      if (input instanceof HTMLInputElement) input.value = "";
    } catch (error) {
      setGuideNote(null);
      setGuideError(error instanceof Error && error.message === "413" ? adminCopy.bilanTooBig : adminCopy.bilanFail);
    } finally {
      guideSending.current = false;
    }
  };

  const onSlides = async (date: string, accountId: string, list: FileList | null) => {
    const files = list
      ? Array.from(list).filter(
          (file) => file.type.startsWith("image/") || file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm)$/i.test(file.name),
        )
      : [];
    if (files.length === 0) return;
    setFileError("");
    try {
      const images: SlideImage[] = [];
      for (const file of files) images.push(await uploadSlideFile(date, accountId, file, file.name, file.type || "image/jpeg"));
      const result = await publishSlides(date, accountId, images);
      if (!result.ok) throw new Error("upload");
      rememberBoard(result.board);
      update((current) => ({
        ...current,
        taniaFiles: {
          ...current.taniaFiles,
          [date]: { ...current.taniaFiles[date], [accountId]: images.map((image) => image.name) },
        },
      }));
      const input = document.getElementById(`upload-${date}-${accountId}`);
      if (input instanceof HTMLInputElement) input.value = "";
    } catch (error) {
      setFileError(error instanceof Error && error.message === "size" ? adminCopy.fileTooBig : adminCopy.fileFail);
    }
  };

  const removeSlide = async (date: string, storageId: string, index: number) => {
    const shared = board.files[date]?.[storageId] ?? [];
    if (shared.length > 0) {
      if (!shared[index]) return;
      setFileError("");
      const result = await dropSharedSlide(date, storageId, index);
      if (!result.ok) {
        setFileError(adminCopy.removeFail);
        return;
      }
      rememberBoard(result.board);
      update((current) => {
        const dateFiles = { ...(current.taniaFiles[date] ?? {}) };
        const kept = result.board.files[date]?.[storageId]?.map((image) => image.name) ?? [];
        if (kept.length === 0) delete dateFiles[storageId];
        else dateFiles[storageId] = kept;
        return { ...current, taniaFiles: { ...current.taniaFiles, [date]: dateFiles } };
      });
      const input = document.getElementById(`upload-${date}-${storageId}`);
      if (input instanceof HTMLInputElement) input.value = "";
      return;
    }
    const names = desk.taniaFiles[date]?.[storageId] ?? [];
    if (!names[index]) return;
    setFileError("");
    try {
      const kept: { name: string; blob: Blob | null }[] = [];
      for (let i = 0; i < names.length; i += 1) {
        if (i === index) continue;
        const blob = (await loadBlob(slideKey(date, storageId, i))) ?? (i === 0 ? await loadBlob(legacySlideKey(date, storageId)) : null);
        kept.push({ name: names[i], blob });
      }
      for (let i = 0; i < names.length; i += 1) await deleteBlob(slideKey(date, storageId, i));
      await deleteBlob(legacySlideKey(date, storageId));
      const nextUrls: Record<string, string> = {};
      for (let i = 0; i < kept.length; i += 1) {
        const blob = kept[i]?.blob;
        if (!blob) continue;
        await saveBlob(slideKey(date, storageId, i), blob);
        nextUrls[slideKey(date, storageId, i)] = URL.createObjectURL(blob);
      }
      setUrls((current) => {
        const next = { ...current };
        for (let i = 0; i < names.length; i += 1) delete next[slideKey(date, storageId, i)];
        return { ...next, ...nextUrls };
      });
      update((current) => {
        const dateFiles = { ...(current.taniaFiles[date] ?? {}) };
        if (kept.length === 0) delete dateFiles[storageId];
        else dateFiles[storageId] = kept.map((item) => item.name);
        return { ...current, taniaFiles: { ...current.taniaFiles, [date]: dateFiles } };
      });
      const input = document.getElementById(`upload-${date}-${storageId}`);
      if (input instanceof HTMLInputElement) input.value = "";
    } catch {
      setFileError(adminCopy.removeFail);
    }
  };

  const saveCaption = (date: string, profileId: string, value: string) => {
    const text = value.slice(0, 500);
    const key = `${date}:${profileId}`;
    setDrafts((current) => ({ ...current, [key]: text }));
    update((current) => ({
      ...current,
      captions: {
        ...(current.captions ?? {}),
        [date]: { ...(current.captions?.[date] ?? {}), [profileId]: text },
      },
    }));
    window.clearTimeout(captionTimers.current[key]);
    captionTimers.current[key] = window.setTimeout(() => {
      void publishSlideCaption(date, profileId, text).then((result) => {
        if (!result.ok) {
          setFileError(adminCopy.captionFail);
          return;
        }
        rememberBoard(result.board);
        setDrafts((current) => {
          if (current[key] !== text) return current;
          const next = { ...current };
          delete next[key];
          return next;
        });
      });
    }, 400);
  };

  const captionOf = (date: string, storageId: string) => {
    const key = `${date}:${storageId}`;
    if (Object.prototype.hasOwnProperty.call(drafts, key)) return drafts[key] ?? "";
    const shared = board.captions[date];
    if (shared && Object.prototype.hasOwnProperty.call(shared, storageId)) return shared[storageId] ?? "";
    return desk.captions?.[date]?.[storageId] ?? "";
  };

  const downloadSlides = async (date: string, storageId: string) => {
    const key = `${storageId}-${date}`;
    if (zippingRef.current) return;
    const shared = slideshowOf(board, date, storageId);
    const localNames = shared.length > 0 ? [] : desk.taniaFiles[date]?.[storageId] ?? [];
    if (shared.length === 0 && localNames.length === 0) return;
    zippingRef.current = key;
    setZipping(key);
    setFileError("");
    try {
      const files: { name: string; bytes: Uint8Array }[] = [];
      if (shared.length > 0) {
        for (const image of shared) {
          files.push({ name: image.name || "image", bytes: await readSharedFile(image.id) });
        }
      } else {
        for (let index = 0; index < localNames.length; index += 1) {
          const href = urls[slideKey(date, storageId, index)];
          if (!href) throw new Error("download");
          const response = await fetch(href);
          if (!response.ok) throw new Error("download");
          files.push({ name: localNames[index] || `image-${index + 1}`, bytes: new Uint8Array(await response.arrayBuffer()) });
        }
      }
      if (files.length !== (shared.length || localNames.length)) throw new Error("download");
      const zip = zipStoredFiles(files);
      const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
      const account = storageId.split("__")[1] || "images";
      saveDownload(url, `slideshow-${account}-${date}.zip`);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setFileError(ui.downloadFail);
    } finally {
      zippingRef.current = null;
      setZipping(null);
    }
  };

  const addPerson = async (event: FormEvent) => {
    event.preventDefault();
    const result = await addManagedProfile(newName, newCode);
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setRoster(result.profiles);
    setNewName("");
    setNewCode("");
    setProfileError("");
  };

  const savePerson = async (id: string, name: string, code: string) => {
    const result = await saveManagedProfile(id, name, code);
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setRoster(result.profiles);
    setProfileError("");
  };

  const deletePerson = async (id: string) => {
    const result = await deleteManagedProfile(id);
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setRoster(result.profiles);
    setProfileError("");
  };

  const adminToday = calendarDate("Europe/Paris", clock);
  const workerToday = person ? calendarDate(timeZoneForGirl(girlName), clock) : adminToday;

  const adminGirls = slideGirls(roster).map((worker) => ({ id: worker.id, label: girlLabel(worker.name), name: worker.name }));
  const shownGirls = girlFilter === "all" ? adminGirls : adminGirls.filter((worker) => worker.id === girlFilter);

  const summaryCell = (date: string, girlId: string): SummaryCell => {
    const plan = DAY_PLANS.find((item) => item.date === date);
    const worker = roster.find((item) => item.id === girlId);
    const day = desk.days[girlId]?.[date];
    const tasks =
      plan && worker
        ? checksFor(plan, "fr").filter((check) => taskIsHers(check.id, accountForLang(langFromName(worker.name))) && !check.banner)
        : [];
    return {
      slot: slotsFor(desk, girlId, date)[0] ?? null,
      done: tasks.filter((check) => day?.checks[check.id] === true).length,
      total: tasks.length,
      proof: Boolean(day?.proofName),
      validated: day?.validated === true,
    };
  };

  const openAdminDay = (date: string) => {
    setAdminOpen(date);
    window.requestAnimationFrame(() => document.getElementById(`admin-day-${date}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  const slideCard = (plan: DayPlan, worker: { id: string; label: string }, account: AccountName, index: number) => {
    const storageId = slideStorageId(worker.id, account.id);
    const shared = board.files[plan.date]?.[storageId] ?? [];
    const names = shared.length > 0 ? shared.map((image) => image.name) : desk.taniaFiles[plan.date]?.[storageId] ?? [];
    const title = accountWord(index, "fr");
    const video = account.id === "us" && plan.date >= ACTIVE_WEEK_START;
    return (
      <div key={storageId} className="rounded-2xl bg-gray-100 p-3">
        <label htmlFor={`upload-${plan.date}-${storageId}`} className="block font-title text-xl leading-none tracking-tight" style={{ color: ACCOUNT_TONE[index].ink }}>
          {title}
        </label>
        {video ? <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">{plan.date === ACTIVE_WEEK_START ? adminCopy.videoOnly : adminCopy.videoTrending}</p> : null}
        <input
          id={`upload-${plan.date}-${storageId}`}
          type="file"
          accept={video ? "video/*" : "image/*,video/*"}
          multiple={!video}
          aria-label={`${title} ${worker.label}`}
          onChange={(event) => void onSlides(plan.date, storageId, event.target.files)}
          className="mt-2 block w-full font-body text-sm"
        />
        {names.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {names.map((name, imageIndex) => {
              const preview = shared[imageIndex] ? `/posting/slide/${shared[imageIndex].id}` : urls[slideKey(plan.date, storageId, imageIndex)];
              return (
                <li key={`${storageId}-${imageIndex}-${name}`} className="flex items-center gap-2">
                  {preview ? (
                    shared[imageIndex]?.type.startsWith("video/") ? (
                      <video src={preview} muted playsInline className="h-12 w-12 shrink-0 rounded-lg bg-black object-cover" />
                    ) : (
                      <img src={preview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    )
                  ) : null}
                  <span className="min-w-0 flex-1 truncate font-body text-sm">{name}</span>
                  <button
                    id={`remove-slide-${plan.date}-${storageId}-${imageIndex}`}
                    type="button"
                    aria-label={adminCopy.removeFile(name)}
                    onClick={() => void removeSlide(plan.date, storageId, imageIndex)}
                    className="inline-flex h-12 shrink-0 items-center rounded-xl border border-black bg-white px-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    {adminCopy.remove}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <textarea
          id={`caption-${plan.date}-${storageId}`}
          value={captionOf(plan.date, storageId)}
          onChange={(event) => saveCaption(plan.date, storageId, event.target.value)}
          rows={3}
          placeholder={adminCopy.captionPlaceholder}
          aria-label={adminCopy.captionLabel(worker.label, title)}
          className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        />
      </div>
    );
  };

  const girlBlock = (plan: DayPlan, worker: { id: string; label: string; name: string }) => {
    const value = summaryCell(plan.date, worker.id);
    const slot = SLOTS.find((item) => item.id === value.slot);
    const chip = "rounded-full px-2.5 py-1 font-body text-xs font-bold";
    return (
      <div key={worker.id} id={`admin-girl-${plan.date}-${worker.id}`} className="rounded-2xl border-2 border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-title text-xl leading-none tracking-tight">{worker.label}</h3>
          <span className={`${chip} ${slot ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}>{slot ? hourText(slot.short) : adminCopy.noHour}</span>
          {value.total > 0 ? (
            <span className={`${chip} bg-gray-100`}>{adminCopy.tasks(value.done, value.total)}</span>
          ) : null}
          <span className={`${chip} ${value.validated ? "bg-[#E7F6EC] text-[#146C36]" : "bg-[#FFF3C4]"}`}>{value.validated ? adminCopy.validated : adminCopy.notValidated}</span>
        </div>
        {value.proof ? (
          <ProofPlayer src={`/posting/proof/${worker.id}/${plan.date}`} label={worker.label} fileName={`${displayName(worker.name)}-${plan.date}.mp4`} />
        ) : (
          <p className="mt-2 font-body text-sm text-gray-700">{adminCopy.noProof}</p>
        )}
        {plan.date >= SLIDE_FROM && plan.date <= SLIDE_UNTIL && plan.publishers.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
            {ACCOUNTS.map((account, index) => (plan.publishers.includes(account.id) ? slideCard(plan, worker, account, index) : null))}
          </div>
        ) : null}
      </div>
    );
  };

  const slideActions = (plan: DayPlan, check: CheckItem): SlideLineActions | undefined => {
    const accountId = check.id.startsWith("post-") ? check.id.slice(5) : "";
    if (!person || !accountId || plan.date < SLIDE_FROM || plan.date > SLIDE_UNTIL || !plan.publishers.includes(accountId)) return undefined;
    const storageId = slideStorageId(person.id, accountId);
    const shared = slideshowOf(board, plan.date, storageId);
    const names = shared.length > 0 ? shared.map((image) => image.name) : desk.taniaFiles[plan.date]?.[storageId] ?? [];
    const zipKey = `${storageId}-${plan.date}`;
    const video = accountId === "us" && plan.date >= ACTIVE_WEEK_START;
    return {
      date: zipKey,
      downloadLabel: video ? slideCopy[lang].videoDownload : slideCopy[lang].download,
      downloadLine: video ? slideCopy[lang].videoDownloadLine : slideCopy[lang].downloadLine,
      namesCount: names.length,
      busy: zipping === zipKey,
      busyLabel: ui.downloadPreparing,
      onDownload: () => void downloadSlides(plan.date, storageId),
      copyLabel: slideCopy[lang].copy,
      copiedLabel: slideCopy[lang].copied,
      copyLine: slideCopy[lang].copyLine,
      caption: captionOf(plan.date, storageId),
      emptyCaption: slideCopy[lang].noCaption,
      waiting: video ? slideCopy[lang].videoWaiting : ui.imagesMissing,
    };
  };

  const workerDay = (plan: DayPlan): DayCardProps => {
    const checks = checksFor(plan, lang);
    const state = (person && desk.days[person.id]?.[plan.date]) || emptyDayState();
    const hour = person ? slotsFor(desk, person.id, plan.date)[0] : undefined;
    const counts = (check: CheckItem) => taskIsHers(check.id, ownAccount) && !check.banner;
    const hers = checks.filter(counts);
    const ticked = hers.filter((check) => state.checks[check.id] === true).length;
    const checksDone = Boolean(state.proofName) && hers.length > 0 && ticked === hers.length;
    const uploading = proofNote?.date === plan.date;
    const proofSrc = !person
      ? ""
      : urls[proofKey(person.id, plan.date)] ||
        (remoteProofs.some((item) => item.profileId === person.id && item.date === plan.date) ? `/posting/proof/${person.id}/${plan.date}` : "");
    return {
      date: plan.date,
      heading: dayHeading(plan, lang),
      title: formatDay(plan.date, lang),
      isToday: plan.date === workerToday,
      labels: {
        today: ui.todayChip,
        noTasks: ui.noTasks,
        noTasksBody: ui.noTasksBody,
        proof: ui.proof,
        proofBody: plan.kind === "friday" ? ui.proofScroll : ui.proofBody,
        proofUpload: ui.proofUpload,
        proofReplace: ui.proofReplace,
        validate: ui.validateDay,
        validated: ui.dayDone,
        progress: ui.progress,
      },
      done: ticked,
      total: hers.length,
      validated: state.validated,
      hasProof: Boolean(state.proofName),
      proofName: state.proofName || (uploading ? proofNote?.name ?? null : null),
      uploading,
      canValidate: checksDone && Boolean(hour),
      hint: !hour ? ui.pickOne : checksDone ? ui.ready : ui.missing,
      slots: (
        <SlotPicker
          date={plan.date}
          dayLabel={formatDay(plan.date, lang)}
          hour={hour}
          onPick={(slot) => toggleSlot(plan.date, slot)}
          labels={{ title: ui.slots, pickOne: ui.pickOne, picked: ui.picked, vary: showHoursVary(plan.date) ? ui.hoursVary : undefined }}
        />
      ),
      checklist:
        checks.length === 0 ? null : (
          <Checklist
            checks={checks}
            lang={lang}
            date={plan.date}
            done={state.checks}
            progressLabel={ui.progress}
            clip={plan.date === BILAN_DATE && guide ? <BilanPlayer file={guide} /> : null}
            banner={(check) => (
              <div className="rounded-2xl border-2 border-black bg-[#FFF3C4] px-3 py-3">
                <TaskCopy label={check.label} large />
              </div>
            )}
            item={(check, label) => (
              <label htmlFor={`check-${plan.date}-${check.id}`} className={`flex min-h-12 items-start gap-3 py-1 font-body ${check.parent ? "text-sm" : "text-base"}`}>
                <input
                  id={`check-${plan.date}-${check.id}`}
                  type="checkbox"
                  checked={state.checks[check.id] === true}
                  onChange={(event) => patchDay(plan.date, (day) => ({ ...day, checks: { ...day.checks, [check.id]: event.target.checked } }))}
                  className={`shrink-0 accent-black ${check.parent ? "mt-0.5 h-5 w-5" : "mt-0.5 h-6 w-6"}`}
                />
                <TaskFace
                  check={check}
                  label={label}
                  large={!check.parent}
                  copy={
                    check.copyText
                      ? { id: `copy-bio-${plan.date}-${check.id}`, text: check.copyText, copy: slideCopy[lang].copy, copied: slideCopy[lang].copied }
                      : undefined
                  }
                  slides={slideActions(plan, check)}
                />
              </label>
            )}
          />
        ),
      proofExtra: (
        <>
          <ProofFeedback
            active={uploading}
            percent={uploading ? proofNote?.percent ?? 0 : 0}
            text={uploading ? proofNote?.text ?? "" : ""}
            error={proofError?.date === plan.date ? proofError.text : null}
          />
          {proofSrc && person ? (
            <ProofPlayer
              src={proofSrc}
              label={displayName(person.name)}
              fileName={`${displayName(person.name)}-${plan.date}.mp4`}
              labels={{
                play: ui.proofPlay,
                close: ui.proofClose,
                loading: ui.proofLoading,
                error: ui.proofError,
                download: ui.proofDownload,
                downloading: ui.proofDownloading,
                downloadFail: ui.proofDownloadFail,
              }}
            />
          ) : null}
        </>
      ),
      onProofFile: (file) => void onProof(plan.date, file),
      onValidate: () => {
        if (!hour) return;
        patchDay(plan.date, (day) => ({ ...day, validated: true }));
      },
    };
  };

  return (
    <main lang={lang} className="min-h-dvh px-4 py-6 selection:bg-yellow selection:text-black sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="font-title text-3xl tracking-tight">
            TAAB
          </a>
          <form action={leavePosting}>
            <button
              type="submit"
              className="inline-flex h-12 items-center font-body text-sm font-bold underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              {ui.switchProfile}
            </button>
          </form>
        </div>
        <header>
          <h1 className="font-title text-4xl tracking-tight">{isTania ? "Tania" : displayName(person?.name ?? "")}</h1>
          <p className="mt-2 max-w-prose font-body text-sm leading-relaxed text-gray-700">{range}</p>
        </header>

        {isTania && (
          <AdminSummary
            dates={visibleDates().filter((date) => !hiddenDays.includes(date))}
            today={adminToday}
            girls={shownGirls}
            allGirls={adminGirls}
            filter={girlFilter}
            onFilter={setGirlFilter}
            cell={summaryCell}
            dayLabel={(date) => formatShortDay(date)}
            onOpen={openAdminDay}
          />
        )}

        {isTania && (
          <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">{adminCopy.slotsTitle}</h2>
            <p className="mt-1 font-body text-xs text-gray-700">
              {people.map((item) => `${personMark(item)} ${girlLabel(item.name)}`).join(" · ")}
            </p>
            <div className="mt-4 grid grid-cols-[4.75rem_repeat(4,minmax(0,1fr))] gap-2 font-body text-base">
              <span />
              {SLOTS.map((slot) => (
                <span key={slot.id} className="py-2 text-center text-sm font-bold">
                  {slot.short}
                </span>
              ))}
              {visibleDates().map((date) => (
                <div key={date} className="contents">
                  <span className={`flex items-center text-sm font-bold ${date === adminToday ? "text-black underline decoration-2 underline-offset-4" : "text-gray-700"}`}>
                    {formatShortDay(date)}
                  </span>
                  {SLOTS.map((slot) => {
                    const marks = people
                      .filter((item) => slotsFor(desk, item.id, date).includes(slot.id))
                      .map((item) => personMark(item));
                    return (
                      <span
                        key={slot.id}
                        className="flex min-h-12 items-center justify-center rounded-lg bg-gray-100 px-1 py-2 text-center text-base font-bold"
                      >
                        {marks.length > 0 ? marks.join(" ") : "·"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-gray-200 pt-4">
              <h3 className="font-body text-base font-bold">{adminCopy.profiles}</h3>
              <ul className="mt-3 flex flex-col gap-4">
                {people.map((item) => (
                  <li key={item.id}>
                    <ProfileEditor profile={item} onSave={savePerson} onDelete={deletePerson} />
                  </li>
                ))}
              </ul>
              <form onSubmit={(event) => void addPerson(event)} className="mt-4 flex flex-col gap-2">
                <label htmlFor="new-person" className="font-body text-sm font-bold">
                  {adminCopy.newProfile}
                </label>
                <input
                  id="new-person"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder={adminCopy.namePlaceholder}
                  className={fieldClass}
                />
                <input
                  id="new-code"
                  value={newCode}
                  onChange={(event) => setNewCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={adminCopy.codePlaceholder}
                  className={fieldClass}
                />
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-black px-4 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {adminCopy.add}
                </button>
              </form>
              {profileError && <p className="mt-2 font-body text-sm text-[#C8102E]">{profileError}</p>}
            </div>
          </section>
        )}

        {showCatchup && catchupDate && (
          <section id="sunday-catchup" className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">{sundayCatchupCopy.title}</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">
              {sundayCatchupCopy.body}
            </p>
            <div className="mt-4 rounded-2xl border-2 border-black bg-[#FFF3C4] px-3 py-3">
              <TaskCopy
                label={
                  checksFor(DAY_PLANS.find((item) => item.date === catchupDate) ?? DAY_PLANS[DAY_PLANS.length - 1], "en").find(
                    (item) => item.id === "bilan",
                  )?.label ?? ""
                }
                large
              />
              {guide ? <BilanPlayer file={guide} /> : null}
            </div>
            <input
              id={`sunday-catchup-${catchupDate}`}
              type="file"
              accept="video/*"
              aria-label={sundayCatchupCopy.input}
              onChange={(event) => void onProof(catchupDate, event.target.files?.[0])}
              className="mt-3 font-body text-sm"
            />
            {proofNote?.date === catchupDate && proofNote.name ? <p className="mt-2 font-body text-sm">{proofNote.name}</p> : null}
            <ProofFeedback
              active={proofNote?.date === catchupDate}
              percent={proofNote?.date === catchupDate ? proofNote.percent : 0}
              text={proofNote?.date === catchupDate ? proofNote.text : ""}
              error={proofError?.date === catchupDate ? proofError.text : null}
            />
          </section>
        )}

        {showLateProof && lateDate && (
          <section id="late-proof" className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">{ui.lateProofTitle(formatDay(lateDate, lang))}</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">{ui.lateProofBody}</p>
            <input
              id={`late-proof-${lateDate}`}
              type="file"
              accept="video/*"
              aria-label={ui.lateProofTitle(formatDay(lateDate, lang))}
              onChange={(event) => void onProof(lateDate, event.target.files?.[0])}
              className="mt-3 font-body text-sm"
            />
            {(proofNote?.date === lateDate && proofNote.name) && (
              <p className="mt-2 font-body text-sm">{proofNote.name}</p>
            )}
            <ProofFeedback
              active={proofNote?.date === lateDate}
              percent={proofNote?.date === lateDate ? proofNote.percent : 0}
              text={proofNote?.date === lateDate ? proofNote.text : ""}
              error={proofError?.date === lateDate ? proofError.text : null}
            />
          </section>
        )}

        {(isTania ? visiblePlans(true) : [])
          .filter((plan) => !(isTania && hiddenDays.includes(plan.date)))
          .map((plan) => {
          const checks = checksFor(plan, isTania ? "fr" : lang);
          if (isTania) {
            const open = adminOpen === plan.date;
            const isToday = plan.date === adminToday;
            const validatedCount = adminGirls.filter((worker) => desk.days[worker.id]?.[plan.date]?.validated === true).length;
            return (
              <section
                key={plan.date}
                id={`admin-day-${plan.date}`}
                aria-current={isToday ? "date" : undefined}
                className={`rounded-3xl bg-white shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] ${isToday ? "ring-2 ring-black" : ""}`}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`admin-day-body-${plan.date}`}
                  onClick={() => setAdminOpen((current) => (current === plan.date ? null : plan.date))}
                  className="flex min-h-16 w-full items-center gap-3 rounded-3xl px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-2 font-body text-sm text-gray-700">
                      {dayHeading(plan)}
                      {isToday ? <span className="rounded-full bg-black px-2 py-0.5 text-xs font-bold text-white">{adminCopy.today}</span> : null}
                    </span>
                    <span className="font-title text-2xl leading-tight tracking-tight">{formatDay(plan.date)}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 font-body text-xs font-bold ${
                      checks.length === 0 ? "bg-gray-100 text-gray-700" : validatedCount === adminGirls.length && adminGirls.length > 0 ? "bg-[#E7F6EC] text-[#146C36]" : "bg-[#FFF3C4]"
                    }`}
                  >
                    {checks.length === 0 ? adminCopy.noTasks : adminCopy.dayValidated(validatedCount, adminGirls.length)}
                  </span>
                  <span aria-hidden className={`shrink-0 font-body text-lg transition-transform ${open ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                <div id={`admin-day-body-${plan.date}`} hidden={!open} className="px-4 pb-4">
                {plan.date === BILAN_DATE && (
                  <div className="mt-4 rounded-2xl border-2 border-black bg-[#FFF3C4] px-3 py-3">
                    <h3 className="font-title text-2xl leading-none tracking-tight">{adminCopy.bilanTitle}</h3>
                    <p className="mt-2 font-body text-sm leading-relaxed">
                      {adminCopy.bilanBody}
                    </p>
                    <input
                      id="bilan-upload"
                      type="file"
                      accept="video/*"
                      aria-label={adminCopy.bilanInput}
                      onChange={(event) => void onBilan(event.target.files?.[0])}
                      className="mt-3 block w-full font-body text-sm"
                    />
                    {guide ? <p className="mt-2 font-body text-sm">{guide.name}</p> : null}
                    <ProofFeedback active={Boolean(guideNote)} percent={guideNote?.percent ?? 0} text={guideNote?.text ?? ""} error={guideError} />
                    {guide ? <BilanPlayer file={guide} /> : null}
                  </div>
                )}
                <div className="mt-2 flex flex-col gap-3">{shownGirls.map((worker) => girlBlock(plan, worker))}</div>
                {checks.length > 0 ? (
                <details className="mt-4 rounded-2xl bg-gray-50 px-3">
                  <summary className="flex min-h-12 cursor-pointer items-center font-body text-base font-bold">{adminCopy.dayBrief}</summary>
                <AccountChecks
                  checks={checks}
                  lang="fr"
                  date={plan.date}
                  item={(check, label) => (
                    <label className={`flex items-start gap-3 font-body ${check.parent ? "text-sm text-gray-800" : "text-base"}`}>
                      <input
                        type="checkbox"
                        checked={profiles.every((worker) => work[worker.id]?.days[plan.date]?.checks[check.id] === true)}
                        onClick={(event) => event.preventDefault()}
                        onChange={() => undefined}
                        aria-readonly="true"
                        className={`shrink-0 accent-black ${check.parent ? "mt-0.5 h-4 w-4" : "mt-1 h-5 w-5"}`}
                      />
                      <TaskFace
                        check={check}
                        label={label}
                        large={!check.parent}
                        copy={
                          check.copyText
                            ? { id: `copy-bio-${plan.date}-${check.id}`, text: check.copyText, copy: slideCopy.fr.copy, copied: slideCopy.fr.copied }
                            : undefined
                        }
                      />
                    </label>
                  )}
                />
                <div className="h-3" />
                </details>
                ) : null}
                <div className="mt-5">
                  <button
                    id={`delete-day-${plan.date}`}
                    type="button"
                    disabled={deletingDate === plan.date}
                    onClick={() => void removeDay(plan.date)}
                    className="h-12 w-full rounded-xl border border-black bg-white px-4 font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
                  >
                    {adminCopy.deleteDay}
                  </button>
                  {dayError === plan.date && (
                    <p className="mt-2 font-body text-sm text-[#C8102E]">{adminCopy.deleteDayFail}</p>
                  )}
                </div>
                </div>
              </section>
            );
          }

          return null;
        })}

        {!isTania && person ? (
          <WorkerView
            days={workerPlans.map(workerDay)}
            today={workerToday}
            status={
              <SaveStatus
                state={saveState}
                labels={{ synced: ui.saveSynced, pending: ui.savePending, error: ui.saveError, retry: ui.saveRetry }}
                onRetry={retrySave}
              />
            }
          />
        ) : null}

        {fileError && <p className="font-body text-sm text-[#C8102E]">{fileError === "files" ? ui.files : fileError}</p>}
        {isTania && <p className="font-body text-sm leading-relaxed text-gray-700">{ui.local}</p>}
      </div>
    </main>
  );
};
