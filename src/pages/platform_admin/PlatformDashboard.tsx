import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getStoredPlatformAdmin } from "../../api/auth";
import { getPlatformStats, getOnboardingTrends } from "../../api/platform_admin";
import type { PlatformStats, OnboardingTrend } from "../../api/platform_admin";

const StatCard = ({ icon, label, value, color, iconColor }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
        <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
    <h4 className="text-sm font-semibold text-slate-600">{label}</h4>
  </div>
);

const PlatformDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const a = getStoredPlatformAdmin();
    if (!a) { navigate("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [s, trends] = await Promise.all([getPlatformStats(), getOnboardingTrends(6)]);
      setStats(s);
      setOnboardingData(trends);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-1 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" label="Total Users" value={stats?.total_users || 0} color="bg-blue-100" iconColor="text-blue-600" />
              <StatCard icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label="Individual Users" value={stats?.individual_users || 0} color="bg-sky-100" iconColor="text-sky-600" />
              <StatCard icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" label="Companies" value={stats?.total_companies || 0} color="bg-indigo-100" iconColor="text-indigo-600" />
              <StatCard icon="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M4 6h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" label="Employee Users" value={stats?.employee_users || 0} color="bg-emerald-100" iconColor="text-emerald-600" />
            </div>

            {/* Onboarding Trends Chart */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Onboarding Trends</h2>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={onboardingData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
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
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                    cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name="Users"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    dot={{ r: 4, fill: "#3b82f6" }}
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="companies"
                    name="Companies"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCompanies)"
                    dot={{ r: 4, fill: "#6366f1" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
    </div>
  );
};

export default PlatformDashboard;
