"use client";

import { MotionConfig, motion } from "framer-motion";

import { Footer } from "~/components/Footer";
import { ProgressBar } from "~/components/progressBar";
import { AppShowcaseCard } from "~/components/site/AppShowcase";
import {
  ArrowIcon,
  Eyebrow,
  PhoneShot,
  Reveal,
  bodyCopy,
  container,
  sectionTitle,
} from "~/components/site/primitives";
import { CONTACT_EMAIL, STUDIO_APPS, StudioApp } from "~/config/apps";
import { trackEvent } from "~/utils/firebase";

const STATS = [
  { value: "1M", label: "Downloads" },
  { value: "50", label: "Countries reached" },
  { value: "1500", label: "Positive reviews" },
  { value: "5", label: "New apps in under a year" },
];

const MARKETS = [
  { name: "United States", x: "18%", y: "44%" },
  { name: "Canada", x: "20%", y: "29%" },
  { name: "Mexico", x: "16%", y: "58%" },
  { name: "United Kingdom", x: "48.5%", y: "32%" },
  { name: "France", x: "50%", y: "39%" },
  { name: "Spain", x: "47.5%", y: "44%" },
];

const MARQUEE_WORDS = ["Date nights", "Game nights", "Couples", "Friends", "Party games", "Confessions", "Road trips", "Sleepovers"];

const navLinks = [
  { label: "Apps", href: "#apps" },
  { label: "Numbers", href: "#numbers" },
  { label: "Contact", href: "#contact" },
];

const buttonBase =
  "group inline-flex items-center justify-center gap-2 rounded-xl font-body font-bold transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0";

const trackStoreClick = (app: StudioApp) =>
  trackEvent("app_store_click", { app: app.id, page: "home" });

const Marquee = () => (
  <div className="overflow-hidden border-y border-black bg-black py-4 text-white md:py-5" aria-hidden="true">
    <div className="flex w-max animate-marquee whitespace-nowrap font-title text-2xl md:text-3xl">
      {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, index) => (
        <span key={`${word}-${index}`} className="flex items-center gap-10 pr-10">
          {word}
          <span className="text-yellow">✦</span>
        </span>
      ))}
    </div>
  </div>
);

export const HomeLanding = () => (
  <MotionConfig reducedMotion="user">
    <div className="overflow-x-clip">
      <ProgressBar color="bg-yellow" bg="bg-yellow-lighter" />

      <header className={`${container} flex items-center justify-between pt-8 md:pt-10`}>
        <a href="/" className="rounded font-title text-3xl tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4">
          TAAB<span className="text-yellow">.</span>
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="rounded-xl px-4 py-2 font-body text-base font-bold text-black/70 transition-colors hover:bg-black/5 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="/creators" className={`${buttonBase} h-10 bg-black px-4 text-sm text-white focus-visible:ring-black`}>
            For creators
            <ArrowIcon />
          </a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section aria-labelledby="home-title" className={`${container} relative pb-16 pt-14 md:pb-28 md:pt-20`}>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
            <div className="relative z-10">
              <Eyebrow>Mobile entertainment studio</Eyebrow>
              <h1 id="home-title" className="isolate mb-7 font-title text-[2.9rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-[5.25rem]">
                Apps that bring people{" "}
                <span className="rotating-background mt-2 whitespace-nowrap">together.</span>
              </h1>
              <p className="mb-9 max-w-xl font-body text-lg leading-relaxed text-black md:text-xl">
                TAAB builds entertainment apps for couples and friends: games that get people talking, laughing and spending real time together.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="#apps" className={`${buttonBase} h-14 bg-black px-7 text-base text-white focus-visible:ring-black md:text-lg`}>
                  Discover our apps
                  <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a href={`mailto:${CONTACT_EMAIL}`} className={`${buttonBase} h-14 border border-black/15 bg-white px-7 text-base text-black focus-visible:ring-black md:text-lg`}>
                  Get in touch
                </a>
              </div>
            </div>

            <div aria-hidden="true" className="relative mx-auto h-[400px] w-full max-w-[460px] sm:h-[480px] lg:h-[560px] lg:max-w-none">
              <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow/35 blur-3xl" />
              <motion.div
                className="absolute left-[2%] top-[14%] h-[72%] w-[38%]"
                initial={{ opacity: 0, y: 40, rotate: -14 }}
                animate={{ opacity: 1, y: 0, rotate: -9 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <PhoneShot eager src="/images/bae/image_5.jpg" className="h-full w-full" />
              </motion.div>
              <motion.div
                className="absolute right-[2%] top-[14%] h-[72%] w-[38%]"
                initial={{ opacity: 0, y: 40, rotate: 14 }}
                animate={{ opacity: 1, y: 0, rotate: 9 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <PhoneShot eager src="/images/vérité/image_2.jpg" className="h-full w-full" />
              </motion.div>
              <motion.div
                className="absolute left-[29%] top-[4%] z-10 h-[84%] w-[42%]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <PhoneShot eager src="/images/vérité/image_1.jpg" className="h-full w-full" />
              </motion.div>
              <motion.div
                className="absolute bottom-[6%] left-0 z-20 rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <p className="font-title text-2xl">1M+</p>
                <p className="font-body text-sm text-gray-700">downloads</p>
              </motion.div>
              <motion.div
                className="absolute right-0 top-[2%] z-20 rounded-2xl bg-black px-4 py-3 text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <p className="font-title text-2xl text-yellow">50+</p>
                <p className="font-body text-sm text-white/75">countries</p>
              </motion.div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/itemTitle3.svg" alt="" className="absolute -bottom-2 right-[8%] z-20 w-14 md:w-20" />
            </div>
          </div>
        </section>

        <Marquee />

        {/* Apps */}
        <section id="apps" aria-labelledby="apps-title" className="scroll-mt-6 py-24 md:py-36">
          <div className={container}>
            <Reveal className="mb-12 max-w-3xl md:mb-16">
              <Eyebrow>Our apps</Eyebrow>
              <h2 id="apps-title" className={`${sectionTitle} mb-6`}>
                Made for the moments that matter.
              </h2>
              <p className={bodyCopy}>
                Every app we ship is built around one idea: putting the phone in the middle of the table, not between people.
              </p>
            </Reveal>
            <div className="space-y-6 md:space-y-8">
              {STUDIO_APPS.map((app, index) => (
                <AppShowcaseCard key={app.id} app={app} reversed={index % 2 === 1} onStoreClick={trackStoreClick} />
              ))}
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section id="numbers" aria-labelledby="numbers-title" className="scroll-mt-6 px-3 pb-24 sm:px-5 md:pb-36">
          <div className="relative mx-auto max-w-[1280px] overflow-clip rounded-[2rem] bg-black py-16 text-white md:rounded-[2.5rem] md:py-24">
            <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-yellow/20 blur-3xl" />
            <div className={`${container} relative`}>
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
                <Reveal>
                  <Eyebrow inverted>The numbers</Eyebrow>
                  <h2 id="numbers-title" className={`${sectionTitle} mb-6`}>
                    Played around the world.
                  </h2>
                  <p className="mb-10 font-body text-lg leading-relaxed text-white/75 md:text-xl">
                    Our apps are used across English, Spanish and French-speaking countries. We&apos;re open about our numbers, and proud of the time people spend together through our games.
                  </p>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-10">
                    {STATS.map((stat) => (
                      <div key={stat.label} className="flex flex-col-reverse border-t border-white/15 pt-5">
                        <dt className="mt-2 font-body text-sm text-white/70 md:text-base">{stat.label}</dt>
                        <dd className="font-title text-5xl tracking-tight md:text-6xl">
                          {stat.value}
                          <span className="text-yellow">+</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
                <Reveal delay={0.1}>
                  <div>
                    <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/map.svg" alt="" aria-hidden="true" className="w-full opacity-60 invert" />
                    {MARKETS.map((market, index) => (
                      <span
                        key={market.name}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: market.x, top: market.y }}
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 animate-ping rounded-full bg-yellow/60"
                          style={{ animationDelay: `${index * 0.35}s`, animationDuration: "2.4s" }}
                        />
                        <span aria-hidden="true" className="relative block h-3 w-3 rounded-full bg-yellow ring-4 ring-yellow/25 md:h-4 md:w-4" />
                      </span>
                    ))}
                    </div>
                    <ul className="mt-8 flex flex-wrap gap-2" aria-label="Top markets">
                      {MARKETS.map((market) => (
                        <li key={market.name} className="rounded-full border border-white/15 px-3 py-1.5 font-body text-sm text-white/80">
                          {market.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* Creators */}
        <section aria-labelledby="creators-title" className={`${container} pb-24 md:pb-36`}>
          <Reveal>
            <div className="relative overflow-clip rounded-[2rem] bg-yellow px-6 py-12 md:rounded-[2.5rem] md:px-14 md:py-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/itemTitle1.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-4 -top-4 w-28 opacity-90 brightness-0 invert md:w-40" />
              <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
                <div>
                  <p className="mb-4 font-body text-xs font-bold uppercase tracking-[0.16em]">Etha Creator Network</p>
                  <h2 id="creators-title" className="mb-4 font-title text-4xl leading-[1.05] tracking-tight md:text-6xl">
                    Make TikToks? Create with us.
                  </h2>
                  <p className="max-w-xl font-body text-lg leading-relaxed md:text-xl">
                    We&apos;re building a small network of US creators. Keep your style, keep your audience, get rewarded when your content performs.
                  </p>
                </div>
                <div className="md:text-right">
                  <a href="/creators" className={`${buttonBase} h-14 w-full bg-black px-7 text-base text-white focus-visible:ring-black sm:w-auto md:text-lg`}>
                    Become a creator
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Contact */}
        <section id="contact" aria-labelledby="contact-title" className={`${container} scroll-mt-6 pb-24 md:pb-36`}>
          <Reveal className="grid gap-8 border-t border-black/10 pt-16 md:grid-cols-[1.4fr_1fr] md:items-end md:pt-24">
            <h2 id="contact-title" className={sectionTitle}>
              A request? A question? An idea<span className="text-yellow">?</span>
            </h2>
            <div className="md:text-right">
              <p className="mb-5 font-body text-lg text-gray-700">Write to us anytime.</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className={`${buttonBase} h-14 w-full bg-black px-7 text-base text-white focus-visible:ring-black sm:w-auto md:text-lg`}>
                {CONTACT_EMAIL}
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  </MotionConfig>
);
