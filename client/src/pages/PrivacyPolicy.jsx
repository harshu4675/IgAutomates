import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Logo from "@/components/common/Logo";

export default function PrivacyPolicy() {
  const lastUpdated = "January 2025";

  return (
    <>
      <Helmet>
        <title>Privacy Policy | IGAutomates</title>
        <meta
          name="description"
          content="IGAutomates Privacy Policy - How we collect, use, and protect your data"
        />
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
              Privacy Policy
            </h1>
            <p className="text-sm text-text-muted font-jakarta">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 font-jakarta text-text-primary">
            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                1. Introduction
              </h2>
              <p className="text-sm leading-relaxed">
                Welcome to IGAutomates (&quot;we,&quot; &quot;our,&quot; or
                &quot;us&quot;). This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our
                Instagram DM automation service. Please read this privacy policy
                carefully.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                2. Information We Collect
              </h2>
              <p className="text-sm leading-relaxed mb-3">
                We collect the following types of information:
              </p>

              <h3 className="text-base font-manrope font-bold text-primary-darkest mb-2 mt-4">
                2.1 Account Information
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Name and email address (during registration)</li>
                <li>Encrypted password</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="text-base font-manrope font-bold text-primary-darkest mb-2 mt-4">
                2.2 Instagram Data
              </h3>
              <p className="text-sm leading-relaxed mb-2">
                When you connect your Instagram Business account, we access:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Instagram username and profile picture</li>
                <li>Follower count and post count</li>
                <li>Your Instagram posts (for campaign creation)</li>
                <li>Comments on your posts (for automation triggers)</li>
                <li>OAuth access tokens (stored securely)</li>
              </ul>

              <h3 className="text-base font-manrope font-bold text-primary-darkest mb-2 mt-4">
                2.3 Automation Data
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Campaign configurations (keywords, messages)</li>
                <li>Comments that trigger automations</li>
                <li>Direct messages sent through our service</li>
                <li>Analytics and performance metrics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                3. How We Use Your Information
              </h2>
              <p className="text-sm leading-relaxed mb-2">
                We use collected information to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Provide and maintain our automation service</li>
                <li>Send automated Instagram DMs on your behalf</li>
                <li>Track campaign performance and analytics</li>
                <li>Improve and personalize your experience</li>
                <li>Communicate with you about our service</li>
                <li>Ensure compliance with Instagram platform policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                4. Instagram Platform Compliance
              </h2>
              <p className="text-sm leading-relaxed">
                IGAutomates uses the official Instagram Graph API and complies
                with all Instagram Platform Policies. We do not:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>Store your Instagram password</li>
                <li>Post content without your explicit configuration</li>
                <li>Use unauthorized scraping methods</li>
                <li>Sell your Instagram data to third parties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-sm leading-relaxed mb-2">
                We do not sell, trade, or rent your personal information. We may
                share information with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Meta/Instagram:</strong> Required for API integration
                  and automated messaging
                </li>
                <li>
                  <strong>Service Providers:</strong> Hosting (Render, Netlify)
                  and database (MongoDB Atlas) providers
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                6. Data Security
              </h2>
              <p className="text-sm leading-relaxed">
                We implement industry-standard security measures to protect your
                data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>Password encryption using bcrypt</li>
                <li>JWT-based authentication</li>
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure storage of OAuth tokens</li>
                <li>Regular security audits and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                7. Data Retention
              </h2>
              <p className="text-sm leading-relaxed">
                We retain your data as long as your account is active or as
                needed to provide services. You can request deletion of your
                account and associated data at any time by contacting us or
                using the account deletion feature in Settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                8. Your Rights
              </h2>
              <p className="text-sm leading-relaxed mb-2">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Disconnect your Instagram account at any time</li>
                <li>Export your data</li>
                <li>Opt-out of communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                9. Cookies and Tracking
              </h2>
              <p className="text-sm leading-relaxed">
                We use minimal cookies for authentication and session
                management. We do not use tracking cookies for advertising
                purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-sm leading-relaxed">
                IGAutomates is not intended for users under 13 years of age. We
                do not knowingly collect data from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                11. Third-Party Services
              </h2>
              <p className="text-sm leading-relaxed mb-2">
                Our service integrates with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Meta/Facebook Graph API:</strong> For Instagram
                  integration
                </li>
                <li>
                  <strong>MongoDB Atlas:</strong> For secure data storage
                </li>
                <li>
                  <strong>Render:</strong> For backend hosting
                </li>
                <li>
                  <strong>Netlify:</strong> For frontend hosting
                </li>
              </ul>
              <p className="text-sm leading-relaxed mt-2">
                Please review their respective privacy policies for more
                information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                12. Changes to This Policy
              </h2>
              <p className="text-sm leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                13. Contact Us
              </h2>
              <p className="text-sm leading-relaxed">
                If you have questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-surface-cream border border-border-light">
                <p className="text-sm">
                  <strong>Email:</strong> harshu6278@gmail.com
                </p>
                <p className="text-sm mt-1">
                  <strong>Response Time:</strong> Within 48 hours
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                14. Data Deletion Request
              </h2>
              <p className="text-sm leading-relaxed mb-2">
                To request deletion of your data:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Log in to your IGAutomates account</li>
                <li>Go to Settings</li>
                <li>
                  Click &quot;Delete Account&quot; (or email us at
                  harshu6278@gmail.com)
                </li>
                <li>All your data will be deleted within 30 days</li>
              </ol>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border-light text-center">
            <p className="text-xs text-text-muted font-jakarta">
              © 2026 IGAutomates. All rights reserved.
            </p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <Link
                to="/terms"
                className="text-xs text-primary-mid hover:text-primary-dark font-jakarta font-semibold transition-colors"
              >
                Terms of Service
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
