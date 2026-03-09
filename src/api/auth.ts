import axios from "axios";
import { API_BASE_URL } from "./config";
import CacheManager from "../utils/cacheManager";

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL USER TYPES (EXISTING - NO CHANGES)
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  full_name: string;
  username: string;
  email: string;
  password: string;
  job_title?: string;
  department?: string;
  profile_pic_url?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  profile_pic_url?: string;
  job_title?: string;
  department?: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY TYPES (NEW)
// ─────────────────────────────────────────────────────────────────────────────

export interface CompanyRegisterPayload {
  company_name: string;
  company_email: string;
  company_logo_url?: string;
  company_size?: string;
  industry?: string;
  address?: string;
  phone?: string;
  website?: string;
  admin_name: string;
  admin_email: string;
  admin_username: string;
  password: string;
}

export interface Employee {
  id: number;
  company_id: number;
  department_id?: number;
  team_id?: number;
  email: string;
  username: string;
  full_name: string;
  profile_pic_url?: string;
  job_title?: string;
  company_role: string;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: number;
  company_name: string;
  company_email: string;
  company_logo_url?: string;
  company_size?: string;
  industry?: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  employee: Employee;
  company: Company;
}

export interface PlatformAdminAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  admin: {
    id: number;
    email: string;
    username: string;
    full_name: string;
    profile_pic_url?: string;
    admin_level: string;
    is_active: boolean;
  };
}

export interface PlatformAdmin {
  id: number;
  email: string;
  username: string;
  full_name: string;
  profile_pic_url?: string;
  admin_level: string;
  is_active: boolean;
}

export interface UnifiedLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_type: "individual" | "employee" | "platform_admin";
  user?: User;
  employee?: Employee;
  company?: Company;
  admin?: PlatformAdmin;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPER
// "Remember me" → localStorage (persists across browser sessions)
// No "remember me" → sessionStorage (cleared when browser/tab closes)
// ─────────────────────────────────────────────────────────────────────────────

const AUTH_KEYS = ["access_token", "refresh_token", "user_type", "user", "employee", "company", "platform_admin"] as const;

function getAuthStore(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function setAuthStore(key: string, value: string, rememberMe: boolean): void {
  if (rememberMe) {
    localStorage.setItem(key, value);
  } else {
    sessionStorage.setItem(key, value);
  }
}

function clearAuthStore(): void {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL USER FUNCTIONS (EXISTING - NO CHANGES)
// ─────────────────────────────────────────────────────────────────────────────

export const registerUser = async (payload: RegisterPayload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Registration failed");
  }
};

export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, payload);
    const { access_token, refresh_token, user } = response.data;
    
    // Save tokens and user to localStorage
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("user_type", "individual");
    
    // Set default header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Login failed");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED LOGIN (NEW - RECOMMENDED)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unified login that automatically detects user type
 * Use this instead of loginUser for a seamless experience
 */
export const unifiedLogin = async (
  payload: LoginPayload,
  rememberMe: boolean = false,
): Promise<UnifiedLoginResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/unified-login`, payload);
    const { access_token, refresh_token, user_type } = response.data;

    setAuthStore("access_token", access_token, rememberMe);
    setAuthStore("refresh_token", refresh_token, rememberMe);
    setAuthStore("user_type", user_type, rememberMe);

    if (user_type === "individual" && response.data.user) {
      setAuthStore("user", JSON.stringify(response.data.user), rememberMe);
    } else if (user_type === "employee" && response.data.employee) {
      setAuthStore("employee", JSON.stringify(response.data.employee), rememberMe);
      setAuthStore("company", JSON.stringify(response.data.company), rememberMe);
    } else if (user_type === "platform_admin" && response.data.admin) {
      setAuthStore("platform_admin", JSON.stringify(response.data.admin), rememberMe);
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || error?.message || "Login failed");
  }
};

export const refreshAccessToken = async (): Promise<string> => {
  try {
    const refresh_token = getAuthStore("refresh_token");
    if (!refresh_token) {
      throw new Error("No refresh token found");
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token });
    const { access_token } = response.data;

    // Preserve whichever storage the user originally chose
    const inLocal = !!localStorage.getItem("access_token");
    setAuthStore("access_token", access_token, inLocal);

    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    return access_token;
  } catch (error: any) {
    logout();
    throw new Error("Session expired. Please login again.");
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_BASE_URL}/auth/logout`);
  } catch {
    // Logout should always succeed on the client side
  } finally {
    clearAuthStore();
    delete axios.defaults.headers.common["Authorization"];
    CacheManager.clearAll();
  }
};

export const getStoredUser = (): User | null => {
  const user = getAuthStore("user");
  return user ? JSON.parse(user) : null;
};

export const getStoredToken = (): string | null => {
  return getAuthStore("access_token");
};

export const getStoredRefreshToken = (): string | null => {
  return getAuthStore("refresh_token");
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY FUNCTIONS (NEW)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a new company with admin account
 */
export const registerCompany = async (payload: CompanyRegisterPayload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/company-auth/register-company`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Company registration failed");
  }
};

/**
 * Login as company employee (all roles: company_admin, hr, manager, team_lead, employee)
 */
export const loginEmployee = async (payload: LoginPayload): Promise<EmployeeAuthResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/company-auth/employee-login`, payload);
    const { access_token, refresh_token, employee, company } = response.data;
    
    // Save tokens and employee/company data to localStorage
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("employee", JSON.stringify(employee));
    localStorage.setItem("company", JSON.stringify(company));
    localStorage.setItem("user_type", "employee");
    
    // Set default header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Employee login failed");
  }
};

/**
 * Login as platform administrator
 */
export const loginPlatformAdmin = async (payload: LoginPayload): Promise<PlatformAdminAuthResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/company-auth/platform-admin-login`, payload);
    const { access_token, refresh_token, admin } = response.data;
    
    // Save tokens and admin data to localStorage
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("platform_admin", JSON.stringify(admin));
    localStorage.setItem("user_type", "platform_admin");
    
    // Set default header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Platform admin login failed");
  }
};

/**
 * Get stored employee data
 */
export const getStoredEmployee = (): Employee | null => {
  const employee = getAuthStore("employee");
  return employee ? JSON.parse(employee) : null;
};

export const getStoredCompany = (): Company | null => {
  const company = getAuthStore("company");
  return company ? JSON.parse(company) : null;
};

export const getStoredPlatformAdmin = (): PlatformAdmin | null => {
  const admin = getAuthStore("platform_admin");
  return admin ? (JSON.parse(admin) as PlatformAdmin) : null;
};

export const getUserType = (): "individual" | "employee" | "platform_admin" | null => {
  const stored = getAuthStore("user_type");
  if (stored === "individual" || stored === "employee" || stored === "platform_admin") {
    return stored;
  }
  return null;
};

/**
 * Check if user is logged in (any type)
 */
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};