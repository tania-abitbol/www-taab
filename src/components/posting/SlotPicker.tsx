import { SLOTS, type SlotId } from "~/config/posting";

export const hourText = (short: string) => {
  const [start, end] = short.split("–");
  return `${start}h–${end}h`;
};

export const SlotPicker = ({
  date,
  dayLabel,
  hour,
  onPick,
  labels,
}: {
  date: string;
  dayLabel: string;
  hour: SlotId | undefined;
  onPick: (slot: SlotId) => void;
  labels: { title: string; pickOne: string; picked: (hour: string) => string; vary?: string };
}) => {
  const chosen = SLOTS.find((slot) => slot.id === hour);
  return (
    <div>
      {labels.vary ? (
        <p id={`hours-vary-${date}`} className="mb-3 rounded-xl bg-[#FFF3C4] px-3 py-2 font-body text-sm leading-relaxed">
          {labels.vary}
        </p>
      ) : null}
      <p className="font-body text-base font-bold">{labels.title}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SLOTS.map((slot) => {
          const selected = hour === slot.id;
          return (
            <button
              key={slot.id}
              id={`slot-${date}-${slot.id}`}
              type="button"
              aria-pressed={selected}
              aria-label={`${dayLabel} ${slot.label}`}
              onClick={() => onPick(slot.id)}
              className={`flex h-12 items-center justify-center rounded-xl px-2 font-body text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                selected ? "bg-black text-white" : "bg-gray-100 text-black"
              }`}
            >
              {hourText(slot.short)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 font-body text-sm leading-relaxed text-gray-700">{chosen ? labels.picked(hourText(chosen.short)) : labels.pickOne}</p>
    </div>
  );
};
