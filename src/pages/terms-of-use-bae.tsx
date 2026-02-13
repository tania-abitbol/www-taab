import { ProgressBar } from "~/components/progressBar";
import "~/app/globals.css";

const TermsOfUseForBae = () => (
  <main>
    <div className="min-h-screen px-8 md:px-32 pt-12 pb-16 max-w-5xl m-auto">
      <ProgressBar color="bg-yellow" bg="bg-yellow-lighter" />

      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center text-blue-700">
        Terms of Use
      </h1>
      <p className="text-sm text-center text-gray-500 mb-8">
        Last updated: March 27, 2026
      </p>
      <p className="text-lg mb-8 text-gray-700 leading-relaxed">
        By using the Bae app, you agree to these Terms of Use.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">1. Description</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          Bae is a mobile application providing interactive questions and games
          for couples.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          2. Subscriptions
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Bae offers auto-renewable subscriptions.
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed ml-4 space-y-2">
          <li>
            Payment will be charged to your Apple ID account at confirmation of
            purchase.
          </li>
          <li>
            Subscriptions automatically renew unless canceled at least 24 hours
            before the end of the current period.
          </li>
          <li>
            Your account will be charged for renewal within 24 hours prior to
            the end of the current period.
          </li>
          <li>
            You can manage and cancel your subscriptions in your Apple account
            settings.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">3. Free Trial</h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          If a free trial is offered:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed ml-4 space-y-2">
          <li>
            It will automatically convert into a paid subscription unless
            canceled before the trial ends.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">4. No Refunds</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          All purchases are handled by Apple. Refund requests must be made
          directly through Apple.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">5. Usage</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          You agree to use the app for personal, non-commercial purposes only.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          6. Limitation of Liability
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We are not responsible for any damages resulting from the use of the
          app.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">7. Changes</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We may update these Terms at any time.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          8. Apple Standard EULA
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          This app is also governed by Apple's standard End User License
          Agreement:{" "}
          <a
            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:text-blue-700 transition-colors"
          >
            https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">9. Contact</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          For any questions, contact:{" "}
          <a
            href="mailto:contact@taabapps.com"
            className="text-blue-500 underline hover:text-blue-700 transition-colors"
          >
            contact@taabapps.com
          </a>
        </p>
      </section>
    </div>
  </main>
);

export default TermsOfUseForBae;
