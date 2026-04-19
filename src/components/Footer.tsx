import React from "react";
import { Link } from "react-router-dom";
import { useBranding } from "../context/BrandingContext";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { brandName, resolvedLogoUrl } = useBranding();

  return (
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-8">

        {/* ── Top: Brand + tagline + socials ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-10 pb-10 border-b border-slate-200">
          <div className="max-w-xs">
            <Link to="/home" className="inline-flex items-center gap-3 mb-3 group">
              {resolvedLogoUrl ? (
                <img src={resolvedLogoUrl} alt={brandName} className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <span className="text-slate-900 font-bold text-lg tracking-tight">{brandName}</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              The complete workforce management platform — attendance, time tracking, and project management in one place.
            </p>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-2.5">
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" className="w-9 h-9 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg flex items-center justify-center transition-all duration-200 group">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" aria-label="YouTube" className="w-9 h-9 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg flex items-center justify-center transition-all duration-200 group">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            {/* Product Hunt */}
            <a href="#" aria-label="Product Hunt" className="w-9 h-9 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-lg flex items-center justify-center transition-all duration-200 group">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.604 8.4h-3.405V12h3.405c.993 0 1.801-.808 1.801-1.8S14.597 8.4 13.604 8.4zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.8V6h5.804c2.319 0 4.2 1.88 4.2 4.2s-1.881 4.2-4.2 4.2z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── Nav columns — all 4 in one row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          <div>
            <h3 className="text-slate-900 font-semibold text-sm mb-4">Product</h3>
            <ul className="space-y-3">
              {[
                { label: "Home",         to: "/home" },
                { label: "Features",     to: "/home#features" },
                { label: "How It Works", to: "/home#howitworks" },
                { label: "Pricing",      to: "/home#pricing" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-semibold text-sm mb-4">Solutions</h3>
            <ul className="space-y-3">
              {[
                { label: "For Individuals", to: "/register" },
                { label: "For Teams",       to: "/register" },
                { label: "Attendance",      to: "/home#features" },
                { label: "Time Tracking",   to: "/home#features" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-semibold text-sm mb-4">Resources</h3>
            <ul className="space-y-3">
              {[
                { label: "Documentation", href: "#" },
                { label: "Help Center",   href: "#" },
                { label: "API Reference", href: "#" },
                { label: "Status",        href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-slate-500 hover:text-slate-900 transition-colors text-sm">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 font-semibold text-sm mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about"   className="text-slate-500 hover:text-slate-900 transition-colors text-sm">About Us</Link></li>
              <li><a href="#"          className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Contact</a></li>
              <li><Link to="/privacy-policy" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-slate-500 hover:text-slate-900 transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">&copy; {currentYear} {brandName}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <Link to="/privacy-policy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            <span>&middot;</span>
            <Link to="/terms-of-service" className="hover:text-slate-700 transition-colors">Terms</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
