import { API_BASE_URL } from "./config";
import { getWithCache } from "./fetchManager";

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE ANALYTICS TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface DailyTrend {
  date: string;
  has_record: boolean;
  check_in_time?: string;
  check_out_time?: string;
  expected_checkin?: string;
  expected_checkout?: string;
  checkin_delay_minutes?: number;
  checkout_diff_minutes?: number;
  checkin_status?: string;
  checkout_status?: string;
  actual_work_hours?: number;
  required_work_hours?: number;
  duty_completed?: boolean;
  shortfall_hours?: number;
  checkin_time_display?: string;
  checkout_time_display?: string;
  expected_checkin_display?: string;
  expected_checkout_display?: string;
  message?: string;
}

export interface WeeklyTrend {
  week: string;
  trends: Array<{
    date: string;
    work_hours: number;
    checkin_delay_minutes: number | null;
    duty_completed: boolean;
    is_active?: boolean; // Indicates ongoing session (checked in but not checked out)
  }>;
  total_work_hours: number;
  days_completed_duty: number;
  days_late: number;
  average_daily_hours: number;
}

export interface DailyStats {
  date: string;
  total_hours: number;
  check_count: number;
  avg_check_in_time?: string;
  avg_check_out_time?: string;
}

export interface WeeklyStats {
  week: string;
  total_hours: number;
  days_worked: number;
  avg_daily_hours: number;
}

export interface MonthlyStats {
  month: string;
  total_hours: number;
  days_worked: number;
  avg_daily_hours: number;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  on_time_days: number;
  attendance_rate: number;
  punctuality_rate: number;
}

export interface WorkDailyReport {
  date: string;
  tasks_completed: number;
  total_hours: number;
  projects: Array<{ name: string; hours: number }>;
  category_breakdown: Array<{ name: string; hours: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE ANALYTICS API CALLS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch daily trend for a specific date
 */
export const fetchDailyTrend = async (date: string): Promise<DailyTrend> => {
  try {
    return await getWithCache<DailyTrend>(
      `${API_BASE_URL}/attendance/trend/daily/${date}`,
      {
        cacheKey: "analytics/daily-trend",
        params: { date }
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch daily trend:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch daily trend");
  }
};

/**
 * Fetch weekly trend (last 7 days)
 */
export const fetchWeeklyTrend = async (): Promise<WeeklyTrend> => {
  try {
    return await getWithCache<WeeklyTrend>(
      `${API_BASE_URL}/attendance/trend/weekly`,
      {
        cacheKey: "analytics/weekly-trend"
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch weekly trend:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch weekly trend");
  }
};

/**
 * Fetch work hours for the week (from time entries on projects)
 * Uses centralized cache deduplication - will use same cached data as Home.tsx for same date ranges
 */
export const fetchWorkWeekly = async (): Promise<Array<{ date: string; work_hours: number }>> => {
  try {
    // Calculate last 7 days
    const pkt = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const endDate = new Date(pkt);
    const startDate = new Date(pkt);
    startDate.setDate(endDate.getDate() - 6);

    const formatDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // Use centralized fetch with automatic deduplication
    const workDailyData: WorkDailyReport[] = await getWithCache<WorkDailyReport[]>(
      `${API_BASE_URL}/reports/work-daily`,
      {
        cacheKey: "analytics/work-daily",
        params: {
          start_date: startDateStr,
          end_date: endDateStr,
        }
      }
    );

    // Return array of {date, work_hours} to match the trends structure
    return workDailyData.map((day) => ({
      date: day.date,
      work_hours: parseFloat(day.total_hours.toFixed(2)),
    }));
  } catch (error: any) {
    console.error("Failed to fetch work weekly:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch work weekly");
  }
};

/**
 * Fetch daily stats for a specific date
 */
export const fetchDailyStats = async (date: string): Promise<DailyStats> => {
  try {
    return await getWithCache<DailyStats>(
      `${API_BASE_URL}/attendance/daily-stats/${date}`,
      {
        cacheKey: "analytics/daily-stats",
        params: { date }
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch daily stats:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch daily stats");
  }
};

/**
 * Fetch weekly stats
 */
export const fetchWeeklyStats = async (): Promise<WeeklyStats> => {
  try {
    return await getWithCache<WeeklyStats>(
      `${API_BASE_URL}/attendance/weekly-stats`,
      {
        cacheKey: "analytics/weekly-stats"
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch weekly stats:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch weekly stats");
  }
};

/**
 * Fetch monthly stats for a specific year and month
 */
export const fetchMonthlyStats = async (year: number, month: number): Promise<MonthlyStats> => {
  try {
    return await getWithCache<MonthlyStats>(
      `${API_BASE_URL}/attendance/monthly-stats`,
      {
        cacheKey: "analytics/monthly-stats",
        params: { year, month }
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch monthly stats:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch monthly stats");
  }
};

/**
 * Fetch attendance report for date range
 */
export const fetchAttendanceReport = async (startDate: string, endDate: string): Promise<any> => {
  try {
    return await getWithCache<any>(
      `${API_BASE_URL}/reports/attendance`,
      {
        cacheKey: "reports/attendance",
        params: { start_date: startDate, end_date: endDate }
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch attendance report:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch attendance report");
  }
};

/**
 * Fetch work daily report for date range
 */
export const fetchWorkDailyReport = async (startDate: string, endDate: string): Promise<any> => {
  try {
    return await getWithCache<any>(
      `${API_BASE_URL}/reports/work-daily`,
      {
        cacheKey: "reports/work-daily",
        params: { start_date: startDate, end_date: endDate }
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch work daily report:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch work daily report");
  }
};

/**
 * Fetch project breakdown report for date range
 */
export const fetchProjectBreakdown = async (startDate: string, endDate: string): Promise<any> => {
  try {
    return await getWithCache<any>(
      `${API_BASE_URL}/reports/project-breakdown`,
      {
        cacheKey: "reports/project-breakdown",
        params: { start_date: startDate, end_date: endDate }
      }
    );
  } catch (error: any) {
    console.error("Failed to fetch project breakdown:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch project breakdown");
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CACHE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store analytics data in localStorage for offline access
 */
export const cacheAnalyticsData = (key: string, data: any): void => {
  try {
    localStorage.setItem(`analytics_${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to cache analytics data:", error);
  }
};

/**
 * Retrieve cached analytics data
 */
export const getCachedAnalyticsData = (key: string): any | null => {
  try {
    const cached = localStorage.getItem(`analytics_${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn("Failed to retrieve cached analytics data:", error);
    return null;
  }
};

/**
 * Clear all cached analytics data
 */
export const clearAnalyticsCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("analytics_")) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Failed to clear analytics cache:", error);
  }
};