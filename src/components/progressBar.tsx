"use client";

import { useState, useEffect } from "react";

type ProgressBarProps = {
  color: string;
  bg: string;
};

export const ProgressBar = ({ color, bg }: ProgressBarProps) => {
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll =
        document.documentElement.scrollTop || document.body.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollTop(scrolled);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`w-full ${bg} h-2 fixed top-0 left-0 z-50`}>
      <div
        className={`${color} h-2 ${
          scrollTop === 100 ? "" : "rounded-tr-xl rounded-br-xl"
        }`}
        style={{ width: `${scrollTop}%` }}
      />
    </div>
  );
};
