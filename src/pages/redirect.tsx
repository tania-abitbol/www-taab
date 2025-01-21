"use client";

import { useEffect } from "react";
import { initializeFirebase, trackEvent } from "../utils/firebase";

const RedirectPage = () => {
  useEffect(() => {
    initializeFirebase();
    trackEvent("redirect");

    // Soumettre le formulaire automatiquement après une courte pause
    const timer = setTimeout(() => {
      const form = document.getElementById("redirectForm") as HTMLFormElement;
      form?.submit();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Redirection...</h1>
      <p>Vous allez être redirigé vers l'application dans quelques secondes.</p>
      <p>
        Si vous n'êtes pas redirigé,{" "}
        <a href="https://apps.apple.com/fr/app/v%C3%A9rit%C3%A9-ou-v%C3%A9rit%C3%A9/id6480046704">
          cliquez ici
        </a>
        .
      </p>

      <form
        id="redirectForm"
        action="https://apps.apple.com/fr/app/v%C3%A9rit%C3%A9-ou-v%C3%A9rit%C3%A9/id6480046704"
        method="get"
      >
        <noscript>
          <button type="submit">Cliquez ici pour continuer</button>
        </noscript>
      </form>
    </div>
  );
};

export default RedirectPage;
