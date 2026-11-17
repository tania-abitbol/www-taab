import { useState } from "react";

import { accountWord, type CheckItem, type PostingLang } from "~/config/posting";
import { ACCOUNT_TONE, accountGroups, actionLabel } from "~/components/posting/accountTone";

/** One collapsible step per account. The first unfinished step opens by itself. Progress shows every box, not only the ones that gate validation. */
export const Checklist = ({
  checks,
  lang,
  date,
  done,
  item,
  banner,
  clip,
  progressLabel,
}: {
  checks: CheckItem[];
  lang: PostingLang;
  date: string;
  done: Record<string, boolean>;
  item: (check: CheckItem, label: string) => JSX.Element;
  banner: (check: CheckItem) => JSX.Element;
  clip?: JSX.Element | null;
  progressLabel: (done: number, total: number) => string;
}) => {
  const groups = accountGroups(checks);
  const tally = (items: CheckItem[]) => {
    const counted = items.filter((check) => !check.banner);
    return { done: counted.filter((check) => done[check.id] === true).length, total: counted.length };
  };
  const [open, setOpen] = useState<Set<number>>(() => {
    const first = groups.find((group) => {
      if (group.account === null) return false;
      const { done: ticked, total } = tally(group.items);
      return total > 0 && ticked < total;
    });
    return new Set(first?.account === undefined || first.account === null ? [] : [first.account]);
  });
  const toggle = (account: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(account)) next.delete(account);
      else next.add(account);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        if (group.account === null) {
          return (
            <ul key={group.items[0].id} className="flex flex-col gap-4">
              {group.items.map((check) => (
                <li key={check.id}>
                  {check.banner ? (
                    banner(check)
                  ) : check.id === "bilan" ? (
                    <div className="rounded-2xl border-2 border-black bg-[#FFF3C4] px-3 py-3">
                      {item(check, check.label)}
                      {clip}
                    </div>
                  ) : (
                    item(check, check.label)
                  )}
                </li>
              ))}
            </ul>
          );
        }
        const account = group.account;
        const tone = ACCOUNT_TONE[account];
        const title = accountWord(account, lang);
        const { done: ticked, total } = tally(group.items);
        const complete = total > 0 && ticked === total;
        const expanded = open.has(account);
        const goal = group.items.find((check) => check.goal)?.goal;
        const panel = `steps-${date}-${account}`;
        return (
          <div key={group.items[0].id} className="overflow-hidden rounded-2xl border-2" style={{ borderColor: tone.frame }}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panel}
              onClick={() => toggle(account)}
              className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex items-center gap-2">
                  <span className="font-title text-2xl leading-none tracking-tight" style={{ color: tone.ink }}>
                    {title}
                  </span>
                  {complete ? (
                    <span aria-hidden className="text-base leading-none">
                      ✅
                    </span>
                  ) : null}
                </span>
                {total > 0 ? (
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <span className="block h-full rounded-full" style={{ width: `${(ticked / total) * 100}%`, backgroundColor: tone.ink }} />
                    </span>
                    <span className="shrink-0 font-body text-xs font-bold text-gray-700">{progressLabel(ticked, total)}</span>
                  </span>
                ) : null}
              </span>
              <span aria-hidden className={`shrink-0 font-body text-lg transition-transform ${expanded ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            <div id={panel} hidden={!expanded} className="px-3 pb-3">
              <ul className="flex flex-col gap-4">
                {group.items.map((check) => (
                  <li key={check.id} className={check.parent ? "ml-8" : ""}>
                    {item(check, actionLabel(check.label, title))}
                  </li>
                ))}
              </ul>
              {goal ? (
                <p
                  id={`session-goal-${date}-${account}`}
                  className="mt-4 rounded-xl px-3 py-2 font-body text-base font-bold leading-relaxed"
                  style={{ backgroundColor: tone.frame, color: tone.ink }}
                >
                  {goal}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
