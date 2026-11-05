"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  AccountTask,
  DayRecord,
  POSTING_START,
  PostingMeta,
  PreparedVideo,
  SLOTS,
  SlotId,
  dayProgress,
  durationLabel,
  formatDay,
  formatShortDay,
  groupVideos,
  isTikTokLink,
  madridToday,
  phaseFor,
  taskFor,
  videosFor,
  weekOf,
} from "~/config/posting";
import { emptyDay, loadBlob, readMeta, saveBlob, writeMeta } from "~/components/posting/storage";

const fieldClass =
  "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1";

const blobKey = {
  video: (id: string) => `video:${id}`,
  proof: (date: string) => `proof:${date}`,
};

export const PostingDashboard = () => {
  const today = madridToday();
  const [meta, setMeta] = useState<PostingMeta | null>(null);
  const [activeDate, setActiveDate] = useState(today);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [depositError, setDepositError] = useState("");
  const [depositNote, setDepositNote] = useState("");

  useEffect(() => {
    const loaded = readMeta();
    setMeta(loaded);
    let cancelled = false;
    const created: string[] = [];
    const remember = (key: string, blob: Blob) => {
      const url = URL.createObjectURL(blob);
      created.push(url);
      if (!cancelled) setUrls((current) => ({ ...current, [key]: url }));
    };
    void (async () => {
      try {
        for (const video of loaded.videos) {
          if (!video.fileName) continue;
          const blob = await loadBlob(blobKey.video(video.id));
          if (blob) remember(blobKey.video(video.id), blob);
        }
        for (const [date, day] of Object.entries(loaded.days)) {
          if (!day.proofName) continue;
          const blob = await loadBlob(blobKey.proof(date));
          if (blob) remember(blobKey.proof(date), blob);
        }
      } catch {
        if (!cancelled) setFileError("Les fichiers de ce navigateur ne se sont pas ouverts. Les liens restent utilisables.");
      }
    })();
    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const commit = (next: PostingMeta) => {
    setMeta(next);
    writeMeta(next);
  };

  const day = meta?.days[activeDate] ?? emptyDay();
  const phase = phaseFor(activeDate);
  const progress = meta ? dayProgress(day, meta.accounts) : null;
  const week = useMemo(() => weekOf(activeDate), [activeDate]);
  const grouped = useMemo(() => (meta ? groupVideos(meta.videos, meta.accounts) : []), [meta]);

  const updateDay = (recipe: (current: DayRecord) => DayRecord) => {
    if (!meta) return;
    const current = meta.days[activeDate] ?? emptyDay();
    commit({ ...meta, days: { ...meta.days, [activeDate]: recipe(current) } });
  };

  const setSlot = (slot: SlotId) => updateDay((current) => ({ ...current, slot }));

  const setTask = (accountId: string, patch: Partial<AccountTask>) =>
    updateDay((current) => ({
      ...current,
      tasks: { ...current.tasks, [accountId]: { ...taskFor(current, accountId), ...patch } },
    }));

  const renameAccount = (accountId: string, name: string) => {
    if (!meta) return;
    commit({
      ...meta,
      accounts: meta.accounts.map((account) => (account.id === accountId ? { ...account, name } : account)),
    });
  };

  const onProof = async (file: File | undefined) => {
    if (!file || !meta) return;
    setFileError("");
    try {
      await saveBlob(blobKey.proof(activeDate), file);
      const url = URL.createObjectURL(file);
      setUrls((current) => ({ ...current, [blobKey.proof(activeDate)]: url }));
      updateDay((current) => ({ ...current, proofName: file.name }));
    } catch {
      setFileError("La capture n'a pas été gardée. Réessaie, ou un fichier plus léger.");
    }
  };

  const onDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!meta) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const accountId = String(data.get("account") ?? "");
    const date = String(data.get("date") ?? "");
    const caption = String(data.get("caption") ?? "").trim();
    const hashtags = String(data.get("hashtags") ?? "").trim();
    const sourceUrl = String(data.get("sourceUrl") ?? "").trim();
    const file = data.get("file");
    const videoFile = file instanceof File && file.size > 0 ? file : null;
    if (!meta.accounts.some((account) => account.id === accountId) || !date) {
      setDepositError("Choisis un compte et une date.");
      setDepositNote("");
      return;
    }
    if (!videoFile && !sourceUrl) {
      setDepositError("Ajoute un fichier ou une URL.");
      setDepositNote("");
      return;
    }
    const video: PreparedVideo = {
      id: crypto.randomUUID(),
      accountId,
      date,
      caption,
      hashtags,
      sourceUrl,
      fileName: videoFile?.name ?? null,
      createdAt: Date.now(),
    };
    try {
      if (videoFile) await saveBlob(blobKey.video(video.id), videoFile);
    } catch {
      setDepositError("Le fichier n'a pas été gardé dans ce navigateur. Colle une URL à la place.");
      setDepositNote("");
      return;
    }
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setUrls((current) => ({ ...current, [blobKey.video(video.id)]: url }));
    }
    commit({ ...meta, videos: [...meta.videos, video] });
    form.reset();
    setDepositError("");
    setDepositNote("Vidéo déposée.");
  };

  const removeVideo = (id: string) => {
    if (!meta) return;
    commit({ ...meta, videos: meta.videos.filter((video) => video.id !== id) });
  };

  if (!meta || !progress) {
    return (
      <main lang="fr" className="min-h-dvh px-4 py-6">
        <p className="font-body text-base text-gray-700">Ouverture…</p>
      </main>
    );
  }

  const proofUrl = urls[blobKey.proof(activeDate)];

  return (
    <main lang="fr" className="min-h-dvh px-4 py-6 selection:bg-yellow selection:text-black sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <a href="/" className="font-title text-3xl tracking-tight">
          TAAB
        </a>

        <header className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
          <p className="font-body text-sm text-gray-700">{formatDay(activeDate)}</p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <h1 className="font-title text-4xl tracking-tight">{phase.label}</h1>
            <p className="font-body text-base font-bold">{durationLabel(phase)}</p>
          </div>
          {phase.id === "before" && (
            <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">
              J1 commence le {formatDay(POSTING_START)}. Le créneau et les liens se souviennent déjà par jour.
            </p>
          )}
          {activeDate !== today && (
            <button
              type="button"
              onClick={() => setActiveDate(today)}
              className="mt-3 font-body text-sm underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Revenir à aujourd&apos;hui
            </button>
          )}

          <fieldset className="mt-5">
            <legend className="font-body text-sm font-bold">Créneau du jour</legend>
            <div role="radiogroup" aria-required="true" aria-label="Créneau du jour" className="mt-2 grid grid-cols-2 gap-2">
              {SLOTS.map((slot) => {
                const selected = day.slot === slot.id;
                return (
                  <button
                    key={slot.id}
                    id={`slot-${slot.id}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSlot(slot.id)}
                    className={`h-12 rounded-xl border px-2 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                      selected ? "border-black bg-black text-white" : "border-gray-300 bg-white text-black"
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <p id="day-status" className={`mt-4 font-body text-base ${progress.done ? "font-bold" : "text-gray-700"}`}>
            {progress.done ? "Journée faite" : `Journée incomplète · ${progress.links}/${progress.total} liens`}
            {!progress.slot ? " · créneau manquant" : ""}
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="font-title text-2xl tracking-tight">Aujourd&apos;hui</h2>
          {meta.accounts.map((account) => {
            const task = taskFor(day, account.id);
            const ready = videosFor(meta.videos, activeDate, account.id);
            const linkInvalid = task.link.trim().length > 0 && !isTikTokLink(task.link);
            return (
              <article key={account.id} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
                <h3 className="font-title text-xl tracking-tight">{account.name}</h3>
                {ready.length === 0 ? (
                  <p className="mt-3 rounded-2xl bg-gray-100 px-3 py-3 font-body text-sm leading-relaxed text-gray-700">
                    Pas de vidéo déposée pour ce jour. La légende, les hashtags et le fichier apparaîtront ici dès
                    qu&apos;ils sont ajoutés plus bas.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-3">
                    {ready.map((video) => (
                      <li key={video.id} className="rounded-2xl bg-gray-100 px-3 py-3">
                        <VideoActions video={video} fileUrl={urls[blobKey.video(video.id)]} />
                        {video.caption && <p className="mt-2 font-body text-sm leading-relaxed">{video.caption}</p>}
                        {video.hashtags && <p className="mt-1 font-body text-sm text-gray-700">{video.hashtags}</p>}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <Check
                    id={`browsed-${account.id}`}
                    label="Parcouru"
                    checked={task.browsed}
                    onChange={(browsed) => setTask(account.id, { browsed })}
                  />
                  <Check
                    id={`engaged-${account.id}`}
                    label="Aimé ou commenté"
                    checked={task.engaged}
                    onChange={(engaged) => setTask(account.id, { engaged })}
                  />
                  <Check
                    id={`published-${account.id}`}
                    label="Publié"
                    checked={task.published}
                    onChange={(published) => setTask(account.id, { published })}
                  />
                </div>
                <label htmlFor={`link-${account.id}`} className="mt-4 block font-body text-sm font-bold">
                  Lien TikTok publié
                </label>
                <input
                  id={`link-${account.id}`}
                  value={task.link}
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="https://www.tiktok.com/…"
                  onChange={(event) => setTask(account.id, { link: event.target.value })}
                  className={`mt-2 ${fieldClass}`}
                />
                {linkInvalid && (
                  <p className="mt-2 font-body text-sm text-[#C8102E]">Colle un lien tiktok.com.</p>
                )}
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
          <h2 className="font-title text-2xl tracking-tight">Vidéos à poster</h2>
          {grouped.length === 0 ? (
            <p className="mt-3 font-body text-sm leading-relaxed text-gray-700">
              Rien à télécharger pour l&apos;instant. Demain, chaque compte reste vide tant qu&apos;un fichier ou une
              URL n&apos;est pas déposé, avec la légende, les hashtags et la date.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-5">
              {grouped.map((group) => (
                <div key={group.date}>
                  <h3 className="font-body text-sm font-bold">{formatDay(group.date)}</h3>
                  {group.rows.map((row) => (
                    <div key={row.account.id} className="mt-2">
                      <p className="font-body text-sm">{row.account.name}</p>
                      <ul className="mt-1 flex flex-col gap-2">
                        {row.videos.map((video) => (
                          <li key={video.id} className="rounded-2xl bg-gray-100 px-3 py-3">
                            <VideoActions video={video} fileUrl={urls[blobKey.video(video.id)]} />
                            {video.caption && <p className="mt-2 font-body text-sm leading-relaxed">{video.caption}</p>}
                            {video.hashtags && <p className="mt-1 font-body text-sm text-gray-700">{video.hashtags}</p>}
                            <button
                              type="button"
                              onClick={() => removeVideo(video.id)}
                              className="mt-2 font-body text-sm text-gray-700 underline decoration-gray-300 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                            >
                              Retirer
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <form key={activeDate} onSubmit={(event) => void onDeposit(event)} className="mt-5 border-t border-gray-200 pt-4">
            <details>
            <summary className="cursor-pointer font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
              Déposer une vidéo
            </summary>
            <div className="mt-3 flex flex-col gap-3">
            <label htmlFor="deposit-account" className="font-body text-sm font-bold">
              Compte
            </label>
            <select id="deposit-account" name="account" className={fieldClass} defaultValue={meta.accounts[0].id}>
              {meta.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <label htmlFor="deposit-date" className="font-body text-sm font-bold">
              Date
            </label>
            <input id="deposit-date" name="date" type="date" required defaultValue={activeDate} className={fieldClass} />
            <label htmlFor="deposit-caption" className="font-body text-sm font-bold">
              Légende
            </label>
            <textarea
              id="deposit-caption"
              name="caption"
              rows={3}
              placeholder="Texte sous la vidéo"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
            />
            <label htmlFor="deposit-tags" className="font-body text-sm font-bold">
              Hashtags
            </label>
            <input id="deposit-tags" name="hashtags" placeholder="#soirée" className={fieldClass} />
            <label htmlFor="deposit-file" className="font-body text-sm font-bold">
              Fichier
            </label>
            <input id="deposit-file" name="file" type="file" accept="video/*" className="font-body text-sm" />
            <label htmlFor="deposit-url" className="font-body text-sm font-bold">
              ou URL
            </label>
            <input id="deposit-url" name="sourceUrl" type="url" inputMode="url" placeholder="https://" className={fieldClass} />
            {meta.accounts.map((account) => (
              <label key={account.id} className="font-body text-sm">
                <span className="mb-1 block font-bold">Nom affiché · {account.id === "es-1" ? "compte 1" : account.id === "es-2" ? "compte 2" : "compte 3"}</span>
                <input
                  value={account.name}
                  onChange={(event) => renameAccount(account.id, event.target.value)}
                  className={fieldClass}
                />
              </label>
            ))}
            {depositError && <p className="font-body text-sm text-[#C8102E]">{depositError}</p>}
            {depositNote && <p className="font-body text-sm">{depositNote}</p>}
            <button
              type="submit"
              className="h-12 rounded-xl bg-black px-5 font-body text-base font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Déposer
            </button>
            </div>
            </details>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
          <h2 className="font-title text-2xl tracking-tight">Preuve du jour</h2>
          <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">
            Une capture filmée de la session. Une par jour.
          </p>
          <label htmlFor="proof-file" className="mt-3 block font-body text-sm font-bold">
            Enregistrement
          </label>
          <input
            id="proof-file"
            type="file"
            accept="video/*"
            onChange={(event) => void onProof(event.target.files?.[0])}
            className="mt-2 font-body text-sm"
          />
          {day.proofName && <p className="mt-3 font-body text-sm">{day.proofName}</p>}
          {proofUrl && <video src={proofUrl} controls className="mt-3 w-full rounded-2xl bg-black" />}
          {fileError && <p className="mt-2 font-body text-sm text-[#C8102E]">{fileError}</p>}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
          <h2 className="font-title text-2xl tracking-tight">Semaine</h2>
          <ol className="mt-3 divide-y divide-gray-200">
            {week.map((date) => {
              const record = meta.days[date];
              const item = dayProgress(record, meta.accounts);
              const itemPhase = phaseFor(date);
              const selected = date === activeDate;
              return (
                <li key={date}>
                  <button
                    type="button"
                    onClick={() => setActiveDate(date)}
                    aria-current={selected ? "date" : undefined}
                    className={`flex w-full flex-col gap-1 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                      selected ? "font-bold" : ""
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-3 font-body text-base">
                      <span>
                        {formatShortDay(date)}
                        {date === today ? " · aujourd'hui" : ""}
                      </span>
                      <span>{itemPhase.label}</span>
                    </span>
                    <span className="font-body text-sm font-normal text-gray-700">
                      {record?.slot ? slotText(record.slot) : "Créneau —"} · {item.links}/{item.total} liens ·{" "}
                      {item.proof ? "Preuve" : "Sans preuve"}
                      {item.done ? " · faite" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <p className="font-body text-sm leading-relaxed text-gray-700">
          Créneaux, cases, liens et fichiers restent dans ce navigateur.
        </p>
      </div>
    </main>
  );
};

const slotText = (id: SlotId) => SLOTS.find((slot) => slot.id === id)?.label ?? "";

const Check = ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label htmlFor={id} className="flex min-h-11 items-center gap-3 font-body text-base">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-5 w-5 accent-black"
    />
    {label}
  </label>
);

const VideoActions = ({ video, fileUrl }: { video: PreparedVideo; fileUrl?: string }) => (
  <span className="flex flex-wrap gap-3">
    {fileUrl && (
      <a
        href={fileUrl}
        download={video.fileName || "video"}
        className="font-body text-sm font-bold underline decoration-gray-300 underline-offset-2"
      >
        Télécharger
      </a>
    )}
    {video.sourceUrl && (
      <a
        href={video.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-sm font-bold underline decoration-gray-300 underline-offset-2"
      >
        Ouvrir
      </a>
    )}
    {!fileUrl && video.fileName && <span className="font-body text-sm text-gray-700">{video.fileName}</span>}
  </span>
);
