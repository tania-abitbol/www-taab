import { unlockDashboard } from "~/app/dashboard/creator/actions";

export const DashboardGate = ({
  refused,
  next = "/dashboard/creator",
  title = "Tableau créateurs",
  lede = "Entre le code pour ouvrir le suivi des vues.",
}: {
  refused: boolean;
  next?: string;
  title?: string;
  lede?: string;
}) => (
  <main lang="fr" className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10 selection:bg-yellow selection:text-black">
    <a href="/" className="mb-10 font-title text-3xl tracking-tight">
      TAAB
    </a>
    <h1 className="mb-3 font-title text-4xl tracking-tight">{title}</h1>
    <p className="mb-8 font-body text-base leading-relaxed text-gray-700">{lede}</p>
    <form action={unlockDashboard} className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="dashboard-code" className="mb-2 block font-body text-sm font-bold">
        Code d&apos;accès
      </label>
      <input
        id="dashboard-code"
        name="code"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        required
        maxLength={12}
        className="block h-12 w-full rounded-xl border border-gray-300 bg-white px-4 font-body text-base text-black placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
      />
      {refused && (
        <p role="alert" className="mt-3 font-body text-sm text-[#C8102E]">
          Ce code ne correspond pas.
        </p>
      )}
      <button
        type="submit"
        className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-black px-6 font-body text-base font-bold text-white transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:translate-y-0"
      >
        Entrer
      </button>
    </form>
  </main>
);
