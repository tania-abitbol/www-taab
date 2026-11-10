"use server";

import { cookies } from "next/headers";

import { DASHBOARD_COOKIE, readSession } from "~/server/dashboardSession";
import { planFor } from "~/config/posting";
import { type SlideImage, emptySlideBoard, visibleBoard } from "~/config/slideBoard";
import { DayWork, cleanDayWork, proofAllowed, proofFileName } from "~/server/postingProofs";
import { captionSlideCard, hideSlideAt, loadSlideBoard, replaceSlideCard } from "~/server/postingSlides";
import { forgetPostedDay, loadWork, proofStorageReady, rememberProof, saveWorkDay } from "~/server/postingProofStore";
import { changeProfile, createProfile, listProfiles, removeProfile } from "~/server/postingProfileStore";

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

const asProfile = async () => {
  const role = readSession(cookies().get(DASHBOARD_COOKIE)?.value)?.role;
  if (!role || role === "tania") return null;
  return role;
};

export const prepareProofUpload = async (date: string, fileName: string, size: number) => {
  const profileId = await asProfile();
  if (!profileId) return { ok: false as const, error: "denied" as const };
  if (!proofAllowed(profileId, date, size)) return { ok: false as const, error: "size" as const };
  if (!proofStorageReady()) return { ok: true as const, local: true as const, name: proofFileName(fileName) };
  return { ok: true as const, local: false as const, name: proofFileName(fileName) };
};

export const saveMyDay = async (date: string, day: DayWork) => {
  const profileId = await asProfile();
  const clean = cleanDayWork(day);
  if (!profileId || !clean || !proofAllowed(profileId, date, 1)) return { ok: false as const };
  if (!proofStorageReady()) return { ok: true as const };
  try {
    await saveWorkDay(profileId, date, clean);
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
};

export const commitProof = async (date: string, fileName: string) => {
  const profileId = await asProfile();
  if (!profileId || !proofAllowed(profileId, date, 1)) return { ok: false as const };
  if (!proofStorageReady()) return { ok: true as const };
  try {
    await rememberProof(profileId, date, fileName);
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
};

const slideRole = async () => readSession(cookies().get(DASHBOARD_COOKIE)?.value)?.role ?? null;

export const loadSharedSlides = async () => {
  const role = await slideRole();
  if (!role) return emptySlideBoard();
  try {
    return visibleBoard(await loadSlideBoard(), role);
  } catch {
    return emptySlideBoard();
  }
};

export const publishSlides = async (date: string, storageId: string, images: SlideImage[]) => {
  if (!(await asTania())) return { ok: false as const };
  if (!Array.isArray(images) || images.length < 1 || images.length > 12) return { ok: false as const };
  try {
    const board = await replaceSlideCard(date, storageId, images);
    return { ok: true as const, board };
  } catch {
    return { ok: false as const };
  }
};

export const publishSlideCaption = async (date: string, storageId: string, caption: string) => {
  if (!(await asTania())) return { ok: false as const };
  if (typeof caption !== "string") return { ok: false as const };
  try {
    const board = await captionSlideCard(date, storageId, caption);
    if (board.captions[date]?.[storageId] !== caption.slice(0, 500)) return { ok: false as const };
    return { ok: true as const, board };
  } catch {
    return { ok: false as const };
  }
};

export const dropSharedSlide = async (date: string, storageId: string, index: number) => {
  if (!(await asTania())) return { ok: false as const };
  if (!Number.isInteger(index) || index < 0) return { ok: false as const };
  try {
    const board = await hideSlideAt(date, storageId, index);
    return { ok: true as const, board };
  } catch {
    return { ok: false as const };
  }
};

export const deleteValidatedDay = async (date: string) => {
  if (!(await asTania())) return { ok: false as const, error: "denied" as const };
  if (!planFor(date)) return { ok: false as const, error: "date" as const };
  try {
    const profiles = await listProfiles();
    await forgetPostedDay(
      profiles.map((profile) => profile.id),
      date,
    );
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "store" as const };
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
