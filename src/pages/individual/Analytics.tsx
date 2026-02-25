import React, { useState, useEffect } from "react";
import {
  fetchDailyTrend,
  fetchWeeklyTrend,
  fetchWorkWeekly,
  fetchMonthlyStats,
  type DailyTrend,
  type WeeklyTrend,
  type MonthlyStats,
} from "../../api/analytics";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "../../components/Skeleton";
import { isFutureDate, formatDateOnlyPKT, getTodayPKT, formatHoursAsHoursMinutes, formatPKTLocalDateOnly } from "../../utils/dateUtils";
import { CacheManager } from "../../utils/cacheManager";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type ViewType = "daily" | "weekly" | "monthly";

const Analytics: React.FC = () => {
  // ── STATE ────────────────────────────────────────────────────────────────
  const [viewType, setViewType] = useState<ViewType>("weekly");
  const [loading, setLoading] = useState(false);

  // Data
  const [dailyTrend, setDailyTrend] = useState<DailyTrend | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend | null>(null);
  const [workWeekly, setWorkWeekly] = useState<Array<{ date: string; work_hours: number }> | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

  // ── EFFECTS ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewType]);

  // ── DATA LOADING ─────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      if (viewType === "daily") {
        const today = getTodayPKT();
        
        // Check if cache is valid (not expired) BEFORE setting loading
        if (CacheManager.isValid("analytics/daily", { date: today })) {
          const cachedDaily = CacheManager.get<DailyTrend>(
            "analytics/daily",
            { date: today }
          );
          if (cachedDaily) {
            setDailyTrend(cachedDaily);
            setLoading(false);
            return; // Don't fetch if cache is still valid
          }
        }

        // Cache is invalid or doesn't exist, set loading and fetch from API
        setLoading(true);
        const trend = await fetchDailyTrend(today);
        CacheManager.set("analytics/daily", trend, { date: today });
        setDailyTrend(trend);
      } else if (viewType === "weekly") {
        // Check if cache is valid (not expired)
        if (CacheManager.isValid("analytics/weekly", {})) {
          const cachedWeekly = CacheManager.get<WeeklyTrend>(
            "analytics/weekly",
            {}
          );
          if (cachedWeekly) {
            setWeeklyTrend(cachedWeekly);
            setLoading(false);
            // Also fetch work-daily for the work hours chart
            try {
              const workData = await fetchWorkWeekly();
              setWorkWeekly(workData);
            } catch {
              // Fail silently - keep existing data
            }
            return;
          }
        }

        // Cache is invalid or doesn't exist, fetch from API
        setLoading(true);
        const [trend, workData] = await Promise.all([
          fetchWeeklyTrend(),
          fetchWorkWeekly(),
        ]);
        CacheManager.set("analytics/weekly", trend, {});
        setWeeklyTrend(trend);
        setWorkWeekly(workData);
      } else if (viewType === "monthly") {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Check if cache is valid (not expired)
        const weeklyValid = CacheManager.isValid("analytics/weekly", {});
        const monthlyValid = CacheManager.isValid("analytics/monthly", { year, month });
        
        if (weeklyValid && monthlyValid) {
          const cachedWeekly = CacheManager.get<WeeklyTrend>("analytics/weekly", {});
          const cachedMonthly = CacheManager.get<MonthlyStats>(
            "analytics/monthly",
            { year, month }
          );
          if (cachedWeekly && cachedMonthly) {
            setWeeklyTrend(cachedWeekly);
            setMonthlyStats(cachedMonthly);
            setLoading(false);
            return; // Don't fetch if cache is still valid
          }
        }

        // Cache is invalid or doesn't exist, fetch from API
        setLoading(true);
        const [trend, stats] = await Promise.all([
          fetchWeeklyTrend(),
          fetchMonthlyStats(year, month),
        ]);
        CacheManager.set("analytics/weekly", trend, {});
        CacheManager.set("analytics/monthly", stats, { year, month });
        setWeeklyTrend(trend);
        setMonthlyStats(stats);
      }
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER HELPERS ───────────────────────────────────────────────────────



  const renderDailyView = () => {
    if (!dailyTrend) return null;

    if (!dailyTrend.has_record) {
      return (
        <div className="bg-slate-100 rounded-xl p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-slate-600 text-lg">
            {dailyTrend.message || "No check-in/check-out record for this date"}
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Attendance</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {dailyTrend?.check_in_time ? "Present" : "Absent"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Today</p>
          </div>

          <div className={`rounded-xl shadow-md border border-slate-200 p-5 ${
            !dailyTrend?.check_out_time ? "bg-slate-50" : dailyTrend.duty_completed ? "bg-green-50" : "bg-red-50"
          }`}>
            <p className="text-xs font-bold text-slate-600 uppercase">Duty Status</p>
            {!dailyTrend?.check_out_time ? (
              <>
                <p className="text-2xl font-bold text-slate-400 mt-2">—</p>
                <p className="text-xs text-slate-500 mt-1">Waiting for checkout</p>
              </>
            ) : (
              <>
                <p className={`text-2xl font-bold mt-2 ${
                  dailyTrend.duty_completed ? "text-green-600" : "text-red-600"
                }`}>
                  {dailyTrend.duty_completed ? "✓ Complete" : "✗ Incomplete"}
                </p>
                {!dailyTrend.duty_completed && (
                  <p className="text-xs text-red-600 mt-1">Short by {formatHoursAsHoursMinutes(dailyTrend.shortfall_hours || 0)}</p>
                )}
              </>
            )}
          </div>

          <div className={`rounded-xl shadow-md border border-slate-200 p-5 ${
            dailyTrend?.checkin_status === "On Time" ? "bg-green-50" : "bg-orange-50"
          }`}>
            <p className="text-xs font-bold text-slate-600 uppercase">Check-in</p>
            <p className={`text-2xl font-bold mt-2 ${
              dailyTrend?.checkin_status === "On Time" ? "text-green-600" : "text-orange-600"
            }`}>
              {dailyTrend?.checkin_status}
            </p>
            <p className={`text-xs mt-1 ${
              dailyTrend?.checkin_status === "On Time" ? "text-green-600" : "text-orange-600"
            }`}>
              {(dailyTrend?.checkin_delay_minutes ?? 0) > 0
                ? `${dailyTrend?.checkin_delay_minutes} min late`
                : `${Math.abs(dailyTrend?.checkin_delay_minutes ?? 0)} min early`}
            </p>
          </div>

          <div className={`rounded-xl shadow-md border border-slate-200 p-5 ${
            !dailyTrend?.check_out_time ? "bg-slate-50" : dailyTrend.checkout_status === "Early" ? "bg-orange-50" : "bg-green-50"
          }`}>
            <p className="text-xs font-bold text-slate-600 uppercase">Check-out</p>
            {!dailyTrend?.check_out_time ? (
              <>
                <p className="text-2xl font-bold text-slate-400 mt-2">—</p>
                <p className="text-xs text-slate-500 mt-1">Not checked out yet</p>
              </>
            ) : (
              <>
                <p className={`text-2xl font-bold mt-2 ${
                  dailyTrend.checkout_status === "Early" ? "text-orange-600" : "text-green-600"
                }`}>
                  {dailyTrend.checkout_status}
                </p>
                <p className={`text-xs mt-1 ${
                  dailyTrend.checkout_status === "Early" ? "text-orange-600" : "text-green-600"
                }`}>
                  {(dailyTrend.checkout_diff_minutes ?? 0) < 0
                    ? `${Math.abs(dailyTrend.checkout_diff_minutes ?? 0)} min early`
                    : `${dailyTrend.checkout_diff_minutes ?? 0} min late`}
                </p>
              </>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Work Hours</p>
            {!dailyTrend?.check_out_time ? (
              <>
                <p className="text-2xl font-bold text-slate-400 mt-2">—</p>
                <p className="text-xs text-slate-500 mt-1">Pending checkout</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {formatHoursAsHoursMinutes(dailyTrend.actual_work_hours || 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Required: {formatHoursAsHoursMinutes(dailyTrend.required_work_hours || 0)}</p>
              </>
            )}
          </div>
        </div>

        {/* Time Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Check-in Comparison</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-semibold text-green-700">Expected</span>
                <span className="text-sm font-mono">{dailyTrend.expected_checkin_display}</span>
              </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Actual</span>
              <span className="text-sm font-mono">{dailyTrend?.checkin_time_display || "—"}</span>
              </div>
              <div
                className={`flex justify-between items-center p-3 rounded-lg ${
                  (dailyTrend.checkin_delay_minutes ?? 0) > 0 ? "bg-red-50" : "bg-green-50"
                }`}
              >
                <span className="font-semibold">Difference</span>
                <span
                  className={`text-sm font-bold ${
                    (dailyTrend.checkin_delay_minutes ?? 0) > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {(dailyTrend.checkin_delay_minutes ?? 0) > 0
                    ? `+${dailyTrend.checkin_delay_minutes} min`
                    : `${dailyTrend.checkin_delay_minutes} min`}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Check-out Comparison</h2>
            <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Expected</span>
              <span className="text-sm font-mono">{dailyTrend?.expected_checkout_display || "—"}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="font-semibold text-slate-700">Actual</span>
              <span className="text-sm font-mono">{dailyTrend?.checkout_time_display || "—"}</span>
              </div>
              <div
                className={`flex justify-between items-center p-3 rounded-lg ${
                  (dailyTrend.checkout_diff_minutes ?? 0) < 0 ? "bg-orange-50" : "bg-green-50"
                }`}
              >
                <span className="font-semibold">Difference</span>
                <span
                  className={`text-sm font-bold ${
                    (dailyTrend.checkout_diff_minutes ?? 0) < 0 ? "text-orange-600" : "text-green-600"
                  }`}
                >
                  {(dailyTrend.checkout_diff_minutes ?? 0) < 0
                    ? `${dailyTrend.checkout_diff_minutes ?? 0} min`
                    : `+${dailyTrend.checkout_diff_minutes ?? 0} min`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderWeeklyView = () => {
    if (!weeklyTrend) return null;

    return (
      <>
        {/* Weekly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Total Hours</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {formatHoursAsHoursMinutes(weeklyTrend.total_work_hours)}
            </p>
            <p className="text-xs text-slate-500 mt-1">This week</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Duties Done</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {weeklyTrend.days_completed_duty}/7
            </p>
            <p className="text-xs text-slate-500 mt-1">Days with 9+ hours</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Late Check-ins</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{weeklyTrend.days_late}</p>
            <p className="text-xs text-slate-500 mt-1">Days</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Daily Average</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {formatHoursAsHoursMinutes(weeklyTrend.average_daily_hours)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Per day</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Work Hours Chart */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Daily Work Hours (Projects)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={workWeekly || weeklyTrend.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDateOnlyPKT(d, { weekday: "short" })}
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  formatter={(v: any) => `${v}h`}
                  labelFormatter={(l) =>
                    formatDateOnlyPKT(l, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  }
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <ReferenceLine
                  y={9}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: "Required (9h)", fill: "#ef4444", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="work_hours"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Work Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Punctuality Chart */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Check-in Punctuality</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDateOnlyPKT(d, { weekday: "short" })}
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                  label={{
                    value: "Minutes",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: "12px" },
                  }}
                />
                <Tooltip
                  formatter={(v: any) => (v !== null ? `${v} min` : "No data")}
                  labelFormatter={(l) =>
                    formatDateOnlyPKT(l, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  }
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <ReferenceLine
                  y={0}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  label={{ value: "On Time", fill: "#10b981", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="checkin_delay_minutes"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: "#f59e0b", r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Check-in Delay"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Summary Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Daily Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Work Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Check-in Delay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Duty Complete
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {weeklyTrend.trends.map((day, index) => (
                  <tr key={index} className={`hover:bg-slate-50 transition-colors ${day.is_active ? "bg-blue-50" : ""}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatPKTLocalDateOnly(day.date)}
                      {day.is_active && <span className="ml-2 text-xs font-semibold text-blue-600">(Active)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatHoursAsHoursMinutes(day.work_hours)}
                        {day.is_active && <span className="text-xs text-blue-600 ml-1">(ongoing)</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {day.checkin_delay_minutes !== null ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            day.checkin_delay_minutes > 0
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {day.checkin_delay_minutes > 0
                            ? `${day.checkin_delay_minutes} min - Late`
                            : `${day.checkin_delay_minutes} min`}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isFutureDate(day.date) ? (
                        <span className="text-slate-400 text-sm">—</span>
                      ) : day.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          In Progress
                        </span>
                      ) : day.duty_completed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderMonthlyView = () => {
    if (!monthlyStats) return null;

    return (
      <>
        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Total Hours</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {formatHoursAsHoursMinutes(monthlyStats.total_hours)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{monthlyStats.month}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Days Worked</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{monthlyStats.days_worked}</p>
            <p className="text-xs text-slate-500 mt-1">Active days</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Daily Average</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {formatHoursAsHoursMinutes(monthlyStats.avg_daily_hours)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Per day</p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Period</p>
            <p className="text-lg font-bold text-slate-900 mt-2">{monthlyStats.month}</p>
            <p className="text-xs text-slate-500 mt-1">Selected month</p>
          </div>
        </div>

        {/* Weekly trend for the month (if available) */}
        {weeklyTrend && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Recent Weekly Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyTrend.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDateOnlyPKT(d, { weekday: "short" })}
                  stroke="#64748b"
                  style={{ fontSize: "12px" }}
                />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  formatter={(v: any) => `${v}h`}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="work_hours" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Work Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </>
    );
  };

  // ── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <div className="p-1">
      {/* View Type Selector */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setViewType("daily")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            viewType === "daily"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setViewType("weekly")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            viewType === "weekly"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setViewType("monthly")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            viewType === "monthly"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <>
          {viewType === "daily" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonChart height="h-72" />
                <SkeletonChart height="h-72" />
              </div>
            </>
          )}
          {viewType === "weekly" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <SkeletonChart height="h-80" />
                <SkeletonChart height="h-80" />
              </div>
              <SkeletonTable rows={7} />
            </>
          )}
          {viewType === "monthly" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
              <SkeletonChart height="h-80" className="mb-6" />
            </>
          )}
        </>
      ) : (
        <>
          {viewType === "daily" && renderDailyView()}
          {viewType === "weekly" && renderWeeklyView()}
          {viewType === "monthly" && renderMonthlyView()}
        </>
      )}
    </div>
  );
};

export default Analytics;