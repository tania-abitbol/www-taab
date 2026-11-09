// firebaseClient.ts
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, logEvent } from "firebase/analytics";

let app: FirebaseApp | undefined;
let analytics: Analytics | undefined;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const initializeFirebase = (): {
  app: FirebaseApp;
  analytics?: Analytics;
} => {
  if (!app) {
    app = initializeApp(firebaseConfig);

    if (typeof window !== "undefined" && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }
  }
  return { app, analytics };
};

export const trackEvent = (
  eventName: string,
  eventParams: Record<string, any> = {}
) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Firebase Analytics] Event logged: ${eventName}`, eventParams);
  } else if (analytics) {
    logEvent(analytics, eventName, eventParams);
  }
};

export { app, analytics };
