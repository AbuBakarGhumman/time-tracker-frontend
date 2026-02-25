import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredToken, getStoredUser, logout, getUserType, getStoredEmployee } from "../api/auth";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../api/config";

interface UserProfile {
  full_name: string;
  profile_pic_url?: string;
}

const Header: React.FC = () => {
  const { user: contextUser } = useUser();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [dashboardLink, setDashboardLink] = useState("/dashboard");
  const navigate = useNavigate();

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

  // Construct image URL directly from user data (no fetching needed)
  const getProfileImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    return `${API_BASE_URL}${url}`;
  };

  // Update user profile from context when it changes (e.g., after profile update)
  useEffect(() => {
    if (contextUser) {
      setUserProfile({
        full_name: contextUser.full_name,
        profile_pic_url: getProfileImageUrl(contextUser.profile_pic_url)
      });
    }
  }, [contextUser?.id, contextUser?.profile_pic_url]);

  // Set up login state and dashboard link based on user type
  useEffect(() => {
    const token = getStoredToken();
    setIsLoggedIn(!!token);
    
    if (token) {
      const currentUserType = getUserType();
      setUserType(currentUserType);

      // Handle individual user
      if (currentUserType === "individual") {
        const storedUser = contextUser || getStoredUser();
        if (storedUser) {
          setUserProfile({
            full_name: storedUser.full_name,
            profile_pic_url: getProfileImageUrl(storedUser.profile_pic_url)
          });
        }
        setDashboardLink("/dashboard");
      }
      // Handle company employee
      else if (currentUserType === "employee") {
        const storedEmployee = getStoredEmployee();
        if (storedEmployee) {
          setUserProfile({
            full_name: storedEmployee.full_name,
            profile_pic_url: getProfileImageUrl(storedEmployee.profile_pic_url)
          });
          // Route to the correct company dashboard based on role
          const dashLink = getRoleBasedDashboardLink(storedEmployee.company_role);
          setDashboardLink(dashLink);
        }
      }
    }
  }, [contextUser?.id]);

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setUserProfile(null);
    setUserType(null);
    setDashboardLink("/dashboard");
    navigate("/home");
  };
  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TimeTrack Pro
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isLoggedIn ? (
            <div className="flex items-center gap-6">
              <Link 
                to={dashboardLink} 
                className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Dashboard
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-white/20 group-hover:border-white/40 transition-all duration-300 group-hover:scale-110">
                    {userProfile?.profile_pic_url ? (
                      <img 
                        src={userProfile.profile_pic_url} 
                        alt={userProfile.full_name || "User"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-sm font-semibold text-white">{userProfile?.full_name}</p>
                      <p className="text-xs text-slate-400">{userType === "individual" ? "Individual" : "Company Employee"}</p>
                    </div>
                    <Link
                      to={dashboardLink}
                      className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors border-t border-slate-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-white/10">
          <nav className="flex flex-col gap-3 mt-4">
            {isLoggedIn ? (
              <>
                <Link 
                  to={dashboardLink} 
                  className="text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-2 border-white/20">
                    {userProfile?.profile_pic_url ? (
                      <img 
                        src={userProfile.profile_pic_url} 
                        alt={userProfile.full_name || "User"} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-red-400 hover:text-red-300 hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 font-medium border-t border-white/10 mt-2 pt-3"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;