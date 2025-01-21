import { ProgressBar } from "~/components/progressBar";
import "~/app/globals.css";

const PrivacyPolicyTruthOrTruth = () => (
  <main>
    <div className="min-h-screen px-8 md:px-32 pt-12 max-w-5xl m-auto">
      <ProgressBar color="bg-yellow" bg="bg-yellow-lighter" />

      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center text-blue-700">
        Privacy Policy Truth or Truth
      </h1>
      <p className="text-lg mb-6 text-gray-700 leading-relaxed">
        Truth or Truth, (hereinafter "we", "our", or "us") respects the privacy
        of its users (hereinafter "user", "you", or "your") and is committed to
        protecting the personal data collected when you use our drinking game
        application (hereinafter "the Application"). This Privacy Policy
        explains how we collect, use, disclose, and secure your information when
        you use our Application.
      </p>
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          1. Information Collection
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We collect information that does not personally identify you unless
          you consent to being tracked. The Application may collect
          usage-related information such as features used and time spent on the
          Application through Google Analytics to better understand user
          behavior.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          2. Use of Information
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          The collected information may be used to:
        </p>
        <ul className="list-disc pl-5 text-lg text-gray-700 leading-relaxed">
          <li>Provide, maintain, and improve the Application.</li>
        </ul>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We do not use the data for personalizing the user experience or for
          marketing purposes.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          3. Information Sharing
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We share your information with third parties only in the following
          cases:
        </p>
        <ul className="list-disc pl-5 text-lg text-gray-700 leading-relaxed">
          <li>With your consent.</li>
          <li>
            With Google Analytics and AdMob for analytics and advertising
            purposes.
          </li>
        </ul>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We do not have specific agreements with service providers regarding
          user data processing.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          4. Data Security
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We do not collect personal data requiring security measures.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          5. Your Rights
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          You have the right to access, correct, or delete your personal data,
          or object to its processing by contacting us via the contact details
          provided in this policy. You can also opt-out of data collection by
          refusing the tracking pop-up at the start.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          6. Changes to the Privacy Policy
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          We may update this Privacy Policy annually. We do not notify users of
          changes; it is the user's responsibility to review the policy
          periodically.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">7. Contact Us</h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          If you have any questions or concerns about this Privacy Policy,
          please contact us at{" "}
          <a
            href="mailto:contact@taabapps.com"
            className="text-blue-500 underline"
          >
            contact@taabapps.com
          </a>
          .
        </p>
      </section>
      <p className="text-lg mb-3 text-gray-700 leading-relaxed">
        By using the Application, you consent to the collection, use,
        disclosure, and protection of your information as described in this
        Privacy Policy.
      </p>
    </div>
  </main>
);

export default PrivacyPolicyTruthOrTruth;
