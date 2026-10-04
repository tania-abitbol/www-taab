import { initializeFirebase, trackEvent } from "~/utils/firebase";

export const CREATOR_EVENTS = {
  pageView: "creator_page_view",
  ctaClick: "creator_cta_click",
  applicationClick: "creator_application_click",
  applicationStart: "creator_application_start",
  applicationStepView: "creator_application_step_view",
  applicationStepCompleted: "creator_application_step_completed",
  applicationValidationError: "creator_application_validation_error",
  applicationBack: "creator_application_back",
  applicationSubmitted: "creator_application_submitted",
  applicationError: "creator_application_error",
  faqOpen: "creator_faq_open",
  stickyCtaShown: "creator_sticky_cta_shown",
  estimatorChange: "creator_estimator_change",
  appStoreClick: "creator_app_store_click",
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
