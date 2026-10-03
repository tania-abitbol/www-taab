"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig, useInView } from "framer-motion";

import { Footer } from "~/components/Footer";
import { ProgressBar } from "~/components/progressBar";
import { AppShowcaseCard } from "~/components/site/AppShowcase";
import {
  CheckIcon,
  Eyebrow,
  Reveal,
  bodyCopy,
  container,
  sectionTitle,
} from "~/components/site/primitives";
import { STUDIO_APPS } from "~/config/apps";
import type { CreatorProgramContent } from "~/config/creatorProgram";

import { ApplicationForm } from "./ApplicationForm";
import { CreatorPhoneMock } from "./CreatorPhoneMock";
import { EarningsEstimator } from "./EarningsEstimator";
import { CREATOR_EVENTS, trackCreatorEvent } from "./tracking";

const APPLY_SECTION_ID = "apply";

const ApplyButton = ({
  children,
  onClick,
  variant = "dark",
  size = "lg",
  className = "",
  tabIndex,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "dark" | "pink" | "light";
  size?: "sm" | "lg";
  className?: string;
  tabIndex?: number;
}) => {
  const variants = {
    dark: "bg-black text-white focus-visible:ring-black",
    pink: "bg-yellow text-black focus-visible:ring-white focus-visible:ring-offset-black",
    light: "bg-white text-black focus-visible:ring-white focus-visible:ring-offset-black",
  };
  const sizes = {
    sm: "h-10 px-4 text-sm",
    lg: "h-14 px-7 text-base md:text-lg",
  };
  return (
    <a
      href={`#${APPLY_SECTION_ID}`}
      tabIndex={tabIndex}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={`group inline-flex items-center justify-center gap-2 rounded-xl font-body font-bold transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
        <path d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.97-3.97a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z" />
      </svg>
    </a>
  );
};

const icons = {
  spark: (
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" />
  ),
  people: (
    <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm11.5 9v-1a4 4 0 0 0-3-3.87M15.5 3.13a3.5 3.5 0 0 1 0 6.75" />
  ),
  pen: <path d="m15 5 4 4M4 20l1-5L16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 2Z" />,
  bulb: (
    <path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
  ),
  chart: <path d="M4 20h16M7 16v-4m5 4V8m5 8V5" />,
  key: (
    <path d="M15 7a2 2 0 1 1 0 .01M21 9a6 6 0 0 1-8.2 5.6L11 16.4V19H8v3H4v-3.6l6.4-6.4A6 6 0 1 1 21 9Z" />
  ),
};

const Icon = ({ name }: { name: keyof typeof icons }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {icons[name]}
  </svg>
);

export const CreatorsLanding = ({ content }: { content: CreatorProgramContent }) => {
  const { hero, deal, earnings, positioning, lookingFor, benefits, apps, application, faq, finalCta } =
    content;
  const program = content.country;

  const heroRef = useRef<HTMLElement>(null);
  const applyRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);
  const [heroInView, setHeroInView] = useState(true);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroInView(entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  const applyInView = useInView(applyRef);
  const finalInView = useInView(finalRef);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    trackCreatorEvent(CREATOR_EVENTS.pageView, { program });
  }, [program]);

  const scrollToApplication = useCallback(() => {
    const target = document.getElementById(APPLY_SECTION_ID);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${APPLY_SECTION_ID}`);
    document.getElementById("apply-title")?.focus({ preventScroll: true });
  }, []);

  const handleCta = (location: string) => () => {
    trackCreatorEvent(CREATOR_EVENTS.ctaClick, { program, location });
    scrollToApplication();
  };

  const handleApply = (location: string) => () => {
    trackCreatorEvent(CREATOR_EVENTS.applicationClick, { program, location });
    scrollToApplication();
  };

  const showStickyCta = !heroInView && !applyInView && !finalInView && !submitted;

  return (
    <MotionConfig reducedMotion="user">
      <div lang="en" className="overflow-x-clip">
        <ProgressBar color="bg-yellow" bg="bg-yellow-lighter" />
        <a
          href={`#${APPLY_SECTION_ID}`}
          className="sr-only z-50 rounded-xl bg-black px-4 py-3 font-body text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to application
        </a>

        <header className={`${container} flex items-center justify-between pt-8 md:pt-10`}>
          <a href="/" className="rounded font-title text-3xl tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4">
            TAAB<span className="text-yellow">.</span>
          </a>
          <ApplyButton size="sm" onClick={handleCta("header")}>
            Apply
          </ApplyButton>
        </header>

        <main>
          {/* 1. Hero */}
          <section ref={heroRef} aria-labelledby="hero-title" className={`${container} relative pb-20 pt-12 md:pb-32 md:pt-20`}>
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
              <div className="relative z-10">
                <Eyebrow>{hero.eyebrow}</Eyebrow>
                <h1 id="hero-title" className="isolate mb-7 font-title text-[3.4rem] leading-[1.02] tracking-tight sm:text-7xl lg:text-[6rem]">
                  {hero.titleLead}{" "}
                  <span className="rotating-background mt-2 whitespace-nowrap">{hero.titleHighlight}</span>
                </h1>
                <p className="mb-6 max-w-xl font-body text-lg leading-relaxed text-black md:text-xl">
                  {hero.copy}
                </p>
                <ul className="mb-9 flex flex-wrap gap-2">
                  {hero.proofPoints.map((point) => (
                    <li key={point} className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 font-body text-sm font-bold shadow-[0_1px_0_rgba(0,0,0,0.06)] ring-1 ring-black/10">
                      <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow text-black">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
                  <ApplyButton onClick={handleCta("hero")} className="w-full sm:w-auto">
                    {hero.cta}
                  </ApplyButton>
                  <p className="text-center font-body text-sm text-gray-700 sm:text-left">{hero.ctaNote}</p>
                </div>
                <p className="mt-8 flex items-center gap-2 font-body text-sm font-bold">
                  <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow" />
                  </span>
                  {hero.secondary}
                </p>
              </div>

              <CreatorPhoneMock />
            </div>
          </section>

          {/* 2. The deal */}
          <section aria-labelledby="deal-title" className="px-3 pb-24 sm:px-5 md:pb-36">
            <div className="relative mx-auto max-w-[1280px] overflow-clip rounded-[2rem] bg-black py-16 text-white md:rounded-[2.5rem] md:py-24">
              <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-yellow/20 blur-3xl" />
              <div className={`${container} relative`}>
                <Reveal className="mb-12 max-w-2xl md:mb-16">
                  <Eyebrow inverted>{deal.eyebrow}</Eyebrow>
                  <h2 id="deal-title" className={`${sectionTitle} mb-5`}>
                    {deal.title}
                  </h2>
                  <p className="font-body text-lg leading-relaxed text-white/75 md:text-xl">{deal.copy}</p>
                </Reveal>
                <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
                  {deal.steps.map((step, index) => {
                    const isPayout = index === deal.steps.length - 1;
                    return (
                      <li key={step.title}>
                        <Reveal
                          delay={index * 0.08}
                          className={`flex h-full flex-col rounded-3xl p-6 md:p-8 ${isPayout ? "bg-yellow text-black" : "border border-white/10 bg-white/5"}`}
                        >
                          <p aria-hidden="true" className={`mb-10 font-title text-5xl md:mb-14 ${isPayout ? "text-black" : "text-yellow"}`}>
                            {isPayout ? "$" : String(index + 1).padStart(2, "0")}
                          </p>
                          <h3 className="mb-2 font-title text-2xl">
                            <span className="sr-only">Step {index + 1}: </span>
                            {step.title}
                          </h3>
                          <p className={`font-body text-base leading-relaxed ${isPayout ? "text-black/80" : "text-white/75"}`}>
                            {step.description}
                          </p>
                        </Reveal>
                      </li>
                    );
                  })}
                </ol>
                {earnings ? (
                  <Reveal className="mt-6">
                    <EarningsEstimator earnings={earnings} />
                  </Reveal>
                ) : (
                  <Reveal className="mt-6">
                    <p className="flex items-start gap-3 rounded-2xl border border-white/10 px-5 py-4 font-body text-base text-white/80 md:items-center md:px-6">
                      <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow text-black md:mt-0">
                        <CheckIcon />
                      </span>
                      {deal.ratesNote}
                    </p>
                  </Reveal>
                )}
              </div>
            </div>
          </section>

          {/* 2. Positioning */}
          <section aria-labelledby="positioning-title" className={`${container} pb-24 md:pb-36`}>
            <Reveal className="max-w-3xl">
              <h2 id="positioning-title" className={`${sectionTitle} mb-6`}>
                {positioning.title}
              </h2>
              <p className={bodyCopy}>{positioning.copy}</p>
            </Reveal>
            <ul className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-6">
              {positioning.points.map((point, index) => (
                <li key={point.title}>
                  <Reveal delay={index * 0.08} className="h-full rounded-3xl border border-black/10 bg-white p-6 md:p-8">
                    <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow/30 text-black">
                      <Icon name={(["spark", "people", "pen"] as const)[index % 3]} />
                    </span>
                    <h3 className="mb-2 font-title text-xl md:text-2xl">{point.title}</h3>
                    <p className="font-body text-base leading-relaxed text-gray-700">{point.description}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
            <Reveal className="mt-6">
              <p className="flex items-start gap-3 rounded-2xl bg-black px-5 py-4 font-body text-base leading-relaxed text-white md:items-center md:px-6">
                <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow text-black md:mt-0">
                  <CheckIcon />
                </span>
                {positioning.note}
              </p>
            </Reveal>
          </section>

          {/* 4. What creators get */}
          <section aria-labelledby="benefits-title" className={`${container} pb-24 md:pb-36`}>
            <Reveal>
              <h2 id="benefits-title" className={`${sectionTitle} mb-12 max-w-3xl md:mb-16`}>
                {benefits.title}
              </h2>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {benefits.items.map((benefit, index) => {
                const accent = index === 0;
                return (
                  <li key={benefit.title}>
                    <Reveal
                      delay={index * 0.08}
                      className={`flex h-full flex-col rounded-3xl p-6 md:p-7 ${accent ? "bg-yellow" : "border border-black/10 bg-white"}`}
                    >
                      <span className={`mb-10 flex h-12 w-12 items-center justify-center rounded-2xl ${accent ? "bg-black text-yellow" : "bg-yellow/30"}`}>
                        <Icon name={(["chart", "bulb", "pen", "key"] as const)[index % 4]} />
                      </span>
                      <h3 className="mb-2 font-title text-xl md:text-2xl">{benefit.title}</h3>
                      <p className={`font-body text-base leading-relaxed ${accent ? "text-black" : "text-gray-700"}`}>
                        {benefit.description}
                      </p>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 5. What we're looking for */}
          <section aria-labelledby="looking-title" className={`${container} pb-24 md:pb-36`}>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <Reveal>
                <h2 id="looking-title" className={`${sectionTitle} mb-6`}>
                  {lookingFor.title}
                </h2>
                <p className={`${bodyCopy} mb-8`}>{lookingFor.copy}</p>
                <p className="inline-block rounded-2xl bg-yellow/30 px-5 py-4 font-body text-base leading-relaxed">
                  {lookingFor.note}
                </p>
              </Reveal>
              <ul className="grid gap-3 sm:grid-cols-2">
                {lookingFor.criteria.map((criterion, index) => {
                  const highlight = index === lookingFor.criteria.length - 1;
                  return (
                    <li key={criterion} className={highlight ? "sm:col-span-2" : undefined}>
                      <Reveal
                        delay={(index % 4) * 0.05}
                        className={`flex h-full items-center gap-3 rounded-2xl border px-5 py-4 font-body text-base font-bold md:py-5 ${
                          highlight ? "border-yellow bg-yellow text-black" : "border-black/10 bg-white"
                        }`}
                      >
                        <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${highlight ? "bg-black text-yellow" : "bg-black text-white"}`}>
                          <CheckIcon />
                        </span>
                        {criterion}
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* 6. TAAB apps */}
          <section aria-labelledby="apps-title" className={`${container} pb-24 md:pb-36`}>
            <Reveal className="max-w-3xl">
              <Eyebrow>TAAB apps</Eyebrow>
              <h2 id="apps-title" className={`${sectionTitle} mb-6`}>
                {apps.title}
              </h2>
              <p className={`${bodyCopy} mb-6`}>{apps.copy}</p>
              <p className="font-title text-xl leading-snug md:text-2xl">{apps.emphasis}</p>
            </Reveal>
            <div className="mt-12 space-y-6 md:mt-16 md:space-y-8">
              {STUDIO_APPS.map((app, index) => (
                <AppShowcaseCard key={app.id} app={app} reversed={index % 2 === 1} />
              ))}
            </div>
          </section>

          {/* 7. Application */}
          <section
            id={APPLY_SECTION_ID}
            ref={applyRef}
            aria-labelledby="apply-title"
            className="scroll-mt-4 px-3 pb-24 sm:px-5 md:pb-36"
          >
            <div className="relative mx-auto max-w-[1280px] overflow-clip rounded-[2rem] bg-black py-10 text-white md:rounded-[2.5rem] md:py-24">
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-yellow/25 blur-3xl" />
              <div className={`${container} relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16`}>
                <div className="lg:sticky lg:top-12 lg:self-start">
                  <Eyebrow inverted>Apply</Eyebrow>
                  <h2 id="apply-title" tabIndex={-1} className={`${sectionTitle} mb-4 focus:outline-none md:mb-6`}>
                    {application.title}
                  </h2>
                  <p className="font-body text-base leading-relaxed text-white/80 md:text-xl lg:mb-8">
                    {application.copy}
                  </p>
                  <ul className="hidden space-y-3 font-body text-base text-white/80 lg:block">
                    {["Takes about 3 minutes", "No follower minimum", "Paid on performance", application.recruitingNote].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow text-black">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <ApplicationForm content={content} onSubmitted={() => setSubmitted(true)} />
              </div>
            </div>
          </section>

          {/* 8. FAQ */}
          <section aria-labelledby="faq-title" className={`${container} pb-24 md:pb-36`}>
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
              <Reveal>
                <h2 id="faq-title" className={sectionTitle}>
                  {faq.title}
                </h2>
              </Reveal>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {faq.items.map((item) => (
                  <details key={item.question} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-title text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4 md:text-xl [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/15 transition-transform duration-200 group-open:rotate-45 group-open:bg-black group-open:text-white">
                        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M10 4v12M4 10h12" />
                        </svg>
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-6 pr-12 font-body text-base leading-relaxed text-gray-700 md:text-lg">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* 9. Final CTA */}
          <section ref={finalRef} aria-labelledby="final-title" className={`${container} relative pb-24 text-center md:pb-36`}>
            <Reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/itemTitle3.svg" alt="" aria-hidden="true" className="mx-auto mb-8 w-14 md:w-20" />
              <h2 id="final-title" className={`${sectionTitle} mx-auto mb-5 max-w-3xl`}>
                {finalCta.title}
              </h2>
              <p className={`${bodyCopy} mb-10`}>{finalCta.copy}</p>
              <ApplyButton onClick={handleApply("final_cta")} className="w-full sm:w-auto">
                {finalCta.cta}
              </ApplyButton>
            </Reveal>
          </section>
        </main>

        <Footer />

        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-[#f9f6f0]/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
            showStickyCta ? "translate-y-0" : "pointer-events-none translate-y-full"
          }`}
          aria-hidden={!showStickyCta}
        >
          <ApplyButton
            onClick={handleApply("sticky_mobile")}
            className="w-full"
            tabIndex={showStickyCta ? undefined : -1}
          >
            {application.cta}
          </ApplyButton>
        </div>
      </div>
    </MotionConfig>
  );
};
