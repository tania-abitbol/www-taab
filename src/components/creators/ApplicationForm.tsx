"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  APPLICATION_STEPS,
  AVERAGE_VIEWS_OPTIONS,
  CONTENT_CATEGORY_OPTIONS,
  CreatorApplicationDraft,
  DEFAULT_REGION_LABEL,
  DraftField,
  FOLLOWER_OPTIONS,
  FieldErrors,
  LIMITS,
  MAX_CONTENT_CATEGORIES,
  POSTING_FREQUENCY_OPTIONS,
  REGIONS_BY_COUNTRY,
  SHOWS_FACE_OPTIONS,
  createEmptyDraft,
  getCountryOptions,
  normalizeUsername,
  tiktokProfileUrl,
  validateFields,
} from "~/config/creatorApplication";
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

const DRAFT_STORAGE_KEY = "taab:creator-application-draft";

interface ApplicationFormProps {
  content: CreatorProgramContent;
  onSubmitted?: () => void;
}

export const ApplicationForm = ({ content, onSubmitted }: ApplicationFormProps) => {
  const { application, countryIsoCode, country: program } = content;
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

  const step = APPLICATION_STEPS[stepIndex];
  const isLastStep = stepIndex === APPLICATION_STEPS.length - 1;
  const pinnedCountryOptions = useMemo(
    () => getCountryOptions([countryIsoCode]).slice(0, 1),
    [countryIsoCode]
  );
  // Country names come from Intl and differ between Node and browsers, so the
  // full list is only built after hydration.
  const [countryOptions, setCountryOptions] = useState(pinnedCountryOptions);
  useEffect(() => {
    setCountryOptions(getCountryOptions([countryIsoCode]));
  }, [countryIsoCode]);
  const region = REGIONS_BY_COUNTRY[draft.country];

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraft((current) => ({ ...current, ...parsed.draft }));
        if (typeof parsed.stepIndex === "number") {
          setStepIndex(Math.min(Math.max(parsed.stepIndex, 0), APPLICATION_STEPS.length - 1));
        }
      }
    } catch {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    restoredRef.current = true;
  }, []);

  useEffect(() => {
    if (!restoredRef.current || status === "success") return;
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ draft, stepIndex }));
    } catch {
      // Storage can be unavailable (private mode, in-app browsers); the form still works.
    }
  }, [draft, stepIndex, status]);

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

  const update = <K extends DraftField>(field: K, value: CreatorApplicationDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      if (field === "country" && current.country !== value) next.state = "";
      setErrors((currentErrors) => {
        if (!currentErrors[field]) return currentErrors;
        const { [field]: _cleared, ...rest } = currentErrors;
        return { ...rest, ...validateFields(next, [field]) };
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
        contentCategories: `Pick up to ${MAX_CONTENT_CATEGORIES}. Unselect one to swap it.`,
      }));
    }
  };

  const validateStep = () => {
    const stepErrors = validateFields(draft, step.fields);
    setErrors(stepErrors);
    const firstInvalid = step.fields.find((field) => stepErrors[field]);
    if (firstInvalid) {
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
      if (!honeypot) await submitCreatorApplication(draft);
      trackCreatorEvent(CREATOR_EVENTS.applicationSubmitted, { program });
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
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
            Step {stepIndex + 1} <span className="font-normal text-gray-700">of {APPLICATION_STEPS.length}</span>
          </p>
          <p className="text-gray-700" aria-hidden="true">
            {isLastStep ? "Final step" : `Next: ${APPLICATION_STEPS[stepIndex + 1].title}`}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Application progress"
          aria-valuemin={1}
          aria-valuemax={APPLICATION_STEPS.length}
          aria-valuenow={stepIndex + 1}
          aria-valuetext={`Step ${stepIndex + 1} of ${APPLICATION_STEPS.length}: ${step.title}`}
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
        <span className="sr-only">{Math.round(progress)}% complete</span>
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
              {step.title}
            </h3>
            <p className="mb-7 font-body text-base text-gray-700">{step.description}</p>

            <div className="space-y-6">
              {step.id === "about" && (
                <>
                  <TextField
                    name="name"
                    label="Name"
                    autoComplete="name"
                    value={draft.name}
                    onChange={(value) => update("name", value)}
                    maxLength={LIMITS.name}
                    error={errors.name}
                  />
                  <TextField
                    name="email"
                    label="Email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={draft.email}
                    onChange={(value) => update("email", value)}
                    maxLength={LIMITS.email}
                    error={errors.email}
                  />
                  <div className="grid gap-6 sm:grid-cols-2">
                    <SelectField
                      name="country"
                      label="Country"
                      autoComplete="country"
                      hint={draft.country === countryIsoCode ? application.recruitingNote : undefined}
                      value={draft.country}
                      onChange={(value) => update("country", value)}
                      options={countryOptions}
                      error={errors.country}
                    />
                    {region ? (
                      <SelectField
                        name="state"
                        label={region.label}
                        autoComplete="address-level1"
                        placeholder={`Select your ${region.label.toLowerCase()}`}
                        value={draft.state}
                        onChange={(value) => update("state", value)}
                        options={region.options.map((option) => ({ value: option, label: option }))}
                        error={errors.state}
                      />
                    ) : (
                      <TextField
                        name="state"
                        label={DEFAULT_REGION_LABEL}
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
                    label="I'm 18 or older."
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
                    label="TikTok username"
                    prefix="@"
                    autoComplete="username"
                    placeholder="yourname"
                    value={draft.tiktokUsername}
                    onChange={(value) => update("tiktokUsername", value.replace(/^\s*@+/, ""))}
                    maxLength={30}
                    error={errors.tiktokUsername}
                    hint={
                      /^[A-Za-z0-9._]{2,24}$/.test(normalizeUsername(draft.tiktokUsername)) ? (
                        <a
                          href={tiktokProfileUrl(draft.tiktokUsername)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-black underline underline-offset-2"
                        >
                          Check it&apos;s you: tiktok.com/@{normalizeUsername(draft.tiktokUsername)} ↗
                        </a>
                      ) : undefined
                    }
                  />
                  <ChoiceGroup
                    name="followers"
                    label="Followers"
                    hint="Any follower count is welcome."
                    options={FOLLOWER_OPTIONS}
                    value={draft.followers}
                    onChange={(value) => update("followers", value)}
                    error={errors.followers}
                  />
                  <ChoiceGroup
                    name="averageViews"
                    label="Average views per video"
                    options={AVERAGE_VIEWS_OPTIONS}
                    value={draft.averageViews}
                    onChange={(value) => update("averageViews", value)}
                    error={errors.averageViews}
                  />
                  <ChoiceGroup
                    name="postingFrequency"
                    label="How often do you post?"
                    options={POSTING_FREQUENCY_OPTIONS}
                    value={draft.postingFrequency}
                    onChange={(value) => update("postingFrequency", value)}
                    error={errors.postingFrequency}
                  />
                </>
              )}

              {step.id === "content" && (
                <>
                  <ChoiceGroup
                    name="contentCategories"
                    label="Content categories"
                    hint={`Pick up to ${MAX_CONTENT_CATEGORIES}.`}
                    options={CONTENT_CATEGORY_OPTIONS}
                    value={draft.contentCategories}
                    onChange={toggleCategory}
                    multiple
                    error={errors.contentCategories}
                  />
                  <TextAreaField
                    name="contentDescription"
                    label="What type of content do you usually create?"
                    placeholder="e.g. Story times about dating in my 20s, filmed in my car."
                    value={draft.contentDescription}
                    onChange={(value) => update("contentDescription", value)}
                    maxLength={LIMITS.contentDescription}
                    rows={3}
                    error={errors.contentDescription}
                  />
                  <ChoiceGroup
                    name="showsFace"
                    label="Comfortable appearing on camera?"
                    options={SHOWS_FACE_OPTIONS}
                    value={draft.showsFace}
                    onChange={(value) => update("showsFace", value)}
                    error={errors.showsFace}
                  />
                </>
              )}

              {step.id === "examples" && (
                <>
                  <TextField
                    name="videoUrl1"
                    label="Your best TikTok"
                    type="url"
                    inputMode="url"
                    placeholder="tiktok.com/@yourname/video/..."
                    value={draft.videoUrl1}
                    onChange={(value) => update("videoUrl1", value)}
                    maxLength={LIMITS.url}
                    error={errors.videoUrl1}
                  />
                  <TextField
                    name="videoUrl2"
                    label="Second TikTok"
                    optional
                    type="url"
                    inputMode="url"
                    placeholder="tiktok.com/@yourname/video/..."
                    value={draft.videoUrl2}
                    onChange={(value) => update("videoUrl2", value)}
                    maxLength={LIMITS.url}
                    error={errors.videoUrl2}
                  />
                  <TextField
                    name="videoUrl3"
                    label="Third TikTok"
                    optional
                    type="url"
                    inputMode="url"
                    placeholder="tiktok.com/@yourname/video/..."
                    value={draft.videoUrl3}
                    onChange={(value) => update("videoUrl3", value)}
                    maxLength={LIMITS.url}
                    error={errors.videoUrl3}
                  />
                  <TextAreaField
                    name="contentDifference"
                    label="What makes your content different?"
                    hint="One or two sentences is perfect."
                    value={draft.contentDifference}
                    onChange={(value) => update("contentDifference", value)}
                    maxLength={LIMITS.contentDifference}
                    rows={3}
                    error={errors.contentDifference}
                  />
                </>
              )}

              {step.id === "motivation" && (
                <>
                  <TextAreaField
                    name="whyCreator"
                    label="Why do you want to become a TAAB Creator?"
                    value={draft.whyCreator}
                    onChange={(value) => update("whyCreator", value)}
                    maxLength={LIMITS.whyCreator}
                    rows={4}
                    error={errors.whyCreator}
                  />
                  <CheckboxField
                    name="informationConfirmed"
                    label="I confirm this information is accurate and that TAAB can contact me by email about the creator program."
                    checked={draft.informationConfirmed}
                    onChange={(value) => update("informationConfirmed", value)}
                    error={errors.informationConfirmed}
                  />
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {status === "error" && (
          <p role="alert" className="mt-6 rounded-xl border border-[#C8102E] bg-[#C8102E]/5 px-4 py-3 font-body text-sm text-[#C8102E]">
            Something went wrong while sending your application. Your answers are saved, so please try again.
          </p>
        )}

        <div className="mt-8 flex items-center gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => goTo(stepIndex - 1)}
              disabled={status === "submitting"}
              className="h-12 rounded-xl border border-gray-300 px-5 font-body text-base font-bold transition-colors hover:border-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-50"
            >
              Back
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
                Sending…
              </>
            ) : isLastStep ? (
              "Submit application"
            ) : (
              <>
                Continue
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
