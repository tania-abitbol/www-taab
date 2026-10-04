"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export const container = "mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12";
export const sectionTitle =
  "font-title text-[2.25rem] leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl";
export const bodyCopy = "font-body text-lg leading-relaxed text-gray-700 md:text-xl";

export const Reveal = ({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "0px 0px -60px 0px" }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const Eyebrow = ({ children, inverted }: { children: ReactNode; inverted?: boolean }) => (
  <p
    className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-body text-xs font-bold uppercase tracking-[0.16em] ${
      inverted ? "border-white/20 text-white" : "border-black/15 text-black"
    }`}
  >
    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-yellow" />
    {children}
  </p>
);

export const PhoneShot = ({
  src,
  className = "",
  alt = "",
  eager,
}: {
  src: string;
  className?: string;
  alt?: string;
  eager?: boolean;
}) => (
  <div
    className={`overflow-hidden rounded-[1.75rem] border-[6px] border-black bg-black shadow-[0_30px_60px_-25px_rgba(0,0,0,0.45)] ${className}`}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
  </div>
);

export const ArrowIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M3 10a.75.75 0 0 1 .75-.75h10.64l-3.97-3.97a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.97-3.97H3.75A.75.75 0 0 1 3 10Z" />
  </svg>
);

export const CheckIcon = ({ className = "" }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 shrink-0 ${className}`}>
    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z" />
  </svg>
);

export const AppStoreBadge = ({
  href,
  appName,
  onClick,
  src = "/images/apple-store-logo.svg",
  altTemplate = "Download {app} on the App Store",
}: {
  href: string;
  appName: string;
  onClick?: () => void;
  src?: string;
  /** `{app}` is replaced with the app name. */
  altTemplate?: string;
}) => (
  <a
    href={href}
    onClick={onClick}
    className="inline-block rounded-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt={altTemplate.replace("{app}", appName)}
      width={150}
      height={50}
      className="h-12 w-auto"
    />
  </a>
);
