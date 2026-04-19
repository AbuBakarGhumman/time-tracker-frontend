import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getStoredToken, getStoredUser, logout, getUserType, getStoredEmployee } from "../api/auth";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../api/config";
import { useBranding } from "../context/BrandingContext";

interface UserProfile {
  full_name: string;
  profile_pic_url?: string;
}

const Header: React.FC = () => {
  const { brandName, resolvedLogoUrl } = useBranding();
  const { user: contextUser } = useUser();
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [dashboardLink, setDashboardLink] = useState("/dashboard");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getRoleBasedDashboardLink = (role: string): string => {
    const roleMap: Record<string, string> = {
      "company_admin": "/company/admin-dashboard",
      "hr": "/company/hr-dashboard",
      "manager": "/company/manager-dashboard",
      "team_lead": "/company/team-dashboard",
      "employee": "/company/employee-dashboard"
    };
    return roleMap[role] || "/company/employee-dashboard";
  };

  const getProfileImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    if (contextUser) {
      setUserProfile({
        full_name: contextUser.full_name,
        profile_pic_url: getProfileImageUrl(contextUser.profile_pic_url)
      });
    }
  }, [contextUser?.id, contextUser?.profile_pic_url]);

  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(!!token);

    if (token) {
      const currentUserType = getUserType();
      setUserType(currentUserType);

      if (currentUserType === "individual") {
        const storedUser = contextUser || getStoredUser();
        if (storedUser) {
          setUserProfile({
            full_name: storedUser.full_name,
            profile_pic_url: getProfileImageUrl(storedUser.profile_pic_url)
          });
        }
        setDashboardLink("/dashboard");
      } else if (currentUserType === "employee") {
        const storedEmployee = getStoredEmployee();
        if (storedEmployee) {
          setUserProfile({
            full_name: storedEmployee.full_name,
            profile_pic_url: getProfileImageUrl(storedEmployee.profile_pic_url)
          });
          setDashboardLink(getRoleBasedDashboardLink(storedEmployee.company_role));
        }
      }
    }
  }, [contextUser?.id]);

  const handleHashNav = (e: React.MouseEvent, hash: string) => {
    if (location.pathname === "/home") {
      e.preventDefault();
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setUserProfile(null);
    setUserType(null);
    setDashboardLink("/dashboard");
    navigate("/home");
  };

  return (
    <header className={`bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-shadow duration-300 ${scrolled ? "header-scrolled" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/home" className="flex items-center gap-3 group flex-shrink-0">
            {resolvedLogoUrl ? (
              <img
                src={resolvedLogoUrl}
                alt={brandName}
                className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm shadow-blue-500/20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <span className="text-slate-900 font-bold text-xl tracking-tight">
              {brandName}
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-8">
            {isLoggedIn ? (
              <div className="flex items-center gap-6">
                <Link
                  to={dashboardLink}
                  className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
                >
                  {t("common.dashboard")}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 group"
                    aria-expanded={isProfileMenuOpen}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center overflow-hidden border-2 border-slate-200 group-hover:border-blue-300 transition-all duration-200">
                      {userProfile?.profile_pic_url ? (
                        <img
                          src={userProfile.profile_pic_url}
                          alt={userProfile.full_name || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{userProfile?.full_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {userType === "individual" ? t("common.individual") : t("common.companyEmployee")}
                        </p>
                      </div>
                      <Link
                        to={dashboardLink}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {t("common.dashboard")}
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t("common.logout")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {[
                  { label: "Features",     to: "/home#features",   hash: "#features" },
                  { label: "How It Works", to: "/home#howitworks", hash: "#howitworks" },
                  { label: "Pricing",      to: "/home#pricing",    hash: "#pricing" },
                  { label: "About",        to: "/about",           hash: null },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={item.hash ? (e) => handleHashNav(e, item.hash!) : undefined}
                    className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm rounded-lg transition-all duration-150"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="w-px h-5 bg-slate-200 mx-3" />
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium text-sm rounded-lg transition-colors"
                >
                  {t("common.login")}
                </Link>
                <Link
                  to="/register"
                  className="ml-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          {/* ── Mobile Menu Button ── */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <nav className="flex flex-col gap-1">
            {isLoggedIn ? (
              <>
                <Link
                  to={dashboardLink}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center overflow-hidden border-2 border-slate-200 flex-shrink-0">
                    {userProfile?.profile_pic_url ? (
                      <img src={userProfile.profile_pic_url} alt={userProfile.full_name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{userProfile?.full_name}</div>
                    <div className="text-xs text-slate-500">{t("common.dashboard")}</div>
                  </div>
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-1 border-t border-slate-100 pt-4 text-left"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">{t("common.logout")}</span>
                </button>
              </>
            ) : (
              <>
                {[
                  { label: "Features",     to: "/home#features",   hash: "#features" },
                  { label: "How It Works", to: "/home#howitworks", hash: "#howitworks" },
                  { label: "Pricing",      to: "/home#pricing",    hash: "#pricing" },
                  { label: "About",        to: "/about",           hash: null },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      if (item.hash) handleHashNav(e, item.hash);
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-slate-100 mt-2 pt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t("common.login")}
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-semibold text-center transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
