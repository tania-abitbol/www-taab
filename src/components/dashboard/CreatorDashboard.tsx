"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  VideoLedger,
  VideoObservation,
  applyObservation,
  elapsedMonthCount,
  eurosForViews,
  monthRows,
} from "~/config/creatorPayout";

const STORAGE_KEY = "taab:creator-video-stats:v2";

const numberFormat = new Intl.NumberFormat("fr-FR");
const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ERRORS: Record<string, string> = {
  unsupported: "Colle un lien public TikTok ou Instagram.",
  "not-video": "Ce lien ne pointe pas vers une vidéo.",
  unavailable: "La page publique ne s'est pas ouverte. Réessaie dans un instant.",
  unauthorized: "Le code a expiré. Recharge la page et entre-le à nouveau.",
};

const readLedgers = (): VideoLedger[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLedgers = (ledgers: VideoLedger[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgers));
};

const formatCount = (value: number | null) => (value == null ? "—" : numberFormat.format(value));

export const CreatorDashboard = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [ledgers, setLedgers] = useState<VideoLedger[]>([]);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const submittingRef = useRef(false);
  const now = Date.now();

  useEffect(() => {
    setLedgers(readLedgers());
    setReady(true);
  }, []);

  const monthCount = useMemo(
    () => ledgers.reduce((max, ledger) => Math.max(max, elapsedMonthCount(ledger, ledger.updatedAt ?? now)), 0),
    [ledgers, now]
  );
  const months = useMemo(() => Array.from({ length: monthCount }, (_, index) => index + 1), [monthCount]);

  const persist = (next: VideoLedger[]) => {
    setLedgers(next);
    writeLedgers(next);
  };

  const submitUrl = async (nextUrl: string) => {
    const trimmed = nextUrl.trim();
    if (!trimmed || submittingRef.current) return;
    submittingRef.current = true;
    setStatus("loading");
    setError("");
    setPendingUrl(trimmed);
    try {
      const response = await fetch("/dashboard/creator/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const payload = (await response.json()) as VideoObservation & { error?: string };
      if (!response.ok) {
        setError(ERRORS[payload.error ?? ""] ?? ERRORS.unavailable);
        setStatus("error");
        return;
      }
      setLedgers((current) => {
        const previous = current.find((ledger) => ledger.id === payload.id) ?? null;
        const next = [applyObservation(previous, payload), ...current.filter((ledger) => ledger.id !== payload.id)].slice(0, 40);
        writeLedgers(next);
        return next;
      });
      setUrl("");
      setStatus("idle");
    } catch {
      setError(ERRORS.unavailable);
      setStatus("error");
    } finally {
      submittingRef.current = false;
      setPendingUrl(null);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitUrl(url);
  };

  const removeLedger = (id: string) => {
    persist(ledgers.filter((ledger) => ledger.id !== id));
  };

  return (
    <main lang="fr" className="min-h-dvh px-3 py-6 selection:bg-yellow selection:text-black sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[100rem]">
        <a href="/" className="font-title text-3xl tracking-tight">
          TAAB
        </a>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-title text-4xl tracking-tight">Suivi</h1>
            <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-gray-700">
              1&nbsp;€ pour 1&nbsp;000 vues. Le total est le chiffre public depuis la publication. Un mois n&apos;affiche
              des euros que pour les vues gagnées entre deux relevés.
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="video-url" className="sr-only">
              Lien de la vidéo
            </label>
            <input
              id="video-url"
              name="url"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              placeholder="Coller un lien TikTok ou Instagram"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="h-12 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              aria-busy={status === "loading"}
              className="h-12 shrink-0 rounded-xl bg-black px-5 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-80"
            >
              {status === "loading" ? "Ajout…" : "Ajouter"}
            </button>
          </form>
        </div>
        {status === "error" && (
          <p role="alert" className="mt-3 font-body text-sm text-[#C8102E]">
            {error}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
          <table className="w-max min-w-full border-collapse text-left">
            <caption className="sr-only">Vidéos suivies, totaux publics et euros par mois mesuré</caption>
            <thead>
              <tr className="border-b border-gray-200 font-body text-xs font-bold text-gray-700">
                <th scope="col" className="sticky left-0 z-10 bg-white px-4 py-3 text-black">
                  Vidéo
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Vues
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  J&apos;aime
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Commentaires
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Partages
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  Enregistrements
                </th>
                <th scope="col" className="px-3 py-3 text-right text-black" title="Total public depuis la publication, pas un mois">
                  Total €
                </th>
                {months.map((month) => (
                  <th key={month} scope="col" className="border-l border-gray-200 px-3 py-3 text-right first:border-l-0">
                    Mois {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-body text-sm">
              {pendingUrl && (
                <tr className="border-b border-gray-200">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-normal">
                    <span className="block max-w-[14rem] truncate font-bold">{pendingUrl}</span>
                    <span className="text-gray-700">Lecture…</span>
                  </th>
                  <td colSpan={6 + months.length} className="px-3 py-3 text-gray-700">
                    …
                  </td>
                </tr>
              )}
              {ready && ledgers.length === 0 && !pendingUrl && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-gray-700">
                    Aucune vidéo. Ajoute un lien pour ouvrir une ligne.
                  </td>
                </tr>
              )}
              {ledgers.map((ledger) => {
                const rows = monthRows(ledger, ledger.updatedAt ?? now);
                const byMonth = new Map(rows.map((row) => [row.month, row]));
                return (
                  <tr key={ledger.id} className="group border-b border-gray-200 last:border-b-0">
                    <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-left align-top font-normal group-hover:bg-gray-100">
                      <a
                        href={ledger.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-w-[16rem] truncate font-bold underline decoration-gray-300 underline-offset-2"
                      >
                        {ledger.author ?? "Vidéo"}
                      </a>
                      {ledger.caption && (
                        <p className="mt-0.5 line-clamp-2 max-w-[16rem] font-normal text-gray-700">{ledger.caption}</p>
                      )}
                      <span className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => void submitUrl(ledger.url)}
                          disabled={status === "loading"}
                          className="font-normal text-gray-700 underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                        >
                          Actualiser
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLedger(ledger.id)}
                          className="font-normal text-gray-700 underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                        >
                          Retirer
                        </button>
                      </span>
                      {ledger.unassignedViews > 0 && (
                        <p className="mt-2 max-w-[16rem] font-normal text-gray-700">
                          {numberFormat.format(ledger.unassignedViews)} vues gagnées à cheval sur deux mois, non
                          réparties.
                        </p>
                      )}
                    </th>
                    <td className="px-3 py-3 text-right align-top tabular-nums">{formatCount(ledger.views)}</td>
                    <td className="px-3 py-3 text-right align-top tabular-nums">{formatCount(ledger.likes)}</td>
                    <td className="px-3 py-3 text-right align-top tabular-nums">{formatCount(ledger.comments)}</td>
                    <td className="px-3 py-3 text-right align-top tabular-nums">{formatCount(ledger.shares)}</td>
                    <td className="px-3 py-3 text-right align-top tabular-nums">{formatCount(ledger.saves)}</td>
                    <td className="px-3 py-3 text-right align-top font-bold tabular-nums">
                      {ledger.views == null ? "—" : euroFormat.format(eurosForViews(ledger.views))}
                    </td>
                    {months.map((month) => {
                      const row = byMonth.get(month);
                      let label = "";
                      if (row) label = row.euros == null ? "non mesuré" : euroFormat.format(row.euros);
                      return (
                        <td
                          key={month}
                          className={`border-l border-gray-200 px-3 py-3 text-right align-top tabular-nums ${
                            row?.open ? "font-bold" : ""
                          } ${row && row.euros == null ? "text-gray-700" : ""}`}
                        >
                          {label}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl font-body text-sm leading-relaxed text-gray-700">
          Les relevés restent dans ce navigateur. Actualiser une ligne ajoute au mois en cours seulement les vues
          gagnées depuis le relevé précédent, si les deux relevés sont dans le même mois.
        </p>
      </div>
    </main>
  );
};
