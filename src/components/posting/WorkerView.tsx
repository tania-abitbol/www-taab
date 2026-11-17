import { useState, type ReactNode } from "react";

import { DayCard, type DayCardProps } from "~/components/posting/DayCard";

/** Today opens first. The other days stay folded until she taps them. */
export const WorkerView = ({ days, today, status }: { days: DayCardProps[]; today: string; status: ReactNode }) => {
  const first = days.find((day) => day.date === today) ?? days.find((day) => day.date > today) ?? days[days.length - 1];
  const [openDate, setOpenDate] = useState<string | null>(first?.date ?? null);
  const current = days.find((day) => day.date === openDate) ?? null;
  const rest = days.filter((day) => day.date !== current?.date);
  const toggle = (date: string) => {
    setOpenDate((now) => (now === date ? null : date));
    window.requestAnimationFrame(() => document.getElementById(`day-${date}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };
  return (
    <>
      {status}
      {current ? <DayCard key={current.date} {...current} open onToggle={() => toggle(current.date)} /> : null}
      {rest.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rest.map((day) => (
            <DayCard key={day.date} {...day} open={false} onToggle={() => toggle(day.date)} />
          ))}
        </div>
      ) : null}
    </>
  );
};
