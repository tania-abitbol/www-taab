import { ProgressBar } from "~/components/progressBar";
import "~/app/globals.css";

const TermsOfUseForBae = () => (
  <main>
    <div className="min-h-screen px-8 md:px-32 pt-12 max-w-5xl m-auto">
      <ProgressBar color="bg-yellow" bg="bg-yellow-lighter" />

      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center text-blue-700">
        Terms of Use for Bae
      </h1>
      <p className="text-lg mb-6 text-gray-700 leading-relaxed">
        Welcome to Bae. By using our app, you agree to comply with and be bound
        by the following terms and conditions. Please review the following terms
        carefully.
      </p>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          1. Subscription Overview
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Bae offers subscriptions that grant access to premium features and
          unlimited content. The available subscription plans are:
        </p>
        <ul className="list-disc pl-5 text-lg text-gray-700 leading-relaxed">
          <li>1-week subscription</li>
          <li>1-month subscription</li>
          <li>1-year subscription</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          2. Pricing and Promotions
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          All prices are subject to change without notice. Occasionally, we may
          offer promotional pricing as incentives or limited-time opportunities
          for qualifying purchases made during the promotional period. Due to
          the time-sensitive nature of these promotions, we cannot offer price
          protection or retroactive discounts or refunds for previous purchases
          in the event of a price reduction or promotional offering.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          3. Payment and Renewal
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Payment will be charged to your iTunes Account at the time of purchase
          confirmation. Subscriptions automatically renew unless auto-renew is
          turned off at least 24 hours before the end of the current period.
          Your account will be charged for renewal within 24 hours prior to the
          end of the current period at the cost of the chosen subscription
          package.
        </p>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Subscriptions may be managed by the user, and auto-renewal can be
          turned off by going to the user's iTunes Account Settings after
          purchase. No cancellation of the current subscription is allowed
          during the active subscription period.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-3 text-blue-600">
          4. Changes to the Terms of Use
        </h2>
        <p className="text-lg mb-3 text-gray-700 leading-relaxed">
          Bae reserves the right to modify these terms at any time. We will do
          our best to notify you of any significant changes, but it is your
          responsibility to review these terms periodically. Your continued use
          of the app after changes have been made will constitute your
          acceptance of the new terms.
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
        By using Bae, you agree to these Terms of Use. Thank you for choosing
        Bae!
      </p>
    </div>
  </main>
);

export default TermsOfUseForBae;
