// pages/company/EmployeeDashboard.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboardLayout from "../../../components/CompanyDashboardLayout";
import axios from "../../../api/interceptor";
import { API_BASE_URL } from "../../../api/config";

const EmployeeDashboard: React.FC = () => {
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState("0h 0m 0s");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const timerRef = useRef<any>(null);

  const isToday = (iso?: string) => iso ? new Date(iso).toDateString() === new Date().toDateString() : false;

  const hasCheckedInToday = isToday(checkInTime || undefined);
  const hasCheckedOutToday = isToday(checkOutTime || undefined);

  useEffect(() => {
    const e = localStorage.getItem("employee");
    const c = localStorage.getItem("company");
    if (!e) { navigate("/login"); return; }
    setEmployee(JSON.parse(e));
    if (c) setCompany(JSON.parse(c));
    fetchStatus();

    // Clock tick
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(clockInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      timerRef.current = setInterval(() => {
        const diff = Date.now() - new Date(checkInTime).getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setElapsedTime(`${h}h ${m}m ${s}s`);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedTime("0h 0m 0s");
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCheckedIn, checkInTime]);

  const fetchStatus = async () => {
    try {
      // Use your existing company attendance endpoint
      const res = await axios.get(`${API_BASE_URL}/company/attendance/status`);
      setIsCheckedIn(res.data.is_checked_in);
      setCheckInTime(res.data.check_in_time);
      setCheckOutTime(res.data.check_out_time);
    } catch {
      // Fallback: no status yet
    }
  };

  const handleCheckIn = async () => {
    if (hasCheckedInToday || loading) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/company/attendance/check-in`, { note: "" });
      await fetchStatus();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!hasCheckedInToday || hasCheckedOutToday || loading) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/company/attendance/check-out`, { note: "" });
      await fetchStatus();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  const firstName = employee?.full_name?.split(" ")[0] || "there";

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const weekAttendance = [true, true, false, true, null]; // null = future

  return (
    <CompanyDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hey, {firstName}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {company?.company_name} · {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Main check-in card */}
        <div className={`rounded-2xl p-6 bg-gradient-to-br ${hasCheckedOutToday ? "from-gray-800 to-gray-900" : isCheckedIn ? "from-sky-700 to-blue-900" : "from-gray-800 to-gray-900"} border ${isCheckedIn ? "border-sky-600/50" : "border-gray-700"} shadow-xl`}>
          <div className="flex items-center justify-between flex-wrap gap-5">
            {/* Status */}
            <div>
              {isCheckedIn && !hasCheckedOutToday ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">Working</span>
                  </div>
                  <p className="text-white text-3xl font-bold font-mono">{elapsedTime}</p>
                  <p className="text-sky-300 text-sm mt-1">
                    Started at {new Date(checkInTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </>
              ) : hasCheckedOutToday ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Day Complete</span>
                  </div>
                  <p className="text-white text-lg font-semibold">
                    {new Date(checkInTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} → {new Date(checkOutTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">See you tomorrow!</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Not Checked In</span>
                  </div>
                  <p className="text-white text-3xl font-bold font-mono">
                    {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">Ready to start your day?</p>
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCheckIn}
                disabled={hasCheckedInToday || loading}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  hasCheckedInToday
                    ? "bg-white/10 text-white/40 cursor-default"
                    : "bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-105 shadow-lg shadow-emerald-500/20"
                }`}
              >
                {hasCheckedInToday ? "✓ Checked In" : loading ? "..." : "Check In"}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!hasCheckedInToday || hasCheckedOutToday || loading}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  hasCheckedOutToday
                    ? "bg-white/10 text-white/40 cursor-default"
                    : !hasCheckedInToday
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : "bg-white/15 hover:bg-white/25 text-white hover:scale-105 border border-white/20"
                }`}
              >
                {hasCheckedOutToday ? "✓ Done" : loading ? "..." : "Check Out"}
              </button>
            </div>
          </div>
        </div>

        {/* Week attendance + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weekly attendance dots */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">This Week</h2>
            <div className="flex items-center justify-between">
              {weekDays.map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="text-gray-500 text-xs font-medium">{day}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    weekAttendance[i] === null
                      ? "bg-gray-800 text-gray-600 border border-dashed border-gray-700"
                      : weekAttendance[i]
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}>
                    {weekAttendance[i] === null ? "—" : weekAttendance[i] ? "✓" : "✗"}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-3">3 / 5 days present so far</p>
          </div>

          {/* Personal stats */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-4">My Stats</h2>
            <div className="space-y-3">
              {[
                { label: "Avg. Check-in", value: "9:02 AM", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-sky-400" },
                { label: "Hours this week", value: "28h 14m", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "text-emerald-400" },
                { label: "On-time rate", value: "85%", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-violet-400" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className={`w-4 h-4 flex-shrink-0 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                  <span className="text-gray-400 text-sm flex-1">{stat.label}</span>
                  <span className="text-white text-sm font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/company/my-attendance")} className="bg-gradient-to-br from-sky-600 to-blue-700 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform flex items-center gap-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <p className="text-white text-sm font-semibold">My Attendance</p>
              <p className="text-white/70 text-xs">Full history</p>
            </div>
          </button>
          <button onClick={() => navigate("/company/time-tracker")} className="bg-gradient-to-br from-violet-600 to-indigo-700 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform flex items-center gap-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-white text-sm font-semibold">Time Tracker</p>
              <p className="text-white/70 text-xs">Log tasks</p>
            </div>
          </button>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
};

export default EmployeeDashboard;