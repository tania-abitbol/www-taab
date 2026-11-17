import { hourText } from "~/components/posting/SlotPicker";
import { SLOTS } from "~/config/posting";
import { adminCopy } from "~/config/postingCopy";

export type SummaryCell = { slot: string | null; done: number; total: number; proof: boolean; validated: boolean };

/** Who did what: one row per day, one column per girl. A cell opens that day. */
export const AdminSummary = ({
  dates,
  today,
  girls,
  allGirls,
  filter,
  onFilter,
  cell,
  dayLabel,
  onOpen,
}: {
  dates: string[];
  today: string;
  girls: { id: string; label: string }[];
  allGirls: { id: string; label: string }[];
  filter: string;
  onFilter: (id: string) => void;
  cell: (date: string, girlId: string) => SummaryCell;
  dayLabel: (date: string) => string;
  onOpen: (date: string) => void;
}) => (
  <section id="admin-summary" className="rounded-3xl bg-white p-4 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)]">
    <h2 className="font-title text-2xl tracking-tight">{adminCopy.summaryTitle}</h2>
    <div role="group" aria-label={adminCopy.filterLabel} className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
      {[{ id: "all", label: adminCopy.filterAll }, ...allGirls].map((girl) => {
        const active = filter === girl.id;
        return (
          <button
            key={girl.id}
            id={`filter-${girl.id}`}
            type="button"
            aria-pressed={active}
            onClick={() => onFilter(girl.id)}
            className={`h-12 shrink-0 rounded-full px-4 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
              active ? "bg-black text-white" : "bg-gray-100 text-black"
            }`}
          >
            {girl.label}
          </button>
        );
      })}
    </div>
    <div className="mt-4 grid gap-1.5 font-body" style={{ gridTemplateColumns: `4.25rem repeat(${Math.max(1, girls.length)}, minmax(0, 1fr))` }}>
      <span />
      {girls.map((girl) => (
        <span key={girl.id} className="truncate px-1 pb-1 text-center text-xs font-bold">
          {girl.label}
        </span>
      ))}
      {dates.map((date) => (
        <div key={date} className="contents">
          <span className={`flex items-center text-sm font-bold ${date === today ? "text-black" : "text-gray-600"}`}>
            {date === today ? <span className="rounded-md bg-black px-1.5 py-0.5 text-white">{dayLabel(date)}</span> : dayLabel(date)}
          </span>
          {girls.map((girl) => {
            const value = cell(date, girl.id);
            const slot = SLOTS.find((item) => item.id === value.slot);
            const tone = value.validated ? "bg-[#E7F6EC]" : value.total > 0 && (value.done > 0 || value.proof) ? "bg-[#FFF3C4]" : "bg-gray-100";
            return (
              <button
                key={girl.id}
                id={`summary-${date}-${girl.id}`}
                type="button"
                onClick={() => onOpen(date)}
                aria-label={adminCopy.summaryCell(girl.label, dayLabel(date), slot ? hourText(slot.short) : null, value.done, value.total, value.proof, value.validated)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-center leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${tone} ${
                  date === today ? "ring-1 ring-black" : ""
                }`}
              >
                <span className="text-xs font-bold">{slot ? hourText(slot.short) : "—"}</span>
                {value.total > 0 ? (
                  <span className="text-xs">
                    {value.done}/{value.total}
                    <span aria-hidden> · {value.proof ? "🎥" : "∅"}</span>
                  </span>
                ) : null}
                {value.validated ? <span className="text-[0.7rem] font-bold text-[#146C36]">{adminCopy.validated}</span> : null}
              </button>
            );
          })}
        </div>
      ))}
    </div>
    <p className="mt-3 font-body text-xs leading-relaxed text-gray-700">{adminCopy.summaryLegend}</p>
  </section>
);
