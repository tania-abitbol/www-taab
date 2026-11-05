/** Login profiles for /posting. Tania's code stays 2580 and is not a profile. */

export type PostingProfile = {
  id: string;
  name: string;
  code: string;
};

export const DEFAULT_PROFILES: PostingProfile[] = [
  { id: "p1", name: "Profil 1", code: "1111" },
  { id: "p2", name: "Profil 2", code: "2222" },
  { id: "p3", name: "Profil 3", code: "3333" },
];

const CODE = /^\d{4,8}$/;
export const PROFILE_ID = /^p[a-z0-9-]{1,40}$/;

export type ProfileResult = { ok: true; profiles: PostingProfile[] } | { ok: false; error: string };

const codeError = (profiles: PostingProfile[], id: string | null, code: string) => {
  if (!CODE.test(code)) return "Le code doit avoir 4 à 8 chiffres.";
  if (code === "2580") return "2580 reste le code de Tania.";
  if (profiles.some((profile) => profile.id !== id && profile.code === code)) return "Ce code est déjà pris.";
  return null;
};

export const profileIdForCode = (profiles: PostingProfile[], code: string) =>
  profiles.find((profile) => profile.code === code.trim())?.id ?? null;

export const updateProfile = (profiles: PostingProfile[], id: string, name: string, code: string): ProfileResult => {
  const nextName = name.trim();
  const nextCode = code.trim();
  if (!nextName || nextName.length > 40) return { ok: false, error: "Indique un nom." };
  if (!profiles.some((profile) => profile.id === id)) return { ok: false, error: "Ce profil n'existe plus." };
  const invalid = codeError(profiles, id, nextCode);
  if (invalid) return { ok: false, error: invalid };
  return {
    ok: true,
    profiles: profiles.map((profile) => (profile.id === id ? { ...profile, name: nextName, code: nextCode } : profile)),
  };
};

export const deleteProfile = (profiles: PostingProfile[], id: string): ProfileResult => {
  if (!profiles.some((profile) => profile.id === id)) return { ok: false, error: "Ce profil n'existe plus." };
  return { ok: true, profiles: profiles.filter((profile) => profile.id !== id) };
};

export const addProfile = (profiles: PostingProfile[], name: string, code: string): ProfileResult => {
  const nextName = name.trim();
  const nextCode = code.trim();
  if (!nextName || nextName.length > 40) return { ok: false, error: "Indique un nom." };
  const invalid = codeError(profiles, null, nextCode);
  if (invalid) return { ok: false, error: invalid };
  const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return { ok: true, profiles: [...profiles, { id, name: nextName, code: nextCode }] };
};

export const normalizeProfiles = (value: unknown): PostingProfile[] | null => {
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  const codes = new Set<string>();
  const profiles: PostingProfile[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<PostingProfile>;
    if (typeof record.id !== "string" || !PROFILE_ID.test(record.id) || seen.has(record.id)) continue;
    if (typeof record.name !== "string" || typeof record.code !== "string") continue;
    const name = record.name.trim().slice(0, 40);
    const code = record.code.trim();
    if (!name || !CODE.test(code) || code === "2580" || codes.has(code)) continue;
    seen.add(record.id);
    codes.add(code);
    profiles.push({ id: record.id, name, code });
  }
  return profiles;
};
