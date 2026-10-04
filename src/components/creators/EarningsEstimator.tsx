"use client";

import { useId, useMemo, useState } from "react";

import type { CreatorEarnings, CreatorUiCopy } from "~/config/creatorProgram";

export const estimateMonthlyEarnings = (
  earnings: CreatorEarnings,
  viewsPerVideo: number,
  videosPerMonth: number
) => ((viewsPerVideo / 1000) * earnings.ratePer1000Views + (earnings.basePerVideo ?? 0)) * videosPerMonth;

const fill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);

export const EarningsEstimator = ({
  earnings,
  copy,
  locale,
  onChange,
}: {
  earnings: CreatorEarnings;
  copy: CreatorUiCopy["estimator"];
  locale: string;
  onChange?: (viewsPerVideo: number, videosPerMonth: number) => void;
}) => {
  const sliderId = useId();
  const [views, setViews] = useState(earnings.viewPresets[Math.floor(earnings.viewPresets.length / 2)]);
  const [videos, setVideos] = useState(Math.min(4, earnings.maxVideosPerMonth));

  const { compact, currency, rateFormat } = useMemo(
    () => ({
      compact: new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
      currency: new Intl.NumberFormat(locale, {
        style: "currency",
        currency: earnings.currency,
        maximumFractionDigits: 0,
      }),
      rateFormat: new Intl.NumberFormat(locale, {
        style: "currency",
        currency: earnings.currency,
        maximumFractionDigits: 2,
      }),
    }),
    [locale, earnings.currency]
  );
  const monthly = estimateMonthlyEarnings(earnings, views, videos);

  return (
    <div className="rounded-3xl bg-white p-6 text-black md:p-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-12">
        <div className="space-y-8">
          <fieldset>
            <legend className="mb-3 font-body text-sm font-bold">{copy.viewsLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {earnings.viewPresets.map((preset) => (
                <label key={preset} className="cursor-pointer">
                  <input
                    type="radio"
                    name="estimator-views"
                    value={preset}
                    checked={views === preset}
                    onChange={() => {
                      setViews(preset);
                      onChange?.(preset, videos);
                    }}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-11 items-center rounded-full border border-gray-300 px-4 font-body text-sm font-bold transition-colors hover:border-black peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2">
                    {compact.format(preset)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={sliderId} className="mb-3 flex items-baseline justify-between font-body text-sm font-bold">
              {copy.videosLabel}
              <span className="font-title text-2xl">{videos}</span>
            </label>
            <input
              id={sliderId}
              type="range"
              min={1}
              max={earnings.maxVideosPerMonth}
              value={videos}
              onChange={(event) => setVideos(Number(event.target.value))}
              onPointerUp={() => onChange?.(views, videos)}
              onKeyUp={() => onChange?.(views, videos)}
              className="w-full accent-black"
            />
          </div>
        </div>
        <div className="rounded-2xl bg-black p-6 text-white md:p-8" aria-live="polite">
          <p className="mb-2 font-body text-sm text-white/70">{copy.resultLabel}</p>
          <p className="font-title text-5xl tracking-tight text-yellow md:text-6xl">{currency.format(monthly)}</p>
          <p className="mt-3 font-body text-sm text-white/70">
            {fill(copy.breakdown, { videos: String(videos), views: compact.format(views) })}
          </p>
        </div>
      </div>
      <p className="mt-6 font-body text-xs leading-relaxed text-gray-700">
        {fill(copy.disclaimer, { rate: rateFormat.format(earnings.ratePer1000Views) })}
      </p>
    </div>
  );
};
