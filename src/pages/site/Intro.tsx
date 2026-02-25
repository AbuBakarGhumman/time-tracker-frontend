// src/pages/Intro.tsx
import React from "react";
import { Link } from "react-router-dom";

const Intro: React.FC = () => {
  return (
    <div className="w-full bg-slate-50">
      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">All-in-One HR Time Management</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Employee Attendance
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Meets Time Tracking
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-300 mb-12 leading-relaxed">
              The perfect blend of Clockify and ResourceInn. Track attendance, log time entries, 
              monitor productivity, and manage your workforce—all in one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <Link
                to="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-lg font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
              >
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-white/10">
              <div>
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-sm text-slate-400 mt-1">Uptime</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  10k+
                </div>
                <div className="text-sm text-slate-400 mt-1">Active Users</div>
              </div>
              <div>
                <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                  50M+
                </div>
                <div className="text-sm text-slate-400 mt-1">Hours Tracked</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Combine the power of attendance management with comprehensive time tracking. 
              No more juggling multiple tools.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Attendance Management */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-blue-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Attendance Tracking</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Employees check-in and check-out seamlessly. Track attendance patterns, manage leaves, 
                  and get real-time visibility into who's working.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    One-click check-in/check-out
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Automated attendance reports
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Late arrival & early departure alerts
                  </li>
                </ul>
              </div>
            </div>

            {/* Time Tracking */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-purple-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Detailed Time Logging</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Log time against specific tasks and projects. Track billable hours, analyze productivity, 
                  and generate accurate timesheets automatically.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Task-level time entries
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Project & client categorization
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Billable vs non-billable tracking
                  </li>
                </ul>
              </div>
            </div>

            {/* Productivity Analytics */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-green-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Advanced Analytics</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Gain deep insights into workforce productivity. Visualize time distribution, 
                  identify bottlenecks, and make data-driven decisions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time productivity dashboards
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Custom reports & exports
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Team performance metrics
                  </li>
                </ul>
              </div>
            </div>

            {/* Team Management */}
            <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-orange-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Centralized Team Control</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Manage your entire workforce from one dashboard. Assign roles, set permissions, 
                  and monitor team activities effortlessly.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Role-based access control
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Department & team organization
                  </li>
                  <li className="flex items-center text-slate-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Employee activity monitoring
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Get Started in Minutes</h2>
            <p className="text-xl text-slate-300">Simple setup, powerful features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl">
                  1
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-slate-900"></div>
              </div>
              <h4 className="text-xl font-bold mb-3">Create Account</h4>
              <p className="text-slate-300">Sign up in 30 seconds. No credit card required for trial.</p>
            </div>

            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl">
                  2
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-slate-900"></div>
              </div>
              <h4 className="text-xl font-bold mb-3">Add Your Team</h4>
              <p className="text-slate-300">Invite employees and set up departments in minutes.</p>
            </div>

            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl">
                  3
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-slate-900"></div>
              </div>
              <h4 className="text-xl font-bold mb-3">Start Tracking</h4>
              <p className="text-slate-300">Check-in for the day and log time against tasks seamlessly.</p>
            </div>

            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl">
                  4
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-slate-900"></div>
              </div>
              <h4 className="text-xl font-bold mb-3">Analyze & Optimize</h4>
              <p className="text-slate-300">View reports, insights, and optimize team productivity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Why Choose Us Over Others?
            </h2>
            <p className="text-xl text-slate-600">
              Get the best of both worlds—attendance tracking and time management
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border-2 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-slate-400 font-semibold mb-3">Clockify</div>
                <div className="text-sm text-slate-600">Great for time tracking but lacks attendance features</div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full">
                  BEST CHOICE
                </div>
                <div className="text-blue-600 font-bold text-lg mb-3">Our Platform</div>
                <div className="text-sm font-semibold text-slate-900">Complete HR solution with attendance + time tracking + analytics</div>
              </div>

              <div>
                <div className="text-slate-400 font-semibold mb-3">ResourceInn</div>
                <div className="text-sm text-slate-600">Good for attendance but limited time entry features</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">Trusted by Teams Worldwide</h3>
            <p className="text-slate-600">Join thousands of companies tracking time smarter</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-1">500+</div>
              <div className="text-sm text-slate-600">Companies</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="text-3xl font-bold text-purple-600 mb-1">10k+</div>
              <div className="text-sm text-slate-600">Active Users</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="text-3xl font-bold text-green-600 mb-1">50M+</div>
              <div className="text-sm text-slate-600">Hours Tracked</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-md">
              <div className="text-3xl font-bold text-orange-600 mb-1">4.9★</div>
              <div className="text-sm text-slate-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse animation-delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Workforce Management?
          </h2>
          <p className="text-xl mb-10 text-blue-100">
            Start your free 14-day trial today. No credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Link
              to="/register"
              className="px-10 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-slate-100 transition-all duration-300 shadow-2xl hover:shadow-white/50 hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white font-bold text-lg rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>

          <p className="text-sm text-blue-100">
            ✓ No credit card required  ✓ 14-day free trial  ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* CSS for animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default Intro;