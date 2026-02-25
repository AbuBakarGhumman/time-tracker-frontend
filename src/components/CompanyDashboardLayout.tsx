// CompanyDashboardLayout.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/config";
import { logout } from "../api/auth";

interface CompanyDashboardLayoutProps {
  children: React.ReactNode;
}

const LG_BREAKPOINT_PX = 1024;

const getNavItems = (role: string) => {
  const base = [
    { name: "Dashboard", path: `/company/${role}-dashboard`, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  ];

  const roleItems: Record<string, typeof base> = {
    company_admin: [
      { name: "Employees", path: "/company/employees", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { name: "Departments", path: "/company/departments", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
      { name: "Teams", path: "/company/teams", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
      { name: "Attendance", path: "/company/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
      { name: "Reports", path: "/company/reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { name: "Settings", path: "/company/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    ],
    hr: [
      { name: "Employees", path: "/company/employees", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
      { name: "Attendance", path: "/company/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
      { name: "Leave Requests", path: "/company/leave-requests", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { name: "Reports", path: "/company/reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    ],
    manager: [
      { name: "My Team", path: "/company/my-team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
      { name: "Attendance", path: "/company/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
      { name: "Reports", path: "/company/reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    ],
    team_lead: [
      { name: "My Team", path: "/company/my-team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
      { name: "Attendance", path: "/company/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    ],
    employee: [
      { name: "My Attendance", path: "/company/my-attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
      { name: "Time Tracker", path: "/company/time-tracker", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    ],
  };

  return [...base, ...(roleItems[role] || roleItems.employee)];
};

{/*const roleColors: Record<string, { gradient: string; badge: string; text: string }> = {
  company_admin: { gradient: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-200 border-violet-500/30", text: "Admin" },
  hr: { gradient: "from-rose-600 to-pink-700", badge: "bg-rose-500/20 text-rose-200 border-rose-500/30", text: "HR" },
  manager: { gradient: "from-amber-600 to-orange-700", badge: "bg-amber-500/20 text-amber-200 border-amber-500/30", text: "Manager" },
  team_lead: { gradient: "from-teal-600 to-emerald-700", badge: "bg-teal-500/20 text-teal-200 border-teal-500/30", text: "Team Lead" },
  employee: { gradient: "from-sky-600 to-blue-700", badge: "bg-sky-500/20 text-sky-200 border-sky-500/30", text: "Employee" },
};*/}

const roleColors: Record<string, { gradient: string; badge: string; text: string }> = {
  company_admin: { gradient: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-200 border-violet-500/30", text: "Admin" },
  hr: { gradient: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-200 border-violet-500/30", text: "HR" },
  manager: { gradient: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-200 border-violet-500/30", text: "Manager" },
  team_lead: { gradient: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-200 border-violet-500/30", text: "Team Lead" },
  employee: { gradient: "from-violet-600 to-indigo-700", badge: "bg-violet-500/20 text-violet-200 border-violet-500/30", text: "Employee" },
};

const CompanyDashboardLayout: React.FC<CompanyDashboardLayoutProps> = ({ children }) => {
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [greetingVisible, setGreetingVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmployee = localStorage.getItem("employee");
    const storedCompany = localStorage.getItem("company");
    if (!storedEmployee) {
      navigate("/login");
      return;
    }
    setEmployee(JSON.parse(storedEmployee));
    if (storedCompany) setCompany(JSON.parse(storedCompany));
  }, [navigate]);

  // Resolve image URLs with API base URL
  const resolvedProfilePicUrl = employee?.profile_pic_url ? `${API_BASE_URL}${employee.profile_pic_url}` : null;
  const resolvedCompanyLogoUrl = company?.company_logo_url ? `${API_BASE_URL}${company.company_logo_url}` : null;

  useEffect(() => {
    if (!employee) return;
    const t1 = setTimeout(() => setGreetingVisible(true), 300);
    const t2 = setTimeout(() => setGreetingVisible(false), 3500);
    const t3 = setTimeout(() => setShowGreeting(false), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [employee]);

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
    await logout();
    navigate("/login");
  };

  if (!employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const role = employee.company_role || "employee";
  const colors = roleColors[role] || roleColors.employee;
  const navItems = getNavItems(role);
  const firstName = employee.full_name?.split(" ")[0] || "User";

  const handleHeaderMenuClick = () => {
    if (window.innerWidth >= LG_BREAKPOINT_PX) {
      setCollapsed((c) => !c);
    } else {
      setMobileSidebarOpen(true);
    }
  };

  const NavTooltip = ({ label }: { label: string }) => (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 px-2.5 py-1.5 bg-slate-700 text-white text-xs font-medium rounded-md whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-700" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800 px-[20px] h-16 flex items-center justify-between z-50">
        {/* LEFT — Brand + Company */}
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

          <div className={`w-8 h-8 bg-gradient-to-br ${colors.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <span className="text-[22px] font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            TimeTrack Pro
          </span>

          {/* Company logo and name */}
          {company && (
            <>
              <div className="hidden md:block w-px h-6 bg-slate-700" />
              <div className="hidden md:flex items-center gap-2">
                {resolvedCompanyLogoUrl ? (
                  <img 
                    src={resolvedCompanyLogoUrl} 
                    alt={company.company_name}
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                <span className="text-sm font-medium text-slate-300">
                  {company.company_name}
                </span>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — greeting + user info + avatar */}
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
            <p className="text-sm font-semibold text-white leading-tight">{employee.full_name}</p>
            <p className="text-xs text-slate-400 leading-tight">{colors.text}</p>
          </div>

          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center overflow-hidden border-2 border-white/20 flex-shrink-0`}>
            {resolvedProfilePicUrl ? (
              <img src={resolvedProfilePicUrl} alt={employee.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">{firstName[0]}</span>
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
                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg`
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }
                    `}
                  >
                    <span className="w-8 flex justify-start flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </span>

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
                className="w-full flex items-center rounded-lg transition-all duration-200 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-3.5 py-2.5"
              >
                <span className="w-8 flex justify-start flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                        ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg`
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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

export default CompanyDashboardLayout;