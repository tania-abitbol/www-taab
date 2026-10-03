import { initializeFirebase, trackEvent } from "~/utils/firebase";

export const CREATOR_EVENTS = {
  pageView: "creator_page_view",
  ctaClick: "creator_cta_click",
  applicationClick: "creator_application_click",
  applicationStepCompleted: "creator_application_step_completed",
  applicationSubmitted: "creator_application_submitted",
  applicationError: "creator_application_error",
} as const;

export type CreatorEventName =
  (typeof CREATOR_EVENTS)[keyof typeof CREATOR_EVENTS];

export const trackCreatorEvent = (
  eventName: CreatorEventName,
  params: Record<string, string> = {}
) => {
  initializeFirebase();
  trackEvent(eventName, params);
};
