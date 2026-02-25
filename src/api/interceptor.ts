import axios from "axios";
import { refreshAccessToken } from "./auth";

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  
  isRefreshing = false;
  failedQueue = [];
};

// Request interceptor to add Authorization header if token exists
axios.interceptors.request.use(
  (config) => {
    const access_token = localStorage.getItem("access_token");
    if (access_token && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh token for authentication endpoints
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/unified-login",
      "/company-auth/employee-login",
      "/company-auth/platform-admin-login",
      "/company-auth/register-company"
    ];
    
    const requestUrl = originalRequest?.url || "";
    const isAuthEndpoint = authEndpoints.some(endpoint => 
      requestUrl.includes(endpoint)
    );

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return axios(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return axios(originalRequest);
      } catch (err) {
        processQueue(err as Error, null);
        // Log the error for debugging
        console.error("Token refresh failed, rejecting queued requests:", err);
        return Promise.reject(err);
      }
    }

    // Log error if it's a critical one
    if (error.response?.status >= 500) {
      console.error("Server error:", error.response.status, error.response.data);
    }

    return Promise.reject(error);
  }
);

export default axios;
