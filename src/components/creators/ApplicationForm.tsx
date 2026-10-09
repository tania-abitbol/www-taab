"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  CreatorApplicationDraft,
  DraftField,
  FOLLOWER_OPTIONS,
  FORM_FIELDS,
  FieldErrors,
  LIMITS,
  createEmptyDraft,
  normalizeUsername,
  tiktokProfileUrl,
  validateDraft,
} from "~/config/creatorApplication";
import { CREATOR_FORM_COPY } from "~/config/creatorFormCopy";
import type { CreatorProgramContent } from "~/config/creatorProgram";

import { CheckboxField, ChoiceGroup, TextField, fieldId } from "./FormFields";
import { submitCreatorApplication } from "./submitApplication";
import { CREATOR_EVENTS, trackCreatorEvent } from "./tracking";

const TIKTOK_PREVIEW_PATTERN = /^[A-Za-z0-9._]{2,24}$/;
const FOLLOWER_VALUES = FOLLOWER_OPTIONS.map((option) => option.value);
const FOCUS_ORDER: (DraftField | "handles")[] = [...FORM_FIELDS, "handles"];

interface ApplicationFormProps {
  content: CreatorProgramContent;
  onSubmitted?: () => void;
}

const restoreDraft = (
  current: CreatorApplicationDraft,
  saved: Partial<CreatorApplicationDraft>
): CreatorApplicationDraft => ({
  name: typeof saved.name === "string" ? saved.name : current.name,
  email: typeof saved.email === "string" ? saved.email : current.email,
  country: current.country,
  ageConfirmed: typeof saved.ageConfirmed === "boolean" ? saved.ageConfirmed : current.ageConfirmed,
  instagramUsername:
    typeof saved.instagramUsername === "string" ? saved.instagramUsername : current.instagramUsername,
  tiktokUsername: typeof saved.tiktokUsername === "string" ? saved.tiktokUsername : current.tiktokUsername,
  followers: FOLLOWER_VALUES.includes(saved.followers as (typeof FOLLOWER_VALUES)[number])
    ? (saved.followers as CreatorApplicationDraft["followers"])
    : current.followers,
});

export const ApplicationForm = ({ content, onSubmitted }: ApplicationFormProps) => {
  const { application, countryIsoCode, country: program, locale } = content;
  const copy = CREATOR_FORM_COPY[locale];
  const draftStorageKey = `taab:creator-application-draft:${program}`;
  const reduceMotion = useReducedMotion();

  const [draft, setDraft] = useState<CreatorApplicationDraft>(() => createEmptyDraft(countryIsoCode));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [honeypot, setHoneypot] = useState("");
  const submittingRef = useRef(false);
  const restoredRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const startedAtRef = useRef<number | null>(null);

  const usernameLooksValid = TIKTOK_PREVIEW_PATTERN.test(normalizeUsername(draft.tiktokUsername));

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.draft && typeof parsed.draft === "object") {
          setDraft((current) => restoreDraft(current, parsed.draft));
        }
      }
    } catch {
      sessionStorage.removeItem(draftStorageKey);
    }
    restoredRef.current = true;
  }, [draftStorageKey]);

  useEffect(() => {
    if (!restoredRef.current || status === "success") return;
    try {
      sessionStorage.setItem(draftStorageKey, JSON.stringify({ draft }));
    } catch {
      // Storage can be unavailable (private mode, in-app browsers); the form still works.
    }
  }, [draft, status, draftStorageKey]);

  useEffect(() => {
    if (status === "success") successHeadingRef.current?.focus();
  }, [status]);

  const markStarted = (field: DraftField) => {
    if (startedAtRef.current !== null) return;
    startedAtRef.current = Date.now();
    trackCreatorEvent(CREATOR_EVENTS.applicationStart, { program, first_field: field });
  };

  const update = <K extends DraftField>(field: K, value: CreatorApplicationDraft[K]) => {
    markStarted(field);
    setDraft((current) => {
      const next = { ...current, [field]: value };
      setErrors((currentErrors) => {
        if (Object.keys(currentErrors).length === 0) return currentErrors;
        const nextErrors = validateDraft(next, copy);
        const kept: FieldErrors = {};
        (Object.keys(currentErrors) as (keyof FieldErrors)[]).forEach((key) => {
          if (nextErrors[key]) kept[key] = nextErrors[key];
        });
        if (nextErrors[field]) kept[field] = nextErrors[field];
        return kept;
      });
      return next;
    });
  };

  const validate = () => {
    const nextErrors = validateDraft(draft, copy);
    setErrors(nextErrors);
    const firstInvalid = FOCUS_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      trackCreatorEvent(CREATOR_EVENTS.applicationValidationError, {
        program,
        fields: FOCUS_ORDER.filter((field) => nextErrors[field]).join(","),
      });
      const focusId = firstInvalid === "handles" ? fieldId("instagramUsername") : fieldId(firstInvalid);
      document.getElementById(focusId)?.focus();
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus("submitting");
    try {
      if (!honeypot) await submitCreatorApplication(draft, locale);
      trackCreatorEvent(CREATOR_EVENTS.applicationSubmitted, {
        program,
        country: draft.country,
        followers: draft.followers,
        seconds_to_submit: String(
          startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : 0
        ),
      });
      sessionStorage.removeItem(draftStorageKey);
      setStatus("success");
      onSubmitted?.();
    } catch (error) {
      console.error("[Creator application] Submission failed", error);
      trackCreatorEvent(CREATOR_EVENTS.applicationError, { program });
      setStatus("error");
      submittingRef.current = false;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting" || submittingRef.current || !validate()) return;
    void submit();
  };

  if (status === "success") {
    return (
      <div ref={rootRef} className="rounded-3xl bg-white p-5 text-black shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] md:p-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col items-start py-6 md:py-10"
          role="status"
        >
          <span aria-hidden="true" className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-yellow">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <h3 ref={successHeadingRef} tabIndex={-1} className="mb-4 font-title text-4xl tracking-tight focus:outline-none md:text-5xl">
            {application.success.title}
          </h3>
          <p className="max-w-md font-body text-base leading-relaxed text-gray-700 md:text-lg">
            {application.success.copy}
          </p>
        </motion.div>
      </div>
    );
  }

  const followerOptions = FOLLOWER_OPTIONS.map((option) => ({
    value: option.value,
    label: copy.options.followers[option.value],
  }));

  return (
    <div ref={rootRef} className="scroll-mt-3 rounded-3xl bg-white p-4 text-black shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6 md:p-8">
      <form noValidate onSubmit={handleSubmit} aria-labelledby="creator-application-title">
        <h3 id="creator-application-title" className="sr-only">
          {copy.title}
        </h3>
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="creator-application-website">Website</label>
          <input
            id="creator-application-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        <div className="space-y-4">
          <TextField
            name="name"
            label={copy.fields.name}
            autoComplete="name"
            value={draft.name}
            onChange={(value) => update("name", value)}
            maxLength={LIMITS.name}
            error={errors.name}
          />
          <TextField
            name="email"
            label={copy.fields.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={copy.fields.emailPlaceholder}
            value={draft.email}
            onChange={(value) => update("email", value)}
            maxLength={LIMITS.email}
            error={errors.email}
          />
          <ChoiceGroup
            name="followers"
            label={copy.fields.followers}
            hint={copy.fields.followersHint}
            options={followerOptions}
            value={draft.followers}
            onChange={(value) => update("followers", value)}
            error={errors.followers}
          />
          <div>
            <p id="creator-application-handles-hint" className="mb-3 font-body text-sm text-gray-700">
              {copy.fields.handlesHint}
            </p>
            <div className="space-y-4">
              <TextField
                name="instagramUsername"
                label={copy.fields.instagramUsername}
                optional
                optionalLabel={copy.fields.optional}
                prefix="@"
                autoComplete="username"
                placeholder={copy.fields.instagramUsernamePlaceholder}
                value={draft.instagramUsername}
                onChange={(value) => update("instagramUsername", value.replace(/^\s*@+/, ""))}
                maxLength={30}
                error={errors.instagramUsername}
              />
              <TextField
                name="tiktokUsername"
                label={copy.fields.tiktokUsername}
                optional
                optionalLabel={copy.fields.optional}
                prefix="@"
                autoComplete="username"
                placeholder={copy.fields.tiktokUsernamePlaceholder}
                value={draft.tiktokUsername}
                onChange={(value) => update("tiktokUsername", value.replace(/^\s*@+/, ""))}
                maxLength={30}
                error={errors.tiktokUsername}
                hint={
                  usernameLooksValid ? (
                    <a
                      href={tiktokProfileUrl(draft.tiktokUsername)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-black underline underline-offset-2"
                    >
                      {copy.fields.checkProfile(normalizeUsername(draft.tiktokUsername))}
                    </a>
                  ) : undefined
                }
              />
            </div>
            {errors.handles && (
              <p id="creator-application-handles-error" role="alert" className="mt-2 flex items-start gap-1.5 font-body text-sm text-[#C8102E]">
                <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor">
                  <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-.75 4a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0V6ZM10 14.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                </svg>
                {errors.handles}
              </p>
            )}
          </div>
          <CheckboxField
            name="ageConfirmed"
            label={copy.fields.ageConfirmed}
            checked={draft.ageConfirmed}
            onChange={(value) => update("ageConfirmed", value)}
            error={errors.ageConfirmed}
          />
          <p className="font-body text-xs text-gray-700">{copy.fields.privacyNote}</p>
        </div>

        {status === "error" && (
          <p role="alert" className="mt-4 rounded-xl border border-[#C8102E] bg-[#C8102E]/5 px-4 py-3 font-body text-sm text-[#C8102E]">
            {copy.errors.submit}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          aria-busy={status === "submitting"}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-6 font-body text-base font-bold text-white transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
        >
          {status === "submitting" ? (
            <>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              {copy.buttons.sending}
            </>
          ) : (
            copy.buttons.submit
          )}
        </button>
      </form>
    </div>
  );
};
