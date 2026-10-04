"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";

import type { CreatorUiCopy } from "~/config/creatorProgram";


const VIEWS_TARGET = 128_400;

const RailIcon = ({ path, label }: { path: string; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d={path} />
      </svg>
    </span>
    <span className="font-body text-[10px] font-bold">{label}</span>
  </div>
);

/** Illustrative TikTok-style post: the visual hook of the creators hero. */
export const CreatorPhoneMock = ({
  copy,
  locale,
}: {
  copy: CreatorUiCopy["phoneMock"];
  locale: string;
}) => {
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const count = (value: number) => new Intl.NumberFormat(locale).format(value);
  const reduceMotion = useReducedMotion();
  const [views, setViews] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setViews(VIEWS_TARGET);
      return;
    }
    const controls = animate(0, VIEWS_TARGET, {
      duration: 2.2,
      delay: 0.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setViews(Math.round(value)),
    });
    return () => controls.stop();
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="relative mx-auto h-[500px] w-full max-w-[380px] sm:h-[540px] lg:h-[600px] lg:max-w-[440px]">
      <div className="absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow/40 blur-3xl" />

      <motion.div
        className="absolute left-[21%] top-[1%] aspect-[1206/2622] w-[58%]"
        initial={{ opacity: 0, y: 30, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] border-[7px] border-black bg-black shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={copy.screen} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 top-0 flex justify-center gap-4 bg-gradient-to-b from-black/60 to-transparent pb-8 pt-4 font-body text-xs font-bold text-white">
            <span className="text-white/60">{copy.following}</span>
            <span className="border-b-2 border-white pb-1">{copy.forYou}</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-5 pt-20 text-white">
            <p className="mb-1 font-body text-sm font-bold">{copy.handle}</p>
            <p className="pr-12 font-body text-xs leading-snug">{copy.caption}</p>
          </div>
          <div className="absolute bottom-20 right-2.5 flex flex-col gap-3 text-white">
            <RailIcon label={compact.format(18_200)} path="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2 0 3.6 1.1 4.3 2.6h2c.7-1.5 2.3-2.6 4.3-2.6 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21Z" />
            <RailIcon label={count(1_204)} path="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            <RailIcon label={count(3_118)} path="M14 4l7 7-7 7v-4c-5 0-8.5 1.6-11 5 1-5 4-10 11-11V4Z" />
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute left-0 top-[16%] z-10 rounded-2xl bg-white px-4 py-3 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="mb-0.5 flex items-center gap-1.5 font-body text-xs text-gray-700">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-[#1A9E5C]" fill="currentColor">
            <path d="M10 3l6 7h-4v7H8v-7H4l6-7Z" />
          </svg>
          {copy.views}
        </p>
        <p className="font-title text-3xl tabular-nums tracking-tight">{compact.format(views)}</p>
      </motion.div>

      <motion.div
        className="absolute bottom-[12%] right-0 z-10 flex items-center gap-3 rounded-2xl bg-black px-4 py-3 text-white shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 2.2 }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow text-lg">💸</span>
        <span>
          <span className="block font-body text-sm font-bold">{copy.payoutTitle}</span>
          <span className="block font-body text-xs text-white/70">{copy.payoutSubtitle}</span>
        </span>
      </motion.div>

      <motion.div
        className="absolute bottom-[34%] left-[2%] z-10 rounded-full bg-yellow px-4 py-2 font-body text-xs font-bold text-black shadow-[0_12px_30px_-15px_rgba(0,0,0,0.4)]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        {copy.chip}
      </motion.div>
    </div>
  );
};
