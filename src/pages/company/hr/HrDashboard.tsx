// pages/company/HRDashboard.tsx
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

const HRDashboard: React.FC = () => {
  const [_employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const navigate = useNavigate();

  const pendingLeaves = [
    { name: "James Carter", type: "Annual Leave", days: 3, from: "Feb 15", to: "Feb 17", dept: "Engineering" },
    { name: "Priya Sharma", type: "Sick Leave", days: 2, from: "Feb 12", to: "Feb 13", dept: "Marketing" },
    { name: "Tom Williams", type: "Personal Leave", days: 1, from: "Feb 14", to: "Feb 14", dept: "Sales" },
  ];

  const newJoinees = [
    { name: "Alex Kim", role: "Frontend Developer", dept: "Engineering", date: "Feb 10" },
    { name: "Maria Santos", role: "HR Coordinator", dept: "HR", date: "Feb 8" },
  ];

  useEffect(() => {
    const e = localStorage.getItem("employee");
    const c = localStorage.getItem("company");
    if (!e) { navigate("/login"); return; }
    setEmployee(JSON.parse(e));
    if (c) setCompany(JSON.parse(c));
  }, []);

  return (
    <CompanyDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              HR Dashboard 🗂️
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {company?.company_name} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            HR Manager
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" label="Total Employees" value="48" sub="2 added this week" color="bg-rose-600" />
          <StatCard icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Leave Requests" value="3" sub="Pending approval" color="bg-amber-600" />
          <StatCard icon="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" label="New Joinees" value="2" sub="This month" color="bg-teal-600" />
          <StatCard icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" label="Attendance Rate" value="87%" sub="Company-wide today" color="bg-indigo-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pending Leave Requests */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold">Pending Leave Requests</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">{pendingLeaves.length} pending</span>
            </div>
            <div className="divide-y divide-gray-800/60">
              {pendingLeaves.map((leave, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-medium">{leave.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{leave.dept} · {leave.type}</p>
                      <p className="text-gray-500 text-xs mt-1">{leave.from} → {leave.to} ({leave.days} day{leave.days > 1 ? "s" : ""})</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors">
                        Approve
                      </button>
                      <button className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors">
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Joinees & Quick Actions */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <h2 className="text-white font-semibold">Recent Joinees</h2>
              </div>
              <div className="divide-y divide-gray-800/60">
                {newJoinees.map((person, i) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                        {person.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{person.name}</p>
                        <p className="text-gray-400 text-xs">{person.role} · {person.dept}</p>
                      </div>
                    </div>
                    <span className="text-gray-500 text-xs">{person.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions for HR */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate("/company/employees/new")} className="bg-gradient-to-br from-rose-600 to-pink-700 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform">
                <svg className="w-5 h-5 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <p className="text-white text-sm font-semibold">Onboard Employee</p>
              </button>
              <button onClick={() => navigate("/company/attendance")} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform">
                <svg className="w-5 h-5 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-white text-sm font-semibold">Attendance Log</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
};

export default HRDashboard;