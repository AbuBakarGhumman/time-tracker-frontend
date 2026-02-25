import axios from "axios";
import { API_BASE_URL } from "./config";
import { getWithCache } from "./fetchManager";

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectResponse {
  id: number;
  name: string;
  color: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME ENTRY TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TimeEntry {
  id: number;
  user_id: number;
  task_name: string;
  start_time: string;
  end_time?: string;
  duration_hours?: number;
  project_id?: number;  // Foreign key to project
  project?: ProjectResponse;  // Nested project object with name and color
  category?: string;
  status: "active" | "completed";
  notes?: string;
  description?: string;
  is_billable?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ActiveEntry {
  id: number;
  task_name: string;
  start_time: string;
  status: string;
  elapsed_time?: string;
  project_id?: number;
  project?: ProjectResponse;
  category?: string;
}

export interface ManualEntryPayload {
  task_name: string;
  description?: string;
  project_id?: number;  // Foreign key to project
  category?: string;
  start_time: string; // ISO format
  end_time: string; // ISO format
  is_billable?: number;
  notes?: string;
}

export interface AutomaticEntryPayload {
  task_name: string;
  description?: string;
  project_id?: number;  // Foreign key to project
  category?: string;
  is_billable?: number;
  notes?: string;
}

export interface StopEntryPayload {
  notes?: string;
}

export interface TimeEntrySummary {
  total_entries: number;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  active_entries: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME ENTRY API CALLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all time entries for the current user
 */
export const fetchTimeEntries = async (): Promise<TimeEntry[]> => {
  try {
    return await getWithCache<TimeEntry[]>(
      `${API_BASE_URL}/time-entries/list`,
      {
        cacheKey: "time-entries/list"
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch time entries:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch time entries");
  }
};

/**
 * Fetch the currently active time entry (if any)
 */
export const fetchActiveEntry = async (): Promise<ActiveEntry | null> => {
  try {
    return await getWithCache<ActiveEntry>(
      `${API_BASE_URL}/time-entries/active`,
      {
        cacheKey: "time-entries/active"
      }
    );
  } catch (error: any) {
    // Active entry endpoint returns 404 when no active entry, which is normal
    if (error?.response?.status !== 404) {
      console.error("Failed to fetch active entry:", error);
    }
    return null;
  }
};

/**
 * Fetch all available projects
 */
export const fetchProjects = async (): Promise<ProjectResponse[]> => {
  try {
    return await getWithCache<ProjectResponse[]>(
      `${API_BASE_URL}/projects/`,
      {
        cacheKey: "projects"
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch projects");
  }
};

/**
 * Create a manual time entry (with start and end times)
 */
export const createManualEntry = async (payload: ManualEntryPayload): Promise<TimeEntry> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/time-entries/manual`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create manual entry:", error);
    throw new Error(error?.response?.data?.detail || "Failed to create manual entry");
  }
};

/**
 * Start an automatic timer entry
 */
export const startAutomaticEntry = async (payload: AutomaticEntryPayload): Promise<TimeEntry> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/time-entries/start`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to start timer:", error);
    throw new Error(error?.response?.data?.detail || "Failed to start timer");
  }
};

/**
 * Stop an active timer entry
 */
export const stopTimerEntry = async (
  entryId: number,
  payload: StopEntryPayload = {}
): Promise<TimeEntry> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/time-entries/stop/${entryId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to stop timer:", error);
    throw new Error(error?.response?.data?.detail || "Failed to stop timer");
  }
};

/**
 * Update an existing time entry
 */
export const updateTimeEntry = async (
  entryId: number,
  payload: Partial<ManualEntryPayload>
): Promise<TimeEntry> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/time-entries/${entryId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update entry:", error);
    throw new Error(error?.response?.data?.detail || "Failed to update entry");
  }
};

/**
 * Delete a time entry
 */
export const deleteTimeEntry = async (entryId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/time-entries/${entryId}`);
  } catch (error: any) {
    console.error("Failed to delete entry:", error);
    throw new Error(error?.response?.data?.detail || "Failed to delete entry");
  }
};

/**
 * Fetch time entry summary for a date range
 */
export const fetchTimeEntrySummary = async (
  startDate?: string,
  endDate?: string
): Promise<TimeEntrySummary> => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await axios.get(
      `${API_BASE_URL}/time-entries/summary?${params.toString()}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch time entry summary:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch summary");
  }
};

/**
 * Fetch time entries for a specific date
 */
export const fetchTimeEntriesByDate = async (date: string): Promise<TimeEntry[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/time-entries/by-date/${date}`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch entries by date:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch entries by date");
  }
};

/**
 * Fetch time entries grouped by project
 */
export const fetchTimeEntriesByProject = async (): Promise<
  Record<string, TimeEntry[]>
> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/time-entries/by-project`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch entries by project:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch entries by project");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CACHE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store time entries in localStorage
 */
export const cacheTimeEntries = (entries: TimeEntry[]): void => {
  try {
    localStorage.setItem("time_entries", JSON.stringify(entries));
  } catch (error) {
    console.warn("Failed to cache time entries:", error);
  }
};

/**
 * Retrieve cached time entries
 */
export const getCachedTimeEntries = (): TimeEntry[] | null => {
  try {
    const cached = localStorage.getItem("time_entries");
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn("Failed to retrieve cached time entries:", error);
    return null;
  }
};

/**
 * Clear cached time entries
 */
export const clearTimeEntriesCache = (): void => {
  try {
    localStorage.removeItem("time_entries");
  } catch (error) {
    console.warn("Failed to clear time entries cache:", error);
  }
};