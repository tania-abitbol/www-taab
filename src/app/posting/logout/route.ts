import { NextResponse } from "next/server";

import { DASHBOARD_COOKIE } from "~/server/dashboardSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/posting", request.url));
  response.cookies.set({
    name: DASHBOARD_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
