import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../api/auth";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../api/config";
import type { User } from "../api/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const LG_BREAKPOINT_PX = 1024;

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user: contextUser } = useUser();
  const [user, setUser] = useState<User | null>(contextUser);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Update local user state when context user changes (e.g., after profile update)
  useEffect(() => {
    if (contextUser) {
      setUser(contextUser);
    }
  }, [contextUser]);

  useEffect(() => {
    const storedUser = contextUser || getStoredUser();
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(storedUser);
      
      // Check if greeting was already shown in this session
      const greetingShown = sessionStorage.getItem("_greetingShown");
      if (!greetingShown) {
        // First time in this session, show greeting
        setShowGreeting(true);
        sessionStorage.setItem("_greetingShown", "true");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const t1 = setTimeout(() => setGreetingVisible(true), 300);
    const t2 = setTimeout(() => setGreetingVisible(false), 3500);
    const t3 = setTimeout(() => setShowGreeting(false), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [user]);

  // Keep collapse state desktop-only (recommended)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < LG_BREAKPOINT_PX) {
        setCollapsed(false);
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = async () => {
    // Clear greeting flag so it shows again on next login
    sessionStorage.removeItem("_greetingShown");
    await logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const profileImageUrl = user.profile_pic_url ? `${API_BASE_URL}${user.profile_pic_url}` : null;
  const firstName = user.full_name;

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      name: "Time Tracker",
      path: "/time-tracker",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      name: "Reports",
      path: "/reports",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      name: "Projects",
      path: "/projects",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01m-3-5h.01m-.01 4h.01",
    },
    {
      name: "Profile",
      path: "/profile",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
      name: "Settings",
      path: "/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M12 15a3 3 0 100-6 3 3 0 000 6z",
    },
  ];

  // ── Tooltip wrapper — only renders when sidebar is collapsed ──────────
  const NavTooltip = ({ label }: { label: string }) => (
    <div
      className="
        absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
        px-2.5 py-1.5 bg-slate-700 text-white text-xs font-medium rounded-md
        whitespace-nowrap pointer-events-none
        opacity-0 group-hover:opacity-100
        transition-opacity duration-150
      "
    >
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-700" />
    </div>
  );

  const handleHeaderMenuClick = () => {
    if (window.innerWidth >= LG_BREAKPOINT_PX) {
      setCollapsed((c) => !c); // Desktop: collapse/expand
    } else {
      setMobileSidebarOpen(true); // Mobile: open overlay
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-[20px] h-16 flex items-center justify-between z-50">
        {/* LEFT — Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleHeaderMenuClick}
            className="p-0.5 hover:bg-slate-800 rounded-lg transition-colors mr-1"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <span className="text-[22px] font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            TimeTrack Pro
          </span>
        </div>

        {/* RIGHT — greeting + user + avatar */}
        <div className="flex items-center gap-4">
          {showGreeting && (
            <div
              className="hidden sm:block"
              style={{
                transition: "opacity 0.6s ease, transform 0.6s ease",
                opacity: greetingVisible ? 1 : 0,
                transform: greetingVisible ? "translateY(0px)" : "translateY(8px)",
              }}
            >
              <p className="text-sm text-slate-300 leading-tight whitespace-nowrap">
                👋&nbsp;Welcome back, <span className="font-semibold text-white">{firstName}!</span>
              </p>
            </div>
          )}

          {showGreeting && (
            <div
              className="hidden sm:block w-px h-5 bg-slate-700"
              style={{ transition: "opacity 0.6s ease", opacity: greetingVisible ? 1 : 0 }}
            />
          )}

          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-white leading-tight">{user.full_name}</p>
            <p className="text-xs text-slate-400 leading-tight">{user.job_title}</p>
          </div>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-white/20 flex-shrink-0">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
        </div>
      </header>

      {/* ── BELOW HEADER: SIDEBAR + BODY ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── DESKTOP SIDEBAR — collapsible ─────────────────────────────── */}
        <aside
          className={`
            hidden lg:flex flex-col flex-shrink-0 relative
            bg-slate-900 border-r border-slate-800
            transition-[width] duration-300 ease-in-out overflow-hidden
            ${collapsed ? "w-16" : "w-52"}
          `}
        >
          {/* Nav links */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    className={`
                      flex items-center rounded-lg transition-all duration-200 text-sm font-medium
                      px-3.5 py-2.5
                      ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }
                    `}
                  >
                    {/* ✅ Icon always same X position (no center on collapse) */}
                    <span className="w-8 flex justify-start flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </span>

                    {/* ✅ Text hides/reveals, icon never moves */}
                    <span
                      className="whitespace-nowrap overflow-hidden transition-all duration-300"
                      style={{
                        maxWidth: collapsed ? "0px" : "200px",
                        opacity: collapsed ? 0 : 1,
                      }}
                    >
                      {item.name}
                    </span>
                  </Link>

                  {collapsed && <NavTooltip label={item.name} />}
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-2 pb-3 border-t border-slate-800 pt-3">
            <div className="relative group">
              <button
                onClick={handleLogout}
                className="
                  w-full flex items-center rounded-lg transition-all duration-200 text-sm font-medium
                  text-slate-400 hover:text-red-400 hover:bg-red-500/10
                  px-3.5 py-2.5
                "
              >
                <span className="w-8 flex justify-start flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </span>

                <span
                  className="whitespace-nowrap overflow-hidden transition-all duration-300"
                  style={{
                    maxWidth: collapsed ? "0px" : "200px",
                    opacity: collapsed ? 0 : 1,
                  }}
                >
                  Logout
                </span>
              </button>

              {collapsed && <NavTooltip label="Logout" />}
            </div>
          </div>
        </aside>

        {/* ── MOBILE SIDEBAR — overlay ─────────────────────────────────── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-52 bg-slate-900 border-r border-slate-800
            transform transition-transform duration-300 ease-in-out lg:hidden
            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{ top: "4rem" }}
        >
          <div className="flex flex-col h-full py-4">
            <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium
                      ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }
                    `}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="px-2 pt-3 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
        )}

        {/* ── MAIN BODY ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;