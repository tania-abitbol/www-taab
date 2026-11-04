"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  MonthRow,
  VideoLedger,
  VideoObservation,
  applyObservation,
  monthRows,
} from "~/config/creatorPayout";

const STORAGE_KEY = "taab:creator-video-stats:v1";

const numberFormat = new Intl.NumberFormat("fr-FR");
const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

const ERRORS: Record<string, string> = {
  unsupported: "Colle un lien public TikTok ou Instagram.",
  "not-video": "Ce lien ne pointe pas vers une vidéo.",
  unavailable: "La page publique ne s'est pas ouverte. Réessaie dans un instant.",
  unauthorized: "Le code a expiré. Recharge la page et entre-le à nouveau.",
};

const viewsLabel = (views: number) => `${numberFormat.format(views)} ${views === 1 ? "vue" : "vues"}`;

const basisLabel = (basis: MonthRow["basis"]) => {
  if (basis === "opening") return "mesuré depuis aujourd'hui";
  if (basis === "unmeasured") return "pas mesuré";
  if (basis === "boundary") return "écart depuis le dernier relevé, sans découpage";
  return "vues gagnées sur cette période";
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

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <dt className="font-body text-sm text-gray-700">{label}</dt>
    <dd className="font-title text-2xl tabular-nums tracking-tight">{value}</dd>
  </div>
);

export const CreatorDashboard = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [ledgers, setLedgers] = useState<VideoLedger[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readLedgers();
    setLedgers(saved);
    setActiveId(saved[0]?.id ?? null);
    setReady(true);
  }, []);

  const active = ledgers.find((ledger) => ledger.id === activeId) ?? null;
  const rows = useMemo(() => (active ? monthRows(active, active.updatedAt ?? Date.now()) : []), [active]);
  const openRow = rows.find((row) => row.open) ?? rows[rows.length - 1];
  const earlier = rows.filter((row) => row !== openRow);

  const submitUrl = async (nextUrl: string) => {
    const trimmed = nextUrl.trim();
    if (!trimmed || status === "loading") return;
    setStatus("loading");
    setError("");
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
        const next = applyObservation(previous, payload);
        const rest = current.filter((ledger) => ledger.id !== next.id);
        const saved = [next, ...rest].slice(0, 30);
        writeLedgers(saved);
        return saved;
      });
      setActiveId(payload.id);
      setUrl(trimmed);
      setStatus("idle");
    } catch {
      setError(ERRORS.unavailable);
      setStatus("error");
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitUrl(url);
  };

  return (
    <main lang="fr" className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8 selection:bg-yellow selection:text-black sm:py-12">
      <a href="/" className="font-title text-3xl tracking-tight">
        TAAB
      </a>
      <h1 className="mb-3 mt-8 font-title text-4xl tracking-tight">Suivi des vues</h1>
      <p className="mb-6 max-w-[40ch] font-body text-base leading-relaxed text-gray-700">
        1&nbsp;€ par vue, compté par période de 30&nbsp;jours à partir de la date du post.
      </p>

      <form onSubmit={onSubmit} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
        <label htmlFor="video-url" className="mb-2 block font-body text-sm font-bold">
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
          placeholder="https://www.tiktok.com/…"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="block h-12 w-full rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
        />
        {status === "error" && (
          <p role="alert" className="mt-3 font-body text-sm text-[#C8102E]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          aria-busy={status === "loading"}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-black px-6 font-body text-base font-bold text-white transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
        >
          {status === "loading" ? "Lecture…" : "Lire la vidéo"}
        </button>
      </form>

      {active && (
        <article aria-live="polite" className="mt-6">
          <header className="mb-4">
            <h2 className="font-title text-2xl tracking-tight">{active.author ?? "Vidéo"}</h2>
            {active.postedAt != null && (
              <p className="mt-1 font-body text-sm text-gray-700">
                Publiée le {dateFormat.format(active.postedAt)}
                {active.dateSource === "media-id" ? " · date lue depuis l'identifiant public" : ""}
              </p>
            )}
            {active.postedAt == null && (
              <p className="mt-1 font-body text-sm text-gray-700">
                La date du post n&apos;est pas sur la page publique. Les périodes ne peuvent pas être calculées.
              </p>
            )}
            {active.caption && (
              <p className="mt-3 line-clamp-3 font-body text-sm leading-relaxed">{active.caption}</p>
            )}
          </header>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label="Vues" value={active.views == null ? "non public" : numberFormat.format(active.views)} />
            <Stat label="J'aime" value={active.likes == null ? "non public" : numberFormat.format(active.likes)} />
            <Stat
              label="Commentaires"
              value={active.comments == null ? "non public" : numberFormat.format(active.comments)}
            />
            {active.shares != null && <Stat label="Partages" value={numberFormat.format(active.shares)} />}
            {active.saves != null && <Stat label="Enregistrements" value={numberFormat.format(active.saves)} />}
          </dl>

          {openRow && (
            <section className="mt-8" aria-labelledby="open-month-title">
              <h3 id="open-month-title" className="mb-3 font-title text-xl tracking-tight">
                Mois {openRow.month}
                <span className="ml-2 font-body text-sm font-normal text-gray-700">en cours</span>
              </h3>
              <div className="rounded-3xl bg-yellow px-5 py-5 text-black">
                <p className="font-title text-4xl tabular-nums tracking-tight">{euroFormat.format(openRow.euros)}</p>
                <p className="mt-1 font-body text-base">{viewsLabel(openRow.views)}</p>
                <p className="mt-3 font-body text-sm">{basisLabel(openRow.basis)}</p>
                <p className="mt-1 font-body text-sm text-black/70">
                  {dateFormat.format(openRow.start)} – {dateFormat.format(openRow.end - 1)}
                </p>
              </div>
            </section>
          )}

          {earlier.length > 0 && (
            <section className="mt-8" aria-labelledby="earlier-months-title">
              <h3 id="earlier-months-title" className="mb-3 font-title text-xl tracking-tight">
                Mois précédents
              </h3>
              {earlier.every((row) => row.basis === "unmeasured") && (
                <p className="mb-3 font-body text-sm leading-relaxed text-gray-700">
                  Mois 1 à {earlier[earlier.length - 1].month}&nbsp;: 0&nbsp;€. Pas mesuré avant aujourd&apos;hui.
                </p>
              )}
              <ol className="max-h-[28rem] divide-y divide-gray-200 overflow-y-auto rounded-3xl bg-white shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
                {earlier.map((row) => (
                  <li key={row.month} className="flex items-baseline justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-body text-sm font-bold">Mois {row.month}</p>
                      <p className="font-body text-sm text-gray-700">{basisLabel(row.basis)}</p>
                    </div>
                    <p className="shrink-0 text-right font-body text-sm tabular-nums">
                      <span className="block font-bold">{euroFormat.format(row.euros)}</span>
                      <span className="text-gray-700">{viewsLabel(row.views)}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </article>
      )}

      {ready && ledgers.length > 1 && (
        <section className="mt-10" aria-labelledby="saved-videos-title">
          <h2 id="saved-videos-title" className="mb-3 font-title text-xl tracking-tight">
            Déjà lues
          </h2>
          <ul className="space-y-2">
            {ledgers.map((ledger) => (
              <li key={ledger.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(ledger.id);
                    setUrl(ledger.url);
                  }}
                  className="w-full rounded-2xl px-1 py-2 text-left font-body text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  <span className="font-bold">{ledger.author ?? ledger.url}</span>
                  <span className="mt-0.5 block text-gray-700">
                    {ledger.views == null ? "vues non publiques" : viewsLabel(ledger.views)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 font-body text-sm leading-relaxed text-gray-700">
        Les relevés restent dans ce navigateur. Un nouveau passage ajoute seulement les vues gagnées depuis le dernier
        chiffre.
      </p>
    </main>
  );
};
