/**
 * Cache Manager - Handles client-side caching with version-based invalidation
 * 
 * Features:
 * - Cache data with expiration
 * - Server-driven cache invalidation via version/hash
 * - Return early when cache is valid to reduce API calls
 * - Fallback to cache on offline or API errors
 * - Request deduplication to prevent duplicate API calls
 */

import React from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version?: string; // Server version for cache validation
}

// Cache duration in milliseconds (5 minutes default)
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<any>>();

export class CacheManager {
  private static readonly CACHE_PREFIX = "cache_";

  /**
   * Generate cache key
   */
  static generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? `_${JSON.stringify(params)}` : "";
    return `${this.CACHE_PREFIX}${endpoint}${paramString}`;
  }

  /**
   * Check if a request is already pending
   */
  static hasPendingRequest(endpoint: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(endpoint, params);
    return pendingRequests.has(key);
  }

  /**
   * Get pending request promise
   */
  static getPendingRequest<T>(endpoint: string, params?: Record<string, any>): Promise<T> | null {
    const key = this.generateKey(endpoint, params);
    return pendingRequests.get(key) || null;
  }

  /**
   * Register a pending request
   */
  static setPendingRequest<T>(endpoint: string, promise: Promise<T>, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    pendingRequests.set(key, promise);
    
    // Automatically remove from pending when promise settles
    promise.then(() => {
      pendingRequests.delete(key);
    }).catch(() => {
      pendingRequests.delete(key);
    });
  }

  /**
   * Clear pending request
   */
  static clearPendingRequest(endpoint: string, params?: Record<string, any>): void {
    const key = this.generateKey(endpoint, params);
    pendingRequests.delete(key);
  }

  /**
   * Get cached data if it exists and is not expired
   */
  static get<T>(endpoint: string, params?: Record<string, any>): T | null {
    try {
      const key = this.generateKey(endpoint, params);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if cache has expired
      if (Date.now() > entry.expiresAt) {
        // Cache expired, remove it
        localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn("Error reading from cache:", error);
      return null;
    }
  }

  /**
   * Cache data with expiration and optional version
   */
  static set<T>(
    endpoint: string,
    data: T,
    params?: Record<string, any>,
    duration: number = DEFAULT_CACHE_DURATION,
    version?: string
  ): void {
    try {
      const key = this.generateKey(endpoint, params);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration,
        version, // Store server version if provided
      };

      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn("Error writing to cache:", error);
    }
  }

  /**
   * Get cached version for server comparison
   * Used to send to server: "I have version X, tell me if it changed"
   */
  static getVersion(endpoint: string, params?: Record<string, any>): string | null {
    try {
      const key = this.generateKey(endpoint, params);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<any> = JSON.parse(cached);
      return entry.version || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear specific cache entry
   */
  static clear(endpoint: string, params?: Record<string, any>): void {
    try {
      const key = this.generateKey(endpoint, params);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("Error clearing cache:", error);
    }
  }

  /**
   * Clear all cached data (use on logout)
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Error clearing all cache:", error);
    }
  }

  /**
   * Check if cache is valid and not expired
   */
  static isValid(endpoint: string, params?: Record<string, any>): boolean {
    try {
      const key = this.generateKey(endpoint, params);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return false;
      }

      const entry: CacheEntry<any> = JSON.parse(cached);
      return Date.now() <= entry.expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get cache age in milliseconds
   */
  static getAge(endpoint: string, params?: Record<string, any>): number | null {
    try {
      const key = this.generateKey(endpoint, params);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const entry: CacheEntry<any> = JSON.parse(cached);
      return Date.now() - entry.timestamp;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Initialize cache refresh detection on app load
 * Detects actual page refreshes (F5, Ctrl+R, hard refresh) vs navigation
 * Using Performance API to detect reload vs navigation - most reliable method
 */
export function initializeCacheRefreshDetection(): void {
  // Use Performance API to detect if page was reloaded
  // performance.navigation.type values:
  // 0 = TYPE_NAVIGATE (normal navigation/link click)
  // 1 = TYPE_RELOAD (F5 or reload button)
  // 2 = TYPE_BACK_FORWARD (back/forward button)
  
  // Also check using PerformanceNavigationTiming (more modern API)
  const entries = performance.getEntriesByType("navigation");
  
  if (entries.length > 0) {
    const navEntry = entries[0] as PerformanceNavigationTiming;
    const navigationType = navEntry.type;
    
    // Clear cache on actual page reload (F5, Ctrl+R, hard refresh)
    // reload = page was reloaded
    // back_forward = used browser back/forward (also clear cache to get fresh data)
    if (navigationType === "reload" || navigationType === "back_forward") {
      console.log("🔄 Page refreshed/reloaded - clearing cache");
      CacheManager.clearAll();
    } else {
      console.log("🔗 Navigation - keeping cache");
    }
  } else {
    // Fallback for older browsers: use sessionStorage marker
    const sessionMarker = sessionStorage.getItem("_sessionMarker");
    if (!sessionMarker) {
      console.log("🔄 First time load (session marker missing) - clearing cache");
      CacheManager.clearAll();
    }
    sessionStorage.setItem("_sessionMarker", "active");
  }
}


/**
 * Hook to detect page refresh and clear cache
 * Clears cache on any page refresh: F5, Ctrl+R, browser refresh button, Shift+F5, etc.
 * Returns true if page was refreshed
 */
export const useDetectPageRefresh = (): boolean => {
  const [isRefresh, setIsRefresh] = React.useState(false);

  React.useEffect(() => {
    const wasRefreshed = sessionStorage.getItem("_wasPageRefreshed");
    if (wasRefreshed === "true") {
      sessionStorage.removeItem("_wasPageRefreshed");
      setIsRefresh(true);
    }
  }, []);

  return isRefresh;
};

export default CacheManager;
