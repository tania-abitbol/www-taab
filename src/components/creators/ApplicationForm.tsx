"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  APPLICATION_STEPS,
  CreatorApplicationDraft,
  DraftField,
  FOLLOWER_OPTIONS,
  FieldErrors,
  LIMITS,
  createEmptyDraft,
  getCountryOptions,
  normalizeUsername,
  tiktokProfileUrl,
  validateFields,
} from "~/config/creatorApplication";
import { CREATOR_FORM_COPY } from "~/config/creatorFormCopy";
import type { CreatorProgramContent } from "~/config/creatorProgram";

import { CheckboxField, ChoiceGroup, SelectField, TextField, fieldId } from "./FormFields";
import { submitCreatorApplication } from "./submitApplication";
import { CREATOR_EVENTS, trackCreatorEvent } from "./tracking";

const USERNAME_PREVIEW_PATTERN = /^[A-Za-z0-9._]{2,24}$/;
const FOLLOWER_VALUES = FOLLOWER_OPTIONS.map((option) => option.value);

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
  country:
    typeof saved.country === "string" && /^[A-Z]{2}$/.test(saved.country)
      ? saved.country
      : current.country,
  ageConfirmed: typeof saved.ageConfirmed === "boolean" ? saved.ageConfirmed : current.ageConfirmed,
  tiktokUsername: typeof saved.tiktokUsername === "string" ? saved.tiktokUsername : current.tiktokUsername,
  followers: FOLLOWER_VALUES.includes(saved.followers as (typeof FOLLOWER_VALUES)[number])
    ? (saved.followers as CreatorApplicationDraft["followers"])
    : current.followers,
  informationConfirmed:
    typeof saved.informationConfirmed === "boolean"
      ? saved.informationConfirmed
      : current.informationConfirmed,
});

export const ApplicationForm = ({ content, onSubmitted }: ApplicationFormProps) => {
  const { application, countryIsoCode, country: program, locale } = content;
  const copy = CREATOR_FORM_COPY[locale];
  const draftStorageKey = `taab:creator-application-draft:${program}`;
  const reduceMotion = useReducedMotion();

  const [draft, setDraft] = useState<CreatorApplicationDraft>(() => createEmptyDraft(countryIsoCode));
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [honeypot, setHoneypot] = useState("");
  const submittingRef = useRef(false);
  const restoredRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasNavigatedRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);

  const step = APPLICATION_STEPS[stepIndex];
  const stepCopy = copy.steps[step.id];
  const isLastStep = stepIndex === APPLICATION_STEPS.length - 1;
  const pinnedCountryOptions = useMemo(
    () => getCountryOptions([countryIsoCode], locale).slice(0, 1),
    [countryIsoCode, locale]
  );
  // Country names come from Intl and differ between Node and browsers, so the
  // full list is only built after hydration. The page's country stays selected.
  const [countryOptions, setCountryOptions] = useState(pinnedCountryOptions);
  useEffect(() => {
    setCountryOptions(getCountryOptions([countryIsoCode], locale));
  }, [countryIsoCode, locale]);
  const usernameLooksValid = USERNAME_PREVIEW_PATTERN.test(normalizeUsername(draft.tiktokUsername));

  useEffect(() => {
    if (!hasNavigatedRef.current) return;
    trackCreatorEvent(CREATOR_EVENTS.applicationStepView, {
      program,
      step: step.id,
      step_number: String(stepIndex + 1),
    });
  }, [program, step.id, stepIndex]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.draft && typeof parsed.draft === "object") {
          setDraft((current) => restoreDraft(current, parsed.draft));
        }
        if (typeof parsed.stepIndex === "number") {
          setStepIndex(Math.min(Math.max(parsed.stepIndex, 0), APPLICATION_STEPS.length - 1));
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
      sessionStorage.setItem(draftStorageKey, JSON.stringify({ draft, stepIndex }));
    } catch {
      // Storage can be unavailable (private mode, in-app browsers); the form still works.
    }
  }, [draft, stepIndex, status, draftStorageKey]);

  useEffect(() => {
    if (!hasNavigatedRef.current) return;
    stepHeadingRef.current?.focus({ preventScroll: true });
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) {
      rootRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }, [stepIndex, reduceMotion]);

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
        if (!currentErrors[field]) return currentErrors;
        const { [field]: _cleared, ...rest } = currentErrors;
        return { ...rest, ...validateFields(next, [field], copy) };
      });
      return next;
    });
  };

  const validateStep = () => {
    const stepErrors = validateFields(draft, step.fields, copy);
    setErrors(stepErrors);
    const firstInvalid = step.fields.find((field) => stepErrors[field]);
    if (firstInvalid) {
      trackCreatorEvent(CREATOR_EVENTS.applicationValidationError, {
        program,
        step: step.id,
        fields: step.fields.filter((field) => stepErrors[field]).join(","),
      });
      document.getElementById(fieldId(firstInvalid))?.focus();
      return false;
    }
    return true;
  };

  const goTo = (index: number) => {
    hasNavigatedRef.current = true;
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
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
    if (status === "submitting" || submittingRef.current || !validateStep()) return;
    trackCreatorEvent(CREATOR_EVENTS.applicationStepCompleted, {
      program,
      step: step.id,
      step_number: String(stepIndex + 1),
    });
    if (isLastStep) {
      void submit();
    } else {
      goTo(stepIndex + 1);
    }
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

  const progress = ((stepIndex + 1) / APPLICATION_STEPS.length) * 100;
  const followerOptions = FOLLOWER_OPTIONS.map((option) => ({
    value: option.value,
    label: copy.options.followers[option.value],
  }));

  return (
    <div ref={rootRef} className="scroll-mt-3 rounded-3xl bg-white p-4 text-black shadow-[0_16px_40px_-28px_rgba(0,0,0,0.45)] sm:p-6 md:p-8">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between gap-3 font-body text-sm">
          <p className="font-bold">
            {copy.progress.step(stepIndex + 1, APPLICATION_STEPS.length)[0]}{" "}
            <span className="font-normal text-gray-700">
              {copy.progress.step(stepIndex + 1, APPLICATION_STEPS.length)[1]}
            </span>
          </p>
          <p className="truncate text-gray-700" aria-hidden="true">
            {isLastStep
              ? copy.progress.finalStep
              : copy.progress.next(copy.steps[APPLICATION_STEPS[stepIndex + 1].id].title)}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={copy.progress.ariaLabel}
          aria-valuemin={1}
          aria-valuemax={APPLICATION_STEPS.length}
          aria-valuenow={stepIndex + 1}
          aria-valuetext={copy.progress.ariaValue(stepIndex + 1, APPLICATION_STEPS.length, stepCopy.title)}
          className="flex gap-1.5"
        >
          {APPLICATION_STEPS.map((item, index) => (
            <span key={item.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <motion.span
                className="block h-full rounded-full bg-black"
                initial={false}
                animate={{ width: index <= stepIndex ? "100%" : "0%" }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
              />
            </span>
          ))}
        </div>
        <span className="sr-only">{copy.progress.complete(Math.round(progress))}</span>
      </div>

      <form noValidate onSubmit={handleSubmit} aria-labelledby="creator-application-step-title">
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

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <h3
              id="creator-application-step-title"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="mb-0.5 font-title text-xl tracking-tight focus:outline-none md:text-2xl"
            >
              {stepCopy.title}
            </h3>
            <p className="mb-4 font-body text-sm text-gray-700">{stepCopy.description}</p>

            <div className="space-y-4">
              {step.id === "about" && (
                <>
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
                  <SelectField
                    name="country"
                    label={copy.fields.country}
                    autoComplete="country"
                    hint={draft.country === countryIsoCode ? application.recruitingNote : undefined}
                    value={draft.country}
                    onChange={(value) => update("country", value)}
                    options={countryOptions}
                    error={errors.country}
                  />
                  {draft.country !== countryIsoCode && (
                    <p className="rounded-xl bg-yellow/25 px-4 py-3 font-body text-sm leading-relaxed">
                      {application.outsideCountryNote}
                    </p>
                  )}
                  <CheckboxField
                    name="ageConfirmed"
                    label={copy.fields.ageConfirmed}
                    checked={draft.ageConfirmed}
                    onChange={(value) => update("ageConfirmed", value)}
                    error={errors.ageConfirmed}
                  />
                </>
              )}

              {step.id === "tiktok" && (
                <>
                  <TextField
                    name="tiktokUsername"
                    label={copy.fields.tiktokUsername}
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
                  <ChoiceGroup
                    name="followers"
                    label={copy.fields.followers}
                    hint={copy.fields.followersHint}
                    options={followerOptions}
                    value={draft.followers}
                    onChange={(value) => update("followers", value)}
                    error={errors.followers}
                  />
                  <CheckboxField
                    name="informationConfirmed"
                    label={copy.fields.informationConfirmed}
                    checked={draft.informationConfirmed}
                    onChange={(value) => update("informationConfirmed", value)}
                    error={errors.informationConfirmed}
                  />
                  <p className="-mt-2 font-body text-xs text-gray-700">{copy.fields.privacyNote}</p>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {status === "error" && (
          <p role="alert" className="mt-4 rounded-xl border border-[#C8102E] bg-[#C8102E]/5 px-4 py-3 font-body text-sm text-[#C8102E]">
            {copy.errors.submit}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => {
                trackCreatorEvent(CREATOR_EVENTS.applicationBack, { program, from_step: step.id });
                goTo(stepIndex - 1);
              }}
              disabled={status === "submitting"}
              className="h-12 rounded-xl border border-gray-300 px-5 font-body text-base font-bold transition-colors hover:border-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {copy.buttons.back}
            </button>
          )}
          <button
            type="submit"
            disabled={status === "submitting"}
            aria-busy={status === "submitting"}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-black px-6 font-body text-base font-bold text-white transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
          >
            {status === "submitting" ? (
              <>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-spin" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {copy.buttons.sending}
              </>
            ) : isLastStep ? (
              copy.buttons.submit
            ) : (
              <>
                {copy.buttons.continue}
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.97-3.97a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
