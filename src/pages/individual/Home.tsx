import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "recharts";
import AnalogClockIcon from "../../components/AnalogClockIcon";
import { SkeletonCard, SkeletonChart } from "../../components/Skeleton";
import {
  isToday,
  getTodayPKT,
  formatHoursAsHoursMinutes,
  getDateStringPKT,
  getNowPKTISO,
  formatPKTLocalTimeOnly,
  formatDateOnlyPKT,
} from "../../utils/dateUtils";
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
  is_weekend?: boolean;
}

interface QuickStats {
  today_hours: number;
  week_hours: number;
  days_worked_this_week: number;
  average_daily_hours: number;
}

const calcDutyHours = (start: string, end: string): number => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(mins / 60, 0);
};

const formatMinutesToHoursMinutes = (minutes: number): string => {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const QUICK_ACTIONS = [
  {
    label: "Log Time",
    desc: "Track a work session",
    to: "/time-tracker",
    color: "blue",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Reports",
    desc: "View detailed reports",
    to: "/reports",
    color: "emerald",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    label: "Projects",
    desc: "Manage your projects",
    to: "/projects",
    color: "violet",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    label: "Notifications",
    desc: "See recent updates",
    to: "/notifications",
    color: "amber",
    icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
];

const ACTION_COLORS: Record<string, string> = {
  blue:    "bg-blue-50   text-blue-600   group-hover:bg-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  violet:  "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
  amber:   "bg-amber-50  text-amber-600  group-hover:bg-amber-100",
};

const Home: React.FC = () => {
  const [, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CheckInStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState("0h 0m 0s");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dutyHours, setDutyHours] = useState(8);
  const [fifteenDayTrend, setFifteenDayTrend] = useState<DateRangeTrend[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    today_hours: 0,
    week_hours: 0,
    days_worked_this_week: 0,
    average_daily_hours: 0,
  });
  const [chartMode, setChartMode] = useState<"hours" | "delay">("hours");
  const [startDate, setStartDate] = useState<string>(() => {
    const pktNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const date = new Date(pktNow);
    date.setDate(date.getDate() - 14);
    return getDateStringPKT(date);
  });
  const [endDate, setEndDate] = useState<string>(getTodayPKT());

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useRef(useNavigate()).current;

  const hasCheckedInToday  = isToday(status?.check_in_time);
  const hasCheckedOutToday = isToday(status?.check_out_time);

  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(fetchStatus, 60_000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // ── boot ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(storedUser);
      const loadInitialData = async () => {
        try {
          await fetchStatus();
          await Promise.all([
            fetchWeeklyTrends(),
            fetchFifteenDayTrend(),
            fetchQuickStats(),
            fetchDutyHours(),
          ]);
        } finally {
          setIsInitialLoading(false);
        }
      };
      loadInitialData();
    }
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (status?.is_checked_in) startPolling();
    else stopPolling();
  }, [status?.is_checked_in]);

  useEffect(() => {
    fetchFifteenDayTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // ── live timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status?.is_checked_in && status?.check_in_time) {
      const interval = setInterval(() => {
        const diff = Date.now() - new Date(status.check_in_time!).getTime();
        const totalSecs = Math.floor(diff / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        setElapsedTime(`${h}h ${m}m ${s}s`);
        setElapsedSeconds(totalSecs);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime("0h 0m 0s");
      setElapsedSeconds(0);
    }
  }, [status?.is_checked_in, status?.check_in_time]);

  // ── api ───────────────────────────────────────────────────────────────────
  const fetchStatus = async () => {
    try {
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

  const fetchDutyHours = async () => {
    try {
      // DashboardLayout already fetches /users/settings — read from cache first
      const cached = CacheManager.isValid("users/settings", {})
        ? CacheManager.get<any>("users/settings", {})
        : null;

      if (cached?.working_hours_start && cached?.working_hours_end) {
        setDutyHours(calcDutyHours(cached.working_hours_start, cached.working_hours_end));
        return;
      }

      // Cache not ready yet — fetch directly
      const res = await axios.get(`${API_BASE_URL}/users/settings`);
      if (res.data?.working_hours_start && res.data?.working_hours_end) {
        CacheManager.set("users/settings", res.data, {});
        setDutyHours(calcDutyHours(res.data.working_hours_start, res.data.working_hours_end));
      }
    } catch {
      // fallback stays at 8h default
    }
  };

  const fetchWeeklyTrends = async () => {
    const cacheKey = "trends/weekly";
    if (CacheManager.isValid(cacheKey, {})) {
      const cachedData = CacheManager.get<WeeklyTrend>(cacheKey, {});
      if (cachedData) return;
    }
    const pendingRequest = CacheManager.getPendingRequest(cacheKey, {});
    if (pendingRequest) {
      try { await pendingRequest; } catch (error) { console.error("Pending weekly trends request failed:", error); }
      return;
    }
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
    CacheManager.setPendingRequest(cacheKey, fetchPromise, {});
  };

  const fetchFifteenDayTrend = async () => {
    const cacheParams = { startDate, endDate };
    const cacheKey = "trends/date-range";
    if (CacheManager.isValid(cacheKey, cacheParams)) {
      const cachedData = CacheManager.get<any>(cacheKey, cacheParams);
      if (cachedData) {
        setFifteenDayTrend(cachedData.trends);
        return;
      }
    }
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
    const fetchPromise = (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/attendance/trend/date-range`, {
          params: { start_date: startDate, end_date: endDate },
        });
        setFifteenDayTrend(res.data.trends);
        CacheManager.set(cacheKey, res.data, cacheParams);
        return res.data;
      } catch (e) {
        console.error("Failed to fetch trend:", e);
        throw e;
      }
    })();
    CacheManager.setPendingRequest(cacheKey, fetchPromise, cacheParams);
  };

  const fetchQuickStats = async () => {
    try {
      const weekStart = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartDate = getDateStringPKT(weekStart);
      const weekEndDate = getTodayPKT();
      const today = getTodayPKT();

      const weekRes = await getWithCache<any>(`${API_BASE_URL}/reports/work-daily`, {
        cacheKey: "stats/quick",
        params: { start_date: weekStartDate, end_date: weekEndDate },
      });

      let todayHours = 0;
      let weekHours = 0;
      let daysWorked = 0;

      if (Array.isArray(weekRes)) {
        weekRes.forEach((report: any) => {
          const reportDate = report.date || report.work_date;
          if (reportDate === today) todayHours = report.total_hours || 0;
          weekHours += report.total_hours || 0;
          if (report.total_hours > 0) daysWorked += 1;
        });
      }

      const avgDaily = daysWorked > 0 ? weekHours / daysWorked : 0;
      setQuickStats({
        today_hours: parseFloat(todayHours.toFixed(2)),
        week_hours: parseFloat(weekHours.toFixed(2)),
        days_worked_this_week: daysWorked,
        average_daily_hours: parseFloat(avgDaily.toFixed(2)),
      });
    } catch (e) {
      console.error("Failed to fetch quick stats:", e);
    }
  };

  const handleCheckIn = async () => {
    if (hasCheckedInToday || loading) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/attendance/check-in`, { note: "", check_in_time: getNowPKTISO() });
      CacheManager.clear("trends/weekly");
      CacheManager.clear("trends/date-range", { startDate, endDate });
      CacheManager.clear("stats/quick");
      await Promise.all([fetchStatus(), fetchWeeklyTrends(), fetchFifteenDayTrend(), fetchQuickStats()]);
    } catch (error: any) {
      console.error("Check-in error:", error?.response?.data || error?.message);
      alert(error?.response?.data?.detail || error?.message || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!hasCheckedInToday || hasCheckedOutToday || loading) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/attendance/check-out`, { note: "", check_out_time: getNowPKTISO() });
      CacheManager.clear("trends/weekly");
      CacheManager.clear("trends/date-range", { startDate, endDate });
      CacheManager.clear("stats/quick");
      await Promise.all([fetchStatus(), fetchWeeklyTrends(), fetchFifteenDayTrend(), fetchQuickStats()]);
    } catch (error: any) {
      console.error("Check-out error:", error?.response?.data || error?.message);
      alert(error?.response?.data?.detail || error?.message || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const checkInDisabled  = hasCheckedInToday || loading;
  const checkOutDisabled = !hasCheckedInToday || hasCheckedOutToday || loading;
  const checkInLabel     = hasCheckedInToday  ? "Checked In ✓" : loading ? "Processing…" : "Check In";
  const checkOutLabel    = hasCheckedOutToday ? "Checked Out ✓"
    : !hasCheckedInToday ? "Check Out"
    : loading ? "Processing…" : "Check Out";

  // ── progress bar ─────────────────────────────────────────────────────────
  const dutySeconds = dutyHours * 3600;
  const workedSeconds = status?.is_checked_in
    ? elapsedSeconds
    : hasCheckedOutToday && status?.check_in_time && status?.check_out_time
      ? (new Date(status.check_out_time).getTime() - new Date(status.check_in_time).getTime()) / 1000
      : 0;
  const workedHours  = workedSeconds / 3600;
  const progressPct  = dutySeconds > 0 ? Math.min((workedSeconds / dutySeconds) * 100, 100) : 0;
  const goalMet      = workedSeconds >= dutySeconds;

  // ── chart ─────────────────────────────────────────────────────────────────
  const chartData = fifteenDayTrend.map((d) => ({
    date: d.date,
    work_hours: d.work_hours || 0,
    checkin_delay_minutes: d.checkin_delay_minutes !== null ? d.checkin_delay_minutes : 0,
    is_absent:  d.checkin_delay_minutes === null && !d.is_weekend,
    is_weekend: d.is_weekend || false,
    is_active:  d.is_active  || false,
  }));

  const workHoursYMax = Math.max(Math.ceil(Math.max(...chartData.map((d) => d.work_hours), 0)) + 2, 4);

  const calculateDelayYAxisDomain = () => {
    if (chartData.length === 0) return { min: 0, max: 200, ticks: [0, 50, 100, 150, 200] };
    const values = chartData.filter((d) => !d.is_absent).map((d) => d.checkin_delay_minutes);
    if (values.length === 0) return { min: 0, max: 200, ticks: [0, 50, 100, 150, 200] };
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    let domainMin = minValue >= 0 ? 0 : Math.floor(minValue / 50) * 50 - 50;
    let domainMax = Math.ceil(maxValue / 50) * 50 + 50;
    const ticks: number[] = [];
    for (let i = domainMin; i <= domainMax; i += 50) ticks.push(i);
    return { min: domainMin, max: domainMax, ticks };
  };

  const delayYAxis = calculateDelayYAxisDomain();

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── STATUS CARD ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 rounded-2xl px-6 py-5 text-white shadow-xl shadow-blue-500/20">

        {/* Top row: status info + buttons */}
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-4 min-w-0">
            <AnalogClockIcon size={50} className="flex-shrink-0" />
            <div className="min-w-0">
              {status?.is_checked_in ? (
                <>
                  <p className="text-sm font-medium text-blue-200 leading-tight">
                    Checked in since {formatPKTLocalTimeOnly(status.check_in_time!)}
                  </p>
                  <p className="text-3xl font-bold font-mono tracking-tight mt-0.5">
                    {elapsedTime}
                  </p>
                </>
              ) : hasCheckedOutToday && status?.check_in_time && status?.check_out_time ? (
                <>
                  <p className="text-sm font-medium text-blue-200 leading-tight mb-2">Day complete</p>
                  <div className="flex items-center gap-5 flex-wrap">
                    <div>
                      <p className="text-[10px] text-blue-300 uppercase tracking-widest leading-none mb-0.5">Check In</p>
                      <p className="text-base font-bold font-mono">{formatPKTLocalTimeOnly(status.check_in_time)}</p>
                    </div>
                    <div className="text-blue-400 text-lg">→</div>
                    <div>
                      <p className="text-[10px] text-blue-300 uppercase tracking-widest leading-none mb-0.5">Check Out</p>
                      <p className="text-base font-bold font-mono">{formatPKTLocalTimeOnly(status.check_out_time)}</p>
                    </div>
                    <div className="w-px h-8 bg-white/20 hidden sm:block" />
                    <div>
                      <p className="text-[10px] text-blue-300 uppercase tracking-widest leading-none mb-0.5">Total</p>
                      <p className="text-base font-bold font-mono">
                        {(() => {
                          const diff = new Date(status.check_out_time).getTime() - new Date(status.check_in_time).getTime();
                          const h = Math.floor(diff / 3_600_000);
                          const m = Math.floor((diff % 3_600_000) / 60_000);
                          return `${h}h ${m}m`;
                        })()}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold leading-tight">Ready to start your day?</p>
                  <p className="text-sm text-blue-200 leading-tight mt-0.5">Check in to begin tracking your time.</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleCheckIn}
              disabled={checkInDisabled}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm
                ${hasCheckedInToday
                  ? "bg-white/15 text-white/50 cursor-default"
                  : "bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 cursor-pointer"
                } disabled:cursor-not-allowed`}
            >
              {checkInLabel}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={checkOutDisabled}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm
                ${hasCheckedOutToday
                  ? "bg-white/15 text-white/50 cursor-default"
                  : !hasCheckedInToday
                    ? "bg-white/15 text-white/50 cursor-not-allowed"
                    : "bg-white text-blue-700 hover:bg-blue-50 hover:scale-105 cursor-pointer"
                } disabled:cursor-not-allowed`}
            >
              {checkOutLabel}
            </button>
          </div>
        </div>

        {/* ── Duty Progress Bar ─────────────────────────────────────────── */}
        <div className="mt-5 pt-4 border-t border-white/15">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-blue-200">Daily Goal</span>
              {goalMet && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-full px-2 py-0.5 uppercase tracking-wide">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Complete
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-white tabular-nums">
                {formatHoursAsHoursMinutes(workedHours)}
              </span>
              <span className="text-blue-300">/</span>
              <span className="text-blue-200">{dutyHours}h</span>
              <span className="text-white/30 mx-0.5">·</span>
              <span className="text-white/60 tabular-nums">{progressPct.toFixed(0)}%</span>
            </div>
          </div>

          {/* Track */}
          <div className="relative h-2.5 bg-white/15 rounded-full overflow-hidden">
            {/* Animated fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${progressPct}%`,
                background: goalMet
                  ? "linear-gradient(90deg, #34d399, #10b981)"
                  : "linear-gradient(90deg, rgba(255,255,255,0.75), rgba(255,255,255,0.9))",
                boxShadow: goalMet
                  ? "0 0 10px rgba(52,211,153,0.5)"
                  : "0 0 8px rgba(255,255,255,0.3)",
              }}
            />
            {/* Pulse glow on active session */}
            {status?.is_checked_in && !goalMet && (
              <div
                className="absolute inset-y-0 right-0 w-6 rounded-r-full animate-pulse"
                style={{
                  left: `${progressPct}%`,
                  width: "20px",
                  marginLeft: "-10px",
                  background: "linear-gradient(90deg, rgba(255,255,255,0.4), transparent)",
                  maxWidth: `${100 - progressPct}%`,
                }}
              />
            )}
          </div>

          {/* Hour markers — one per hour */}
          <div className="flex justify-between mt-1.5">
            {Array.from({ length: dutyHours + 1 }, (_, i) => i).map((h) => (
              <span key={h} className="text-[10px] text-blue-300/60 tabular-nums">{h}h</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK STATS ───────────────────────────────────────────────────── */}
      {isInitialLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Today's Hours */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Today</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {formatHoursAsHoursMinutes(quickStats.today_hours)}
            </p>
            <p className="text-xs text-slate-500 mb-2">Today's Hours</p>
            <div className="flex items-center gap-1.5">
              {status?.is_checked_in ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-medium">Session active</span>
                </>
              ) : hasCheckedOutToday ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-xs text-slate-500">Day complete</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-400">Not started</span>
                </>
              )}
            </div>
          </div>

          {/* This Week */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">This Week</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {formatHoursAsHoursMinutes(quickStats.week_hours)}
            </p>
            <p className="text-xs text-slate-500 mb-2">Total Hours</p>
            <p className="text-xs text-slate-400">{quickStats.days_worked_this_week} days tracked</p>
          </div>

          {/* Days Worked */}
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Days Worked</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {quickStats.days_worked_this_week}
            </p>
            <p className="text-xs text-slate-500 mb-2">This week</p>
            <p className="text-xs text-slate-400">Mon – Sun</p>
          </div>

          {/* Daily Average */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Avg / Day</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {formatHoursAsHoursMinutes(quickStats.average_daily_hours)}
            </p>
            <p className="text-xs text-slate-500 mb-2">Daily Average</p>
            <p className="text-xs text-slate-400">
              {quickStats.days_worked_this_week > 0
                ? `Based on ${quickStats.days_worked_this_week} days`
                : "No data yet"}
            </p>
          </div>

        </div>
      )}

      {/* ── CHART + QUICK ACTIONS ────────────────────────────────────────── */}
      {isInitialLoading ? (
        <SkeletonChart height="h-80" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {chartMode === "hours" ? "Work Hours" : "Check-in Timing"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {chartMode === "hours"
                    ? "Hours worked per day"
                    : "Minutes early (−) or late (+) per day"}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
                  <button
                    onClick={() => setChartMode("hours")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                      chartMode === "hours"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Work Hours
                  </button>
                  <button
                    onClick={() => setChartMode("delay")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                      chartMode === "delay"
                        ? "bg-white shadow text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Check-in Delay
                  </button>
                </div>
                {fifteenDayTrend.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                    />
                    <span className="text-slate-300 text-xs">–</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {fifteenDayTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                {chartMode === "hours" ? (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => formatDateOnlyPKT(d, { month: "short", day: "numeric" })}
                      stroke="#e2e8f0"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="none"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, workHoursYMax]}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatHoursAsHoursMinutes(value), "Work Hours"]}
                      labelFormatter={(label) =>
                        formatDateOnlyPKT(label, { weekday: "short", month: "short", day: "numeric" })
                      }
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "12px",
                        padding: "8px 12px",
                      }}
                      cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="work_hours"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#colorHours)"
                      dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                    <defs>
                      <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f97316" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => formatDateOnlyPKT(d, { month: "short", day: "numeric" })}
                      stroke="#e2e8f0"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="none"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[delayYAxis.min, delayYAxis.max]}
                      ticks={delayYAxis.ticks}
                      tickFormatter={(v) => `${v}m`}
                    />
                    <Tooltip
                      formatter={(value: any, _: string, props: any) => {
                        if (props.payload.is_weekend) return ["Weekend", "Status"];
                        if (props.payload.is_absent)  return ["Absent",  "Status"];
                        if (props.payload.is_active)  return [`${formatMinutesToHoursMinutes(value)} late (Active)`, "Status"];
                        if (value === 0)  return ["On time", "Status"];
                        if (value > 0)   return [`${formatMinutesToHoursMinutes(value)} late`, "Status"];
                        return [`${formatMinutesToHoursMinutes(value)} early`, "Status"];
                      }}
                      labelFormatter={(label) =>
                        formatDateOnlyPKT(label, { weekday: "short", month: "short", day: "numeric" })
                      }
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        fontSize: "12px",
                        padding: "8px 12px",
                      }}
                      cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="checkin_delay_minutes"
                      name="Check-in Delay"
                      stroke="#f97316"
                      strokeWidth={2.5}
                      fill="url(#colorDelay)"
                      dot={{ r: 4, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#f97316", stroke: "#fff", strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm font-medium text-slate-400">No trend data yet</p>
                  <p className="text-xs text-slate-300 mt-1">Check in to start building your history</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-0.5">Quick Actions</h3>
            <p className="text-xs text-slate-400 mb-5">Jump to a section</p>
            <div className="space-y-1.5 flex-1">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-all duration-150 border border-transparent hover:border-slate-100"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${ACTION_COLORS[action.color]}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 leading-tight">
                      {action.label}
                    </p>
                    <p className="text-xs text-slate-400 leading-tight mt-0.5">{action.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Home;
