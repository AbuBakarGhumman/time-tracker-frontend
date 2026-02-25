/**
 * Fetch Manager - Centralized API request handler with built-in caching and deduplication
 * 
 * Ensures:
 * - Only ONE request per endpoint+params combination, even if called multiple times
 * - All callers wait for the same Promise
 * - Cache is checked before making requests
 * - No duplicate simultaneous API calls
 */

import axios from "./interceptor";
import { CacheManager } from "../utils/cacheManager";

interface FetchOptions {
  cacheKey: string;
  params?: Record<string, any>;
  cacheDuration?: number;
}

// Global request deduplication - maps request signatures to pending promises
const globalPendingRequests = new Map<string, Promise<any>>();

/**
 * Generate unique signature for a request
 */
function generateRequestSignature(method: string, url: string, params?: Record<string, any>): string {
  const paramStr = params ? JSON.stringify(params) : "";
  return `${method}:${url}${paramStr}`;
}

/**
 * Centralized fetch with automatic caching and deduplication
 */
export async function fetchWithCache<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  options: FetchOptions
): Promise<T> {
  const { cacheKey, params, cacheDuration = 5 * 60 * 1000 } = options;

  // Step 1: Check if cached data is still valid
  if (CacheManager.isValid(cacheKey, params)) {
    const cached = CacheManager.get<T>(cacheKey, params);
    if (cached) {
      console.log(`📦 [Cache Hit] ${url}`, params);
      return cached;
    }
  }

  // Step 2: Check if request is already pending globally
  const requestSignature = generateRequestSignature(method, url, params);
  
  if (globalPendingRequests.has(requestSignature)) {
    console.log(`⏳ [Pending] Awaiting ${url}`, params);
    return globalPendingRequests.get(requestSignature)!;
  }

  // Step 3: Create and register the request
  console.log(`🔄 [Fetching] ${url}`, params);
  
  const requestPromise = (async () => {
    try {
      const config = method === "GET" 
        ? { params }
        : {};

      const response = await axios({
        method,
        url,
        ...(method !== "GET" && { data: params }),
        ...(method === "GET" && config),
      });

      const data = response.data as T;
      
      // Cache the successful response
      CacheManager.set(cacheKey, data, params, cacheDuration);
      console.log(`✅ [Cached] ${url}`, params);
      
      return data;
    } catch (error) {
      console.error(`❌ [Error] ${url}`, error);
      throw error;
    } finally {
      // Clean up from pending requests
      globalPendingRequests.delete(requestSignature);
    }
  })();

  // Register as pending BEFORE returning
  globalPendingRequests.set(requestSignature, requestPromise);

  return requestPromise;
}

/**
 * GET request with caching
 */
export function getWithCache<T>(
  url: string,
  options: FetchOptions
): Promise<T> {
  return fetchWithCache<T>("GET", url, options);
}

/**
 * Clear all pending requests (on logout)
 */
export function clearAllPendingRequests(): void {
  globalPendingRequests.clear();
}

/**
 * Clear cache and pending requests for a specific cache key
 * Used after mutations (create/update/delete) to force fresh fetch
 */
export function clearCacheForKey(cacheKey: string, params?: Record<string, any>): void {
  // Clear from CacheManager
  CacheManager.clear(cacheKey, params);
  
  // Also clear any pending requests for this cache key
  // This ensures the next fetch will make a new API call
  const keysToDelete: string[] = [];
  globalPendingRequests.forEach((_, signature) => {
    // Check if this pending request is for the same endpoint by looking at cache patterns
    if (signature.includes(cacheKey)) {
      keysToDelete.push(signature);
    }
  });
  keysToDelete.forEach(key => globalPendingRequests.delete(key));
}


