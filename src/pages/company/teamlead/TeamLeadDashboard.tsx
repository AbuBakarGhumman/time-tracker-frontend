// pages/company/TeamDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CompanyDashboardLayout from "../../../components/CompanyDashboardLayout";

const TeamDashboard: React.FC = () => {
  const [, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const e = localStorage.getItem("employee");
    const c = localStorage.getItem("company");
    if (!e) { navigate("/login"); return; }
    setEmployee(JSON.parse(e));
    if (c) setCompany(JSON.parse(c));
  }, []);

  const teamMembers = [
    { name: "Jordan Lee", role: "Developer", status: "present", checkIn: "9:05 AM", avatar: "JL", color: "from-teal-500 to-emerald-600" },
    { name: "Chloe Zhang", role: "Designer", status: "present", checkIn: "8:48 AM", avatar: "CZ", color: "from-sky-500 to-blue-600" },
    { name: "Ryan Torres", role: "Developer", status: "late", checkIn: "10:30 AM", avatar: "RT", color: "from-amber-500 to-orange-600" },
    { name: "Nina Okafor", role: "Analyst", status: "absent", checkIn: "—", avatar: "NO", color: "from-pink-500 to-rose-600" },
  ];

  const statusConfig: Record<string, { badge: string; dot: string; label: string }> = {
    present: { badge: "text-emerald-400 bg-emerald-500/10", dot: "bg-emerald-400", label: "Present" },
    late: { badge: "text-amber-400 bg-amber-500/10", dot: "bg-amber-400", label: "Late" },
    absent: { badge: "text-red-400 bg-red-500/10", dot: "bg-red-400", label: "Absent" },
  };

  const present = teamMembers.filter(m => m.status === "present").length;

  return (
    <CompanyDashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Dashboard 🚀</h1>
            <p className="text-gray-400 text-sm mt-1">
              {company?.company_name} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Team Lead
          </span>
        </div>

        {/* Team snapshot cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Team Size", value: teamMembers.length, color: "bg-teal-600", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
            { label: "Present Today", value: present, color: "bg-emerald-600", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Late / Absent", value: `${teamMembers.filter(m => m.status === "late").length} / ${teamMembers.filter(m => m.status === "absent").length}`, color: "bg-amber-600", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "On Time Rate", value: `${Math.round((present / teamMembers.length) * 100)}%`, color: "bg-sky-600", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide">{stat.label}</p>
                <p className="text-white text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Team Members */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">My Team Members</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {teamMembers.map((member, i) => {
              const cfg = statusConfig[member.status];
              return (
                <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-800 transition-colors">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {member.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{member.name}</p>
                    <p className="text-gray-400 text-xs">{member.role}</p>
                    {member.checkIn !== "—" && <p className="text-gray-500 text-xs mt-0.5">In: {member.checkIn}</p>}
                  </div>
                  <span className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/company/attendance")} className="bg-gradient-to-br from-teal-600 to-emerald-700 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform flex items-center gap-3">
            <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <p className="text-white text-sm font-semibold">Attendance</p>
              <p className="text-white/70 text-xs">View records</p>
            </div>
          </button>
          <button onClick={() => navigate("/company/my-team")} className="bg-gradient-to-br from-sky-600 to-blue-700 p-4 rounded-xl text-left hover:scale-[1.02] transition-transform flex items-center gap-3">
            <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div>
              <p className="text-white text-sm font-semibold">Manage Team</p>
              <p className="text-white/70 text-xs">Edit members</p>
            </div>
          </button>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
};

export default TeamDashboard;