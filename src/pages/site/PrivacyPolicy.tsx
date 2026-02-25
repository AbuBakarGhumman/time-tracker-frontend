// src/pages/PrivacyPolicy.tsx
/**
 * Privacy Policy Page — TimeTrack Pro
 * Styled to match Intro theme (gradient hero + clean legal content cards).
 */

import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy: React.FC = () => {
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
              <span className="text-sm font-medium">Privacy Policy</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
              Your Data,
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {" "}
                Handled Responsibly
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
              This Privacy Policy explains how TimeTrack Pro collects, uses, and protects information when
              you use our platform. By using the service, you agree to the practices described below.
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">1. Information We Collect</h2>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>
                    <span className="font-semibold text-slate-800">Account Data:</span> name, email, role,
                    organization details.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Work Data:</span> check-ins/check-outs,
                    time entries, tasks/projects, attendance records.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Usage Data:</span> device and log data
                    used to improve security and performance.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">2. How We Use Information</h2>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Provide core functionality (attendance, time tracking, analytics).</li>
                  <li>Maintain security, prevent abuse, and troubleshoot issues.</li>
                  <li>Improve product experience and performance.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">3. Data Sharing</h2>
                <p className="text-slate-600 leading-relaxed">
                  We do not sell your data. We may share limited information with trusted service providers
                  (e.g., hosting, analytics) solely to operate the platform and only under appropriate
                  contractual safeguards.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">4. Data Retention</h2>
                <p className="text-slate-600 leading-relaxed">
                  We retain data for as long as your account is active or as needed to provide the service.
                  You may request deletion subject to legal and operational requirements.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">5. Security</h2>
                <p className="text-slate-600 leading-relaxed">
                  We apply reasonable technical and organizational measures designed to protect your data.
                  No system is 100% secure, so we also encourage strong passwords and access controls.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">6. Your Choices</h2>
                <ul className="list-disc pl-6 text-slate-600 space-y-2">
                  <li>Access and update profile information.</li>
                  <li>Manage organization permissions and roles.</li>
                  <li>Request export or deletion of your data (where applicable).</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">7. Contact</h2>
                <p className="text-slate-600 leading-relaxed">
                  For privacy questions or requests, contact your organization administrator or your
                  platform support team.
                </p>
              </div>
            </div>
          </div>

          {/* Small note card */}
          <div className="mt-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="text-slate-900 font-bold mb-1">Note</div>
            <div className="text-slate-600 text-sm">
              This is a general policy template for your app UI. If you need jurisdiction-specific legal
              compliance (GDPR/CCPA/etc.), you should have a lawyer review and tailor it.
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

export default PrivacyPolicy;
