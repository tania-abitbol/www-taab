"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  ACCOUNTS,
  DAY_PLANS,
  DayState,
  Desk,
  SLOTS,
  SlotId,
  calendarDates,
  checksFor,
  dayHeading,
  dayReady,
  emptyDayState,
  formatDay,
  madridToday,
  othersValidated,
  planFor,
  slideshowSplit,
  slotsFor,
} from "~/config/posting";
import { loadBlob, readDesk, saveBlob, writeDesk } from "~/components/posting/storage";

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1";

const proofKey = (personId: string, date: string) => `proof:${personId}:${date}`;
const TANIA_FILE = "tania:slideshow";

export const PostingDashboard = () => {
  const today = madridToday();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [viewer, setViewer] = useState("p1");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [newName, setNewName] = useState("");

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
            const name = loaded.days[person.id]?.[plan.date]?.proofName;
            if (!name) continue;
            const blob = await loadBlob(proofKey(person.id, plan.date));
            if (blob) remember(proofKey(person.id, plan.date), blob);
          }
        }
        if (loaded.taniaFileName) {
          const blob = await loadBlob(TANIA_FILE);
          if (blob) remember(TANIA_FILE, blob);
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

  const person = desk.people.find((item) => item.id === viewer) ?? null;
  const weekOpen = othersValidated(desk);

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
        weekValidated: { ...current.weekValidated, [person.id]: false },
        taniaValidated: false,
      };
    });
  };

  const patchDay = (date: string, recipe: (day: DayState) => DayState) => {
    if (!person) return;
    update((current) => {
      const existing = current.days[person.id]?.[date] ?? emptyDayState();
      const next = recipe(existing);
      const plan = planFor(date);
      const ready = plan ? dayReady(plan, next, slotsFor(current, person.id, date).length) : false;
      const saved = { ...next, validated: next.validated && ready };
      return {
        ...current,
        days: { ...current.days, [person.id]: { ...current.days[person.id], [date]: saved } },
      };
    });
  };

  const onProof = async (date: string, file: File | undefined) => {
    if (!file || !person) return;
    setFileError("");
    try {
      await saveBlob(proofKey(person.id, date), file);
      const url = URL.createObjectURL(file);
      setUrls((current) => ({ ...current, [proofKey(person.id, date)]: url }));
      patchDay(date, (day) => ({ ...day, proofName: file.name, validated: day.validated }));
    } catch {
      setFileError("La capture n'a pas été gardée. Réessaie avec un fichier plus léger.");
    }
  };

  const onTaniaFile = async (file: File | undefined) => {
    if (!file) return;
    setFileError("");
    try {
      await saveBlob(TANIA_FILE, file);
      const url = URL.createObjectURL(file);
      setUrls((current) => ({ ...current, [TANIA_FILE]: url }));
      update((current) => ({ ...current, taniaFileName: file.name }));
    } catch {
      setFileError("Le fichier n'a pas été gardé dans ce navigateur.");
    }
  };

  const addPerson = (event: FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const id = `p-${Date.now().toString(36)}`;
    update((current) => ({
      ...current,
      people: [...current.people, { id, name }],
      taniaValidated: false,
    }));
    setNewName("");
    setViewer(id);
  };

  return (
    <main lang="fr" className="min-h-dvh px-4 py-6 selection:bg-yellow selection:text-black sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <a href="/" className="font-title text-3xl tracking-tight">
          TAAB
        </a>
        <header>
          <h1 className="font-title text-4xl tracking-tight">Publication</h1>
          <p className="mt-2 max-w-prose font-body text-sm leading-relaxed text-gray-700">
            Du jeudi 5 novembre au dimanche 15 novembre. Chacun coche ses créneaux, puis Tania les poste sur Upwork.
          </p>
        </header>

        <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
          <label htmlFor="viewer" className="font-body text-sm font-bold">
            Je suis
          </label>
          <select id="viewer" value={viewer} onChange={(event) => setViewer(event.target.value)} className={`mt-2 ${fieldClass}`}>
            {desk.people.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            <option value="tania">Tania</option>
          </select>
          {person && (
            <label htmlFor="person-name" className="mt-3 block font-body text-sm font-bold">
              Nom affiché
              <input
                id="person-name"
                value={person.name}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    people: current.people.map((item) => (item.id === person.id ? { ...item, name: event.target.value } : item)),
                  }))
                }
                className={`mt-2 ${fieldClass}`}
              />
            </label>
          )}
          <form onSubmit={addPerson} className="mt-3 flex gap-2">
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

        <section aria-label="Calendrier de la semaine" className="flex flex-col gap-3">
          <h2 className="font-title text-2xl tracking-tight">Créneaux</h2>
          {calendarDates().map((date) => (
            <article key={date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
              <h3 className="font-body text-base font-bold">
                {formatDay(date)}
                {date === today ? " · aujourd'hui" : ""}
              </h3>
              {person && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {SLOTS.map((slot) => {
                    const selected = slotsFor(desk, person.id, date).includes(slot.id);
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
              )}
              <ul className="mt-3 flex flex-col gap-1">
                {desk.people.map((item) => {
                  const labels = slotsFor(desk, item.id, date).map((id) => SLOTS.find((slot) => slot.id === id)?.label);
                  return (
                    <li key={item.id} className="font-body text-sm text-gray-700">
                      {item.name} · {labels.length > 0 ? labels.join(", ") : "aucun créneau"}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
          <h2 className="font-title text-2xl tracking-tight">Validation</h2>
          {person && (
            <button
              id="validate-week"
              type="button"
              disabled={desk.weekValidated[person.id] === true}
              onClick={() => update((current) => ({ ...current, weekValidated: { ...current.weekValidated, [person.id]: true } }))}
              className="mt-3 h-12 w-full rounded-xl bg-black px-4 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
            >
              {desk.weekValidated[person.id] ? "Semaine validée" : "Valider ma semaine"}
            </button>
          )}
          <p className="mt-4 font-body text-sm leading-relaxed text-gray-700">
            Quand les autres ont validé, Tania valide à son tour. Elle poste ensuite les créneaux sur Upwork.
          </p>
          <button
            id="validate-tania"
            type="button"
            disabled={!weekOpen || desk.taniaValidated}
            onClick={() => update((current) => ({ ...current, taniaValidated: true }))}
            className="mt-3 h-12 w-full rounded-xl border border-black bg-white px-4 font-body text-base font-bold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
          >
            {desk.taniaValidated ? "Créneaux validés, à poster sur Upwork" : "Valider les créneaux"}
          </button>
          {!weekOpen && <p className="mt-2 font-body text-sm text-gray-700">En attente de la validation de chaque personne.</p>}
        </section>

        {DAY_PLANS.map((plan) => {
          const state = person ? desk.days[person.id]?.[plan.date] ?? emptyDayState() : emptyDayState();
          const slotCount = person ? slotsFor(desk, person.id, plan.date).length : 0;
          const checks = checksFor(plan, state, slotCount);
          const ready = person ? dayReady(plan, state, slotCount) : false;
          const split = slideshowSplit(slotCount);
          return (
            <section key={plan.date} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
              <p className="font-body text-sm text-gray-700">{dayHeading(plan)}</p>
              <h2 className="font-title text-2xl tracking-tight">{formatDay(plan.date)}</h2>
              {plan.kind === "warmup" || plan.kind === "warmup-profile" ? (
                <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">1 h pour les trois comptes, soit 20 min chacun.</p>
              ) : null}
              {plan.kind === "slideshow" && (
                <div className="mt-3">
                  <p className="font-body text-sm leading-relaxed text-gray-700">
                    Un compte publie un diaporama. 10 min d&apos;échauffement avant, 10 min après.
                    {slotCount > 0
                      ? ` Temps restant ${split.remaining} min, soit ${split.each} min sur chacun des deux autres comptes.`
                      : " Coche tes créneaux pour voir le temps restant en minutes."}
                  </p>
                  <div role="radiogroup" aria-label="Compte du diaporama" className="mt-3 grid gap-2">
                    {ACCOUNTS.map((account) => {
                      const selected = state.slideshowAccount === account.id;
                      return (
                        <button
                          key={account.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={!person}
                          onClick={() => patchDay(plan.date, (day) => ({ ...day, slideshowAccount: account.id }))}
                          className={`h-12 rounded-xl border px-3 text-left font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                            selected ? "border-black bg-black text-white" : "border-gray-300 bg-white"
                          }`}
                        >
                          Diaporama · {account.name}
                        </button>
                      );
                    })}
                  </div>
                  <label htmlFor="tania-file" className="mt-4 block font-body text-sm font-bold">
                    Fichier de Tania
                  </label>
                  <input
                    id="tania-file"
                    type="file"
                    onChange={(event) => void onTaniaFile(event.target.files?.[0])}
                    className="mt-2 font-body text-sm"
                  />
                  {desk.taniaFileName && <p className="mt-2 font-body text-sm">{desk.taniaFileName}</p>}
                  {urls[TANIA_FILE] && (
                    <a href={urls[TANIA_FILE]} download={desk.taniaFileName || "diaporama"} className="mt-2 inline-block font-body text-sm font-bold underline">
                      Télécharger
                    </a>
                  )}
                </div>
              )}
              {plan.kind === "two-publish" && person && (
                <div className="mt-3">
                  <p className="font-body text-sm leading-relaxed text-gray-700">
                    Deux comptes publient. Le troisième ne fait que l&apos;échauffement.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {ACCOUNTS.map((account) => {
                      const selected = state.publishers.includes(account.id);
                      return (
                        <button
                          key={account.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            patchDay(plan.date, (day) => ({
                              ...day,
                              publishers: selected
                                ? day.publishers.filter((id) => id !== account.id)
                                : [...day.publishers, account.id],
                            }))
                          }
                          className={`h-12 rounded-xl border px-3 text-left font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                            selected ? "border-black bg-black text-white" : "border-gray-300 bg-white"
                          }`}
                        >
                          {account.name} publie
                        </button>
                      );
                    })}
                  </div>
                  {state.publishers.length !== 2 && (
                    <p className="mt-2 font-body text-sm text-gray-700">Choisis exactement deux comptes.</p>
                  )}
                </div>
              )}
              {plan.kind === "all-publish" && (
                <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">Les trois comptes publient.</p>
              )}

              {person ? (
                <ul className="mt-4 flex flex-col gap-2">
                  {checks.map((check) => (
                    <li key={check.id}>
                      <label htmlFor={`check-${plan.date}-${check.id}`} className="flex min-h-11 items-start gap-3 font-body text-base">
                        <input
                          id={`check-${plan.date}-${check.id}`}
                          type="checkbox"
                          checked={state.checks[check.id] === true}
                          onChange={(event) =>
                            patchDay(plan.date, (day) => ({
                              ...day,
                              checks: { ...day.checks, [check.id]: event.target.checked },
                            }))
                          }
                          className="mt-1 h-5 w-5 accent-black"
                        />
                        <span>{check.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {desk.people.map((item) => {
                    const itemState = desk.days[item.id]?.[plan.date] ?? emptyDayState();
                    const itemReady = dayReady(plan, itemState, slotsFor(desk, item.id, plan.date).length);
                    return (
                      <li key={item.id} className="font-body text-sm">
                        {item.name} · {itemState.validated ? "journée validée" : itemReady ? "prête à valider" : "en cours"}
                        {itemState.proofName ? ` · ${itemState.proofName}` : " · sans preuve"}
                      </li>
                    );
                  })}
                </ul>
              )}

              {person && (
                <div className="mt-5 rounded-2xl bg-gray-100 p-3">
                  <h3 className="font-body text-base font-bold">Preuve du jour</h3>
                  <p className="mt-1 font-body text-sm leading-relaxed text-gray-700">
                    Enregistrement filmé de la session. C&apos;est la seule preuve de publication.
                  </p>
                  <label htmlFor={`proof-${plan.date}`} className="mt-3 block font-body text-sm font-bold">
                    Fichier
                  </label>
                  <input
                    id={`proof-${plan.date}`}
                    type="file"
                    accept="video/*"
                    onChange={(event) => void onProof(plan.date, event.target.files?.[0])}
                    className="mt-2 font-body text-sm"
                  />
                  {state.proofName && <p className="mt-2 font-body text-sm">{state.proofName}</p>}
                  {urls[proofKey(person.id, plan.date)] && (
                    <video src={urls[proofKey(person.id, plan.date)]} controls className="mt-3 w-full rounded-2xl bg-black" />
                  )}
                </div>
              )}

              {person && (
                <div className="mt-4">
                  <button
                    id={`validate-day-${plan.date}`}
                    type="button"
                    disabled={!ready || state.validated}
                    onClick={() => patchDay(plan.date, (day) => ({ ...day, validated: true }))}
                    className="h-12 w-full rounded-xl bg-black px-4 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-40"
                  >
                    {state.validated ? "Journée validée" : "Valider la journée"}
                  </button>
                  {!state.validated && (
                    <p className="mt-2 font-body text-sm text-gray-700">
                      {ready ? "Cases et preuve sont là." : "Il manque des cases ou la preuve."}
                    </p>
                  )}
                </div>
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
