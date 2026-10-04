"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  APPLICATION_STEPS,
  AVERAGE_VIEWS_OPTIONS,
  CONTENT_CATEGORY_OPTIONS,
  CreatorApplicationDraft,
  DraftField,
  FOLLOWER_OPTIONS,
  FieldErrors,
  LIMITS,
  MAX_CONTENT_CATEGORIES,
  POSTING_FREQUENCY_OPTIONS,
  REGIONS_BY_COUNTRY,
  createEmptyDraft,
  getCountryOptions,
  normalizeUsername,
  regionLabel,
  tiktokProfileUrl,
  validateFields,
} from "~/config/creatorApplication";
import { CREATOR_FORM_COPY } from "~/config/creatorFormCopy";
import type { CreatorProgramContent } from "~/config/creatorProgram";

import {
  CheckboxField,
  ChoiceGroup,
  SelectField,
  TextAreaField,
  TextField,
  fieldId,
} from "./FormFields";
import { submitCreatorApplication } from "./submitApplication";
import { CREATOR_EVENTS, trackCreatorEvent } from "./tracking";

const USERNAME_PREVIEW_PATTERN = /^[A-Za-z0-9._]{2,24}$/;

interface ApplicationFormProps {
  content: CreatorProgramContent;
  onSubmitted?: () => void;
}

export const ApplicationForm = ({ content, onSubmitted }: ApplicationFormProps) => {
  const { application, countryIsoCode, country: program, locale } = content;
  const copy = CREATOR_FORM_COPY[locale];
  const draftStorageKey = `taab:creator-application-draft:${program}`;
  const reduceMotion = useReducedMotion();

  const [draft, setDraft] = useState<CreatorApplicationDraft>(() =>
    createEmptyDraft(countryIsoCode)
  );
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
  const localizedOptions = <T extends string>(options: readonly { value: T }[], labels: Record<T, string>) =>
    options.map((option) => ({ value: option.value, label: labels[option.value] }));
  const isLastStep = stepIndex === APPLICATION_STEPS.length - 1;
  const pinnedCountryOptions = useMemo(
    () => getCountryOptions([countryIsoCode], locale).slice(0, 1),
    [countryIsoCode, locale]
  );
  // Country names come from Intl and differ between Node and browsers, so the
  // full list is only built after hydration.
  const [countryOptions, setCountryOptions] = useState(pinnedCountryOptions);
  useEffect(() => {
    setCountryOptions(getCountryOptions([countryIsoCode], locale));
  }, [countryIsoCode, locale]);
  const regionOptions = REGIONS_BY_COUNTRY[draft.country];
  const currentRegionLabel = regionLabel(copy, draft.country);
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
        setDraft((current) => ({ ...current, ...parsed.draft }));
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
      if (field === "country" && current.country !== value) next.state = "";
      setErrors((currentErrors) => {
        if (!currentErrors[field]) return currentErrors;
        const { [field]: _cleared, ...rest } = currentErrors;
        return { ...rest, ...validateFields(next, [field], copy) };
      });
      return next;
    });
  };

  const toggleCategory = (value: CreatorApplicationDraft["contentCategories"][number]) => {
    const current = draft.contentCategories;
    if (current.includes(value)) {
      update("contentCategories", current.filter((item) => item !== value));
    } else if (current.length < MAX_CONTENT_CATEGORIES) {
      update("contentCategories", [...current, value]);
    } else {
      setErrors((currentErrors) => ({
        ...currentErrors,
        contentCategories: copy.errors.categoriesSwap(MAX_CONTENT_CATEGORIES),
      }));
    }
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
    if (status === "submitting" || !validateStep()) return;
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
      <div ref={rootRef} className="rounded-3xl bg-white p-6 text-black shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] md:p-10">
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

  return (
    <div ref={rootRef} className="scroll-mt-6 rounded-3xl bg-white p-5 text-black shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] sm:p-8 md:p-10">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between font-body text-sm">
          <p className="font-bold">
            {copy.progress.step(stepIndex + 1, APPLICATION_STEPS.length)[0]}{" "}
            <span className="font-normal text-gray-700">
              {copy.progress.step(stepIndex + 1, APPLICATION_STEPS.length)[1]}
            </span>
          </p>
          <p className="text-gray-700" aria-hidden="true">
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
              className="mb-1 font-title text-2xl tracking-tight focus:outline-none md:text-3xl"
            >
              {stepCopy.title}
            </h3>
            <p className="mb-7 font-body text-base text-gray-700">{stepCopy.description}</p>

            <div className="space-y-6">
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
                  <div className="grid gap-6 sm:grid-cols-2">
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
                    {regionOptions ? (
                      <SelectField
                        name="state"
                        label={currentRegionLabel}
                        autoComplete="address-level1"
                        placeholder={copy.fields.selectRegion(currentRegionLabel)}
                        value={draft.state}
                        onChange={(value) => update("state", value)}
                        options={regionOptions.map((option) => ({ value: option, label: option }))}
                        error={errors.state}
                      />
                    ) : (
                      <TextField
                        name="state"
                        label={currentRegionLabel}
                        autoComplete="address-level1"
                        value={draft.state}
                        onChange={(value) => update("state", value)}
                        maxLength={LIMITS.state}
                        error={errors.state}
                      />
                    )}
                  </div>
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
                    options={localizedOptions(FOLLOWER_OPTIONS, copy.options.followers)}
                    value={draft.followers}
                    onChange={(value) => update("followers", value)}
                    error={errors.followers}
                  />
                  <ChoiceGroup
                    name="averageViews"
                    label={copy.fields.averageViews}
                    options={localizedOptions(AVERAGE_VIEWS_OPTIONS, copy.options.averageViews)}
                    value={draft.averageViews}
                    onChange={(value) => update("averageViews", value)}
                    error={errors.averageViews}
                  />
                  <ChoiceGroup
                    name="postingFrequency"
                    label={copy.fields.postingFrequency}
                    options={localizedOptions(POSTING_FREQUENCY_OPTIONS, copy.options.postingFrequency)}
                    value={draft.postingFrequency}
                    onChange={(value) => update("postingFrequency", value)}
                    error={errors.postingFrequency}
                  />
                  <ChoiceGroup
                    name="contentCategories"
                    label={copy.fields.contentCategories}
                    hint={copy.fields.contentCategoriesHint(MAX_CONTENT_CATEGORIES)}
                    options={localizedOptions(CONTENT_CATEGORY_OPTIONS, copy.options.contentCategories)}
                    value={draft.contentCategories}
                    onChange={toggleCategory}
                    multiple
                    error={errors.contentCategories}
                  />
                </>
              )}

              {step.id === "motivation" && (
                <>
                  <TextAreaField
                    name="whyCreator"
                    label={copy.fields.whyCreator}
                    hint={copy.fields.whyCreatorHint}
                    placeholder={copy.fields.whyCreatorPlaceholder}
                    value={draft.whyCreator}
                    onChange={(value) => update("whyCreator", value)}
                    maxLength={LIMITS.whyCreator}
                    rows={4}
                    error={errors.whyCreator}
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
          <p role="alert" className="mt-6 rounded-xl border border-[#C8102E] bg-[#C8102E]/5 px-4 py-3 font-body text-sm text-[#C8102E]">
            {copy.errors.submit}
          </p>
        )}

        <div className="mt-8 flex items-center gap-3">
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
