"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import {
  ACCOUNTS,
  CALENDAR_END,
  WORKER_VISIBLE_THROUGH,
  CATCHUP_DATES,
  CALENDAR_START,
  DAY_PLANS,
  calendarDates,
  DayState,
  Desk,
  SLOTS,
  chooseSlot,
  SlotId,
  accountRole,
  checksFor,
  dateLocale,
  dayHeading,
  dayReady,
  emptyDayState,
  formatDay,
  formatShortDay,
  madridToday,
  openDates,
  openPlans,
  PostingLang,
  displayName,
  langFromName,
  suiviDates,
  personMark,
  postingUi,
  slotsFor,
} from "~/config/posting";
import { leavePosting } from "~/app/dashboard/creator/actions";
import {   addManagedProfile, commitProof, deleteManagedProfile, prepareProofUpload, saveManagedProfile, saveMyDay } from "~/app/posting/actions";
import { PROOF_PART_BYTES, proofPartCount, type DayWork, type ProfileWork, type ProofRecord } from "~/server/postingProofs";
import { loadBlob, readDesk, saveBlob, writeDesk } from "~/components/posting/storage";

type ManagedProfile = { id: string; name: string; code?: string };

const hourText = (short: string) => {
  const [start, end] = short.split("–");
  return `${start}h–${end}h`;
};

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1";

const proofKey = (personId: string, date: string) => `proof:${personId}:${date}`;
const slideKey = (date: string, accountId: string) => `tania:${date}:${accountId}`;

const uploadProof = (file: File, date: string, onProgress: (percent: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const parts = Math.max(1, proofPartCount(file.size));
    const generation = (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}abcdefghijkl`)
      .replace(/-/g, "")
      .slice(0, 12);
    const send = (index: number) => {
      const start = index * PROOF_PART_BYTES;
      const blob = file.slice(start, Math.min(file.size, start + PROOF_PART_BYTES));
      const request = new XMLHttpRequest();
      request.open("POST", "/posting/upload");
      request.setRequestHeader("content-type", "application/octet-stream");
      request.setRequestHeader("x-proof-date", date);
      request.setRequestHeader("x-proof-generation", generation);
      request.setRequestHeader("x-proof-part", String(index));
      request.setRequestHeader("x-proof-parts", String(parts));
      request.setRequestHeader("x-proof-size", String(file.size));
      request.setRequestHeader("x-proof-name", encodeURIComponent(file.name));
      request.setRequestHeader("x-proof-type", /^video\/[a-z0-9.+-]+$/i.test(file.type) ? file.type : "video/mp4");
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.min(99, Math.round(((start + event.loaded) / file.size) * 100)));
      };
      request.onload = () => {
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(String(request.status)));
          return;
        }
        if (index + 1 >= parts) {
          onProgress(100);
          resolve();
          return;
        }
        send(index + 1);
      };
      request.onerror = () => reject(new Error("upload"));
      request.send(blob);
    };
    onProgress(0);
    send(0);
  });

const ProofFeedback = ({
  active,
  percent,
  text,
  error,
}: {
  active: boolean;
  percent: number;
  text: string;
  error: string | null;
}) => {
  if (!active && !error) return null;
  return (
    <div className="mt-2">
      {active && (
        <>
          <p className="font-body text-sm text-gray-700">{text}</p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={text}
            className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200"
          >
            <div className="h-full bg-black" style={{ width: `${percent}%` }} />
          </div>
        </>
      )}
      {error && <p className="mt-2 font-body text-sm text-[#C8102E]">{error}</p>}
    </div>
  );
};

export const PostingDashboard = ({
  role,
  profiles,
  work = {},
}: {
  role: string;
  profiles: ManagedProfile[];
  work?: Record<string, ProfileWork>;
}) => {
  const remoteProofs: ProofRecord[] = Object.entries(work).flatMap(([profileId, profile]) =>
    Object.entries(profile.days)
      .filter((entry): entry is [string, DayWork & { proofName: string }] => Boolean(entry[1].proofName))
      .map(([date, day]) => ({ profileId, date, name: day.proofName }))
  );
  const today = madridToday();
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
  const isTania = role === "tania";
  const lang: PostingLang = isTania ? "fr" : langFromName(profiles.find((item) => item.id === role)?.name ?? "");
  const ui = postingUi(lang);
  const lower = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
  const workerDates = openDates(today).filter((date) => date <= WORKER_VISIBLE_THROUGH);
  const rangeStart = isTania ? CALENDAR_START : workerDates[0] ?? today;
  const rangeEnd = isTania ? CALENDAR_END : workerDates[workerDates.length - 1] ?? WORKER_VISIBLE_THROUGH;
  const range =
    lang === "en"
      ? ui.range(formatDay(rangeStart, lang), formatDay(rangeEnd, lang))
      : ui.range(lower(formatDay(rangeStart, lang)), lower(formatDay(rangeEnd, lang)));
  const visibleDates = (forTania: boolean) =>
    (forTania ? calendarDates() : openDates(today)).filter((date) => forTania || date <= WORKER_VISIBLE_THROUGH);
  const visiblePlans = (forTania: boolean) =>
    (forTania ? DAY_PLANS : openPlans(today)).filter((plan) => forTania || plan.date <= WORKER_VISIBLE_THROUGH);

  useEffect(() => {
    const loaded = readDesk();
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
        for (const [date, files] of Object.entries(loaded.taniaFiles)) {
          for (const accountId of Object.keys(files)) {
            const blob = await loadBlob(slideKey(date, accountId));
            if (blob) remember(slideKey(date, accountId), blob);
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
  const missingDays = person ? visibleDates(false).filter((date) => slotsFor(desk, person.id, date).length === 0) : [];
  const missingNames = new Intl.ListFormat(dateLocale(lang), { type: "conjunction" }).format(
    missingDays.map((date) => lower(formatDay(date, lang)))
  );
  const weekSaved = person ? desk.weekValidated[person.id] === true : false;

  const publishDay = (date: string, desk: Desk) => {
    if (!person) return;
    const record = desk.days[person.id]?.[date];
    void saveMyDay(date, {
      slot: slotsFor(desk, person.id, date)[0] ?? null,
      checks: record?.checks ?? {},
      validated: record?.validated === true,
      proofName: record?.proofName ?? null,
    });
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
      publishDay(date, next);
      return next;
    });
  };

  const patchDay = (date: string, recipe: (day: DayState) => DayState) => {
    if (!person) return;
    update((current) => {
      const existing = current.days[person.id]?.[date] ?? emptyDayState();
      const next = recipe(existing);
      const plan = DAY_PLANS.find((item) => item.date === date);
      const validated = Boolean(plan && next.validated && dayReady(plan, next));
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
      if (prepared.local) {
        await saveBlob(proofKey(person.id, date), file);
        setProofNote({ date, percent: 100, text: ui.proofSending(100), name: prepared.name });
      } else {
        await uploadProof(file, date, (percent) => setProofNote({ date, percent, text: ui.proofSending(percent), name: prepared.name }));
      }
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

  const onSlide = async (date: string, accountId: string, file: File | undefined) => {
    if (!file) return;
    setFileError("");
    try {
      await saveBlob(slideKey(date, accountId), file);
      setUrls((current) => ({ ...current, [slideKey(date, accountId)]: URL.createObjectURL(file) }));
      update((current) => ({
        ...current,
        taniaFiles: { ...current.taniaFiles, [date]: { ...current.taniaFiles[date], [accountId]: file.name } },
      }));
    } catch {
      setFileError("Le fichier n'a pas été gardé dans ce navigateur.");
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
              className="font-body text-sm font-bold underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
          <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">Suivi</h2>
            <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">
              Heure, cases et vidéo de chaque personne, y compris les jours passés.
            </p>
            <div className="mt-4 flex flex-col gap-6">
              {profiles.map((worker) => (
                <div key={worker.id}>
                  <h3 className="font-title text-xl tracking-tight">{displayName(worker.name)}</h3>
                  <div className="mt-2 flex flex-col gap-3">
                    {suiviDates(today).map((date) => {
                      const day = work[worker.id]?.days[date];
                      const plan = DAY_PLANS.find((item) => item.date === date);
                      const done = plan ? checksFor(plan, "fr").filter((item) => day?.checks[item.id]) : [];
                      const slot = SLOTS.find((item) => item.id === day?.slot);
                      return (
                        <article key={date} className="border-t border-gray-200 pt-3">
                          <p className="font-body text-base font-bold">{formatDay(date)}</p>
                          <p className="mt-1 font-body text-sm">{slot ? slot.label : "Pas d'heure"}</p>
                          {done.length > 0 ? (
                            <ul className="mt-1 font-body text-sm leading-relaxed text-gray-700">
                              {done.map((item) => (
                                <li key={item.id}>{item.label.split(". ")[0]}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 font-body text-sm text-gray-700">Aucune case</p>
                          )}
                          {day?.proofName ? (
                            <video src={`/posting/proof/${worker.id}/${date}`} controls className="mt-2 w-full rounded-2xl bg-black" />
                          ) : (
                            <p className="mt-1 font-body text-sm text-gray-700">Pas de vidéo</p>
                          )}
                          <p className="mt-1 font-body text-sm">{day?.validated ? "Journée validée" : "Journée pas validée"}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isTania ? (
          <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">Créneaux</h2>
            <p className="mt-1 font-body text-xs text-gray-700">
              {people.map((item) => `${personMark(item)} ${item.name}`).join(" · ")}
            </p>
            <div className="mt-3 grid grid-cols-[3.4rem_repeat(4,1fr)] gap-1 font-body text-[11px] leading-tight">
              <span />
              {SLOTS.map((slot) => (
                <span key={slot.id} className="text-center font-bold">
                  {slot.short}
                </span>
              ))}
              {visibleDates(true).map((date) => (
                <div key={date} className="contents">
                  <span className={`py-1 ${date === today ? "font-bold" : ""}`}>{formatShortDay(date)}</span>
                  {SLOTS.map((slot) => {
                    const marks = people
                      .filter((item) => slotsFor(desk, item.id, date).includes(slot.id))
                      .map((item) => personMark(item));
                    return (
                      <span key={slot.id} className="rounded-md bg-gray-100 px-0.5 py-1 text-center">
                        {marks.length > 0 ? marks.join(" ") : "·"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-gray-200 pt-4">
              <h3 className="font-body text-base font-bold">Profils</h3>
              <ul className="mt-3 flex flex-col gap-4">
                {people.map((item) => (
                  <li key={item.id}>
                    <ProfileEditor profile={item} onSave={savePerson} onDelete={deletePerson} />
                  </li>
                ))}
              </ul>
              <form onSubmit={(event) => void addPerson(event)} className="mt-4 flex flex-col gap-2">
                <label htmlFor="new-person" className="font-body text-sm font-bold">
                  Nouveau profil
                </label>
                <input
                  id="new-person"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Nom"
                  className={fieldClass}
                />
                <input
                  id="new-code"
                  value={newCode}
                  onChange={(event) => setNewCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Code"
                  className={fieldClass}
                />
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-black px-4 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Ajouter
                </button>
              </form>
              {profileError && <p className="mt-2 font-body text-sm text-[#C8102E]">{profileError}</p>}
            </div>
          </section>
        ) : (
          <section aria-label={ui.slots} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">{ui.slots}</h2>
            <p className="mt-2 font-body text-base leading-relaxed text-gray-700">{ui.slotsHelp}</p>
            <ul className="mt-4 flex flex-col gap-4">
              {visibleDates(false).map((date) => {
                const chosen = person ? slotsFor(desk, person.id, date)[0] : undefined;
                const chosenSlot = SLOTS.find((slot) => slot.id === chosen);
                return (
                  <li key={date} className="border-t border-gray-200 pt-4 first:border-t-0 first:pt-0">
                    <p className="font-body text-base font-bold">
                      {formatDay(date, lang)}
                      {date === today ? `, ${ui.todayWord}` : ""}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {SLOTS.map((slot) => {
                        const selected = chosen === slot.id;
                        const hour = hourText(slot.short);
                        return (
                          <button
                            key={slot.id}
                            id={`slot-${date}-${slot.id}`}
                            type="button"
                            aria-pressed={selected}
                            aria-label={`${formatDay(date, lang)} ${slot.label}`}
                            onClick={() => toggleSlot(date, slot.id)}
                            className={`flex h-12 items-center justify-center rounded-xl px-2 font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                              selected ? "bg-black text-white" : "bg-gray-100 text-black"
                            }`}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">
                      {chosenSlot ? ui.picked(hourText(chosenSlot.short)) : ui.pickOne}
                    </p>
                  </li>
                );
              })}
            </ul>
            {person && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                {missingDays.length > 0 && (
                  <p className="font-body text-base leading-relaxed text-gray-700">
                    {missingDays.length > 3 ? ui.missingCount(missingDays.length) : ui.missingHours(missingNames)}
                  </p>
                )}
                {missingDays.length === 0 && !weekSaved && (
                  <p className="font-body text-base leading-relaxed text-gray-700">{ui.readyHours}</p>
                )}
                {weekSaved ? (
                  <div id="validate-week" className={`${missingDays.length > 0 ? "mt-3" : ""} rounded-xl border border-black px-4 py-3`}>
                    <p className="font-body text-base font-bold">{ui.weekDone}</p>
                    <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">{ui.weekEdit}</p>
                  </div>
                ) : (
                  <button
                    id="validate-week"
                    type="button"
                    onClick={() =>
                      update((current) => ({ ...current, weekValidated: { ...current.weekValidated, [person.id]: true } }))
                    }
                    className="mt-3 h-12 w-full rounded-xl bg-black px-4 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    {ui.validateWeek}
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {!isTania && person && (
          <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">{ui.catchupTitle}</h2>
            <p className="mt-2 font-body text-base leading-relaxed text-gray-700">{ui.catchupBody}</p>
            <div className="mt-4 flex flex-col gap-4">
              {CATCHUP_DATES.map((date) => {
                const savedName =
                  desk.days[person.id]?.[date]?.proofName ||
                  remoteProofs.find((item) => item.profileId === person.id && item.date === date)?.name;
                const localUrl = urls[proofKey(person.id, date)];
                const remote = remoteProofs.some((item) => item.profileId === person.id && item.date === date);
                return (
                  <div key={date}>
                    <h3 className="font-body text-base font-bold">{date === "2026-11-06" ? ui.catchupFriday : ui.catchupSaturday}</h3>
                    <input
                      id={`catchup-${date}`}
                      type="file"
                      accept="video/*"
                      onChange={(event) => void onProof(date, event.target.files?.[0])}
                      className="mt-2 font-body text-sm"
                    />
                    <ProofFeedback
                      active={proofNote?.date === date}
                      percent={proofNote?.date === date ? proofNote.percent : 0}
                      text={proofNote?.date === date ? proofNote.text : ""}
                      error={proofError?.date === date ? proofError.text : null}
                    />
                    {(savedName || (proofNote?.date === date && proofNote.name)) && (
                      <p className="mt-2 font-body text-sm">{savedName || proofNote?.name}</p>
                    )}
                    {(localUrl || remote) && (
                      <video src={localUrl || `/posting/proof/${person.id}/${date}`} controls playsInline className="mt-2 w-full rounded-2xl bg-black" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {visiblePlans(isTania).map((plan) => {
          const checks = checksFor(plan, isTania ? "fr" : lang);
          if (isTania) {
            return (
              <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
                <p className="font-body text-sm text-gray-700">{dayHeading(plan)}</p>
                <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date)}</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {checks.map((check) => (
                    <li key={check.id} className={check.parent ? "ml-8 font-body text-sm leading-relaxed text-gray-700" : "font-body text-sm leading-relaxed"}>
                      {check.label}
                    </li>
                  ))}
                </ul>
                <RemoteProofs date={plan.date} proofs={remoteProofs} profiles={profiles} />
                {plan.publishers.length > 0 && (
                  <div className="mt-4 flex flex-col gap-4">
                    {ACCOUNTS.filter((account) => plan.publishers.includes(account.id)).map((account) => {
                      const fileName = desk.taniaFiles[plan.date]?.[account.id];
                      return (
                        <div key={account.id}>
                          <p className="font-body text-sm font-bold">
                            {account.name} · {accountRole(plan, account.id)}
                          </p>
                          <label htmlFor={`upload-${plan.date}-${account.id}`} className="mt-1 block font-body text-sm">
                            Diaporama
                          </label>
                          <input
                            id={`upload-${plan.date}-${account.id}`}
                            type="file"
                            accept="image/*,video/*"
                            onChange={(event) => void onSlide(plan.date, account.id, event.target.files?.[0])}
                            className="mt-1 font-body text-sm"
                          />
                          {fileName && <p className="mt-1 font-body text-sm">{fileName}</p>}
                          {urls[slideKey(plan.date, account.id)] && (
                            <a
                              href={urls[slideKey(plan.date, account.id)]}
                              download={fileName || "diaporama"}
                              className="mt-1 inline-block font-body text-sm font-bold underline"
                            >
                              Télécharger
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          }

          const state = person ? desk.days[person.id]?.[plan.date] ?? emptyDayState() : emptyDayState();
          const ready = dayReady(plan, state);
          return (
            <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
              <p className="font-body text-sm text-gray-700">{dayHeading(plan, lang)}</p>
              <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date, lang)}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {checks.map((check) => (
                  <li key={check.id} className={check.parent ? "ml-8" : ""}>
                    <label
                      htmlFor={`check-${plan.date}-${check.id}`}
                      className={`flex items-start gap-3 font-body ${check.parent ? "min-h-9 text-sm" : "min-h-11 text-base"}`}
                    >
                      <input
                        id={`check-${plan.date}-${check.id}`}
                        type="checkbox"
                        checked={state.checks[check.id] === true}
                        onChange={(event) =>
                          patchDay(plan.date, (day) => ({ ...day, checks: { ...day.checks, [check.id]: event.target.checked } }))
                        }
                        className={`shrink-0 accent-black ${check.parent ? "mt-0.5 h-4 w-4" : "mt-1 h-5 w-5"}`}
                      />
                      <span>{check.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-gray-100 p-3">
                <h3 className="font-body text-base font-bold">{ui.proof}</h3>
                <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">
                  {plan.kind === "friday" ? ui.proofScroll : ui.proofBody}
                </p>
                <input
                  id={`proof-${plan.date}`}
                  type="file"
                  accept="video/*"
                  onChange={(event) => void onProof(plan.date, event.target.files?.[0])}
                  className="mt-2 font-body text-sm"
                />
                {(state.proofName || (proofNote?.date === plan.date && proofNote.name)) && (
                  <p className="mt-2 font-body text-sm">{state.proofName || proofNote?.name}</p>
                )}
                <ProofFeedback
                  active={proofNote?.date === plan.date}
                  percent={proofNote?.date === plan.date ? proofNote.percent : 0}
                  text={proofNote?.date === plan.date ? proofNote.text : ""}
                  error={proofError?.date === plan.date ? proofError.text : null}
                />
                {person && (urls[proofKey(person.id, plan.date)] || remoteProofs.some((item) => item.profileId === person.id && item.date === plan.date)) && (
                  <video
                    src={urls[proofKey(person.id, plan.date)] || `/posting/proof/${person.id}/${plan.date}`}
                    controls
                    playsInline
                    className="mt-3 w-full rounded-2xl bg-black"
                  />
                )}
              </div>
              <button
                id={`validate-day-${plan.date}`}
                type="button"
                disabled={!ready || state.validated}
                onClick={() => patchDay(plan.date, (day) => ({ ...day, validated: true }))}
                className="mt-4 h-12 w-full rounded-xl bg-black px-4 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
              >
                {state.validated ? ui.dayDone : ui.validateDay}
              </button>
              {!state.validated && (
                <p className="mt-2 font-body text-sm text-gray-700">{ready ? ui.ready : ui.missing}</p>
              )}
            </section>
          );
        })}

        {fileError && <p className="font-body text-sm text-[#C8102E]">{fileError === "files" ? ui.files : fileError}</p>}
        <p className="font-body text-sm leading-relaxed text-gray-700">{ui.local}</p>
      </div>
    </main>
  );
};

const RemoteProofs = ({
  date,
  proofs,
  profiles,
}: {
  date: string;
  proofs: ProofRecord[];
  profiles: ManagedProfile[];
}) => {
  const rows = proofs.filter((item) => item.date === date);
  if (!rows.length) return null;
  return (
    <div className="mt-4 flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.profileId}>
          <p className="font-body text-sm font-bold">{profiles.find((item) => item.id === row.profileId)?.name}</p>
          <video src={`/posting/proof/${row.profileId}/${row.date}`} controls className="mt-2 w-full rounded-2xl bg-black" />
        </div>
      ))}
    </div>
  );
};

const ProfileEditor = ({
  profile,
  onSave,
  onDelete,
}: {
  profile: ManagedProfile;
  onSave: (id: string, name: string, code: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [name, setName] = useState(profile.name);
  const [code, setCode] = useState(profile.code ?? "");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`profile-name-${profile.id}`} className="sr-only">
        Nom de {profile.name}
      </label>
      <input
        id={`profile-name-${profile.id}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
        className={fieldClass}
      />
      <label htmlFor={`profile-code-${profile.id}`} className="sr-only">
        Code de {profile.name}
      </label>
      <input
        id={`profile-code-${profile.id}`}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        inputMode="numeric"
        autoComplete="off"
        className={fieldClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void onSave(profile.id, name, code)}
          className="h-12 rounded-xl bg-black px-3 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          Enregistrer
        </button>
        <button
          id={`profile-delete-${profile.id}`}
          type="button"
          onClick={() => void onDelete(profile.id)}
          className="h-12 rounded-xl border border-black bg-white px-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};
