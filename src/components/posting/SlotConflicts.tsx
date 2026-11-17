import { hourText } from "~/components/posting/SlotPicker";
import { SLOTS, type SlotId } from "~/config/posting";
import { adminCopy } from "~/config/postingCopy";

export type SlotConflict = { date: string; slot: SlotId; girls: { id: string; label: string }[] };

/** Two girls on the same hour: name them and move one. */
export const SlotConflicts = ({
  conflicts,
  dayLabel,
  takenOn,
  busy,
  error,
  onReassign,
}: {
  conflicts: SlotConflict[];
  dayLabel: (date: string) => string;
  takenOn: (date: string) => SlotId[];
  busy: string | null;
  error: string | null;
  onReassign: (profileId: string, date: string, slot: SlotId | null) => void;
}) => {
  if (conflicts.length === 0) return null;
  return (
    <div id="slot-conflicts" className="mt-4 rounded-2xl border-2 border-[#D99A00] bg-[#FFF3C4] p-3">
      <h3 className="font-body text-base font-bold">{adminCopy.conflictTitle}</h3>
      <ul className="mt-2 flex flex-col gap-4">
        {conflicts.map((conflict) => {
          const slot = SLOTS.find((item) => item.id === conflict.slot);
          const taken = takenOn(conflict.date);
          return (
            <li key={`${conflict.date}-${conflict.slot}`}>
              <p className="font-body text-sm font-bold">
                {dayLabel(conflict.date)} · {slot ? hourText(slot.short) : conflict.slot} : {conflict.girls.map((girl) => girl.label).join(", ")}
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {conflict.girls.map((girl) => {
                  const key = `${girl.id}-${conflict.date}`;
                  return (
                    <label key={girl.id} htmlFor={`reassign-${key}`} className="flex items-center gap-2 font-body text-sm">
                      <span className="min-w-0 flex-1 truncate font-bold">{girl.label}</span>
                      <select
                        id={`reassign-${key}`}
                        value={conflict.slot}
                        disabled={busy === key}
                        onChange={(event) => onReassign(girl.id, conflict.date, event.target.value === "none" ? null : (event.target.value as SlotId))}
                        className="h-12 w-40 shrink-0 rounded-xl border border-gray-300 bg-white px-3 font-body text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50"
                      >
                        {SLOTS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {hourText(option.short)}
                            {option.id !== conflict.slot && taken.includes(option.id) ? adminCopy.slotTaken : ""}
                          </option>
                        ))}
                        <option value="none">{adminCopy.noSlot}</option>
                      </select>
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-3 font-body text-sm text-[#C8102E]">{error}</p> : null}
    </div>
  );
};
