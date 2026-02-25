// pages/company/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboardLayout from "../../../components/CompanyDashboardLayout";

const StatCard = ({ icon, label, value, sub, color }: any) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
    </div>
    <div>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  </div>
);

const QuickActionCard = ({ icon, label, desc, onClick, gradient }: any) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-br ${gradient} p-5 rounded-2xl text-left hover:scale-[1.02] transition-all duration-200 shadow-lg group`}
  >
    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
    </div>
    <p className="text-white font-semibold text-sm">{label}</p>
    <p className="text-white/70 text-xs mt-1">{desc}</p>
  </button>
);

const AdminDashboard: React.FC = () => {
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    departments: 0,
    teams: 0,
    lateToday: 0,
    absentToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const e = localStorage.getItem("employee");
    const c = localStorage.getItem("company");
    if (!e) { navigate("/login"); return; }
    setEmployee(JSON.parse(e));
    if (c) setCompany(JSON.parse(c));
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Replace with your actual endpoints
      // const res = await axios.get(`${API_BASE_URL}/company/stats`);
      // Mock data for demonstration
      setStats({ totalEmployees: 48, presentToday: 35, departments: 6, teams: 12, lateToday: 4, absentToday: 9 });
      setRecentActivity([
        { type: "checkin", name: "Sarah Johnson", time: "8:47 AM", status: "on-time" },
        { type: "checkin", name: "Mike Chen", time: "9:12 AM", status: "late" },
        { type: "checkout", name: "David Park", time: "5:03 PM", status: "done" },
        { type: "new", name: "Emma Wilson", time: "Yesterday", status: "joined" },
        { type: "checkin", name: "Aisha Patel", time: "8:55 AM", status: "on-time" },
      ]);
    } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = {
    "on-time": "text-emerald-400 bg-emerald-500/10",
    "late": "text-amber-400 bg-amber-500/10",
    "done": "text-sky-400 bg-sky-500/10",
    "joined": "text-violet-400 bg-violet-500/10",
  };
  const statusLabels: Record<string, string> = {
    "on-time": "On time", "late": "Late", "done": "Checked out", "joined": "New employee"
  };

  return (
    <CompanyDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              {employee?.full_name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {company?.company_name} · Admin Dashboard · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Company Admin
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" label="Total Employees" value={stats.totalEmployees} sub="Across all departments" color="bg-violet-600" />
          <StatCard icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" label="Present Today" value={stats.presentToday} sub={`${stats.absentToday} absent`} color="bg-emerald-600" />
          <StatCard icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" label="Departments" value={stats.departments} sub={`${stats.teams} teams`} color="bg-indigo-600" />
          <StatCard icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Late Arrivals" value={stats.lateToday} sub="Today" color="bg-amber-600" />
          <StatCard icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" label="Attendance Rate" value={`${Math.round((stats.presentToday / stats.totalEmployees) * 100) || 0}%`} sub="This week" color="bg-sky-600" />
          <StatCard icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" label="Teams" value={stats.teams} sub="Active teams" color="bg-pink-600" />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickActionCard
              icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              label="Add Employee"
              desc="Create a new account"
              gradient="from-violet-600 to-indigo-700"
              onClick={() => navigate("/company/employees/new")}
            />
            <QuickActionCard
              icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              label="New Department"
              desc="Organize your company"
              gradient="from-indigo-600 to-blue-700"
              onClick={() => navigate("/company/departments/new")}
            />
            <QuickActionCard
              icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              label="Create Team"
              desc="Group employees together"
              gradient="from-teal-600 to-emerald-700"
              onClick={() => navigate("/company/teams/new")}
            />
            <QuickActionCard
              icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              label="View Reports"
              desc="Attendance analytics"
              gradient="from-rose-600 to-pink-700"
              onClick={() => navigate("/company/reports")}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">Today's Activity</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {recentActivity.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-3.5 ${i < recentActivity.length - 1 ? "border-b border-gray-800/60" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 text-xs font-bold">
                    {item.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <p className="text-gray-500 text-xs capitalize">{item.type === "checkin" ? "Checked in" : item.type === "checkout" ? "Checked out" : "New employee added"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                  <span className="text-gray-500 text-xs">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
};

export default AdminDashboard;