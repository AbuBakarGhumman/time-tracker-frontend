// src/pages/site/About.tsx
import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBranding } from "../../context/BrandingContext";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const rv = (inView: boolean, extra = "") =>
  `transition-all duration-700 ease-out ${extra} ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`;
const rl = (inView: boolean, extra = "") =>
  `transition-all duration-700 ease-out ${extra} ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"}`;
const rr = (inView: boolean, extra = "") =>
  `transition-all duration-700 ease-out ${extra} ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-14"}`;
const rs = (inView: boolean, extra = "") =>
  `transition-all duration-700 ease-out ${extra} ${inView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`;

const CheckIcon = () => (
  <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
    <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  </span>
);

const ArrowRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const About: React.FC = () => {
  const { brandName } = useBranding();

  const problemRef      = useInView();
  const solutionRef     = useInView();
  const benefitsRef     = useInView();
  const testimonialsRef = useInView();
  const statsRef        = useInView();
  const ctaRef          = useInView();

  return (
    <div className="w-full bg-white">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO — centered, bold mission statement
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 pt-24 pb-20 lg:pt-32 lg:pb-24">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-300/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <div className="relative max-w-5xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full border border-blue-200 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-700">About {brandName}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-slate-900">
            Time is your team's most
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              valuable resource.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            Most teams lose hours every week to manual timesheets, disconnected tools, and
            guesswork. {brandName} was built to fix exactly that — giving you complete
            visibility into where time actually goes, so your team can focus on work
            that matters.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl text-base font-semibold hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight />
            </Link>
            <Link
              to="/home"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl text-base font-semibold hover:border-slate-300 hover:shadow-md transition-all duration-300"
            >
              See the Platform
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. WIDE MISSION PHOTO
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden h-[420px] lg:h-[500px]">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=80"
          alt="Team collaboration"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-slate-900/65" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 lg:px-8 max-w-3xl mx-auto">
          <svg className="w-10 h-10 text-blue-300/60 mb-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed italic">
            We built {brandName} because we couldn't find a tool that treated time the
            way professionals actually think about it — not just as a number, but as the
            context for everything your team creates.
          </p>
          <p className="mt-6 text-sm font-semibold text-blue-300 tracking-wide uppercase">
            — The {brandName} Team
          </p>
        </div>

        {/* Floating stats */}
        <div className="absolute bottom-6 left-6 sm:left-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 hidden sm:block">
          <p className="text-xs text-white/60 mb-1">Organizations trust us</p>
          <p className="text-2xl font-bold text-white">500+</p>
        </div>
        <div className="absolute bottom-6 right-6 sm:right-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 hidden sm:block">
          <p className="text-xs text-white/60 mb-1">Hours tracked</p>
          <p className="text-2xl font-bold text-white">50M+</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. THE PROBLEM
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={problemRef.ref} className={rv(problemRef.inView, "text-center mb-16")}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-sm font-semibold border border-red-100 mb-5">
              The Problem
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5">
              The tools you're using are{" "}
              <span className="text-red-500">costing you more than they save.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Spreadsheets, fragmented apps, and manual processes don't just waste time —
              they create errors, blind spots, and decisions made on guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                delay: "delay-0",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
                grad: "from-red-500 to-red-600",
                bg: "bg-red-50", border: "border-red-100",
                label: "Pain Point #1",
                title: "Scattered, disconnected tools",
                desc: "Attendance in one app, time logs in another, projects in a third. No single source of truth — syncing data costs hours every week and still produces errors.",
              },
              {
                delay: "delay-100",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
                grad: "from-orange-500 to-orange-600",
                bg: "bg-orange-50", border: "border-orange-100",
                label: "Pain Point #2",
                title: "Manual entry, constant errors",
                desc: "Employees fill in timesheets from memory at week's end. Managers approve data they can't verify. Inaccurate records flow into payroll and reporting.",
              },
              {
                delay: "delay-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
                grad: "from-amber-500 to-amber-600",
                bg: "bg-amber-50", border: "border-amber-100",
                label: "Pain Point #3",
                title: "Zero real-time visibility",
                desc: "Which project is overrunning? Who's behind? Leaders can't answer without digging through stale reports — by the time they know, it's already too late.",
              },
            ].map((p) => (
              <div key={p.title} className={rv(problemRef.inView, `${p.bg} rounded-2xl p-8 border ${p.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${p.delay}`)}>
                <div className={`w-12 h-12 bg-gradient-to-br ${p.grad} rounded-xl flex items-center justify-center mb-5 shadow-md`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {p.icon}
                  </svg>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{p.label}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{p.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. OUR SOLUTION — feature list + real image
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={solutionRef.ref} className={rv(solutionRef.inView, "text-center mb-16")}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100 mb-5">
              Our Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5">
              We rebuilt the category{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">from scratch.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {brandName} brings attendance, time tracking, and project management into
              one unified workspace — designed for both individuals and enterprise teams.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: feature list */}
            <div className={rl(solutionRef.inView, "space-y-6")}>
              {[
                {
                  grad: "from-blue-500 to-blue-600",
                  title: "Smart Attendance, automated",
                  desc: "Employees check in with one click. Managers see live presence data, late arrivals flagged automatically, and daily summaries without lifting a finger.",
                  points: ["One-click check-in / check-out", "Real-time team presence dashboard", "Automated daily & monthly reports"],
                },
                {
                  grad: "from-violet-500 to-violet-600",
                  title: "Time that means something",
                  desc: "Every logged hour is linked to a task, project, and person — not just a raw number. Billable and non-billable time tracked down to the minute.",
                  points: ["Project & task-level time entries", "Billable vs non-billable separation", "Weekly timesheets with approval flows"],
                },
                {
                  grad: "from-teal-500 to-teal-600",
                  title: "Projects delivered, not just planned",
                  desc: "Create tasks, assign owners, set deadlines, and track progress — all linked to the actual time being spent, so budgets never quietly overrun.",
                  points: ["Kanban boards with priority levels", "Time-linked project budgets", "Progress tracking and milestone alerts"],
                },
              ].map((f) => (
                <div key={f.title} className={rv(solutionRef.inView, "flex gap-5 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300")}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${f.grad} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">{f.desc}</p>
                    <ul className="space-y-1.5">
                      {f.points.map((pt) => (
                        <li key={pt} className="flex items-center gap-2 text-sm text-slate-500">
                          <CheckIcon />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: real photo with floating dashboard card */}
            <div className={rr(solutionRef.inView, "delay-150")}>
              <div className="relative pt-6 pb-10 pl-2 pr-6">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80"
                    alt="Team using platform"
                    className="w-full h-[480px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-transparent" />
                </div>

                {/* Floating live dashboard card */}
                <div className="absolute bottom-2 left-0 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 min-w-[230px] z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Team Dashboard</p>
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Sarah K.", status: "Checked in", time: "9h 12m", dot: "bg-green-400" },
                      { name: "Ahmed R.", status: "On break",   time: "6h 45m", dot: "bg-amber-400" },
                      { name: "Priya M.", status: "Checked in", time: "8h 03m", dot: "bg-green-400" },
                    ].map((u) => (
                      <div key={u.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
                          <span className="text-slate-700 font-medium">{u.name}</span>
                        </div>
                        <span className="text-slate-400 tabular-nums">{u.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating weekly hours metric */}
                <div className="absolute top-0 right-0 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3 z-10">
                  <p className="text-[11px] text-slate-500 mb-1">Team hours this week</p>
                  <p className="text-2xl font-bold text-slate-900">142h 30m</p>
                  <p className="text-[11px] text-green-600 font-medium mt-0.5">↑ 8% vs last week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. BENEFITS — dark gradient, redesigned cards
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 text-white py-24 lg:py-32">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div ref={benefitsRef.ref} className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className={rv(benefitsRef.inView, "text-center mb-16")}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 text-white rounded-full text-sm font-medium border border-white/20 mb-5">
              <span className="text-blue-200">✦</span> Why It Matters
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-5">
              What changes when time tracking{" "}
              <span className="text-blue-200">actually works.</span>
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              When attendance, time, and projects are connected — everyone wins, from individual
              contributors to leadership.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                delay: "delay-0",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                title: "Save hours every week",
                desc: "No more chasing timesheets or reconciling spreadsheets. Automated tracking cuts admin time by up to 80% for managers and HR.",
              },
              {
                delay: "delay-100",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                title: "Decide with real data",
                desc: "Live dashboards replace gut feelings with facts. Spot project overruns and team bottlenecks before they escalate into problems.",
              },
              {
                delay: "delay-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
                title: "Accurate payroll, every time",
                desc: "Time entries feed directly into auditable records. No more end-of-month disputes, corrections, or spreadsheet reconciliation.",
              },
              {
                delay: "delay-0",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
                title: "Works for any team size",
                desc: "Freelancers track billable hours for clients. Enterprise teams manage hundreds of employees. Same platform, same simplicity.",
              },
              {
                delay: "delay-100",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
                title: "Role-based, by default",
                desc: "Admin, HR, Manager, Team Lead, and Employee roles built in. Everyone sees exactly what they need, nothing they shouldn't.",
              },
              {
                delay: "delay-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                title: "Live in under 10 minutes",
                desc: "No complex setup, no IT team, no lengthy onboarding. Invite your team, configure your workspace, and start tracking from day one.",
              },
            ].map((b) => (
              <div key={b.title} className={rv(benefitsRef.inView, `bg-white/10 backdrop-blur-sm rounded-2xl p-7 border border-white/15 hover:bg-white/15 hover:border-white/25 transition-all duration-300 group ${b.delay}`)}>
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {b.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{b.title}</h3>
                <p className="text-blue-100 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. TESTIMONIALS
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={testimonialsRef.ref} className={rv(testimonialsRef.inView, "text-center mb-14")}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100 mb-5">
              Real Stories
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Teams that made the switch{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">don't go back.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Here's what changed for the people who were tired of the old way of doing things.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                before: "We were chasing timesheets every Friday and still had missing entries by Monday.",
                quote: "Now attendance just happens. HR has gone from frustrated to genuinely happy — and payroll runs itself. I can't imagine going back to the spreadsheet era.",
                name: "Amira Hassan",
                role: "HR Manager",
                company: "BuildCo",
                initials: "AH",
                grad: "from-blue-500 to-blue-600",
                delay: "delay-0",
              },
              {
                before: "I was regularly missing billable hours because I couldn't remember exactly what I worked on.",
                quote: "Every minute is logged now. I've recovered nearly $800/month in billable time I used to write off as 'I probably didn't work that much.' It adds up fast.",
                name: "Marcus Chen",
                role: "Freelance Product Designer",
                company: "Self-employed",
                initials: "MC",
                grad: "from-violet-500 to-violet-600",
                delay: "delay-100",
              },
              {
                before: "We had three different tools for HR, time, and projects — none of them talked to each other.",
                quote: "We shut down three separate subscriptions on day one. Everything our team needs lives in one place, and our reporting has gone from a Friday afternoon task to a 10-second export.",
                name: "Sarah Mitchell",
                role: "Operations Director",
                company: "TechVentures",
                initials: "SM",
                grad: "from-teal-500 to-teal-600",
                delay: "delay-200",
              },
            ].map((t) => (
              <div key={t.name} className={rv(testimonialsRef.inView, `bg-slate-50 rounded-2xl border border-slate-200 p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${t.delay}`)}>
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Before state */}
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Before</p>
                  <p className="text-xs text-slate-500 italic">"{t.before}"</p>
                </div>

                <blockquote className="text-slate-700 leading-relaxed mb-6 text-[15px]">
                  "{t.quote}"
                </blockquote>

                <div className="flex items-center gap-3 pt-5 border-t border-slate-200">
                  <div className={`w-10 h-10 bg-gradient-to-br ${t.grad} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role} · {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. STATS
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div ref={statsRef.ref} className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className={rv(statsRef.inView, "grid grid-cols-2 md:grid-cols-4 gap-10 text-center")}>
            {[
              { value: "500+",  label: "Organizations",  color: "text-blue-600",   bg: "bg-blue-50" },
              { value: "10k+",  label: "Active Users",   color: "text-violet-600", bg: "bg-violet-50" },
              { value: "50M+",  label: "Hours Tracked",  color: "text-indigo-600", bg: "bg-indigo-50" },
              { value: "99.9%", label: "Uptime SLA",     color: "text-emerald-600",bg: "bg-emerald-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl py-8 px-4`}>
                <div className={`text-4xl lg:text-5xl font-bold ${s.color} mb-2`}>{s.value}</div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. CTA
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-violet-700 text-white py-24 lg:py-32">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div ref={ctaRef.ref} className={`relative max-w-3xl mx-auto px-6 lg:px-8 text-center transition-all duration-700 ease-out ${ctaRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to take back
            <br />your team's time?
          </h2>
          <p className="text-lg text-blue-100 mb-12 leading-relaxed">
            Join 500+ organizations using {brandName} to track time accurately, manage
            teams confidently, and make better decisions — every single day.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl text-base font-semibold hover:bg-slate-50 hover:shadow-xl transition-all duration-300"
            >
              Start Free — No Credit Card
              <ArrowRight />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white border border-white/40 rounded-xl text-base font-semibold hover:bg-white/10 hover:border-white/70 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-8">Free plan available · Cancel anytime · No setup fees</p>
        </div>
      </section>

    </div>
  );
};

export default About;
