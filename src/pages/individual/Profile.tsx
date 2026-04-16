import React, { useState, useEffect } from "react";
import axios from "../../api/interceptor";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getStoredUser } from "../../api/auth";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../api/config";
import type { User } from "../../api/auth";
import AnalogClockIcon from "../../components/AnalogClockIcon";
import { CacheManager } from "../../utils/cacheManager";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { updateUser: updateContextUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    job_title: "",
    department: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Local preview only used when user picks a new file before saving
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  // Build the full image URL from a relative path stored in user.profile_pic_url
  const getProfileImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    return `${API_BASE_URL}${url}`;
  };

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const loadUserProfile = async () => {
      try {
        const cachedProfile = CacheManager.get<User>("profile/user");

        if (cachedProfile && CacheManager.isValid("profile/user")) {
          setUser(cachedProfile);
          setFormData({
            full_name: cachedProfile.full_name || "",
            job_title: cachedProfile.job_title || "",
            department: cachedProfile.department || "",
          });
          setIsInitialLoading(false);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/users/me`);
        const userData = res.data;

        CacheManager.set("profile/user", userData);

        setUser(userData);
        setFormData({
          full_name: userData.full_name || "",
          job_title: userData.job_title || "",
          department: userData.department || "",
        });
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setUser(storedUser);
        setFormData({
          full_name: storedUser.full_name || "",
          job_title: storedUser.job_title || "",
          department: storedUser.department || "",
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Only use FileReader for the temporary local preview while editing
      const reader = new FileReader();
      reader.onloadend = () => setLocalPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("full_name", formData.full_name);
      formDataToSend.append("job_title", formData.job_title);
      formDataToSend.append("department", formData.department);

      if (selectedFile) {
        formDataToSend.append("file", selectedFile);
      }

      const response = await axios.put(`${API_BASE_URL}/users/profile`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response.data.user as User;
      setUser(updatedUser);
      updateContextUser(updatedUser);

      // Clear cache so fresh data is fetched on next load
      CacheManager.clear("profile/user");

      setShowEditModal(false);
      setSelectedFile(null);
      setLocalPreview(null);
      alert(t("profile.profileUpdated"));
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // The avatar shown on the main page — always built from user.profile_pic_url
  const avatarSrc = getProfileImageUrl(user?.profile_pic_url);

  // The avatar shown inside the edit modal — uses local preview if user picked a new file
  const modalAvatarSrc = localPreview ?? getProfileImageUrl(user?.profile_pic_url);

  return (
    <div className="p-1">
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-4 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <AnalogClockIcon size={50} className="flex-shrink-0" />
            <div>
              <p className="text-base font-bold text-white mb-1 flex items-center gap-2">
                {t("profile.title")}
              </p>
              <p className="text-sm text-white/90">
                {t("profile.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isInitialLoading || !user ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 animate-pulse">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-slate-200 mx-auto mb-6" />
              <div className="h-6 bg-slate-200 rounded w-3/4 mx-auto mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/3 mx-auto mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto mt-4 mb-6" />
              <div className="w-full h-10 bg-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-6 pb-4 border-b border-slate-100" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg mx-auto mb-6">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.full_name}</h2>
            <p className="text-slate-600 mb-1">{user.job_title || t("profile.noJobTitle")}</p>
            <p className="text-sm text-slate-500">{user.department || t("profile.noDepartment")}</p>
            <p className="text-sm text-slate-500 mt-2">{user.email}</p>

            <button
              onClick={() => setShowEditModal(true)}
              className="w-full mt-6 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
            >
              {t("profile.editProfile")}
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              {t("profile.personalInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 font-semibold mb-2">{t("profile.fullName")}</p>
                <p className="text-base text-slate-900">{user.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold mb-2">{t("profile.emailAddress")}</p>
                <p className="text-base text-slate-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold mb-2">{t("profile.jobTitle")}</p>
                <p className="text-base text-slate-900">{user.job_title || t("common.na")}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold mb-2">{t("profile.department")}</p>
                <p className="text-base text-slate-900">{user.department || t("common.na")}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              {t("profile.accountInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 font-semibold mb-2">{t("profile.username")}</p>
                <p className="text-base text-slate-900">{user.username || t("common.na")}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold mb-2">{t("profile.role")}</p>
                <p className="text-base text-slate-900 capitalize">{user.role || "Employee"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">{t("profile.editProfile")}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedFile(null);
                  setLocalPreview(null);
                }}
                className="text-white hover:text-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex flex-col items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {modalAvatarSrc ? (
                      <img src={modalAvatarSrc} alt={user?.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById("profileImageInput")?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-all duration-200 border-4 border-white"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("profile.fullName")}</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("profile.jobTitle")}</label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("profile.department")}</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedFile(null);
                  setLocalPreview(null);
                  setFormData({
                    full_name: user?.full_name || "",
                    job_title: user?.job_title || "",
                    department: user?.department || "",
                  });
                }}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? t("common.saving") : t("profile.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;