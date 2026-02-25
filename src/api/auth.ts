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
  role?: "employee" | "admin";
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

// Unified login response type
export interface UnifiedLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_type: "individual" | "employee" | "platform_admin";
  user?: User;
  employee?: Employee;
  company?: Company;
  admin?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL USER FUNCTIONS (EXISTING - NO CHANGES)
// ─────────────────────────────────────────────────────────────────────────────

export const registerUser = async (payload: RegisterPayload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Registration failed:", error);
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
    console.error("Login failed:", error);
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
export const unifiedLogin = async (payload: LoginPayload): Promise<UnifiedLoginResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/unified-login`, payload);
    const { access_token, refresh_token, user_type } = response.data;
    
    // Save tokens
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("user_type", user_type);
    
    // Save user-specific data based on type
    if (user_type === "individual" && response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    } else if (user_type === "employee" && response.data.employee) {
      localStorage.setItem("employee", JSON.stringify(response.data.employee));
      localStorage.setItem("company", JSON.stringify(response.data.company));
    } else if (user_type === "platform_admin" && response.data.admin) {
      localStorage.setItem("platform_admin", JSON.stringify(response.data.admin));
    }
    
    // Set default header for future requests
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    
    return response.data;
  } catch (error: any) {
    console.error("Login API error:", error);
    const errorDetail = error?.response?.data?.detail || error?.message || "Login failed";
    console.error("Error detail being thrown:", errorDetail);
    throw new Error(errorDetail);
  }
};

export const refreshAccessToken = async (): Promise<string> => {
  try {
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) {
      throw new Error("No refresh token found");
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token });
    const { access_token } = response.data;
    
    // Update access token in localStorage
    localStorage.setItem("access_token", access_token);
    
    // Update axios default header
    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
    
    return access_token;
  } catch (error: any) {
    console.error("Token refresh failed:", error);
    // If refresh fails, logout the user
    logout();
    throw new Error("Session expired. Please login again.");
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_BASE_URL}/auth/logout`);
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    // Clear all stored data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("employee");
    localStorage.removeItem("company");
    localStorage.removeItem("platform_admin");
    localStorage.removeItem("user_type");
    delete axios.defaults.headers.common["Authorization"];
    
    // Clear all cached data
    CacheManager.clearAll();
  }
};

export const getStoredUser = (): User | null => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem("access_token");
};

export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token");
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
    console.error("Company registration failed:", error);
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
    console.error("Employee login failed:", error);
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
    console.error("Platform admin login failed:", error);
    throw new Error(error?.response?.data?.detail || "Platform admin login failed");
  }
};

/**
 * Get stored employee data
 */
export const getStoredEmployee = (): Employee | null => {
  const employee = localStorage.getItem("employee");
  return employee ? JSON.parse(employee) : null;
};

/**
 * Get stored company data
 */
export const getStoredCompany = (): Company | null => {
  const company = localStorage.getItem("company");
  return company ? JSON.parse(company) : null;
};

/**
 * Get stored platform admin data
 */
export const getStoredPlatformAdmin = (): any | null => {
  const admin = localStorage.getItem("platform_admin");
  return admin ? JSON.parse(admin) : null;
};

/**
 * Get current user type
 */
export const getUserType = (): "individual" | "employee" | "platform_admin" | null => {
  return localStorage.getItem("user_type") as any;
};

/**
 * Check if user is logged in (any type)
 */
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};