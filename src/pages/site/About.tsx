// src/pages/About.tsx
/**
 * About Page — TimeTrack Pro
 * Modern marketing-style "About" page aligned with Intro theme (gradient hero + card sections).
 */

import React from "react";
import { Link } from "react-router-dom";

const About: React.FC = () => {
  return (
    <div className="w-full bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">About TimeTrack Pro</span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Built for Modern Teams
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Who Value Time & Clarity
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-300 leading-relaxed">
              TimeTrack Pro helps organizations unify attendance and time tracking in a single workflow—
              so teams spend less time managing tools and more time delivering outcomes.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-lg font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
              >
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <Link
                to="/"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-2">Our Mission</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Make time tracking effortless</h2>
            <p className="text-slate-600 leading-relaxed">
              We simplify the daily routines of attendance, task tracking, and reporting—so teams can focus
              on work, not admin.
            </p>
          </div>

          {/* What we solve */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-2">What We Solve</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No more tool switching</h2>
            <p className="text-slate-600 leading-relaxed">
              Attendance, time entries, analytics, and team controls—built into one clean workflow with a
              consistent experience across the app.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
            <div className="text-sm font-semibold text-slate-500 mb-2">Values</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Clarity. Trust. Speed.</h2>
            <p className="text-slate-600 leading-relaxed">
              We prioritize accurate reporting, strong permissions, and a fast UX—so your team can rely on
              the data every day.
            </p>
          </div>
        </div>

        {/* Highlights */}
        <div className="max-w-7xl mx-auto mt-10 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border-2 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-slate-900 font-bold text-lg mb-1">Attendance that stays simple</div>
              <div className="text-slate-600 text-sm">
                One-click check-in/out, visibility across teams, and clean reporting.
              </div>
            </div>
            <div>
              <div className="text-slate-900 font-bold text-lg mb-1">Time entries that make sense</div>
              <div className="text-slate-600 text-sm">
                Task-level logging, project structure, and billable tracking in one flow.
              </div>
            </div>
            <div>
              <div className="text-slate-900 font-bold text-lg mb-1">Analytics you can act on</div>
              <div className="text-slate-600 text-sm">
                Productivity dashboards, exports, and insights for operational decisions.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CSS Animations */}
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

export default About;
