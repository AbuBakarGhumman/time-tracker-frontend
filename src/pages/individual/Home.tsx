import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../api/auth";
import { API_BASE_URL } from "../../api/config";
import { getWithCache } from "../../api/fetchManager";
import type { User } from "../../api/auth";
import axios from "../../api/interceptor";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
} from "recharts";
import AnalogClockIcon from "../../components/AnalogClockIcon";
import { SkeletonCard, SkeletonChart } from "../../components/Skeleton";
import { isToday, getTodayPKT, formatHoursAsHoursMinutes, getDateStringPKT, getNowPKTISO, formatPKTLocalTimeOnly, formatDateOnlyPKT } from "../../utils/dateUtils";
import { CacheManager } from "../../utils/cacheManager";

interface CheckInStatus {
  is_checked_in: boolean;
  check_in_time?: string;
  check_out_time?: string;
  elapsed_time?: string;
}

interface WeeklyTrend {
  week: string;
  trends: Array<{
    date: string;
    work_hours: number;
    checkin_delay_minutes: number | null;
    duty_completed: boolean;
  }>;
  total_work_hours: number;
  days_completed_duty: number;
  days_late: number;
  average_daily_hours: number;
}

interface DateRangeTrend {
  date: string;
  checkin_delay_minutes: number | null;
  duty_completed: boolean;
  work_hours: number;
  is_active?: boolean;
}

interface QuickStats {
  today_hours: number;
  week_hours: number;
  days_worked_this_week: number;
  average_daily_hours: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────
// Custom dot component
const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;

  // Determine dot color based on state
  let fillColor = "#f97316"; // Orange for normal
  if (payload.is_absent) fillColor = "#ef4444"; // Red for absent
  else if (payload.is_active) fillColor = "#3b82f6"; // Blue for active

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={fillColor}
      stroke="#fff"
      strokeWidth={2}
    />
  );
};

// Format minutes as "X Hours Y Minutes" format
const formatMinutesToHoursMinutes = (minutes: number): string => {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  if (hours === 0) {
    return `${mins} Minutes`;
  }
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
  }
  
  return `${hours} ${hours === 1 ? "Hour" : "Hours"} ${mins} Minutes`;
};

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState("0h 0m 0s");
  const [fifteenDayTrend, setFifteenDayTrend] = useState<DateRangeTrend[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    today_hours: 0,
    week_hours: 0,
    days_worked_this_week: 0,
    average_daily_hours: 0,
  });
  const [startDate, setStartDate] = useState<string>(() => {
    const pktNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const date = new Date(pktNow);
    date.setDate(date.getDate() - 14);
    return getDateStringPKT(date);
  });
  const [endDate, setEndDate] = useState<string>(getTodayPKT());

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useRef(useNavigate()).current;

  // ── derived state — whether today's actions have already been taken ────────
  const hasCheckedInToday = isToday(status?.check_in_time);
  const hasCheckedOutToday = isToday(status?.check_out_time);

  // ── polling control ───────────────────────────────────────────────────────
  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(fetchStatus, 30_000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // ── boot ──────────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(storedUser);
      
      // Load initial data - only fetch what's not cached
      // Status is always fetched (real-time), but other data uses cache if valid
      const loadInitialData = async () => {
        try {
          // Always fetch current status (real-time, no cache)
          await fetchStatus();
          
          // Load cached or fresh trend data
          await Promise.all([
            fetchWeeklyTrends(),      // Checks cache, returns early if valid
            fetchFifteenDayTrend(),   // Checks cache, returns early if valid
            fetchQuickStats(),        // Checks cache, returns early if valid
          ]);
        } finally {
          setIsInitialLoading(false);
        }
      };
      
      loadInitialData();
    }
    return () => stopPolling();
  }, []);

  // ── react to status changes: start/stop polling intelligently ─────────────
  useEffect(() => {
    if (status?.is_checked_in) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [status?.is_checked_in]);

  // ── update chart when date range changes ──────────────────────────────────
  useEffect(() => {
    fetchFifteenDayTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // ── live timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status?.is_checked_in && status?.check_in_time) {
      const interval = setInterval(() => {
        const diff = Date.now() - new Date(status.check_in_time!).getTime();
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1000);
        setElapsedTime(`${h}h ${m}m ${s}s`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime("0h 0m 0s");
    }
  }, [status?.is_checked_in, status?.check_in_time]);

  // ── api ───────────────────────────────────────────────────────────────────
  const fetchStatus = async () => {
    try {
      // Check if a request is already pending for this data
      const pendingRequest = CacheManager.getPendingRequest("attendance/status", {});
      if (pendingRequest) {
        try {
          const data = await pendingRequest;
          setStatus(data as CheckInStatus);
        } catch (error) {
          console.error("Pending status request failed:", error);
        }
        return;
      }

      // Make the request and register it as pending
      const fetchPromise = (async () => {
        const res = await axios.get(`${API_BASE_URL}/attendance/status`);
        setStatus(res.data);
        return res.data;
      })();

      CacheManager.setPendingRequest("attendance/status", fetchPromise, {});
    } catch (e) {
      console.error("Failed to fetch status:", e);
    }
  };

  const fetchWeeklyTrends = async () => {
    const cacheKey = "trends/weekly";
    
    // Check if cache is valid (not expired)
    if (CacheManager.isValid(cacheKey, {})) {
      const cachedData = CacheManager.get<WeeklyTrend>(cacheKey, {});
      if (cachedData) {
        return; // Cache is valid, no need to fetch
      }
    }

    // Check if a request is already pending for this data
    const pendingRequest = CacheManager.getPendingRequest(cacheKey, {});
    if (pendingRequest) {
      try {
        await pendingRequest;
      } catch (error) {
        console.error("Pending weekly trends request failed:", error);
      }
      return;
    }

    // Cache is invalid or doesn't exist, fetch from API and cache it
    const fetchPromise = (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/attendance/trend/weekly`);
        CacheManager.set(cacheKey, res.data, {});
        return res.data;
      } catch (e) {
        console.error("Failed to fetch weekly trends:", e);
        throw e;
      }
    })();

    // Register this as a pending request
    CacheManager.setPendingRequest(cacheKey, fetchPromise, {});
  };

  const fetchFifteenDayTrend = async () => {
    const cacheParams = { startDate, endDate };
    const cacheKey = "trends/date-range";
    
    // Check if cache is valid (not expired)
    if (CacheManager.isValid(cacheKey, cacheParams)) {
      const cachedData = CacheManager.get<any>(cacheKey, cacheParams);
      if (cachedData) {
        setFifteenDayTrend(cachedData.trends);
        return; // Don't fetch if cache is still valid
      }
    }

    // Check if a request is already pending for this data
    const pendingRequest = CacheManager.getPendingRequest(cacheKey, cacheParams);
    if (pendingRequest) {
      try {
        const data = await pendingRequest as { trends: DateRangeTrend[] };
        setFifteenDayTrend(data.trends);
      } catch (error) {
        console.error("Pending fifteen day trend request failed:", error);
      }
      return;
    }

    // Cache is invalid or doesn't exist, fetch from API
    const fetchPromise = (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/attendance/trend/date-range`, {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        });
        setFifteenDayTrend(res.data.trends);
        CacheManager.set(cacheKey, res.data, cacheParams);
        return res.data;
      } catch (e) {
        console.error("Failed to fetch trend:", e);
        throw e;
      }
    })();

    // Register this as a pending request
    CacheManager.setPendingRequest(cacheKey, fetchPromise, cacheParams);
  };

  const fetchQuickStats = async () => {
    try {
      const weekStart = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartDate = getDateStringPKT(weekStart);
      const weekEndDate = getTodayPKT();
      const today = getTodayPKT();
      
      // Use centralized fetch with automatic deduplication and caching
      const weekRes = await getWithCache<any>(`${API_BASE_URL}/reports/work-daily`, {
        cacheKey: "stats/quick",
        params: {
          start_date: weekStartDate,
          end_date: weekEndDate,
        }
      });
      
      let todayHours = 0;
      let weekHours = 0;
      let daysWorked = 0;
      
      if (Array.isArray(weekRes)) {
        weekRes.forEach((report: any) => {
          const reportDate = report.date || report.work_date;
          if (reportDate === today) {
            todayHours = report.total_hours || 0;
          }
          weekHours += report.total_hours || 0;
          if (report.total_hours > 0) {
            daysWorked += 1;
          }
        });
      }
      
      const avgDaily = daysWorked > 0 ? weekHours / daysWorked : 0;
      
      const stats: QuickStats = {
        today_hours: parseFloat(todayHours.toFixed(2)),
        week_hours: parseFloat(weekHours.toFixed(2)),
        days_worked_this_week: daysWorked,
        average_daily_hours: parseFloat(avgDaily.toFixed(2)),
      };
      
      setQuickStats(stats);
    } catch (e) {
      console.error("Failed to fetch quick stats:", e);
    }
  };

  const handleCheckIn = async () => {
    if (hasCheckedInToday || loading) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance/check-in`, { 
        note: "",
        check_in_time: getNowPKTISO()
      });
      console.log("Check-in successful:", response.data);
      await fetchStatus();
      
      // Clear cache for trend data to force immediate refresh
      CacheManager.clear("trends/weekly");
      CacheManager.clear("trends/date-range", { startDate, endDate });
      CacheManager.clear("stats/quick");
      
      // Fetch fresh data
      await Promise.all([
        fetchWeeklyTrends(),
        fetchFifteenDayTrend(),
        fetchQuickStats(),
      ]);
    } catch (error: any) {
      console.error("Check-in error:", error?.response?.data || error?.message);
      const errorMessage = error?.response?.data?.detail || error?.message || "Check-in failed";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!hasCheckedInToday || hasCheckedOutToday || loading) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/attendance/check-out`, { 
        note: "",
        check_out_time: getNowPKTISO()
      });
      console.log("Check-out successful:", response.data);
      await fetchStatus();
      
      // Clear cache for trend data to force immediate refresh
      CacheManager.clear("trends/weekly");
      CacheManager.clear("trends/date-range", { startDate, endDate });
      CacheManager.clear("stats/quick");
      
      // Fetch fresh data
      await Promise.all([
        fetchWeeklyTrends(),
        fetchFifteenDayTrend(),
        fetchQuickStats(),
      ]);
    } catch (error: any) {
      console.error("Check-out error:", error?.response?.data || error?.message);
      const errorMessage = error?.response?.data?.detail || error?.message || "Check-out failed";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── button labels & disabled states ───────────────────────────────────────
  const checkInDisabled = hasCheckedInToday || loading;
  const checkOutDisabled = !hasCheckedInToday || hasCheckedOutToday || loading;

  const checkInLabel = hasCheckedInToday ? "Checked In ✓" : loading ? "Processing…" : "Check In";
  const checkOutLabel = hasCheckedOutToday ? "Checked Out ✓"
    : !hasCheckedInToday ? "Check Out"
      : loading ? "Processing…"
        : "Check Out";

  // ── Prepare chart data - use 0 for absent days to keep continuity ──
  const chartData = fifteenDayTrend.map((d) => ({
    date: d.date,
    // Use actual delay for present days, 0 for absent days (to maintain line continuity)
    checkin_delay_minutes: d.checkin_delay_minutes !== null ? d.checkin_delay_minutes : 0,
    is_absent: d.checkin_delay_minutes === null,
    is_active: d.is_active || false,
  }));

  // ── Calculate responsive Y-axis domain based on data ──
  const calculateYAxisDomain = () => {
    if (chartData.length === 0) return { min: 0, max: 200, ticks: [0, 50, 100, 150, 200] };

    // Get all non-null values
    const values = chartData
      .filter((d) => d.is_absent === false)
      .map((d) => d.checkin_delay_minutes)
      .filter((v) => v !== null);

    if (values.length === 0) return { min: 0, max: 200, ticks: [0, 50, 100, 150, 200] };

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Determine the domain
    let domainMin = Math.floor(minValue / 50) * 50;
    let domainMax = Math.ceil(maxValue / 50) * 50;

    // If all values are positive, start from 0
    if (minValue >= 0) {
      domainMin = 0;
    }

    // Add some padding
    if (domainMin < 0) domainMin -= 50;
    domainMax += 50;

    // Generate ticks with 50-minute intervals
    const ticks = [];
    for (let i = domainMin; i <= domainMax; i += 50) {
      ticks.push(i);
    }

    return { min: domainMin, max: domainMax, ticks };
  };

  const yAxisConfig = calculateYAxisDomain();

  return (
    <div className="p-1">

      {/* ── STATUS CARD ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-4 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Left — status text */}
          <div className="flex items-center gap-4 min-w-0">
            {status?.is_checked_in ? (
              <>
                <AnalogClockIcon size={50} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight truncate">
                    Checked in since {formatPKTLocalTimeOnly(status.check_in_time!)}
                  </p>
                  <p className="text-2xl font-bold font-mono tracking-tight leading-tight mt-0.5">
                    {elapsedTime}
                  </p>
                </div>
              </>
            ) : hasCheckedOutToday && status?.check_in_time && status?.check_out_time ? (
              <>
                <AnalogClockIcon size={50} className="flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight mb-1">
                    Day complete
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] text-blue-200 uppercase tracking-wide leading-none">Check In</p>
                      <p className="text-sm font-bold font-mono text-white leading-tight">
                        {formatPKTLocalTimeOnly(status.check_in_time)}
                      </p>
                    </div>
                    <div className="text-blue-300 text-lg">→</div>
                    <div>
                      <p className="text-[10px] text-blue-200 uppercase tracking-wide leading-none">Check Out</p>
                      <p className="text-sm font-bold font-mono text-white leading-tight">
                        {formatPKTLocalTimeOnly(status.check_out_time)}
                      </p>
                    </div>
                    <div className="text-blue-300 text-lg">·</div>
                    <div>
                      <p className="text-[10px] text-blue-200 uppercase tracking-wide leading-none">Work Hours</p>
                      <p className="text-sm font-bold font-mono text-white leading-tight">
                        {(() => {
                          const diff = new Date(status.check_out_time).getTime() - new Date(status.check_in_time).getTime();
                          const h = Math.floor(diff / 3_600_000);
                          const m = Math.floor((diff % 3_600_000) / 60_000);
                          return `${h}h ${m}m`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AnalogClockIcon size={50} className="flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">Ready to start?</p>
                  <p className="text-xs text-blue-100 leading-tight mt-0.5">Clock in to begin tracking.</p>
                </div>
              </>
            )}
          </div>

          {/* Right — buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCheckIn}
              disabled={checkInDisabled}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow
                ${hasCheckedInToday
                  ? "bg-white/20 text-white/60 cursor-default"
                  : "bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 cursor-pointer"
                }
                disabled:cursor-not-allowed
              `}
            >
              {checkInLabel}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={checkOutDisabled}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow
                ${hasCheckedOutToday
                  ? "bg-white/20 text-white/60 cursor-default"
                  : !hasCheckedInToday
                    ? "bg-white/20 text-white/60 cursor-not-allowed"
                    : "bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 cursor-pointer"
                }
                disabled:cursor-not-allowed
              `}
            >
              {checkOutLabel}
            </button>
          </div>

        </div>
      </div>

      {/* ── QUICK STATS ───────────────────────────────────────────────────── */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900">{formatHoursAsHoursMinutes(quickStats.today_hours)}</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-600">Today's Hours</h4>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {formatHoursAsHoursMinutes(quickStats.week_hours)}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-600">This Week</h4>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {quickStats.days_worked_this_week}/7
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-600">Days Worked</h4>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {formatHoursAsHoursMinutes(quickStats.average_daily_hours)}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-600">Daily Average</h4>
          </div>
        </div>
      )}

      {/* ── MY CHECK IN TRENDS ────────────────────────────────────────────── */}
      {isInitialLoading ? (
        <SkeletonChart height="h-96" />
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">My Check In Trends</h3>
            {fifteenDayTrend.length > 0 && (
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          {fifteenDayTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={380}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
            >
              <defs>
                <linearGradient id="colorCheckin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d) =>
                  formatDateOnlyPKT(d, { month: "short", day: "numeric" })
                }
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: "12px" }}
                tick={{ fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                domain={[yAxisConfig.min, yAxisConfig.max]}
                ticks={yAxisConfig.ticks}
                label={{
                  value: "Minutes",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: "12px", fill: "#94a3b8" },
                }}
              />
              <Tooltip
                formatter={(value: any, _: string, props: any) => {
                  if (props.payload.is_absent) return "Absent";
                  if (props.payload.is_active) return `${formatMinutesToHoursMinutes(value)} late (Active)`;
                  if (value === 0) return "On time";
                  if (value > 0) return `${formatMinutesToHoursMinutes(value)} late`;
                  return `${formatMinutesToHoursMinutes(value)} early`;
                }}
                labelFormatter={(label) =>
                  formatDateOnlyPKT(label, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              />
              <Area
                type="monotone"
                dataKey="checkin_delay_minutes"
                name="Checkin Status"
                stroke="none"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCheckin)"
                connectNulls={false}
                dot={<CustomizedDot />}
                activeDot={{ r: 6 }}
                isAnimationActive={true}
              />
              {/* Color-coded line connecting the dots */}
              <Line
                type="monotone"
                dataKey="checkin_delay_minutes"
                name="Checkin Status"
                stroke="#f97316"
                strokeWidth={20}
                dot={true}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 bg-slate-50 rounded-lg">
              <div className="text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-slate-500">Loading trend data...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;