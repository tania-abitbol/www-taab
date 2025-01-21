import "~/app/globals.css";

const TermsOfUseTruthOrTruth = () => (
  <main>
    <div className="min-h-screen px-8 md:px-32 pt-12 max-w-5xl m-auto">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center text-blue-700">
        Terms of Use for Truth Or Truth
      </h1>
      <p className="text-lg mb-6 text-gray-700 leading-relaxed">
        Welcome to Truth Or Truth. By using our app, you agree to comply with
        and be bound by the following terms and conditions. Please review these
        terms carefully before subscribing or using our services.
      </p>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          1. Auto-Renewable Subscriptions
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Truth Or Truth offers the following subscription plans:
        </p>
        <ul className="list-disc pl-5 text-lg text-gray-700 leading-relaxed">
          <li>Monthly Subscription: €4.99 per month</li>
          <li>Annual Subscription: €11.99 per year</li>
        </ul>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Subscriptions automatically renew at the end of each billing period
          unless canceled at least 24 hours before the current period ends. Your
          iTunes account will be charged for renewal within 24 hours prior to
          the end of the current period.
        </p>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Subscriptions can be managed by the user, and auto-renewal can be
          turned off through your Apple ID account settings. No refunds will be
          issued for unused portions of a subscription period.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          2. Privacy Policy
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Your privacy is important to us. Please review our Privacy Policy at
          the following link:
          <a
            href="https://taab.app/privacy-policy-forhowmuch"
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          .
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          3. Subscription Cancellation
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          To cancel your subscription:
        </p>
        <ol className="list-decimal pl-5 text-lg text-gray-700 leading-relaxed">
          <li>Go to your Apple ID account settings.</li>
          <li>
            Select "Subscriptions" and choose the subscription you want to
            manage.
          </li>
          <li>Click "Cancel Subscription."</li>
        </ol>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          After cancellation, you will continue to have access to premium
          features until the end of the paid period.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          4. General Terms
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          By using this app, you agree not to misuse the app or use it for any
          unlawful purposes. Access to premium content is only available to
          users with an active subscription. We reserve the right to modify
          subscription terms or pricing with prior notice to users.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">5. Contact Us</h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          If you have any questions or concerns regarding these Terms of Use,
          please feel free to contact us at{" "}
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
        By using Truth Or Truth, you agree to these Terms of Use. Thank you for
        choosing Truth Or Truth!
      </p>
    </div>
  </main>
);

export default TermsOfUseTruthOrTruth;
