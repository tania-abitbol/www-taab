import { ProgressBar } from "~/components/progressBar";
import "~/app/globals.css";

const PrivacyPolicyForBae = () => (
  <main>
    <div className="min-h-screen px-8 md:px-32 pt-12 pb-16 max-w-5xl m-auto">
      <ProgressBar color="bg-yellow" bg="bg-yellow-lighter" />

      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center text-blue-700">
        Privacy Policy
      </h1>
      <p className="text-sm text-center text-gray-500 mb-8">
        Last updated: March 27, 2026
      </p>
      <p className="text-lg mb-8 text-gray-700 leading-relaxed">
        This Privacy Policy describes how Bae ("we", "our", or "us") collects,
        uses, and protects your information when you use our mobile application.
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          1. Information We Collect
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We may collect the following information:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed ml-4 space-y-2">
          <li>Usage data (app interactions, features used)</li>
          <li>Device information (device type, OS version)</li>
          <li>Purchase information (subscriptions handled by Apple)</li>
        </ul>
        <p className="text-lg mt-4 text-gray-700 leading-relaxed">
          We do <strong>NOT</strong> collect personally identifiable information
          unless explicitly provided.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          2. How We Use Information
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We use collected data to:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed ml-4 space-y-2">
          <li>Improve the app experience</li>
          <li>Analyze usage and performance</li>
          <li>Provide customer support</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">3. Purchases</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          All purchases are processed by Apple. We do not store or have access
          to your payment information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          4. Third-Party Services
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We may use third-party services such as:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 leading-relaxed ml-4 space-y-2">
          <li>Firebase (analytics)</li>
          <li>RevenueCat (subscription management)</li>
        </ul>
        <p className="text-lg mt-4 text-gray-700 leading-relaxed">
          These services may collect anonymized data in accordance with their
          own privacy policies.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          5. Data Security
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We take reasonable measures to protect your data but cannot guarantee
          absolute security.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">
          6. Your Rights
        </h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          You may stop all data collection by uninstalling the app.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">7. Changes</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          We may update this policy. Changes will be posted on this page.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-blue-600">8. Contact</h2>
        <p className="text-lg text-gray-700 leading-relaxed">
          If you have any questions, contact us at:{" "}
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

export default PrivacyPolicyForBae;
