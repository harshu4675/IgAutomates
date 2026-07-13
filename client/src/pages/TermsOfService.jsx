import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Logo from "@/components/common/Logo";

export default function TermsOfService() {
  const lastUpdated = "January 2025";

  return (
    <>
      <Helmet>
        <title>Terms of Service | IGAutomates</title>
      </Helmet>

      <div className="min-h-screen bg-white">
        <header className="border-b border-border-light bg-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="default" />
            <Link
              to="/"
              className="text-sm font-jakarta font-semibold text-primary-mid hover:text-primary-dark transition-colors"
            >
              Back to App
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-4xl font-manrope font-extrabold text-primary-darkest mb-3">
              Terms of Service
            </h1>
            <p className="text-sm text-text-muted font-jakarta">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 font-jakarta text-text-primary">
            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-sm leading-relaxed">
                By accessing and using IGAutomates, you accept and agree to be
                bound by the terms and provisions of this agreement. If you do
                not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                2. Service Description
              </h2>
              <p className="text-sm leading-relaxed">
                IGAutomates is an Instagram DM automation service that allows
                users to automatically send direct messages when specific
                keywords are used in comments on their Instagram Business posts.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                3. User Responsibilities
              </h2>
              <p className="text-sm leading-relaxed mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Comply with Instagram&apos;s Platform Policies and Community
                  Guidelines
                </li>
                <li>Not use the service for spam or unsolicited messaging</li>
                <li>Respect user privacy and data protection laws</li>
                <li>Provide accurate account information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Only automate messages you have legal right to send</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                4. Prohibited Uses
              </h2>
              <p className="text-sm leading-relaxed mb-2">
                You may not use IGAutomates to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Send spam or unwanted commercial messages</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any laws or regulations</li>
                <li>Distribute malware or malicious content</li>
                <li>Impersonate others or misrepresent identity</li>
                <li>Attempt to reverse engineer our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                5. Account Termination
              </h2>
              <p className="text-sm leading-relaxed">
                We reserve the right to suspend or terminate your account for
                violations of these terms, Instagram Platform Policies, or for
                any other reason at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                6. Instagram Platform Compliance
              </h2>
              <p className="text-sm leading-relaxed">
                IGAutomates operates within Instagram&apos;s API terms of
                service. Instagram may change its API or policies at any time,
                which could affect our service functionality. We are not
                responsible for changes made by Instagram/Meta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                7. Service Availability
              </h2>
              <p className="text-sm leading-relaxed">
                We strive to provide 99% uptime but do not guarantee
                uninterrupted service. Maintenance, updates, or technical issues
                may cause temporary unavailability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                8. Limitation of Liability
              </h2>
              <p className="text-sm leading-relaxed">
                IGAutomates is provided &quot;as is&quot; without warranties of
                any kind. We are not liable for any indirect, incidental, or
                consequential damages arising from your use of the service,
                including but not limited to account bans from Instagram due to
                misuse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                9. Free Service
              </h2>
              <p className="text-sm leading-relaxed">
                IGAutomates is currently offered as a free service. We reserve
                the right to introduce paid plans in the future with prior
                notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                10. Changes to Terms
              </h2>
              <p className="text-sm leading-relaxed">
                We may modify these terms at any time. Continued use of the
                service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                11. Contact
              </h2>
              <p className="text-sm leading-relaxed">
                For questions about these Terms, contact us at:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-surface-cream border border-border-light">
                <p className="text-sm">
                  <strong>Email:</strong> harshu6278@gmail.com
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border-light text-center">
            <p className="text-xs text-text-muted font-jakarta">
              © 2026 IGAutomates. All rights reserved.
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <Link
                to="/privacy-policy"
                className="text-xs text-primary-mid hover:text-primary-dark font-jakarta font-semibold transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-text-muted">·</span>
              <Link
                to="/"
                className="text-xs text-primary-mid hover:text-primary-dark font-jakarta font-semibold transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
