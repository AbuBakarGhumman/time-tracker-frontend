// src/pages/site/Intro.tsx
import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const CheckCircle = () => (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100">
    {children}
  </span>
);

const ArrowRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const Intro: React.FC = () => {
  const { t } = useTranslation();
  const { brandName } = useBranding();

  const featuresRef      = useInView();
  const attendanceRef    = useInView();
  const timeRef          = useInView();
  const projectsRef      = useInView();
  const whyUsRef         = useInView();
  const audienceRef      = useInView();
  const stepsRef         = useInView();
  const testimonialsRef  = useInView();
  const pricingRef       = useInView();
  const ctaRef           = useInView();

  return (
    <div className="w-full bg-white">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 pt-24 pb-0 lg:pt-32">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-300/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 rounded-full border border-blue-200 text-sm font-medium text-blue-700 mb-8">
              <span className="text-blue-500">✦</span>
              The all-in-one workforce platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-slate-900">
              Stop juggling tools.{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Start delivering results.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
              {brandName} unifies attendance, time tracking, and project management into
              one workspace — so your team spends less time reporting and more time doing.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                {t("site.startFreeTrial")}
                <ArrowRight />
              </Link>
              <a
                href="#features"
                onClick={(e) => { e.preventDefault(); document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" }); }}
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-semibold text-base hover:border-slate-300 hover:shadow-md transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                See what's inside
              </a>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-slate-400 text-sm mb-16">
              {["500+ Companies", "10,000+ Users", "50M+ Hours Logged", "99.9% Uptime"].map((stat, i, arr) => (
                <React.Fragment key={stat}>
                  <span className="text-slate-500">{stat}</span>
                  {i < arr.length - 1 && <span className="hidden sm:inline text-slate-300">·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── Product mockup screenshot ── */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/15 to-violet-500/15 rounded-3xl blur-2xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                  <div className="w-3 h-3 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 max-w-xs bg-white rounded-md px-3 py-1.5 text-xs text-slate-400 border border-slate-200 text-center mx-auto">
                  app.softdesk.io/dashboard
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="p-5 bg-slate-50">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Present Today",  val: "24/27", color: "text-green-600",  bg: "bg-green-50 border-green-100" },
                    { label: "Hours Logged",   val: "187 h",  color: "text-blue-600",   bg: "bg-blue-50 border-blue-100" },
                    { label: "Active Tasks",   val: "34",    color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
                    { label: "Billable Rate",  val: "94%",   color: "text-teal-600",   bg: "bg-teal-50 border-teal-100" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-xl border p-3`}>
                      <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Two panel row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Attendance list */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Live Attendance</p>
                    <div className="space-y-2">
                      {[
                        { n: "Sara Ahmed",  t: "09:01", s: "On time", c: "text-green-600 bg-green-50" },
                        { n: "Bilal Raza",  t: "09:18", s: "Late",    c: "text-amber-600 bg-amber-50" },
                        { n: "Hina Malik",  t: "08:55", s: "On time", c: "text-green-600 bg-green-50" },
                      ].map((r) => (
                        <div key={r.n} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-white text-[9px] font-bold">
                              {r.n.split(" ").map((x) => x[0]).join("")}
                            </div>
                            <span className="text-slate-700 font-medium">{r.n}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${r.c}`}>{r.s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active timer */}
                  <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl p-4 text-white">
                    <p className="text-xs font-medium text-blue-100 mb-0.5">Currently tracking</p>
                    <p className="text-xs text-white/70 mb-3">Website Redesign · UI Work</p>
                    <p className="text-4xl font-bold tabular-nums mb-2">02:34:17</p>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs text-green-300 font-medium">Billable</span>
                      <span className="ml-auto text-xs text-blue-200">Today: 5h 34m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Fade gradient at bottom */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-blue-50 to-transparent rounded-b-2xl" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. FEATURES
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-white pt-24 pb-24 lg:pt-32 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={featuresRef.ref} className={rv(featuresRef.inView, "text-center mb-16")}>
            <Badge>Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-4">
              Six tools. One workspace.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Zero friction.</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              From daily check-ins to quarterly analytics — every capability your team needs,
              built to work together out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                delay: "delay-0",
                grad: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/20", hover: "hover:border-blue-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
                title: "Attendance Management",
                body: "Smart check-in/check-out, shift tracking, and real-time alerts. HR stops chasing spreadsheets and starts making decisions.",
              },
              {
                delay: "delay-100",
                grad: "from-violet-500 to-violet-600", shadow: "shadow-violet-500/20", hover: "hover:border-violet-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
                title: "Billable Time Logging",
                body: "Log hours against projects with one click. Separate billable from non-billable time and generate client-ready reports in seconds.",
              },
              {
                delay: "delay-200",
                grad: "from-teal-500 to-teal-600", shadow: "shadow-teal-500/20", hover: "hover:border-teal-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
                title: "Project & Task Management",
                body: "Kanban boards, deadlines, and milestones — directly connected to the time your team is actually spending on each task.",
              },
              {
                delay: "delay-0",
                grad: "from-green-500 to-green-600", shadow: "shadow-green-500/20", hover: "hover:border-green-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
                title: "Team Analytics",
                body: "Real-time productivity dashboards and custom exports that give managers clarity to make faster, smarter decisions.",
              },
              {
                delay: "delay-100",
                grad: "from-indigo-500 to-violet-600", shadow: "shadow-indigo-500/20", hover: "hover:border-indigo-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
                title: "AI-Powered Insights",
                body: "Spot burnout risk before it happens, forecast delivery dates, and surface hidden patterns in how your team works.",
              },
              {
                delay: "delay-200",
                grad: "from-orange-500 to-orange-600", shadow: "shadow-orange-500/20", hover: "hover:border-orange-200",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
                title: "Role-Based Access",
                body: "Admin, HR, Manager, Team Lead, Employee — every role sees exactly what they need, nothing they shouldn't.",
              },
            ].map((card) => (
              <div key={card.title} className={rv(featuresRef.inView, `group bg-white rounded-2xl border border-slate-200 shadow-sm p-8 ${card.hover} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${card.delay}`)}>
                <div className={`w-12 h-12 bg-gradient-to-br ${card.grad} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md ${card.shadow}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. ATTENDANCE — real photo
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={attendanceRef.ref} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: text */}
            <div className={rl(attendanceRef.inView)}>
              <Badge>Attendance Tracking</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-4">
                Your team shows up.{" "}
                <span className="text-blue-600">You always know.</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Know exactly when your team starts, ends, and takes breaks — in real time.
                No manual entry, no chasing people for timesheets. HR has everything
                they need for payroll before the week is out.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Real-time check-in / check-out from any device",
                  "Overtime, late arrival & absence alerts",
                  "Leave tracking with approval workflows",
                  "Payroll-ready exports in one click",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-violet-600 transition-colors duration-200">
                Explore Attendance <ArrowRight />
              </Link>
            </div>

            {/* Right: real photo + floating UI */}
            <div className={rr(attendanceRef.inView, "delay-150")}>
              <div className="relative pt-6 pb-10 pl-2 pr-6">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80"
                    alt="Team attendance"
                    className="w-full h-[420px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-transparent" />
                </div>

                {/* Floating attendance widget */}
                <div className="absolute bottom-2 left-0 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 min-w-[220px] z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Attendance</p>
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "24", label: "Present", color: "text-green-600", bg: "bg-green-50" },
                      { val: "3",  label: "Late",    color: "text-amber-600", bg: "bg-amber-50" },
                      { val: "2",  label: "Absent",  color: "text-red-500",   bg: "bg-red-50"   },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                        <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating rate pill */}
                <div className="absolute top-0 right-0 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3 z-10">
                  <p className="text-[11px] text-slate-500 mb-1">Attendance Rate</p>
                  <p className="text-2xl font-bold text-slate-900">94.3<span className="text-base font-normal text-slate-400">%</span></p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-2 w-24">
                    <div className="h-full w-[94%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. TIME TRACKING — reversed, real photo
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={timeRef.ref} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: real photo + floating UI */}
            <div className={rl(timeRef.inView, "order-2 lg:order-1 delay-150")}>
              <div className="relative pt-6 pb-10 pl-6 pr-2">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80"
                    alt="Time tracking"
                    className="w-full h-[420px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-bl from-slate-900/40 via-transparent to-transparent" />
                </div>

                {/* Floating active timer */}
                <div className="absolute bottom-2 right-0 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl shadow-xl p-4 min-w-[200px] z-10">
                  <p className="text-xs font-medium text-blue-100 mb-0.5">Currently tracking</p>
                  <p className="text-xs text-white/70 mb-2">Website Redesign · UI</p>
                  <p className="text-3xl font-bold text-white tabular-nums">02:34:17</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-300 font-medium">Billable</span>
                  </div>
                </div>

                {/* Floating daily total */}
                <div className="absolute top-0 left-0 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3 z-10">
                  <p className="text-[11px] text-slate-500 mb-0.5">Today's total</p>
                  <p className="text-2xl font-bold text-slate-900">5h 34m</p>
                  <p className="text-[11px] text-blue-600 font-medium mt-0.5">4h 12m billable</p>
                </div>
              </div>
            </div>

            {/* Right: text */}
            <div className={rr(timeRef.inView, "order-1 lg:order-2")}>
              <Badge>Time Tracking</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-4">
                Stop guessing{" "}
                <span className="text-violet-600">where the time went.</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Every hour logged is linked to a project, a task, and a person — not just
                a raw number. Whether you're a freelancer billing clients or a team managing
                budgets, precision is built in from the start.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "One-click timer — start, pause, stop",
                  "Log time by project, task & client",
                  "Billable vs non-billable hour separation",
                  "Weekly and monthly time reports",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-violet-600 transition-colors duration-200">
                Explore Time Tracking <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. PROJECTS — real photo
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={projectsRef.ref} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: text */}
            <div className={rl(projectsRef.inView)}>
              <Badge>Project Management</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-4">
                From idea to done —{" "}
                <span className="text-teal-600">always on track.</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Tasks, milestones, priorities, and budgets — all connected to the actual
                time being spent. Your team always knows what to work on next, and you
                always know if you're on track to deliver.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Kanban & list views for any workflow",
                  "Task assignments, deadlines & priorities",
                  "Project budgets tied to logged time",
                  "Milestone tracking with progress reports",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-violet-600 transition-colors duration-200">
                Explore Projects <ArrowRight />
              </Link>
            </div>

            {/* Right: real photo + floating UI */}
            <div className={rr(projectsRef.inView, "delay-150")}>
              <div className="relative pt-6 pb-10 pl-2 pr-6">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
                    alt="Project collaboration"
                    className="w-full h-[420px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tl from-slate-900/40 via-transparent to-transparent" />
                </div>

                {/* Floating project widget */}
                <div className="absolute bottom-2 left-0 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 min-w-[220px] z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-700 truncate">Website Redesign</p>
                    <span className="text-xs font-bold text-blue-600">67%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mb-3">
                    <div className="h-full w-[67%] bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { val: "12", label: "Done",   color: "text-green-600" },
                      { val: "5",  label: "Active", color: "text-blue-600"  },
                      { val: "3",  label: "To Do",  color: "text-slate-400" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] text-slate-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating team avatars */}
                <div className="absolute top-0 right-0 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3 z-10">
                  <p className="text-[11px] text-slate-500 mb-2">Active team</p>
                  <div className="flex -space-x-2">
                    {["from-blue-500 to-blue-600","from-violet-500 to-violet-600","from-teal-500 to-teal-600","from-orange-400 to-orange-500"].map((g, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}>
                        {["S","B","H","U"][i]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. WHY SOFTDESK
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={whyUsRef.ref} className={rv(whyUsRef.inView, "text-center mb-14")}>
            <Badge>What Makes Us Different</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-4">
              Built different.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Designed for real work.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Most tools track time <em>or</em> manage projects. {brandName} connects both — so your
              data actually means something and your team stays in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                delay: "delay-0",
                grad: "from-blue-500 to-blue-600",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
                title: "All your work data, connected",
                body: "Time logs, attendance, tasks, and reports — all linked. When someone logs an hour, the project budget updates. No syncing, no gaps.",
              },
              {
                delay: "delay-100",
                grad: "from-violet-500 to-violet-600",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
                title: "Solo today, 500-person team tomorrow",
                body: "Start free as an individual. Add your whole company later. One platform handles both without migration or switching tools.",
              },
              {
                delay: "delay-200",
                grad: "from-teal-500 to-teal-600",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                title: "Real-time, not last week",
                body: "See what's happening right now — not in a PDF someone exported on Monday. Instant visibility for managers who move fast.",
              },
              {
                delay: "delay-300",
                grad: "from-orange-500 to-orange-600",
                icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" /></>,
                title: "Hours with context, not just numbers",
                body: "Every logged hour links to a task, project, and person. Not a raw number — real context. So you always know where work is going.",
              },
            ].map((card) => (
              <div key={card.title} className={rv(whyUsRef.inView, `bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 ${card.delay}`)}>
                <div className={`w-12 h-12 bg-gradient-to-br ${card.grad} rounded-xl flex items-center justify-center mb-5 shadow-md`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. FOR INDIVIDUALS & TEAMS
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={audienceRef.ref} className={rv(audienceRef.inView, "text-center mb-14")}>
            <Badge>Built For Everyone</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-4">
              Whether it's just you,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">or your whole company.</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mt-4 max-w-2xl mx-auto">
              {brandName} scales to fit exactly how you work — from a solo freelancer
              invoicing clients to an enterprise managing hundreds of employees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={rl(audienceRef.inView, "bg-white border border-blue-100 rounded-3xl p-8 lg:p-10 delay-100")}>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Freelancers &amp; Individuals</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Track billable hours, generate professional client reports, and manage
                your own projects — without paying for a team plan you don't need.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["Free to start — no credit card needed", "Client-ready billable hour reports", "Personal time & project dashboard", "Works on mobile, tablet, and desktop"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
                Get Started Free <ArrowRight />
              </Link>
            </div>

            <div className={rr(audienceRef.inView, "bg-white border border-violet-100 rounded-3xl p-8 lg:p-10 delay-200")}>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Enterprise Teams</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Give HR, managers, and employees the exact tools they need with
                role-based access, company-wide analytics, and multi-team support.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["Admin, HR, Manager, Team Lead & Employee roles", "Company-wide attendance & productivity analytics", "Multi-team project and task management", "14-day free trial — full access, no commitment"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25">
                Start Team Trial <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. HOW IT WORKS — dark, modern redesign
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="howitworks" className="relative overflow-hidden bg-slate-950 py-24 lg:py-32">
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        {/* Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={stepsRef.ref} className={rv(stepsRef.inView, "text-center mb-20")}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-sm font-medium border border-white/10 mb-6">
              <span className="text-blue-400">✦</span> Quick Setup
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              From signup to tracking in{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">under 10 minutes.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto">
              No IT team. No lengthy onboarding. No setup fees. Three steps and your whole team is live.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-[4.5rem] left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-gradient-to-r from-blue-500/30 via-violet-500/30 to-violet-500/30" style={{ backgroundImage: "repeating-linear-gradient(to right, rgba(99,102,241,0.3) 0, rgba(99,102,241,0.3) 6px, transparent 6px, transparent 14px)" }} />

            {[
              {
                num: "01",
                grad: "from-blue-600 to-blue-500",
                shadow: "shadow-blue-500/30",
                delay: "delay-0",
                title: "Create your workspace",
                body: "Sign up, set your company profile, invite team members, and configure roles — all in a guided 3-minute setup. No IT required.",
                outcome: "Your entire org, structured and ready",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
              },
              {
                num: "02",
                grad: "from-blue-500 to-violet-500",
                shadow: "shadow-violet-500/30",
                delay: "delay-200",
                title: "Add projects & assign tasks",
                body: "Create your first project, add tasks, assign them to team members, and set priorities. Takes under 5 minutes. Everyone knows what to do.",
                outcome: "Clear ownership — no more 'who's doing what?'",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
              },
              {
                num: "03",
                grad: "from-violet-500 to-violet-600",
                shadow: "shadow-violet-500/30",
                delay: "delay-300",
                title: "Track time & attendance",
                body: "Your team checks in and logs hours. You see live data, analytics, and automated reports — with zero manual effort from anyone.",
                outcome: "Complete visibility across your whole team",
                icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
              },
            ].map((step) => (
              <div key={step.num} className={rv(stepsRef.inView, step.delay)}>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-full hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 group">
                  {/* Icon + decorative number */}
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${step.grad} rounded-2xl flex items-center justify-center shadow-xl ${step.shadow} group-hover:scale-105 transition-transform duration-300`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {step.icon}
                      </svg>
                    </div>
                    <span className="text-7xl font-black text-white/[0.04] leading-none select-none">{step.num}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed mb-6 text-sm">{step.body}</p>

                  {/* Outcome */}
                  <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-green-400 font-medium">{step.outcome}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={rv(stepsRef.inView, "text-center mt-14 delay-300")}>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-base hover:bg-slate-100 hover:shadow-2xl transition-all duration-200"
            >
              Start in minutes — it's free
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. TESTIMONIALS
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={testimonialsRef.ref} className={rv(testimonialsRef.inView, "text-center mb-14")}>
            <Badge>Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-4">
              Loved by teams that{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">value their time.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real results from real professionals — solo freelancers and enterprise HR teams alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "We used to chase timesheets every Friday afternoon. Now attendance just happens automatically. HR has gone from frustrated to genuinely happy — and payroll runs itself.",
                name: "Amira Hassan",
                role: "HR Manager",
                company: "BuildCo",
                initials: "AH",
                grad: "from-blue-500 to-blue-600",
                delay: "delay-0",
              },
              {
                quote: "I invoice clients every two weeks. Before this, I was guessing hours from memory. Now every minute is logged and I've recovered nearly $800/month in billable time I used to miss completely.",
                name: "Marcus Chen",
                role: "Freelance Product Designer",
                company: "Self-employed",
                initials: "MC",
                grad: "from-violet-500 to-violet-600",
                delay: "delay-100",
              },
              {
                quote: "Time tracking, attendance, and project management all in one place — that was the deciding factor for us. We shut down three separate tools on day one and haven't looked back.",
                name: "Sarah Mitchell",
                role: "Operations Director",
                company: "TechVentures",
                initials: "SM",
                grad: "from-teal-500 to-teal-600",
                delay: "delay-200",
              },
            ].map((t) => (
              <div key={t.name} className={rv(testimonialsRef.inView, `bg-white rounded-2xl border border-slate-200 shadow-sm p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${t.delay}`)}>
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="text-slate-700 leading-relaxed mb-6 text-[15px]">
                  "{t.quote}"
                </blockquote>

                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
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
          10. PRICING
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="bg-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div ref={pricingRef.ref} className={rv(pricingRef.inView, "text-center mb-14")}>
            <Badge>Simple Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-4 mb-3">
              Pricing that makes sense{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">at every stage.</span>
            </h2>
            <p className="text-lg text-slate-500">Start free. Upgrade when you're ready. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

            {/* Individual – Free */}
            <div className={rs(pricingRef.inView, "bg-white rounded-2xl border border-slate-200 shadow-sm p-8 delay-0")}>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Individual</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-5xl font-bold text-slate-900">Free</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">Perfect for freelancers and solo professionals.</p>
              <Link
                to="/register"
                className="block text-center bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold hover:border-slate-300 hover:shadow-md transition-all duration-200 mb-8"
              >
                Get Started Free
              </Link>
              <ul className="space-y-3">
                {["1 user", "Up to 5 active projects", "Attendance & time tracking", "Basic reports", "30-day history"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700 text-sm">
                    <CheckCircle />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Professional – highlighted */}
            <div className={rs(pricingRef.inView, "relative bg-white rounded-2xl border-2 border-blue-500 shadow-xl p-8 delay-100")}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full text-sm font-semibold shadow-lg">
                  ✦ Most Popular
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Professional</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold text-slate-900">$12</span>
                <span className="text-slate-500 mb-1.5">/user/mo</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">For growing teams that need collaboration.</p>
              <Link
                to="/register"
                className="block text-center bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-200 mb-8"
              >
                {t("site.startFreeTrial")}
              </Link>
              <ul className="space-y-3">
                {["Everything in Individual", "Unlimited projects", "Team management", "Advanced analytics", "AI insights", "1-year history"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700 text-sm">
                    <CheckCircle />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise – Custom */}
            <div className={rs(pricingRef.inView, "bg-white rounded-2xl border border-slate-200 shadow-sm p-8 delay-200")}>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Enterprise</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-5xl font-bold text-slate-900">Custom</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">For large organizations with advanced needs.</p>
              <Link
                to="/register"
                className="block text-center bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold hover:border-slate-300 hover:shadow-md transition-all duration-200 mb-8"
              >
                Contact Sales
              </Link>
              <ul className="space-y-3">
                {["Everything in Professional", "Unlimited users", "Custom roles & permissions", "Priority support", "SSO / API access", "Dedicated onboarding"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700 text-sm">
                    <CheckCircle />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          11. CTA
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-violet-700 text-white py-24 lg:py-32">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div ref={ctaRef.ref} className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className={rv(ctaRef.inView)}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Your most productive era{" "}
              <br className="hidden sm:block" />
              starts today.
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed mb-12 max-w-2xl mx-auto">
              Join thousands of teams already using {brandName} to track time, manage
              projects, and make smarter workforce decisions — all from one place.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-base hover:bg-slate-50 hover:shadow-xl transition-all duration-200"
              >
                {t("site.startFreeTrial")}
                <ArrowRight />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white border border-white/40 px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/10 hover:border-white/70 transition-all duration-200"
              >
                Book a Demo
              </Link>
            </div>
            <p className="text-blue-200 text-sm mt-8">
              No credit card required · Free plan available · Cancel anytime
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Intro;
