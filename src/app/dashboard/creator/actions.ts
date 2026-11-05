"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { codeMatches, createSessionValue, DASHBOARD_COOKIE } from "~/server/dashboardSession";

const safeNext = (value: FormDataEntryValue | null) => {
  const next = String(value ?? "");
  if (next === "/posting" || next === "/dashboard/creator") return next;
  return "/dashboard/creator";
};

export const unlockDashboard = async (formData: FormData) => {
  const next = safeNext(formData.get("next"));
  const code = String(formData.get("code") ?? "");
  if (!codeMatches(code)) redirect(`${next}?refus=1`);

  cookies().set({
    name: DASHBOARD_COOKIE,
    value: createSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(next);
};
