// pages/company/ManagerDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboardLayout from "../../../components/CompanyDashboardLayout";

const ManagerDashboard: React.FC = () => {
  const [, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const navigate = useNavigate();

  const teamMembers = [
    { name: "Sarah Johnson", role: "Senior Dev", status: "present", checkIn: "8:47 AM", hours: "6h 32m", avatar: "SJ" },
    { name: "Mike Chen", role: "Backend Dev", status: "late", checkIn: "10:15 AM", hours: "4h 12m", avatar: "MC" },
    { name: "Lisa Park", role: "QA Engineer", status: "absent", checkIn: "—", hours: "—", avatar: "LP" },
    { name: "Tom Rivera", role: "Frontend Dev", status: "present", checkIn: "9:02 AM", hours: "5h 55m", avatar: "TR" },
    { name: "Aisha Patel", role: "DevOps", status: "present", checkIn: "8:50 AM", hours: "6h 28m", avatar: "AP" },
  ];

  const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
    present: { dot: "bg-emerald-400", badge: "text-emerald-400 bg-emerald-500/10", label: "Present" },
    late: { dot: "bg-amber-400", badge: "text-amber-400 bg-amber-500/10", label: "Late" },
    absent: { dot: "bg-red-400", badge: "text-red-400 bg-red-500/10", label: "Absent" },
  };

  useEffect(() => {
    const e = localStorage.getItem("employee");
    const c = localStorage.getItem("company");
    if (!e) { navigate("/login"); return; }
    setEmployee(JSON.parse(e));
    if (c) setCompany(JSON.parse(c));
  }, []);

  const present = teamMembers.filter(m => m.status === "present").length;
  const late = teamMembers.filter(m => m.status === "late").length;
  const absent = teamMembers.filter(m => m.status === "absent").length;

  return (
    <CompanyDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Overview 📊</h1>
            <p className="text-gray-400 text-sm mt-1">
              {company?.company_name} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Manager
          </span>
        </div>

        {/* Attendance Summary Bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-white font-semibold">Today's Team Status</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" />{present} Present</span>
              <span className="flex items-center gap-1.5 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-400" />{late} Late</span>
              <span className="flex items-center gap-1.5 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400" />{absent} Absent</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(present / teamMembers.length) * 100}%` }} />
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(late / teamMembers.length) * 100}%` }} />
            <div className="h-full bg-red-500 transition-all" style={{ width: `${(absent / teamMembers.length) * 100}%` }} />
          </div>
          <p className="text-gray-500 text-xs mt-2">{Math.round(((present + late) / teamMembers.length) * 100)}% of team checked in today</p>
        </div>

        {/* Team Members Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">My Team ({teamMembers.length} members)</h2>
            <button onClick={() => navigate("/company/reports")} className="text-xs text-gray-400 hover:text-white transition-colors">
              View full report →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Member</th>
                  <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Check In</th>
                  <th className="text-left px-5 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wide">Hours Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {teamMembers.map((member, i) => {
                  const cfg = statusConfig[member.status];
                  return (
                    <tr key={i} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{member.name}</p>
                            <p className="text-gray-500 text-xs">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300 text-sm">{member.checkIn}</td>
                      <td className="px-5 py-3.5 text-gray-300 text-sm font-mono">{member.hours}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Team Report", desc: "Weekly summary", gradient: "from-amber-600 to-orange-700", path: "/company/reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { label: "Attendance Log", desc: "View records", gradient: "from-indigo-600 to-blue-700", path: "/company/attendance", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { label: "My Team", desc: "Manage members", gradient: "from-teal-600 to-emerald-700", path: "/company/my-team", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
          ].map((action, i) => (
            <button key={i} onClick={() => navigate(action.path)} className={`bg-gradient-to-br ${action.gradient} p-4 rounded-xl text-left hover:scale-[1.02] transition-transform`}>
              <svg className="w-5 h-5 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
              </svg>
              <p className="text-white text-sm font-semibold">{action.label}</p>
              <p className="text-white/70 text-xs">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </CompanyDashboardLayout>
  );
};

export default ManagerDashboard;