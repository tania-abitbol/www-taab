"use client";

import { useEffect } from "react";

import { initializeFirebase, trackEvent } from "~/utils/firebase";

const SCROLL_MILESTONES = [25, 50, 75, 100];

export const trackPageEvent = (eventName: string, params: Record<string, string>) => {
  initializeFirebase();
  trackEvent(eventName, params);
};

/**
 * Sends `section_view` once per `<section aria-labelledby>` that becomes
 * visible and `scroll_depth` once per milestone, both tagged with `page`.
 */
export const usePageAnalytics = (page: string) => {
  useEffect(() => {
    const seenSections = new Set<string>();
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[aria-labelledby]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target.getAttribute("aria-labelledby")?.replace(/-title$/, "");
          if (!entry.isIntersecting || !section || seenSections.has(section)) return;
          seenSections.add(section);
          trackPageEvent("section_view", { page, section });
          observer.unobserve(entry.target);
        });
      },
      // Tall sections never reach an area threshold, so count a section as seen
      // once it crosses the middle of the viewport.
      { rootMargin: "0px 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));

    const reached = new Set<number>();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
        SCROLL_MILESTONES.forEach((milestone) => {
          if (percent >= milestone - 1 && !reached.has(milestone)) {
            reached.add(milestone);
            trackPageEvent("scroll_depth", { page, percent: String(milestone) });
          }
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [page]);
};
