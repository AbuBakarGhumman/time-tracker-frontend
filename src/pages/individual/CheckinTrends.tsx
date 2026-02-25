import React, { useState, useEffect } from "react";
import axios from "../../api/interceptor";
import { API_BASE_URL } from "../../api/config";
import { formatDateOnlyPKT, getTodayPKT, formatHoursAsHoursMinutes, formatPKTLocalDateOnly } from "../../utils/dateUtils";
import CacheManager from "../../utils/cacheManager";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface DailyTrend {
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

const CheckinTrends: React.FC = () => {
  const [viewType, setViewType] = useState<"daily" | "weekly">("daily");
  const [selectedDate, setSelectedDate] = useState(getTodayPKT());
  const [dailyTrend, setDailyTrend] = useState<DailyTrend | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, [selectedDate, viewType]);

  const fetchTrends = async () => {
    try {
      if (viewType === "daily") {
        // Check if cache is valid (not expired)
        if (CacheManager.isValid("attendance/trend/daily", { date: selectedDate })) {
          const cachedDaily = CacheManager.get<DailyTrend>(
            "attendance/trend/daily",
            { date: selectedDate }
          );
          if (cachedDaily) {
            setDailyTrend(cachedDaily);
            setLoading(false);
            return; // Don't fetch if cache is still valid
          }
        }

        // Cache is invalid or doesn't exist, fetch from API
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/attendance/trend/daily/${selectedDate}`
        );
        CacheManager.set(
          "attendance/trend/daily",
          response.data,
          { date: selectedDate }
        );
        setDailyTrend(response.data);
      } else {
        // Check if cache is valid (not expired)
        if (CacheManager.isValid("attendance/trend/weekly", {})) {
          const cachedWeekly = CacheManager.get<WeeklyTrend>(
            "attendance/trend/weekly",
            {}
          );
          if (cachedWeekly) {
            setWeeklyTrend(cachedWeekly);
            setLoading(false);
            return; // Don't fetch if cache is still valid
          }
        }

        // Cache is invalid or doesn't exist, fetch from API
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/attendance/trend/weekly`
        );
        CacheManager.set("attendance/trend/weekly", response.data, {});
        setWeeklyTrend(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch trends:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-1">
      {/* Office Hours Info */}
      <div className="bg-blue-50 rounded-xl shadow-md border-l-4 border-blue-600 p-5 mb-6">
        <h2 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Office Hours
        </h2>
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Check-in:</span> 12:00 PM | 
          <span className="font-semibold ml-3">Check-out:</span> 9:00 PM | 
          <span className="font-semibold ml-3">Required:</span> 9 hours
        </p>
      </div>

      {/* View Type Selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setViewType("daily")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            viewType === "daily"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          📅 Daily Trend
        </button>
        <button
          onClick={() => setViewType("weekly")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            viewType === "weekly"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          📊 Weekly Trend
        </button>
      </div>

      {/* Daily View */}
      {viewType === "daily" && (
        <div>
          {/* Date Selector */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 mb-6">
            <label className="block text-sm font-semibold mb-2 text-slate-700">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : dailyTrend && dailyTrend.has_record ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className={`rounded-xl shadow-md p-5 border-l-4 ${
                  dailyTrend.duty_completed
                    ? "bg-green-50 border-green-600"
                    : "bg-red-50 border-red-600"
                }`}>
                  <p className="text-xs font-bold text-slate-600 uppercase">Duty Status</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    dailyTrend.duty_completed ? "text-green-600" : "text-red-600"
                  }`}>
                    {dailyTrend.duty_completed ? "✓ Complete" : "✗ Incomplete"}
                  </p>
                  {!dailyTrend.duty_completed && (
                    <p className="text-xs text-red-600 mt-1">Short by {formatHoursAsHoursMinutes(dailyTrend.shortfall_hours || 0)}</p>
                  )}
                </div>

                <div className={`rounded-xl shadow-md p-5 border-l-4 ${
                  dailyTrend.checkin_status === "On Time"
                    ? "bg-green-50 border-green-600"
                    : "bg-orange-50 border-orange-600"
                }`}>
                  <p className="text-xs font-bold text-slate-600 uppercase">Check-in</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    dailyTrend.checkin_status === "On Time" ? "text-green-600" : "text-orange-600"
                  }`}>
                    {dailyTrend.checkin_status}
                  </p>
                  <p className={`text-xs mt-1 ${
                    dailyTrend.checkin_status === "On Time" ? "text-green-600" : "text-orange-600"
                  }`}>
                    {(dailyTrend.checkin_delay_minutes ?? 0) > 0
                      ? `${dailyTrend.checkin_delay_minutes} min late`
                      : `${Math.abs(dailyTrend.checkin_delay_minutes ?? 0)} min early`}
                  </p>
                </div>

                <div className={`rounded-xl shadow-md p-5 border-l-4 ${
                  dailyTrend.checkout_status === "Early"
                    ? "bg-orange-50 border-orange-600"
                    : "bg-green-50 border-green-600"
                }`}>
                  <p className="text-xs font-bold text-slate-600 uppercase">Check-out</p>
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
                </div>

                <div className="bg-purple-50 rounded-xl shadow-md p-5 border-l-4 border-purple-600">
                  <p className="text-xs font-bold text-slate-600 uppercase">Work Hours</p>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {formatHoursAsHoursMinutes(dailyTrend.actual_work_hours ?? 0)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Required: {formatHoursAsHoursMinutes(dailyTrend.required_work_hours || 0)}</p>
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
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-blue-700">Actual</span>
                      <span className="text-sm font-mono">{dailyTrend.checkin_time_display}</span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      (dailyTrend.checkin_delay_minutes ?? 0) > 0 ? "bg-red-50" : "bg-green-50"
                    }`}>
                      <span className="font-semibold">Difference</span>
                      <span className={`text-sm font-bold ${
                        (dailyTrend.checkin_delay_minutes ?? 0) > 0 ? "text-red-600" : "text-green-600"
                      }`}>
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
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-semibold text-green-700">Expected</span>
                      <span className="text-sm font-mono">{dailyTrend.expected_checkout_display}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-blue-700">Actual</span>
                      <span className="text-sm font-mono">{dailyTrend.checkout_time_display}</span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      (dailyTrend.checkout_diff_minutes ?? 0) < 0 ? "bg-orange-50" : "bg-green-50"
                    }`}>
                      <span className="font-semibold">Difference</span>
                      <span className={`text-sm font-bold ${
                        (dailyTrend.checkout_diff_minutes ?? 0) < 0 ? "text-orange-600" : "text-green-600"
                      }`}>
                        {(dailyTrend.checkout_diff_minutes ?? 0) < 0
                          ? `${dailyTrend.checkout_diff_minutes ?? 0} min`
                          : `+${dailyTrend.checkout_diff_minutes ?? 0} min`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-100 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-600 text-lg">
                {dailyTrend?.message || "No check-in/check-out record for this date"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Weekly View */}
      {viewType === "weekly" && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : weeklyTrend ? (
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
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {weeklyTrend.days_late}
                  </p>
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

              {/* Weekly Chart - Line Graph */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-bold mb-4 text-slate-900">Daily Work Hours</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={weeklyTrend.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => formatDateOnlyPKT(date, { weekday: "short" })}
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      formatter={(value: any) => `${value}h`}
                      labelFormatter={(label) => formatDateOnlyPKT(label, { weekday: "long" })}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Legend />
                    <ReferenceLine y={9} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Required (9h)', fill: '#ef4444', fontSize: 12 }} />
                    <Line type="monotone" dataKey="work_hours" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} activeDot={{ r: 7 }} name="Work Hours" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Details Table */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-900">Daily Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Work Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check-in Delay</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Duty Complete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {weeklyTrend.trends.map((day, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {formatPKTLocalDateOnly(day.date, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-900">{formatHoursAsHoursMinutes(day.work_hours)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {day.checkin_delay_minutes !== null ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                day.checkin_delay_minutes > 0
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {day.checkin_delay_minutes > 0
                                  ? `+${day.checkin_delay_minutes} min`
                                  : `${day.checkin_delay_minutes} min`}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {day.duty_completed ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ✗ No
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
          ) : (
            <div className="bg-slate-100 rounded-xl p-12 text-center">
              <p className="text-slate-600 text-lg">No data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckinTrends;