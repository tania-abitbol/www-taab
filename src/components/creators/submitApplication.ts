import { initializeFirebase } from "~/utils/firebase";
import {
  CREATOR_APPLICATIONS_COLLECTION,
  CreatorApplicationDraft,
  buildApplicationPayload,
} from "~/config/creatorApplication";

let emulatorConnected = false;

/** Firestore is loaded on demand so it stays out of the landing page bundle. */
export const submitCreatorApplication = async (
  draft: CreatorApplicationDraft
) => {
  const { getFirestore, connectFirestoreEmulator, collection, addDoc, serverTimestamp } =
    await import("firebase/firestore");
  const { app } = initializeFirebase();
  const db = getFirestore(app);

  const emulatorHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;
  if (emulatorHost && !emulatorConnected) {
    const [host, port] = emulatorHost.split(":");
    connectFirestoreEmulator(db, host, Number(port));
    emulatorConnected = true;
  }

  await addDoc(collection(db, CREATOR_APPLICATIONS_COLLECTION), {
    ...buildApplicationPayload(draft),
    createdAt: serverTimestamp(),
  });
};
