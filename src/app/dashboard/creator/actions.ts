"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { codeMatches, createSessionValue, DASHBOARD_COOKIE } from "~/server/dashboardSession";

export const unlockDashboard = async (formData: FormData) => {
  const code = String(formData.get("code") ?? "");
  if (!codeMatches(code)) redirect("/dashboard/creator?refus=1");

  cookies().set({
    name: DASHBOARD_COOKIE,
    value: createSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/dashboard/creator");
};
