"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initializeFirebase, trackEvent } from "~/utils/firebase";

export const ClientTracking = () => {
  const pathname = usePathname();
  const isFirstPageRef = useRef(true);

  useEffect(() => {
    const { analytics } = initializeFirebase();

    // Firebase Analytics already sends a page_view when it initializes, so only
    // client-side navigations need a manual one.
    if (isFirstPageRef.current) {
      isFirstPageRef.current = false;
      return;
    }

    if (!analytics) return;

    trackEvent("page_view", { page_path: pathname });
  }, [pathname]);

  return null;
};
