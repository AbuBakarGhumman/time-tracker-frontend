// src/pages/site/Register.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { uploadProfileImage } from "../../api/images";
import { registerUser, registerCompany } from "../../api/auth";
import { useBranding } from "../../context/BrandingContext";

type RegistrationType = "individual" | "company";

const EyeOpen = () => (
  <svg className="h-[clamp(1rem,1.2vw,3.5rem)] w-[clamp(1rem,1.2vw,3.5rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOff = () => (
  <svg className="h-[clamp(1rem,1.2vw,3.5rem)] w-[clamp(1rem,1.2vw,3.5rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { brandName, resolvedLogoUrl } = useBranding();
  const [registrationType, setRegistrationType] = useState<RegistrationType>("individual");

  const [formData, setFormData] = useState({
    full_name: "", username: "", email: "", password: "", confirm_password: "",
    job_title: "", department: "", profile_pic: null as File | null,
  });

  const [companyData, setCompanyData] = useState({
    company_name: "", company_email: "", admin_name: "", admin_username: "",
    admin_email: "", password: "", confirm_password: "", company_size: "",
    industry: "", profile_pic: null as File | null,
  });

  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewUrl, setPreviewUrl]             = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (registrationType === "individual") setFormData({ ...formData, [name]: value });
    else setCompanyData({ ...companyData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (registrationType === "individual") setFormData({ ...formData, profile_pic: file });
      else setCompanyData({ ...companyData, profile_pic: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (loading) return;

    if (registrationType === "individual") {
      if (formData.password !== formData.confirm_password) { setError(t("auth.passwordsDoNotMatch")); return; }
      setLoading(true);
      try {
        let profile_pic_url = "";
        if (formData.profile_pic) profile_pic_url = await uploadProfileImage(formData.profile_pic);
        await registerUser({
          full_name: formData.full_name, username: formData.username, email: formData.email,
          password: formData.password, job_title: formData.job_title,
          department: formData.department, profile_pic_url,
        });
        navigate("/login", { state: { message: "Registration successful! Please log in." } });
      } catch (err: any) {
        setError(err.message || t("auth.registrationFailed"));
      } finally { setLoading(false); }
    } else {
      if (companyData.password !== companyData.confirm_password) { setError(t("auth.passwordsDoNotMatch")); return; }
      if (!companyData.company_name || !companyData.company_email || !companyData.admin_name ||
          !companyData.admin_username || !companyData.admin_email || !companyData.password) {
        setError(t("auth.fillAllFields")); return;
      }
      setLoading(true);
      try {
        let company_logo_url = "";
        if (companyData.profile_pic) company_logo_url = await uploadProfileImage(companyData.profile_pic);
        await registerCompany({
          company_name: companyData.company_name, company_email: companyData.company_email,
          company_logo_url, company_size: companyData.company_size || undefined,
          industry: companyData.industry || undefined, admin_name: companyData.admin_name,
          admin_email: companyData.admin_email, admin_username: companyData.admin_username,
          password: companyData.password,
        });
        navigate("/login", { state: { message: "Company registration successful! Please log in.", isCompanyLogin: true } });
      } catch (err: any) {
        setError(err.message || t("auth.companyRegistrationFailed"));
      } finally { setLoading(false); }
    }
  };

  const inputClass = "border border-slate-200 rounded-xl px-4 py-3 text-sm w-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-screen flex">

      {/* ── Left: White Form Panel ─────────────────────────────────────────── */}
      <div className="flex-1 lg:w-[45%] bg-white overflow-y-auto min-h-screen">
        <div className="max-w-lg mx-auto px-8 sm:px-12 py-12">

          {/* Brand */}
          <Link to="/home" className="inline-flex items-center gap-2.5 mb-10 group">
            {resolvedLogoUrl ? (
              <img
                src={resolvedLogoUrl}
                alt={brandName}
                className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <span className="text-slate-900 font-semibold text-base">{brandName}</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1.5">{t("auth.createYourAccount")}</h1>
            <p className="text-sm text-slate-500">{t("auth.joinThousands")}</p>
          </div>

          {/* Account Type Toggle */}
          <div className="bg-slate-100 rounded-xl p-1 flex mb-8">
            <button
              type="button"
              onClick={() => { setRegistrationType("individual"); setError(""); setPreviewUrl(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm transition-all duration-200 ${
                registrationType === "individual"
                  ? "bg-white shadow text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t("common.individual")}
            </button>
            <button
              type="button"
              onClick={() => { setRegistrationType("company"); setError(""); setPreviewUrl(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm transition-all duration-200 ${
                registrationType === "company"
                  ? "bg-white shadow text-slate-900 font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t("auth.company")}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm flex items-center gap-3">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ── INDIVIDUAL FORM ──────────────────────────────────────────────── */}
          {registrationType === "individual" && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center mb-2">
                <label className="relative group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden transition-opacity group-hover:opacity-80">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  {/* Camera overlay on hover */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <p className="text-xs text-slate-400 mt-2">{t("auth.uploadProfilePic")}</p>
              </div>

              {/* Full Name + Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("auth.fullName")}</label>
                  <input
                    type="text"
                    name="full_name"
                    placeholder={t("auth.fullNamePlaceholder")}
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("auth.username")}</label>
                  <input
                    type="text"
                    name="username"
                    placeholder={t("auth.usernamePlaceholder")}
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>{t("auth.emailAddress")}</label>
                <input
                  type="email"
                  name="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Password + Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("auth.password")}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("auth.confirmPassword")}</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      placeholder="••••••••"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Title + Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t("auth.jobTitle")}{" "}
                    <span className="text-slate-400 normal-case font-normal tracking-normal">{t("common.optional")}</span>
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    placeholder={t("auth.jobTitlePlaceholder")}
                    value={formData.job_title}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t("auth.department")}{" "}
                    <span className="text-slate-400 normal-case font-normal tracking-normal">{t("common.optional")}</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder={t("auth.departmentPlaceholder")}
                    value={formData.department}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                  {t("auth.agreeToTerms")}{" "}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">{t("auth.termsOfService")}</Link>{" "}
                  {t("auth.and")}{" "}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">{t("auth.privacyPolicy")}</Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("auth.creatingAccount")}
                  </span>
                ) : t("auth.createAccount")}
              </button>
            </form>
          )}

          {/* ── COMPANY FORM ─────────────────────────────────────────────────── */}
          {registrationType === "company" && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Company Logo Upload */}
              <div className="flex flex-col items-center mb-2">
                <label className="relative group cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden transition-opacity group-hover:opacity-80">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Company logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  {/* Camera overlay on hover */}
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <p className="text-xs text-slate-400 mt-2">{t("auth.uploadCompanyLogo")}</p>
              </div>

              {/* Company Name */}
              <div>
                <label className={labelClass}>{t("auth.companyName")}</label>
                <input
                  type="text"
                  name="company_name"
                  placeholder={t("auth.companyNamePlaceholder")}
                  value={companyData.company_name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Company Email */}
              <div>
                <label className={labelClass}>{t("auth.companyEmail")}</label>
                <input
                  type="email"
                  name="company_email"
                  placeholder={t("auth.companyEmailPlaceholder")}
                  value={companyData.company_email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>

              {/* Admin Account Section */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-6 block">
                  {t("auth.adminAccountDetails")}
                </span>

                {/* Admin Name + Admin Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className={labelClass}>{t("auth.adminFullName")}</label>
                    <input
                      type="text"
                      name="admin_name"
                      placeholder={t("auth.fullNamePlaceholder")}
                      value={companyData.admin_name}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("auth.adminUsername")}</label>
                    <input
                      type="text"
                      name="admin_username"
                      placeholder={t("auth.usernamePlaceholder")}
                      value={companyData.admin_username}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Admin Email */}
                <div className="mb-5">
                  <label className={labelClass}>{t("auth.adminEmail")}</label>
                  <input
                    type="email"
                    name="admin_email"
                    placeholder={t("auth.adminEmailPlaceholder")}
                    value={companyData.admin_email}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Password + Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t("auth.password")}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        value={companyData.password}
                        onChange={handleChange}
                        required
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("auth.confirmPassword")}</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        placeholder="••••••••"
                        value={companyData.confirm_password}
                        onChange={handleChange}
                        required
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Size + Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    {t("auth.companySize")}{" "}
                    <span className="text-slate-400 normal-case font-normal tracking-normal">{t("common.optional")}</span>
                  </label>
                  <select
                    name="company_size"
                    value={companyData.company_size}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">{t("auth.selectCompanySize")}</option>
                    <option value="1-10">{t("auth.companySize1")}</option>
                    <option value="11-50">{t("auth.companySize2")}</option>
                    <option value="51-200">{t("auth.companySize3")}</option>
                    <option value="201-500">{t("auth.companySize4")}</option>
                    <option value="500+">{t("auth.companySize5")}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {t("auth.industry")}{" "}
                    <span className="text-slate-400 normal-case font-normal tracking-normal">{t("common.optional")}</span>
                  </label>
                  <select
                    name="industry"
                    value={companyData.industry}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">{t("auth.selectIndustry")}</option>
                    <option value="technology">{t("auth.industryTech")}</option>
                    <option value="finance">{t("auth.industryFinance")}</option>
                    <option value="healthcare">{t("auth.industryHealthcare")}</option>
                    <option value="education">{t("auth.industryEducation")}</option>
                    <option value="retail">{t("auth.industryRetail")}</option>
                    <option value="manufacturing">{t("auth.industryManufacturing")}</option>
                    <option value="consulting">{t("auth.industryConsulting")}</option>
                    <option value="other">{t("auth.industryOther")}</option>
                  </select>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="terms-company"
                  required
                  className="w-4 h-4 mt-0.5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="terms-company" className="text-sm text-slate-600 leading-relaxed">
                  {t("auth.agreeToTerms")}{" "}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">{t("auth.termsOfService")}</Link>{" "}
                  {t("auth.and")}{" "}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">{t("auth.privacyPolicy")}</Link>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("auth.creatingWorkspace")}
                  </span>
                ) : t("auth.createCompanyWorkspace")}
              </button>
            </form>
          )}

          {/* Sign In Link */}
          <p className="mt-8 text-center text-sm text-slate-500">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              {t("auth.signInInstead")}
            </Link>
          </p>

        </div>
      </div>

      {/* ── Right: Image Panel (hidden on mobile) ─────────────────────────── */}
      <div className="hidden lg:block lg:w-[55%] sticky top-0 h-screen relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1400&q=80"
          alt="Professional business meeting"
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Content over overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          {/* Top: brand */}
          <Link to="/home" className="inline-flex items-center gap-3 group w-fit">
            {resolvedLogoUrl ? (
              <img src={resolvedLogoUrl} alt={brandName} className="w-10 h-10 rounded-2xl object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <span className="text-white text-xl font-bold tracking-tight">{brandName}</span>
          </Link>

          {/* Middle: headline */}
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              {registrationType === "individual"
                ? <>Track your time.<br />Own your work.</>
                : <>Build your team.<br />Scale with ease.</>
              }
            </h2>
            <p className="text-white/90 text-base leading-relaxed max-w-sm">
              {registrationType === "individual"
                ? "The simplest way to log hours, report billables, and stay on top of every project — from anywhere."
                : "A unified platform for attendance, project tracking, and team analytics. Built for growing companies."
              }
            </p>
          </div>

          {/* Bottom: feature bullets */}
          <ul className="space-y-3">
            {(registrationType === "individual"
              ? [
                  "Free to get started — no credit card required",
                  "Log time by project and task",
                  "Automatic billable hour reports",
                  "Works seamlessly on all devices",
                ]
              : [
                  "Manage unlimited employees across teams",
                  "Role-based access: Admin, HR, Manager, Employee",
                  "Company-wide attendance and analytics",
                  "14-day free trial for your entire team",
                ]
            ).map((item, i) => (
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

    </div>
  );
};

export default Register;
