"use client";

import { FormEvent, Fragment, useEffect, useMemo, useRef, useState } from "react";

import { accountRef } from "~/components/dashboard/accounts";
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

const platformLabel = (platform: VideoLedger["platform"]) => (platform === "tiktok" ? "TikTok" : "Instagram");

const Chevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}>
    <path d="M6 3.5 11 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type VideoRowProps = {
  ledger: VideoLedger;
  months: number[];
  now: number;
  nested: boolean;
  busy: boolean;
  rowId?: string;
  onRefresh: (url: string) => void;
  onRemove: (id: string) => void;
};

const VideoRow = ({ ledger, months, now, nested, busy, rowId, onRefresh, onRemove }: VideoRowProps) => {
  const rows = monthRows(ledger, ledger.updatedAt ?? now);
  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const title = nested ? ledger.caption || "Vidéo" : ledger.author || ledger.caption || "Vidéo";
  return (
    <tr id={rowId} className="group border-b border-gray-200 last:border-b-0">
      <th scope="row" className={`sticky left-0 z-10 bg-white text-left align-top font-normal group-hover:bg-gray-100 ${nested ? "py-3 pl-10 pr-4" : "px-4 py-3"}`}>
        <a
          href={ledger.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block max-w-[16rem] font-bold underline decoration-gray-300 underline-offset-2 ${nested ? "line-clamp-2" : "truncate"}`}
        >
          {title}
        </a>
        {!nested && ledger.caption && (
          <p className="mt-0.5 line-clamp-2 max-w-[16rem] font-normal text-gray-700">{ledger.caption}</p>
        )}
        <span className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => onRefresh(ledger.url)}
            disabled={busy}
            className="font-normal text-gray-700 underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            Actualiser
          </button>
          <button
            type="button"
            onClick={() => onRemove(ledger.id)}
            className="font-normal text-gray-700 underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            Retirer
          </button>
        </span>
        {ledger.unassignedViews > 0 && (
          <p className="mt-2 max-w-[16rem] font-normal text-gray-700">
            {numberFormat.format(ledger.unassignedViews)} vues gagnées à cheval sur deux mois, non réparties.
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
            className={`border-l border-gray-200 px-3 py-3 text-right align-top tabular-nums ${row?.open ? "font-bold" : ""} ${
              row && row.euros == null ? "text-gray-700" : ""
            }`}
          >
            {label}
          </td>
        );
      })}
    </tr>
  );
};

export const CreatorDashboard = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [ledgers, setLedgers] = useState<VideoLedger[]>([]);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
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
  const groups = useMemo(() => {
    const order: { key: string; handle: string | null; label: string; platform: VideoLedger["platform"]; ledgers: VideoLedger[] }[] = [];
    const byKey = new Map<string, (typeof order)[number]>();
    for (const ledger of ledgers) {
      const account = accountRef(ledger);
      let group = byKey.get(account.key);
      if (!group) {
        group = {
          key: account.key,
          handle: account.handle,
          label: ledger.author?.trim() || (account.handle ? `@${account.handle}` : "Compte"),
          platform: ledger.platform,
          ledgers: [],
        };
        byKey.set(account.key, group);
        order.push(group);
      }
      group.ledgers.push(ledger);
      if (!group.label || group.label.startsWith("@")) {
        const name = ledger.author?.trim();
        if (name) group.label = name;
      }
    }
    return order;
  }, [ledgers]);

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
      setOpenFolders((current) => ({ ...current, [accountRef(payload).key]: true }));
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
              {groups.map((group) => {
                if (group.ledgers.length < 2) {
                  return (
                    <VideoRow
                      key={group.ledgers[0].id}
                      ledger={group.ledgers[0]}
                      months={months}
                      now={now}
                      nested={false}
                      busy={status === "loading"}
                      onRefresh={(next) => void submitUrl(next)}
                      onRemove={removeLedger}
                    />
                  );
                }
                const open = openFolders[group.key] === true;
                const folderId = `compte-${group.key.replace(/[^a-z0-9_-]/gi, "-")}`;
                const sameName = group.handle && group.label.replace(/^@/, "").toLowerCase() === group.handle.toLowerCase();
                return (
                  <Fragment key={group.key}>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th scope="row" className="sticky left-0 z-10 bg-gray-100 px-4 py-3 text-left font-normal">
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={folderId}
                          onClick={() => setOpenFolders((current) => ({ ...current, [group.key]: !open }))}
                          className="flex max-w-[20rem] items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                        >
                          <Chevron open={open} />
                          <span className="min-w-0">
                            <span className="block truncate font-bold">
                              {platformLabel(group.platform)} · {group.label}
                            </span>
                            <span className="block truncate text-gray-700">
                              {group.ledgers.length} vidéos
                              {!sameName && group.handle ? ` · @${group.handle}` : ""}
                            </span>
                          </span>
                        </button>
                      </th>
                      <td colSpan={6 + months.length} />
                    </tr>
                    {open &&
                      group.ledgers.map((ledger, index) => (
                        <VideoRow
                          key={ledger.id}
                          ledger={ledger}
                          months={months}
                          now={now}
                          nested
                          rowId={index === 0 ? folderId : undefined}
                          busy={status === "loading"}
                          onRefresh={(next) => void submitUrl(next)}
                          onRemove={removeLedger}
                        />
                      ))}
                  </Fragment>
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
