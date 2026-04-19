/**
 * App Router — SoftDesk
 * React Router v6 routes (public + protected) with shared Header/Footer layout.
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { UserProvider } from "./context/UserContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AIAssistantProvider } from "./context/AIAssistantContext";
import { BrandingProvider } from "./context/BrandingContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import DashboardLayout from "./components/DashboardLayout";
import PlatformAdminLayout from "./components/PlatformAdminLayout";

import Intro from "./pages/site/Intro";
import Login from "./pages/site/Login";
import Register from "./pages/site/Register";

import Home from "./pages/individual/Home";
import TimeTracker from "./pages/individual/TimeTracker";
import Reports from "./pages/individual/Reports";
import Projects from "./pages/individual/Projects";
import ProjectBoard from "./pages/individual/ProjectBoard";
import ProjectSettings from "./pages/individual/ProjectSettings";
import Profile from "./pages/individual/Profile";
import Settings from "./pages/individual/Settings";
import Notifications from "./pages/individual/Notifications";

import About from "./pages/site/About";
import PrivacyPolicy from "./pages/site/PrivacyPolicy";
import TermsOfService from "./pages/site/TermsOfService";

// Company role-based dashboards
import AdminDashboard from "./pages/company/admin/AdminDashboard";
import HRDashboard from "./pages/company/hr/HrDashboard";
import ManagerDashboard from "./pages/company/manager/ManagerDashboard";
import TeamDashboard from "./pages/company/teamlead/TeamLeadDashboard";
import EmployeeDashboard from "./pages/company/employee/EmployeeDashboard";

// Platform Admin
import PlatformDashboard from "./pages/platform_admin/PlatformDashboard";
import PlatformUsers from "./pages/platform_admin/PlatformUsers";
import PlatformCompanies from "./pages/platform_admin/PlatformCompanies";
import PlatformAnalytics from "./pages/platform_admin/PlatformAnalytics";
import PlatformProfile from "./pages/platform_admin/PlatformProfile";
import PlatformSettings from "./pages/platform_admin/PlatformSettings";
import PlatformBranding from "./pages/platform_admin/PlatformBranding";

import { getStoredToken } from "./api/auth";
import axios from "./api/interceptor";
import { useDetectPageRefresh, initializeCacheRefreshDetection } from "./utils/cacheManager";

// Initialize cache refresh detection immediately when app loads
initializeCacheRefreshDetection();

// Initialize auth token on app startup
const initializeAuth = () => {
  const access_token = localStorage.getItem("access_token");
  if (access_token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  }
};

initializeAuth();

// Protected Route Component
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const token = getStoredToken();
  return token ? element : <Navigate to="/login" replace />;
};

// Reusable public layout wrapper
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  // Initialize auth state on app load - restores token from either localStorage or sessionStorage
  useDetectPageRefresh();

  useEffect(() => {
    // Auth initialization handled by api/interceptor
  }, []);

  return (
    <ThemeProvider>
    <BrandingProvider>
    <UserProvider>
    <AIAssistantProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <div className="min-h-screen flex flex-col">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<PublicLayout><Intro /></PublicLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
            <Route path="/terms-of-service" element={<PublicLayout><TermsOfService /></PublicLayout>} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute element={<DashboardLayout><Home /></DashboardLayout>} />} />
            <Route path="/time-tracker" element={<ProtectedRoute element={<DashboardLayout><TimeTracker /></DashboardLayout>} />} />
            <Route path="/reports" element={<ProtectedRoute element={<DashboardLayout><Reports /></DashboardLayout>} />} />
            <Route path="/projects" element={<ProtectedRoute element={<DashboardLayout><Projects /></DashboardLayout>} />} />
            <Route path="/projects/:id/board" element={<ProtectedRoute element={<DashboardLayout><ProjectBoard /></DashboardLayout>} />} />
            <Route path="/projects/:id/settings" element={<ProtectedRoute element={<DashboardLayout><ProjectSettings /></DashboardLayout>} />} />
            <Route path="/profile" element={<ProtectedRoute element={<DashboardLayout><Profile /></DashboardLayout>} />} />
            <Route path="/settings" element={<ProtectedRoute element={<DashboardLayout><Settings /></DashboardLayout>} />} />
            <Route path="/notifications" element={<ProtectedRoute element={<DashboardLayout><Notifications /></DashboardLayout>} />} />

            {/* Company Dashboards */}
            <Route path="/company/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} />} />
            <Route path="/company/hr-dashboard" element={<ProtectedRoute element={<HRDashboard />} />} />
            <Route path="/company/manager-dashboard" element={<ProtectedRoute element={<ManagerDashboard />} />} />
            <Route path="/company/team-dashboard" element={<ProtectedRoute element={<TeamDashboard />} />} />
            <Route path="/company/employee-dashboard" element={<ProtectedRoute element={<EmployeeDashboard />} />} />

            {/* Platform Admin */}
            <Route path="/platform/admin-dashboard" element={<ProtectedRoute element={<PlatformAdminLayout><PlatformDashboard /></PlatformAdminLayout>} />} />
            <Route path="/platform/users" element={<ProtectedRoute element={<PlatformAdminLayout><PlatformUsers /></PlatformAdminLayout>} />} />
            <Route path="/platform/companies" element={<ProtectedRoute element={<PlatformAdminLayout><PlatformCompanies /></PlatformAdminLayout>} />} />
            <Route path="/platform/analytics" element={<ProtectedRoute element={<PlatformAdminLayout><PlatformAnalytics /></PlatformAdminLayout>} />} />
            <Route path="/platform/profile" element={<ProtectedRoute element={<PlatformAdminLayout><PlatformProfile /></PlatformAdminLayout>} />} />
            <Route path="/platform/settings" element={<ProtectedRoute element={<PlatformAdminLayout><PlatformSettings /></PlatformAdminLayout>} />} />
            <Route path="/platform/branding" element={<ProtectedRoute element={<PlatformAdminLayout><PlatformBranding /></PlatformAdminLayout>} />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AIAssistantProvider>
    </UserProvider>
    </BrandingProvider>
    </ThemeProvider>
  );
}

export default App;