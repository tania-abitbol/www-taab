"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { ArrowIcon, Eyebrow } from "~/components/site/primitives";
import type { CreatorProgramContent } from "~/config/creatorProgram";

import { CREATOR_EVENTS, trackCreatorEvent } from "./tracking";

type PickerProgram = Pick<CreatorProgramContent, "country" | "locale" | "path" | "picker">;

/** Shared entry link (e.g. TikTok bio) that sends creators to their country's page. */
export const CountryPicker = ({ programs }: { programs: PickerProgram[] }) => {
  const [ordered, setOrdered] = useState(programs);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(window.location.search);
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    const match = programs.find((program) =>
      languages.some((language) => language.toLowerCase().startsWith(program.locale))
    );
    if (!match) return;
    setSuggested(match.country);
    setOrdered([match, ...programs.filter((program) => program.country !== match.country)]);
  }, [programs]);

  return (
    <main className="flex min-h-[100svh] flex-col px-5 pb-10 pt-8 sm:px-8">
      <a href="/" className="mx-auto w-full max-w-[560px] font-title text-3xl tracking-tight">
        TAAB<span className="text-yellow">.</span>
      </a>

      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center py-12">
        <Eyebrow>TAAB Creator Network</Eyebrow>
        <h1 className="mb-4 font-title text-[2.6rem] leading-[1.05] tracking-tight sm:text-6xl">
          Post TikToks. <span className="rotating-background mt-1">Get paid.</span>
        </h1>
        <p lang="fr" className="mb-10 font-title text-xl text-gray-700 sm:text-2xl">
          Poste des TikToks. Fais-toi payer.
        </p>

        <p className="mb-4 font-body text-base font-bold">
          Where are you based? <span lang="fr" className="font-normal text-gray-700">· Tu es où ?</span>
        </p>
        <ul className="space-y-3">
          {ordered.map((program, index) => (
            <motion.li
              key={program.country}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <a
                href={`${program.path}${query}`}
                hrefLang={program.locale}
                lang={program.locale}
                onClick={() =>
                  trackCreatorEvent(CREATOR_EVENTS.countryPicked, {
                    program: program.country,
                    suggested: String(program.country === suggested),
                  })
                }
                className={`group flex items-center gap-4 rounded-2xl border p-5 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:p-6 ${
                  program.country === suggested ? "border-black bg-black text-white" : "border-black/15 bg-white"
                }`}
              >
                <span aria-hidden="true" className="text-4xl leading-none">
                  {program.picker.flag}
                </span>
                <span className="flex-1">
                  <span className="block font-title text-xl sm:text-2xl">{program.picker.countryName}</span>
                  <span
                    className={`block font-body text-sm ${program.country === suggested ? "text-white/70" : "text-gray-700"}`}
                  >
                    {program.picker.cta}
                  </span>
                </span>
                <ArrowIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.li>
          ))}
        </ul>
        <p className="mt-8 font-body text-sm text-gray-700">
          More countries soon. <span lang="fr">D&apos;autres pays bientôt.</span>
        </p>
      </div>
    </main>
  );
};
