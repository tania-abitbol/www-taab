"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  ACCOUNTS,
  DAY_PLANS,
  DayState,
  Desk,
  DeskRole,
  SLOTS,
  SlotId,
  accountRole,
  calendarDates,
  checksFor,
  dayHeading,
  dayReady,
  emptyDayState,
  formatDay,
  formatShortDay,
  madridToday,
  personMark,
  slotsFor,
} from "~/config/posting";
import { loadBlob, readDesk, saveBlob, writeDesk } from "~/components/posting/storage";

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1";

const proofKey = (personId: string, date: string) => `proof:${personId}:${date}`;
const slideKey = (date: string, accountId: string) => `tania:${date}:${accountId}`;

export const PostingDashboard = ({ role }: { role: DeskRole }) => {
  const today = madridToday();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [newName, setNewName] = useState("");
  const isTania = role === "tania";

  useEffect(() => {
    const loaded = readDesk();
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
        if (!cancelled) setFileError("Les fichiers de ce navigateur ne se sont pas ouverts.");
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
      <main lang="fr" className="min-h-dvh px-4 py-6">
        <p className="font-body text-base text-gray-700">Ouverture…</p>
      </main>
    );
  }

  const person = desk.people.find((item) => item.id === role) ?? null;

  const toggleSlot = (date: string, slotId: SlotId) => {
    if (!person) return;
    update((current) => {
      const chosen = new Set(slotsFor(current, person.id, date));
      if (chosen.has(slotId)) chosen.delete(slotId);
      else chosen.add(slotId);
      const ordered = SLOTS.map((slot) => slot.id).filter((id) => chosen.has(id));
      return {
        ...current,
        slots: { ...current.slots, [person.id]: { ...current.slots[person.id], [date]: ordered } },
      };
    });
  };

  const patchDay = (date: string, recipe: (day: DayState) => DayState) => {
    if (!person) return;
    update((current) => {
      const existing = current.days[person.id]?.[date] ?? emptyDayState();
      const next = recipe(existing);
      const plan = DAY_PLANS.find((item) => item.date === date);
      const validated = Boolean(plan && next.validated && dayReady(plan, next));
      return {
        ...current,
        days: { ...current.days, [person.id]: { ...current.days[person.id], [date]: { ...next, validated } } },
      };
    });
  };

  const onProof = async (date: string, file: File | undefined) => {
    if (!file || !person) return;
    setFileError("");
    try {
      await saveBlob(proofKey(person.id, date), file);
      setUrls((current) => ({ ...current, [proofKey(person.id, date)]: URL.createObjectURL(file) }));
      patchDay(date, (day) => ({ ...day, proofName: file.name }));
    } catch {
      setFileError("La capture n'a pas été gardée. Réessaie avec un fichier plus léger.");
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

  const addPerson = (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    update((current) => ({ ...current, people: [...current.people, { id: `x-${Date.now().toString(36)}`, name }] }));
    setNewName("");
  };

  return (
    <main lang="fr" className="min-h-dvh px-4 py-6 selection:bg-yellow selection:text-black sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <a href="/" className="font-title text-3xl tracking-tight">
          TAAB
        </a>
        <header>
          <h1 className="font-title text-4xl tracking-tight">{isTania ? "Tania" : person?.name}</h1>
          <p className="mt-2 max-w-prose font-body text-sm leading-relaxed text-gray-700">
            Du jeudi 5 novembre au dimanche 15 novembre.
          </p>
        </header>

        {isTania ? (
          <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
            <h2 className="font-title text-2xl tracking-tight">Créneaux</h2>
            <p className="mt-1 font-body text-xs text-gray-700">
              {desk.people.map((item) => `${personMark(item)} ${item.name}`).join(" · ")}
            </p>
            <div className="mt-3 grid grid-cols-[3.4rem_repeat(4,1fr)] gap-1 font-body text-[11px] leading-tight">
              <span />
              {SLOTS.map((slot) => (
                <span key={slot.id} className="text-center font-bold">
                  {slot.short}
                </span>
              ))}
              {calendarDates().map((date) => (
                <div key={date} className="contents">
                  <span className={`py-1 ${date === today ? "font-bold" : ""}`}>{formatShortDay(date)}</span>
                  {SLOTS.map((slot) => {
                    const marks = desk.people
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
            <form onSubmit={addPerson} className="mt-4 flex gap-2">
              <label htmlFor="new-person" className="sr-only">
                Ajouter une personne
              </label>
              <input
                id="new-person"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Ajouter une personne"
                className={fieldClass}
              />
              <button
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-black px-4 font-body text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Ajouter
              </button>
            </form>
          </section>
        ) : (
          <section aria-label="Créneaux" className="flex flex-col gap-3">
            <h2 className="font-title text-2xl tracking-tight">Créneaux</h2>
            {calendarDates().map((date) => (
              <article key={date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
                <h3 className="font-body text-base font-bold">
                  {formatDay(date)}
                  {date === today ? " · aujourd'hui" : ""}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SLOTS.map((slot) => {
                    const selected = person ? slotsFor(desk, person.id, date).includes(slot.id) : false;
                    return (
                      <button
                        key={slot.id}
                        id={`slot-${date}-${slot.id}`}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleSlot(date, slot.id)}
                        className={`h-12 rounded-xl border px-2 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                          selected ? "border-black bg-black text-white" : "border-gray-300 bg-white text-black"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
            {person && (
              <button
                id="validate-week"
                type="button"
                disabled={desk.weekValidated[person.id] === true}
                onClick={() => update((current) => ({ ...current, weekValidated: { ...current.weekValidated, [person.id]: true } }))}
                className="h-12 rounded-xl bg-black px-4 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
              >
                {desk.weekValidated[person.id] ? "Semaine validée" : "Valider ma semaine"}
              </button>
            )}
          </section>
        )}

        {DAY_PLANS.map((plan) => {
          const checks = checksFor(plan);
          if (isTania && plan.kind !== "post") {
            return (
              <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
                <p className="font-body text-sm text-gray-700">{dayHeading(plan)}</p>
                <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date)}</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {checks.map((check) => (
                    <li key={check.id} className="font-body text-sm leading-relaxed">
                      {check.label}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          if (isTania && plan.kind === "post") {
            return (
              <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
                <p className="font-body text-sm text-gray-700">{dayHeading(plan)}</p>
                <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date)}</h2>
                <div className="mt-3 flex flex-col gap-4">
                  {ACCOUNTS.map((account) => {
                    const roleLabel = accountRole(plan, account.id);
                    const fileName = desk.taniaFiles[plan.date]?.[account.id];
                    return (
                      <div key={account.id}>
                        <p className="font-body text-sm font-bold">
                          {account.name} · {roleLabel}
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
              </section>
            );
          }

          const state = person ? desk.days[person.id]?.[plan.date] ?? emptyDayState() : emptyDayState();
          const ready = dayReady(plan, state);
          return (
            <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
              <p className="font-body text-sm text-gray-700">{dayHeading(plan)}</p>
              <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date)}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {checks.map((check) => (
                  <li key={check.id}>
                    <label htmlFor={`check-${plan.date}-${check.id}`} className="flex min-h-11 items-start gap-3 font-body text-base">
                      <input
                        id={`check-${plan.date}-${check.id}`}
                        type="checkbox"
                        checked={state.checks[check.id] === true}
                        onChange={(event) =>
                          patchDay(plan.date, (day) => ({ ...day, checks: { ...day.checks, [check.id]: event.target.checked } }))
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-black"
                      />
                      <span>{check.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-gray-100 p-3">
                <h3 className="font-body text-base font-bold">Preuve du jour</h3>
                <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">
                  Enregistrement filmé de la session. C&apos;est la seule preuve de publication.
                </p>
                <input
                  id={`proof-${plan.date}`}
                  type="file"
                  accept="video/*"
                  onChange={(event) => void onProof(plan.date, event.target.files?.[0])}
                  className="mt-2 font-body text-sm"
                />
                {state.proofName && <p className="mt-2 font-body text-sm">{state.proofName}</p>}
                {person && urls[proofKey(person.id, plan.date)] && (
                  <video src={urls[proofKey(person.id, plan.date)]} controls className="mt-3 w-full rounded-2xl bg-black" />
                )}
              </div>
              <button
                id={`validate-day-${plan.date}`}
                type="button"
                disabled={!ready || state.validated}
                onClick={() => patchDay(plan.date, (day) => ({ ...day, validated: true }))}
                className="mt-4 h-12 w-full rounded-xl bg-black px-4 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
              >
                {state.validated ? "Journée validée" : "Valider la journée"}
              </button>
              {!state.validated && (
                <p className="mt-2 font-body text-sm text-gray-700">
                  {ready ? "Cases et preuve sont là." : "Il manque des cases ou la preuve."}
                </p>
              )}
            </section>
          );
        })}

        {fileError && <p className="font-body text-sm text-[#C8102E]">{fileError}</p>}
        <p className="font-body text-sm leading-relaxed text-gray-700">Créneaux, cases et fichiers restent dans ce navigateur.</p>
      </div>
    </main>
  );
};
