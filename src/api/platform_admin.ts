import axios from "./interceptor";
import { API_BASE_URL } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  total_users: number;
  individual_users: number;
  employee_users: number;
  admin_users: number;
  active_users: number;
  inactive_users: number;
  total_companies: number;
  active_companies: number;
  total_departments: number;
  total_teams: number;
}

export interface PlatformUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  profile_pic_url?: string;
  account_type: string;
  is_active: boolean;
  job_title?: string;
  department?: string;
  created_at: string;
}

export interface PlatformCompany {
  id: number;
  company_name: string;
  company_email: string;
  company_logo_url?: string;
  company_size?: string;
  industry?: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  employee_count: number;
  department_count: number;
}

export interface RecentActivity {
  recent_users: {
    id: number;
    full_name: string;
    email: string;
    account_type: string;
    created_at: string;
  }[];
  recent_companies: {
    id: number;
    company_name: string;
    company_email: string;
    is_active: boolean;
    created_at: string;
  }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────

export const getPlatformStats = async (): Promise<PlatformStats> => {
  const res = await axios.get(`${API_BASE_URL}/platform-admin/stats`);
  return res.data;
};

export const getUsers = async (params?: {
  account_type?: string;
  is_active?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<{ total: number; users: PlatformUser[] }> => {
  const res = await axios.get(`${API_BASE_URL}/platform-admin/users`, { params });
  return res.data;
};

export const toggleUserActive = async (userId: number) => {
  const res = await axios.patch(`${API_BASE_URL}/platform-admin/users/${userId}/toggle-active`);
  return res.data;
};

export const getCompanies = async (params?: {
  is_active?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<{ total: number; companies: PlatformCompany[] }> => {
  const res = await axios.get(`${API_BASE_URL}/platform-admin/companies`, { params });
  return res.data;
};

export const toggleCompanyActive = async (companyId: number) => {
  const res = await axios.patch(`${API_BASE_URL}/platform-admin/companies/${companyId}/toggle-active`);
  return res.data;
};

export const getRecentActivity = async (limit = 10): Promise<RecentActivity> => {
  const res = await axios.get(`${API_BASE_URL}/platform-admin/recent-activity`, { params: { limit } });
  return res.data;
};

export interface OnboardingTrend {
  month: string;
  users: number;
  companies: number;
}

export const getOnboardingTrends = async (months = 6): Promise<OnboardingTrend[]> => {
  const res = await axios.get(`${API_BASE_URL}/platform-admin/onboarding-trends`, { params: { months } });
  return res.data;
};
