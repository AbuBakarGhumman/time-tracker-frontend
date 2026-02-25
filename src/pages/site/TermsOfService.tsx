// src/pages/TermsOfService.tsx
/**
 * Terms of Service Page — TimeTrack Pro
 * Styled to match Intro theme (gradient hero + readable legal sections).
 */

import React from "react";
import { Link } from "react-router-dom";

const TermsOfService: React.FC = () => {
  const lastUpdated = "February 10, 2026";

  return (
    <div className="w-full bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Terms of Service</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
              Clear Terms for a
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                Trusted Platform
              </span>
            </h1>

            <p className="text-slate-300 text-lg">
              Last updated: <span className="text-white font-semibold">{lastUpdated}</span>
            </p>

            <div className="mt-8 flex justify-center">
              <Link
                to="/"
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-all duration-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <p className="text-slate-600 leading-relaxed mb-6">
              These Terms of Service govern your use of TimeTrack Pro. By accessing or using the platform,
              you agree to these terms.
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">1. Accounts & Access</h2>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>You are responsible for maintaining the confidentiality of account credentials.</li>
                  <li>You must ensure only authorized users access your organization workspace.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">2. Acceptable Use</h2>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Do not misuse the service (attempt unauthorized access, disrupt, or exploit).</li>
                  <li>Do not upload unlawful content or violate others’ rights.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">3. Organization Data</h2>
                <p className="text-slate-600 leading-relaxed">
                  Your organization owns its data (attendance records, time entries, projects, reports).
                  You grant us permission to process this data solely to provide and improve the service.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">4. Subscriptions & Billing</h2>
                <p className="text-slate-600 leading-relaxed">
                  If you subscribe to a paid plan, fees and billing cycles will be disclosed at checkout
                  (or via your agreement). Trials may convert to paid plans unless canceled.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">5. Service Availability</h2>
                <p className="text-slate-600 leading-relaxed">
                  We aim for reliable uptime, but occasional maintenance or outages may occur. We may update
                  features to improve performance, security, or usability.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">6. Disclaimers</h2>
                <p className="text-slate-600 leading-relaxed">
                  The service is provided “as is” and “as available.” To the maximum extent permitted by
                  law, we disclaim warranties of merchantability, fitness, and non-infringement.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">7. Limitation of Liability</h2>
                <p className="text-slate-600 leading-relaxed">
                  To the extent permitted by law, we are not liable for indirect, incidental, or
                  consequential damages, or loss of profits, data, or business opportunities.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">8. Termination</h2>
                <p className="text-slate-600 leading-relaxed">
                  You may stop using the service at any time. We may suspend or terminate access if there
                  is a serious violation of these terms or a security risk.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">9. Changes to Terms</h2>
                <p className="text-slate-600 leading-relaxed">
                  We may update these terms periodically. Continued use after an update means you accept
                  the revised terms.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="text-slate-900 font-bold mb-1">Tip</div>
            <div className="text-slate-600 text-sm">
              If you want this to be fully production/legal-ready, share your company name, support email,
              and billing rules (trial length, refunds), and I’ll tailor the terms accordingly.
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default TermsOfService;
