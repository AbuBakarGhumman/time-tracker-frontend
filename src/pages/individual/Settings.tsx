import React, { useState, useEffect } from "react";
import axios from "../../api/interceptor";
import { useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../../api/auth";
import { API_BASE_URL } from "../../api/config";
import CacheManager from "../../utils/cacheManager";
import type { User } from "../../api/auth";
import AnalogClockIcon from "../../components/AnalogClockIcon";

interface Settings {
  enable_notifications: boolean;
  daily_digest: boolean;
  email_alerts: boolean;
  theme: "light" | "dark";
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
}

const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    enable_notifications: true,
    daily_digest: true,
    email_alerts: true,
    theme: "light",
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    timezone: "Asia/Karachi",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(storedUser);
      loadSettings();
    }
  }, [navigate]);

  const loadSettings = async () => {
    try {
      // Check if cache is valid (not expired)
      if (CacheManager.isValid("users/settings", {})) {
        const cachedSettings = CacheManager.get<Settings>("users/settings", {});
        if (cachedSettings) {
          setSettings(cachedSettings);
          return; // Don't fetch if cache is still valid
        }
      }

      // Cache is invalid or doesn't exist, fetch from API
      const res = await axios.get(`${API_BASE_URL}/users/settings`);
      CacheManager.set("users/settings", res.data, {});
      setSettings(res.data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveMessage("");
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/users/settings`, settings);
      // Update cache with new settings
      CacheManager.set("users/settings", settings, {});
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage(error?.response?.data?.detail || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      setSaveMessage("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });
      setSaveMessage("Password changed successfully!");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      setShowPasswordModal(false);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage(error?.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = window.confirm("Are you sure you want to logout from all devices?");
    if (!confirmed) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/logout-all`, {});
      await logout();
      navigate("/login");
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to logout from all devices");
    } finally {
      setLoading(false);
    }
  };

  if (!user || isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-1">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-4 mb-6 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse" />
                <div>
                  <div className="h-6 bg-white/20 rounded w-32 mb-2 animate-pulse" />
                  <div className="h-4 bg-white/20 rounded w-64 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Content skeleton - 3 cards matching Settings cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-6 pb-4 border-b border-slate-100" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                    <div className="w-11 h-6 bg-slate-200 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                    <div className="w-11 h-6 bg-slate-200 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                    <div className="w-11 h-6 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-1">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Settings Header */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-4 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <AnalogClockIcon size={50} className="flex-shrink-0" />
            <div>
              <p className="text-base font-bold text-white mb-1 flex items-center gap-2">
                Settings
              </p>
              <p className="text-sm text-white/90">
                Manage your account preferences and configurations
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Main Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notification Settings */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              Notification Preferences
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">Enable Notifications</p>
                  <p className="text-sm text-slate-600">Receive push notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enable_notifications}
                    onChange={(e) => handleSettingChange("enable_notifications", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">Daily Digest</p>
                  <p className="text-sm text-slate-600">Receive a daily summary of your activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.daily_digest}
                    onChange={(e) => handleSettingChange("daily_digest", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">Email Alerts</p>
                  <p className="text-sm text-slate-600">Receive important alerts via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_alerts}
                    onChange={(e) => handleSettingChange("email_alerts", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              Display Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange("theme", e.target.value as "light" | "dark")}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSettingChange("timezone", e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Third Column with Working Hours and Security */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            {/* Working Hours Settings */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-200">
                Working Hours
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={settings.working_hours_start}
                    onChange={(e) => handleSettingChange("working_hours_start", e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={settings.working_hours_end}
                    onChange={(e) => handleSettingChange("working_hours_end", e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex-1 flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-200">Security</h2>
              <div className="flex-1 flex items-center">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings Button - Full Width Below Main Grid */}
        <div className="mt-6">
          {saveMessage && (
            <div
              className={`p-4 rounded-lg mb-4 ${saveMessage.includes("successfully")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
                }`}
            >
              {saveMessage}
            </div>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Logout from All Devices */}
        <div className="bg-red-50 rounded-xl shadow-md border border-red-200 p-6 lg:col-span-3">
          <h2 className="text-xl font-bold text-red-900 mb-4">Logout From All Devices</h2>
          <p className="text-red-700 mb-4">
            This will logout you from all devices and sessions. You will need to login again.
          </p>
          <button
            onClick={handleLogoutAll}
            disabled={loading}
            className="w-full px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Logout from All Devices"}
          </button>
        </div>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold">Change Password</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                  }}
                  className="text-white hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, current_password: e.target.value }))}
                      required
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))}
                      required
                      placeholder="Enter new password (min 8 characters)"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData((prev) => ({ ...prev, confirm_password: e.target.value }))}
                      required
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    />
                    {passwordData.new_password && passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                      <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="flex-shrink-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                  }}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
