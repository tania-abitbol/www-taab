"use server";

import { cookies } from "next/headers";

import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { changeProfile, createProfile, removeProfile } from "~/server/postingProfileStore";

const refused = { ok: false as const, error: "Seul le code de Tania peut gérer les profils." };

const asTania = async () => readSession(cookies().get(DASHBOARD_COOKIE)?.value)?.role === "tania";

export const saveManagedProfile = async (id: string, name: string, code: string) => {
  if (!(await asTania())) return refused;
  try {
    return await changeProfile(id, name, code);
  } catch {
    return { ok: false as const, error: "Le registre des profils n'a pas pu être enregistré." };
  }
};

export const deleteManagedProfile = async (id: string) => {
  if (!(await asTania())) return refused;
  try {
    return await removeProfile(id);
  } catch {
    return { ok: false as const, error: "Le registre des profils n'a pas pu être enregistré." };
  }
};

export const addManagedProfile = async (name: string, code: string) => {
  if (!(await asTania())) return refused;
  try {
    return await createProfile(name, code);
  } catch {
    return { ok: false as const, error: "Le registre des profils n'a pas pu être enregistré." };
  }
};
