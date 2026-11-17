import type { CheckItem } from "~/config/posting";

export const ACCOUNT_TONE = [
  { ink: "#1D6FB8", frame: "#9DCEF5" },
  { ink: "#C45C12", frame: "#F3C091" },
  { ink: "#6B3FA0", frame: "#D2B4EE" },
] as const;

export const accountIndexFromId = (id: string) => (id.endsWith("-fr") ? 0 : id.endsWith("-es") ? 1 : id.endsWith("-us") ? 2 : null);

export const accountGroups = (checks: CheckItem[]) => {
  const groups: { account: number | null; items: CheckItem[] }[] = [];
  for (const check of checks) {
    const account = accountIndexFromId(check.id);
    const last = groups[groups.length - 1];
    if (last && last.account === account) last.items.push(check);
    else groups.push({ account, items: [check] });
  }
  return groups;
};

export const actionLabel = (label: string, title: string | null) =>
  title && label.startsWith(`${title}\n`) ? label.slice(title.length + 1) : label;
