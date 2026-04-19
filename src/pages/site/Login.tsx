// src/pages/site/Login.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { unifiedLogin } from "../../api/auth";
import { useBranding } from "../../context/BrandingContext";

const Login: React.FC = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [, setErrorType]                = useState<"email" | "password" | "general" | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useTranslation();
  const { brandName, resolvedLogoUrl } = useBranding();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(t("auth.registrationSuccess"));
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorType(null);
    setLoading(true);
    try {
      const response = await unifiedLogin({ email, password }, rememberMe);
      if (response.user_type === "individual") {
        navigate("/dashboard");
      } else if (response.user_type === "employee") {
        const role = response.employee?.company_role;
        if      (role === "company_admin") navigate("/company/admin-dashboard");
        else if (role === "hr")            navigate("/company/hr-dashboard");
        else if (role === "manager")       navigate("/company/manager-dashboard");
        else if (role === "team_lead")     navigate("/company/team-dashboard");
        else                               navigate("/company/employee-dashboard");
      } else if (response.user_type === "platform_admin") {
        navigate("/platform/admin-dashboard");
      }
    } catch (err: any) {
      setError(err.message || t("auth.loginFailedMessage"));
      setErrorType("general");
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared brand logo element ─────────────────────────────────────── */
  const BrandLogo = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const boxCls = size === "lg"
      ? "w-12 h-12 rounded-2xl"
      : "w-8 h-8 rounded-xl";
    const iconCls = size === "lg"
      ? "w-6 h-6"
      : "w-4 h-4";
    const imgCls = size === "lg"
      ? "w-12 h-12 rounded-2xl object-contain"
      : "w-8 h-8 rounded-xl object-contain";

    return resolvedLogoUrl ? (
      <img src={resolvedLogoUrl} alt={brandName} className={imgCls} />
    ) : (
      <div className={`${boxCls} bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0`}>
        <svg className={`${iconCls} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left image panel (lg+) ──────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        {/* Full-bleed photo */}
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80"
          alt="Modern professional office"
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content over overlay */}
        <div className="relative h-full flex flex-col justify-between p-12 xl:p-16 text-white">

          {/* Top: brand */}
          <Link to="/home" className="inline-flex items-center gap-3 group w-fit">
            <BrandLogo size="lg" />
            <span className="text-white text-xl font-bold tracking-tight">{brandName}</span>
          </Link>

          {/* Middle: headline */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              The smarter way<br />to track time &amp;<br />
              <span className="text-blue-300">attendance</span>
            </h1>
            <p className="text-white/90 text-base xl:text-lg leading-relaxed max-w-sm">
              Trusted by 500+ companies and 10,000+ professionals to manage
              attendance, log project time, and understand team productivity.
            </p>
          </div>

          {/* Bottom: feature bullets */}
          <ul className="space-y-3">
            {[
              "Real-time attendance & check-in tracking",
              "Project time logs with billable reporting",
              "Role-based dashboards for every team",
              "Works on any device, anywhere",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>

        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 sm:px-12 lg:px-16 xl:px-20 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Brand mark — visible on all screen sizes in the right panel */}
          <Link to="/home" className="inline-flex items-center gap-2.5 mb-10 group">
            <BrandLogo size="sm" />
            <span className="text-slate-800 font-semibold text-base">{brandName}</span>
          </Link>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-slate-900 mb-1.5">
            {t("auth.welcomeBack")}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {t("auth.signInToContinue")} {brandName}
          </p>

          {/* Success banner */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-green-700 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
              <span className="font-semibold">{t("auth.loginFailed")}: </span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                {t("auth.emailAddress")}
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) { setError(""); setErrorType(null); } }}
                placeholder={t("auth.emailPlaceholder")}
                className="border border-slate-200 rounded-xl px-4 py-3.5 text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400 text-slate-900"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                {t("auth.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) { setError(""); setErrorType(null); } }}
                  placeholder={t("auth.passwordPlaceholder")}
                  className="border border-slate-200 rounded-xl px-4 py-3.5 pr-12 text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-400 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    /* eye-off */
                    <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    /* eye */
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                  {t("auth.rememberMe")}
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("auth.signingIn")}
                </span>
              ) : (
                t("auth.logIn")
              )}
            </button>

          </form>

          {/* Register link */}
          <p className="mt-8 text-sm text-slate-500 text-center">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              {t("auth.createOneNow")}
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};

export default Login;
