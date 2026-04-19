import React, { useState, useEffect } from "react";
import axios from "../../api/interceptor";
import { useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../../api/auth";
import { API_BASE_URL } from "../../api/config";
import CacheManager from "../../utils/cacheManager";
import type { User } from "../../api/auth";
import { setStoredTimezone } from "../../utils/dateUtils";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../../i18n/i18n";

interface Settings {
  enable_notifications: boolean;
  daily_digest: boolean;
  email_alerts: boolean;
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
  require_task_for_time_entry: boolean;
  ai_assistant_name: string;
  report_brand_name: string;
  report_brand_logo_url: string;
  report_accent_color: string;
}

type SettingsTab = "general" | "notifications" | "branding" | "account";

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();

  const TABS: { key: SettingsTab; label: string }[] = [
    { key: "general", label: t("settings.general") },
    { key: "notifications", label: t("settings.notificationsTab") },
    { key: "branding", label: t("settings.reportBranding") },
    { key: "account", label: t("settings.account") },
  ];
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<Settings>({
    enable_notifications: true,
    daily_digest: true,
    email_alerts: true,
    working_hours_start: "09:00",
    working_hours_end: "18:00",
    timezone: "Asia/Karachi",
    require_task_for_time_entry: false,
    ai_assistant_name: "",
    report_brand_name: "",
    report_brand_logo_url: "",
    report_accent_color: "#3b82f6",
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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
          if (cachedSettings.timezone) setStoredTimezone(cachedSettings.timezone);
          return; // Don't fetch if cache is still valid
        }
      }

      // Cache is invalid or doesn't exist, fetch from API
      const res = await axios.get(`${API_BASE_URL}/users/settings`);
      CacheManager.set("users/settings", res.data, {});
      setSettings(res.data);
      if (res.data?.timezone) setStoredTimezone(res.data.timezone);
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
      // Update cache with new settings and persist timezone for all date utils
      CacheManager.set("users/settings", settings, {});
      if (settings.timezone) setStoredTimezone(settings.timezone);
      setSaveMessage(t("common.settingsSaved"));
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage(error?.response?.data?.detail || t("settings.failedSaveSettings"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(t("settings.confirmLogoutAll"));
    if (!confirmed) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/logout-all`, {});
      await logout();
      navigate("/login");
    } catch (error: any) {
      alert(error?.response?.data?.detail || t("settings.failedLogoutAll"));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage("");
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMessage(t("settings.passwordMismatch"));
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordMessage(t("settings.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users/change-password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });

      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMessage(t("settings.passwordChanged"));
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (error: any) {
      setPasswordMessage(error?.response?.data?.detail || t("settings.failedPasswordChange"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_BASE_URL}/images/upload-profile-pic`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleSettingChange("report_brand_logo_url", res.data.profile_pic_url);
    } catch (error: any) {
      alert(error?.response?.data?.detail || t("settings.failedUploadLogo"));
    }
  };

  return (
    <div className="p-1">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isInitialLoading ? (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                  <div className="w-11 h-6 bg-slate-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
        <>

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Display Settings */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
                  {t("settings.displaySettings")}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.timezone")}</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleSettingChange("timezone", e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      <optgroup label="UTC">
                        <option value="UTC">UTC +00:00</option>
                      </optgroup>
                      <optgroup label="Africa">
                        <option value="Africa/Cairo">Africa/Cairo (EET, +02:00)</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg (SAST, +02:00)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT, +01:00)</option>
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT, +03:00)</option>
                      </optgroup>
                      <optgroup label="Americas">
                        <option value="America/Anchorage">America/Anchorage (AKST, -09:00)</option>
                        <option value="America/Bogota">America/Bogota (COT, -05:00)</option>
                        <option value="America/Chicago">America/Chicago (CST, -06:00)</option>
                        <option value="America/Denver">America/Denver (MST, -07:00)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST, -08:00)</option>
                        <option value="America/Mexico_City">America/Mexico_City (CST, -06:00)</option>
                        <option value="America/New_York">America/New_York (EST, -05:00)</option>
                        <option value="America/Phoenix">America/Phoenix (MST, -07:00)</option>
                        <option value="America/Sao_Paulo">America/Sao_Paulo (BRT, -03:00)</option>
                        <option value="America/Toronto">America/Toronto (EST, -05:00)</option>
                        <option value="America/Vancouver">America/Vancouver (PST, -08:00)</option>
                        <option value="Pacific/Honolulu">Pacific/Honolulu (HST, -10:00)</option>
                      </optgroup>
                      <optgroup label="Asia">
                        <option value="Asia/Baghdad">Asia/Baghdad (AST, +03:00)</option>
                        <option value="Asia/Bangkok">Asia/Bangkok (ICT, +07:00)</option>
                        <option value="Asia/Colombo">Asia/Colombo (SLST, +05:30)</option>
                        <option value="Asia/Dhaka">Asia/Dhaka (BST, +06:00)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST, +04:00)</option>
                        <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT, +07:00)</option>
                        <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT, +08:00)</option>
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB, +07:00)</option>
                        <option value="Asia/Karachi">Asia/Karachi (PKT, +05:00)</option>
                        <option value="Asia/Kathmandu">Asia/Kathmandu (NPT, +05:45)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST, +05:30)</option>
                        <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (MYT, +08:00)</option>
                        <option value="Asia/Kuwait">Asia/Kuwait (AST, +03:00)</option>
                        <option value="Asia/Manila">Asia/Manila (PHT, +08:00)</option>
                        <option value="Asia/Riyadh">Asia/Riyadh (AST, +03:00)</option>
                        <option value="Asia/Seoul">Asia/Seoul (KST, +09:00)</option>
                        <option value="Asia/Shanghai">Asia/Shanghai (CST, +08:00)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT, +08:00)</option>
                        <option value="Asia/Taipei">Asia/Taipei (CST, +08:00)</option>
                        <option value="Asia/Tashkent">Asia/Tashkent (UZT, +05:00)</option>
                        <option value="Asia/Tehran">Asia/Tehran (IRST, +03:30)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST, +09:00)</option>
                      </optgroup>
                      <optgroup label="Australia &amp; Pacific">
                        <option value="Australia/Adelaide">Australia/Adelaide (ACST, +09:30)</option>
                        <option value="Australia/Brisbane">Australia/Brisbane (AEST, +10:00)</option>
                        <option value="Australia/Darwin">Australia/Darwin (ACST, +09:30)</option>
                        <option value="Australia/Melbourne">Australia/Melbourne (AEST, +10:00)</option>
                        <option value="Australia/Perth">Australia/Perth (AWST, +08:00)</option>
                        <option value="Australia/Sydney">Australia/Sydney (AEST, +10:00)</option>
                        <option value="Pacific/Auckland">Pacific/Auckland (NZST, +12:00)</option>
                        <option value="Pacific/Fiji">Pacific/Fiji (FJT, +12:00)</option>
                      </optgroup>
                      <optgroup label="Europe">
                        <option value="Atlantic/Reykjavik">Atlantic/Reykjavik (GMT, +00:00)</option>
                        <option value="Europe/Amsterdam">Europe/Amsterdam (CET, +01:00)</option>
                        <option value="Europe/Athens">Europe/Athens (EET, +02:00)</option>
                        <option value="Europe/Berlin">Europe/Berlin (CET, +01:00)</option>
                        <option value="Europe/Brussels">Europe/Brussels (CET, +01:00)</option>
                        <option value="Europe/Bucharest">Europe/Bucharest (EET, +02:00)</option>
                        <option value="Europe/Copenhagen">Europe/Copenhagen (CET, +01:00)</option>
                        <option value="Europe/Dublin">Europe/Dublin (GMT, +00:00)</option>
                        <option value="Europe/Helsinki">Europe/Helsinki (EET, +02:00)</option>
                        <option value="Europe/Istanbul">Europe/Istanbul (TRT, +03:00)</option>
                        <option value="Europe/Kiev">Europe/Kiev (EET, +02:00)</option>
                        <option value="Europe/Lisbon">Europe/Lisbon (WET, +00:00)</option>
                        <option value="Europe/London">Europe/London (GMT, +00:00)</option>
                        <option value="Europe/Madrid">Europe/Madrid (CET, +01:00)</option>
                        <option value="Europe/Moscow">Europe/Moscow (MSK, +03:00)</option>
                        <option value="Europe/Oslo">Europe/Oslo (CET, +01:00)</option>
                        <option value="Europe/Paris">Europe/Paris (CET, +01:00)</option>
                        <option value="Europe/Prague">Europe/Prague (CET, +01:00)</option>
                        <option value="Europe/Rome">Europe/Rome (CET, +01:00)</option>
                        <option value="Europe/Stockholm">Europe/Stockholm (CET, +01:00)</option>
                        <option value="Europe/Warsaw">Europe/Warsaw (CET, +01:00)</option>
                        <option value="Europe/Zurich">Europe/Zurich (CET, +01:00)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.language")}</label>
                    <select
                      value={i18n.language}
                      onChange={(e) => {
                        const code = e.target.value;
                        i18n.changeLanguage(code);
                        localStorage.setItem("app-language", code);
                        const lang = LANGUAGES.find((l) => l.code === code);
                        document.documentElement.dir = lang?.dir || "ltr";
                        document.documentElement.lang = code;
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.nativeName} — {lang.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">{t("settings.languageDescription")}</p>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
                  {t("settings.workingHours")}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.startTime")}</label>
                    <input
                      type="time"
                      value={settings.working_hours_start}
                      onChange={(e) => handleSettingChange("working_hours_start", e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.endTime")}</label>
                    <input
                      type="time"
                      value={settings.working_hours_end}
                      onChange={(e) => handleSettingChange("working_hours_end", e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Time Entry */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-200">
                  {t("settings.timeEntry")}
                </h2>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{t("settings.requireTask")}</p>
                    <p className="text-sm text-slate-600">{t("settings.requireTaskDesc")}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_task_for_time_entry}
                      onChange={(e) => handleSettingChange("require_task_for_time_entry", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4 pb-3 border-b border-slate-200">{t("settings.aiAssistant")}</h2>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.assistantName")}</label>
                  <input
                    type="text"
                    value={settings.ai_assistant_name || ""}
                    onChange={(e) => handleSettingChange("ai_assistant_name", e.target.value)}
                    placeholder={t("settings.assistantNamePlaceholder")}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    maxLength={30}
                  />
                  <p className="text-xs text-slate-500 mt-1">{t("settings.assistantNameHint")}</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div>
              {saveMessage && (
                <div
                  className={`p-4 rounded-lg mb-4 ${saveMessage === t("common.settingsSaved")
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
                {loading ? t("common.saving") : t("settings.saveSettings")}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
                {t("settings.notificationPreferences")}
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{t("settings.enableNotifications")}</p>
                    <p className="text-sm text-slate-600">{t("settings.enableNotificationsDesc")}</p>
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
                    <p className="font-semibold text-slate-900">{t("settings.dailyDigest")}</p>
                    <p className="text-sm text-slate-600">{t("settings.dailyDigestDesc")}</p>
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
                    <p className="font-semibold text-slate-900">{t("settings.emailAlerts")}</p>
                    <p className="text-sm text-slate-600">{t("settings.emailAlertsDesc")}</p>
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

            {/* Save Button */}
            <div>
              {saveMessage && (
                <div
                  className={`p-4 rounded-lg mb-4 ${saveMessage === t("common.settingsSaved")
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
                {loading ? t("common.saving") : t("settings.saveSettings")}
              </button>
            </div>
          </div>
        )}

        {/* Report Branding Tab */}
        {activeTab === "branding" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
                {t("settings.brandingTitle")}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {t("settings.brandingDescription")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.brandName")}</label>
                  <input
                    type="text"
                    value={settings.report_brand_name}
                    onChange={(e) => handleSettingChange("report_brand_name", e.target.value)}
                    placeholder={t("settings.brandNamePlaceholder")}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">Shown in the PDF report header. Leave blank to use "SoftDesk".</p>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.accentColor")}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.report_accent_color}
                      onChange={(e) => handleSettingChange("report_accent_color", e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={settings.report_accent_color}
                      onChange={(e) => handleSettingChange("report_accent_color", e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Used for report header background, section titles, and chart accents.</p>
                </div>

                {/* Logo Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.brandLogo")}</label>
                  <div className="flex items-center gap-4">
                    {settings.report_brand_logo_url ? (
                      <div className="relative">
                        <img
                          src={`${API_BASE_URL}${settings.report_brand_logo_url}`}
                          alt="Brand logo"
                          className="w-16 h-16 rounded-lg object-contain border border-slate-200 bg-white"
                        />
                        <button
                          onClick={() => handleSettingChange("report_brand_logo_url", "")}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          x
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors">
                        {t("settings.uploadLogo")}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-slate-400 mt-1">PNG or JPG, max 2MB. Appears in top-left of PDF reports.</p>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.livePreview")}</label>
                  <div
                    className="rounded-lg p-4 text-white flex items-center justify-between"
                    style={{ background: `linear-gradient(135deg, ${settings.report_accent_color}, ${settings.report_accent_color}dd)` }}
                  >
                    <div className="flex items-center gap-3">
                      {settings.report_brand_logo_url && (
                        <img
                          src={`${API_BASE_URL}${settings.report_brand_logo_url}`}
                          alt="Logo"
                          className="w-8 h-8 rounded object-contain bg-white/20"
                        />
                      )}
                      <div>
                        <p className="font-bold text-sm">{settings.report_brand_name || "SoftDesk"}</p>
                        <p className="text-xs text-white/70">Attendance Report — Jan 1, 2026 — Mar 26, 2026</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/50">{t("settings.livePreview")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div>
              {saveMessage && (
                <div
                  className={`p-4 rounded-lg mb-4 ${saveMessage === t("common.settingsSaved")
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
                {loading ? t("common.saving") : t("settings.saveSettings")}
              </button>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-2 pb-4 border-b border-slate-200">
                {t("settings.changePassword")}
              </h2>
              <p className="text-sm text-slate-500 mb-4">{t("settings.updatePasswordDesc")}</p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
              >
                {t("settings.changePassword")}
              </button>
            </div>

            {/* Logout from All Devices */}
            <div className="bg-red-50 rounded-xl shadow-md border border-red-200 p-6">
              <h2 className="text-xl font-bold text-red-900 mb-4">{t("settings.logoutAllDevices")}</h2>
              <p className="text-red-700 mb-4">
                {t("settings.logoutAllDesc")}
              </p>
              <button
                onClick={handleLogoutAll}
                disabled={loading}
                className="w-full px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? t("common.processing") : t("settings.logoutAll")}
              </button>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold">{t("settings.changePassword")}</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                    setPasswordMessage("");
                  }}
                  className="text-white hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.currentPassword")}</label>
                    <input
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.newPassword")}</label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password (min 8 characters)"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("settings.confirmNewPassword")}</label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                    {passwordData.new_password && passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                      <p className="text-sm text-red-600 mt-1">{t("settings.passwordMismatch")}</p>
                    )}
                  </div>

                  {passwordMessage && (
                    <div
                      className={`p-4 rounded-lg ${passwordMessage === t("settings.passwordChanged")
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                      {passwordMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
                    setPasswordMessage("");
                  }}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? t("settings.updatingPassword") : t("settings.updatePassword")}
                </button>
              </div>
            </div>
          </div>
        )}

        </>
        )}
      </div>
    </div>
  );
};

export default Settings;
