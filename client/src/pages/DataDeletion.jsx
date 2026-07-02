import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Logo from "@/components/common/Logo";
import { HiOutlineEnvelope } from "react-icons/hi2";

export default function DataDeletion() {
  return (
    <>
      <Helmet>
        <title>Data Deletion | InstaFlow</title>
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

        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-manrope font-extrabold text-primary-darkest mb-3">
              Data Deletion Instructions
            </h1>
            <p className="text-sm text-text-muted font-jakarta">
              How to permanently delete your InstaFlow data
            </p>
          </div>

          <div className="space-y-8 font-jakarta text-text-primary">
            <section className="p-6 rounded-2xl bg-surface-cream border border-border-light">
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                Method 1: Delete Via Account Settings
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Log in to your InstaFlow account</li>
                <li>
                  Navigate to <strong>Settings</strong>
                </li>
                <li>Scroll to the &quot;Danger Zone&quot; section</li>
                <li>
                  Click <strong>&quot;Delete Account&quot;</strong>
                </li>
                <li>Confirm your decision</li>
                <li>
                  All your data will be permanently deleted within 24 hours
                </li>
              </ol>
            </section>

            <section className="p-6 rounded-2xl bg-surface-cream border border-border-light">
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                Method 2: Email Request
              </h2>
              <p className="text-sm leading-relaxed mb-4">
                Send an email to our support team with the subject &quot;Data
                Deletion Request&quot; and include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                <li>Your registered email address</li>
                <li>Your Instagram username (if connected)</li>
                <li>Reason for deletion (optional)</li>
              </ul>
              <div className="p-4 rounded-xl bg-white border border-border-light flex items-center gap-3">
                <HiOutlineEnvelope className="w-5 h-5 text-primary-mid" />
                <a
                  href="mailto:harshu6278@gmail.com?subject=Data Deletion Request"
                  className="text-sm font-jakarta font-semibold text-primary-dark hover:text-primary-darkest"
                >
                  harshu6278@gmail.com
                </a>
              </div>
              <p className="text-xs text-text-muted mt-3">
                We will process your request within 48 hours and confirm via
                email once complete.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                What Gets Deleted
              </h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your account information (name, email, password)</li>
                <li>All connected Instagram account data</li>
                <li>All campaigns and automations</li>
                <li>All analytics and event logs</li>
                <li>All stored OAuth tokens</li>
                <li>All processed comment history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-manrope font-bold text-primary-darkest mb-3">
                Data Retention
              </h2>
              <p className="text-sm leading-relaxed">
                After deletion, your data is permanently removed from our active
                systems within 24 hours. Backup systems are cleared within 30
                days. Some minimal information may be retained for legal
                compliance purposes only.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border-light text-center">
            <p className="text-xs text-text-muted font-jakarta">
              © {new Date().getFullYear()} InstaFlow. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
