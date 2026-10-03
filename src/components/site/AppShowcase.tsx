"use client";

import type { StudioApp } from "~/config/apps";

import { AppStoreBadge, PhoneShot, Reveal } from "./primitives";

const themes = {
  light: {
    panel: "bg-gradient-to-br from-[#FFE6EF] via-[#FFD3E2] to-[#FFB8CF] text-black",
    copy: "text-black/75",
    glow: "bg-white/60",
  },
  dark: {
    panel: "bg-gradient-to-br from-[#14163F] via-[#0B0C2A] to-[#05061A] text-white",
    copy: "text-white/75",
    glow: "bg-[#6D6BFF]/30",
  },
};

export const AppShowcaseCard = ({
  app,
  headingLevel = "h3",
  reversed,
  onStoreClick,
}: {
  app: StudioApp;
  headingLevel?: "h2" | "h3";
  reversed?: boolean;
  onStoreClick?: (app: StudioApp) => void;
}) => {
  const theme = themes[app.theme];
  const Heading = headingLevel;

  return (
    <article
      className={`relative overflow-clip rounded-[2rem] md:rounded-[2.5rem] ${theme.panel}`}
      aria-labelledby={`app-${app.id}-title`}
    >
      <div aria-hidden="true" className={`pointer-events-none absolute -top-24 h-80 w-80 rounded-full blur-3xl ${theme.glow} ${reversed ? "-left-20" : "-right-20"}`} />
      <div className="relative grid items-center gap-10 px-6 pb-0 pt-10 sm:px-10 md:grid-cols-2 md:gap-6 md:px-14 md:py-16">
        <Reveal className={reversed ? "md:order-2" : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={app.logo} alt="" width={64} height={64} className="mb-6 h-14 w-14 rounded-2xl shadow-lg md:h-16 md:w-16" />
          <Heading id={`app-${app.id}-title`} className="mb-3 font-title text-3xl tracking-tight md:text-5xl">
            {app.name}
          </Heading>
          <p className="mb-4 font-title text-lg leading-snug md:text-2xl">{app.tagline}</p>
          <p className={`mb-8 max-w-md font-body text-base leading-relaxed md:text-lg ${theme.copy}`}>
            {app.description}
          </p>
          <AppStoreBadge href={app.iosLink} appName={app.name} onClick={() => onStoreClick?.(app)} />
        </Reveal>

        <div
          aria-hidden="true"
          className={`relative mx-auto h-[300px] w-full max-w-[420px] sm:h-[380px] md:h-[440px] ${reversed ? "md:order-1" : ""}`}
        >
          <PhoneShot src={app.screenshots[1]} className="absolute bottom-[-12%] left-[2%] h-[86%] w-[36%] -rotate-[8deg] md:bottom-[4%]" />
          <PhoneShot src={app.screenshots[2]} className="absolute bottom-[-12%] right-[2%] h-[86%] w-[36%] rotate-[8deg] md:bottom-[4%]" />
          <PhoneShot src={app.screenshots[0]} className="absolute bottom-[-6%] left-1/2 z-10 h-[96%] w-[40%] -translate-x-1/2 md:bottom-[8%]" />
        </div>
      </div>
    </article>
  );
};
