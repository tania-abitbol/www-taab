"use client";

import { useId, useMemo, useState } from "react";

import type { CreatorEarnings } from "~/config/creatorProgram";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const estimateMonthlyEarnings = (
  earnings: CreatorEarnings,
  viewsPerVideo: number,
  videosPerMonth: number
) => ((viewsPerVideo / 1000) * earnings.ratePer1000Views + (earnings.basePerVideo ?? 0)) * videosPerMonth;

export const EarningsEstimator = ({ earnings }: { earnings: CreatorEarnings }) => {
  const sliderId = useId();
  const [views, setViews] = useState(earnings.viewPresets[Math.floor(earnings.viewPresets.length / 2)]);
  const [videos, setVideos] = useState(Math.min(4, earnings.maxVideosPerMonth));

  const currency = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: earnings.currency, maximumFractionDigits: 0 }),
    [earnings.currency]
  );
  const rateFormat = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: earnings.currency, maximumFractionDigits: 2 }),
    [earnings.currency]
  );
  const monthly = estimateMonthlyEarnings(earnings, views, videos);

  return (
    <div className="rounded-3xl bg-white p-6 text-black md:p-10">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-12">
        <div className="space-y-8">
          <fieldset>
            <legend className="mb-3 font-body text-sm font-bold">Average views per video</legend>
            <div className="flex flex-wrap gap-2">
              {earnings.viewPresets.map((preset) => (
                <label key={preset} className="cursor-pointer">
                  <input
                    type="radio"
                    name="estimator-views"
                    value={preset}
                    checked={views === preset}
                    onChange={() => setViews(preset)}
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
              Videos per month
              <span className="font-title text-2xl">{videos}</span>
            </label>
            <input
              id={sliderId}
              type="range"
              min={1}
              max={earnings.maxVideosPerMonth}
              value={videos}
              onChange={(event) => setVideos(Number(event.target.value))}
              className="w-full accent-black"
            />
          </div>
        </div>
        <div className="rounded-2xl bg-black p-6 text-white md:p-8" aria-live="polite">
          <p className="mb-2 font-body text-sm text-white/70">Estimated monthly earnings</p>
          <p className="font-title text-5xl tracking-tight text-yellow md:text-6xl">{currency.format(monthly)}</p>
          <p className="mt-3 font-body text-sm text-white/70">
            {videos} video{videos > 1 ? "s" : ""} × {compact.format(views)} views
          </p>
        </div>
      </div>
      <p className="mt-6 font-body text-xs leading-relaxed text-gray-700">
        Estimate based on our current creator rate of {rateFormat.format(earnings.ratePer1000Views)} per 1,000 views
        {earnings.basePerVideo ? ` plus ${rateFormat.format(earnings.basePerVideo)} per video` : ""}. Actual earnings depend on how your videos perform and are not guaranteed.
      </p>
    </div>
  );
};
