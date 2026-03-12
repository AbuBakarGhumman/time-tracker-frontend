import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredPlatformAdmin } from "../../api/auth";
import { getPlatformStats } from "../../api/platform_admin";
import type { PlatformStats } from "../../api/platform_admin";

const PlatformAnalytics: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "companies">("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const a = getStoredPlatformAdmin();
    if (!a) { navigate("/login"); return; }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const s = await getPlatformStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-700 text-sm font-medium">{label}</span>
          <span className="text-slate-500 text-xs font-semibold">{value} ({pct}%)</span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  const BigStat = ({ label, value, icon, color, iconColor, valueCls, sub }: any) => (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 text-center">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
        <svg className={`w-7 h-7 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <p className={`text-3xl font-bold ${valueCls}`}>{value}</p>
      <p className="text-slate-600 text-sm font-medium mt-1">{label}</p>
      {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "users" as const, label: "User Insights" },
    { key: "companies" as const, label: "Company Insights" },
  ];

  return (
    <div className="p-1 space-y-6">
        {/* Tabs */}
        <div className="flex gap-3 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : stats ? (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <BigStat
                    icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    label="Total Users" value={stats.total_users}
                    color="bg-blue-100" iconColor="text-blue-600" valueCls="text-blue-600"
                    sub={`${stats.inactive_users} inactive`}
                  />
                  <BigStat
                    icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    label="Companies" value={stats.total_companies}
                    color="bg-indigo-100" iconColor="text-indigo-600" valueCls="text-indigo-600"
                    sub={`${stats.active_companies} active`}
                  />
                  <BigStat
                    icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    label="Teams" value={stats.total_teams}
                    color="bg-emerald-100" iconColor="text-emerald-600" valueCls="text-emerald-600"
                    sub={`${stats.total_departments} departments`}
                  />
                </div>

                {/* Platform Health */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5">Platform Health</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${stats.active_users > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-slate-600 text-xs font-semibold">User Activity</span>
                      </div>
                      <p className="text-slate-900 text-xl font-bold">{stats.active_users}/{stats.total_users}</p>
                      <p className="text-slate-500 text-xs">Active accounts</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${stats.active_companies > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span className="text-slate-600 text-xs font-semibold">Companies</span>
                      </div>
                      <p className="text-slate-900 text-xl font-bold">{stats.active_companies}/{stats.total_companies}</p>
                      <p className="text-slate-500 text-xs">Active companies</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-slate-600 text-xs font-semibold">Admin Coverage</span>
                      </div>
                      <p className="text-slate-900 text-xl font-bold">{stats.admin_users}</p>
                      <p className="text-slate-500 text-xs">Platform admins</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-slate-600 text-xs font-semibold">Departments</span>
                      </div>
                      <p className="text-slate-900 text-xl font-bold">{stats.total_departments}</p>
                      <p className="text-slate-500 text-xs">Total departments</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <>
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5">User Distribution</h2>
                  <div className="space-y-5">
                    <ProgressBar label="Individual Users" value={stats.individual_users} total={stats.total_users} color="bg-sky-500" />
                    <ProgressBar label="Company Employees" value={stats.employee_users} total={stats.total_users} color="bg-emerald-500" />
                    <ProgressBar label="Platform Admins" value={stats.admin_users} total={stats.total_users} color="bg-purple-500" />
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 text-sm font-medium">Active Rate</span>
                      <span className="text-green-600 text-lg font-bold">
                        {stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* User Summary Table */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Count</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[
                        { label: "Individual Users", value: stats.individual_users, color: "bg-sky-100 text-sky-800" },
                        { label: "Company Employees", value: stats.employee_users, color: "bg-emerald-100 text-emerald-800" },
                        { label: "Platform Admins", value: stats.admin_users, color: "bg-purple-100 text-purple-800" },
                        { label: "Active Users", value: stats.active_users, color: "bg-green-100 text-green-800" },
                        { label: "Inactive Users", value: stats.inactive_users, color: "bg-red-100 text-red-800" },
                      ].map((row) => (
                        <tr key={row.label} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{row.value}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.color}`}>
                              {stats.total_users > 0 ? Math.round((row.value / stats.total_users) * 100) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Companies Tab */}
            {activeTab === "companies" && (
              <>
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5">Company Metrics</h2>
                  <div className="space-y-5">
                    <ProgressBar label="Active Companies" value={stats.active_companies} total={stats.total_companies} color="bg-emerald-500" />
                    <ProgressBar label="Inactive Companies" value={stats.total_companies - stats.active_companies} total={stats.total_companies} color="bg-red-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Departments</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.total_departments}</p>
                    <p className="text-xs text-slate-500 mt-1">Across all companies</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Teams</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_teams}</p>
                    <p className="text-xs text-slate-500 mt-1">Across all companies</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Avg Employees</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-2">
                      {stats.employee_users > 0 && stats.total_companies > 0
                        ? Math.round(stats.employee_users / stats.total_companies)
                        : 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Per company</p>
                  </div>
                </div>

                {/* Company Summary Table */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Metric</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Total Companies</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{stats.total_companies}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Registered</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Active Companies</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{stats.active_companies}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {stats.total_companies > 0 ? Math.round((stats.active_companies / stats.total_companies) * 100) : 0}% active
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Total Employees</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{stats.employee_users}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">In companies</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 px-6 py-16 text-center text-slate-400 text-sm">
            Failed to load analytics data
          </div>
        )}
    </div>
  );
};

export default PlatformAnalytics;
