"use client";

import { ArrowIcon, Eyebrow } from "~/components/site/primitives";
import type { CreatorProgramContent } from "~/config/creatorProgram";

import { COUNTRY_PICK_STORAGE_KEY } from "./tracking";

type PickerProgram = Pick<CreatorProgramContent, "country" | "locale" | "path" | "picker">;

/**
 * Shared entry link (e.g. a bio) that sends creators to their country's page.
 * Order and query string are decided on the server so the list never jumps
 * after hydration, and utm params are already on the link in the first HTML.
 */
export const CountryPicker = ({
  programs,
  suggested,
  query,
}: {
  programs: PickerProgram[];
  suggested: string | null;
  query: string;
}) => {
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
          {programs.map((program) => (
            <li key={program.country}>
              <a
                href={`${program.path}${query}`}
                hrefLang={program.locale}
                lang={program.locale}
                onClick={() => {
                  try {
                    sessionStorage.setItem(
                      COUNTRY_PICK_STORAGE_KEY,
                      JSON.stringify({
                        program: program.country,
                        suggested: String(program.country === suggested),
                        ts: Date.now(),
                      })
                    );
                  } catch {
                    // The destination page only logs the click when this write succeeds.
                  }
                }}
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
            </li>
          ))}
        </ul>
        <p className="mt-8 font-body text-sm text-gray-700">
          More countries soon. <span lang="fr">D&apos;autres pays bientôt.</span>
        </p>
      </div>
    </main>
  );
};
