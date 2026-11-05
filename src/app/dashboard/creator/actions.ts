"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSessionValue, DASHBOARD_COOKIE, roleForCode } from "~/server/dashboardSession";

const safeNext = (value: FormDataEntryValue | null) => {
  const next = String(value ?? "");
  if (next === "/posting" || next === "/dashboard/creator") return next;
  return "/dashboard/creator";
};

export const unlockDashboard = async (formData: FormData) => {
  const next = safeNext(formData.get("next"));
  const role = roleForCode(String(formData.get("code") ?? ""));
  if (!role || (next === "/dashboard/creator" && role !== "tania")) redirect(`${next}?refus=1`);

  cookies().set({
    name: DASHBOARD_COOKIE,
    value: createSessionValue(role),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(next);
};

export const leavePosting = async () => {
  cookies().set({
    name: DASHBOARD_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  redirect("/posting");
};
