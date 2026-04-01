import React, { useState, useEffect } from "react";
import {
  fetchAttendanceReport,
  fetchWorkDailyReport,
  fetchProjectBreakdown,
  fetchProductivityReport,
  fetchTasksSummaryReport,
} from "../../api/analytics";
import axios from "../../api/interceptor";
import { API_BASE_URL } from "../../api/config";
import { generateReportPdf } from "../../utils/reportPdf";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "../../components/Skeleton";
import { getTodayPKT, formatHoursAsHoursMinutes, getDateStringPKT, formatPKTLocalDateOnly } from "../../utils/dateUtils";

// ── Types ────────────────────────────────────────────────────────────────────

interface AttendanceReport {
  total_working_days: number;
  present_days: number;
  absent_days: number;
  late_arrivals: number;
  early_departures: number;
  total_working_hours: number;
  average_daily_hours: number;
  overtime_hours: number;
  undertime_hours: number;
  on_time_percentage: number;
  avg_checkin_time: string | null;
  avg_checkout_time: string | null;
  longest_present_streak: number;
  daily_breakdown: Array<{
    date: string;
    present: boolean;
    hours: number;
    checkin_time: string | null;
    checkout_time: string | null;
    is_late: boolean;
    is_overtime: boolean;
  }>;
}

interface WorkReport {
  date: string;
  tasks_completed: number;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  projects: Array<{
    project_name: string;
    hours: number;
    percentage: number;
  }>;
  category_breakdown: Array<{
    category: string;
    hours: number;
  }>;
}

interface ProjectStats {
  name: string;
  value: number;
  hours: number;
  color?: string;
  billable_hours: number;
  non_billable_hours: number;
  task_count: number;
  completed_task_count: number;
  entry_count: number;
}

interface ProjectBreakdownData {
  projects: ProjectStats[];
  total_hours: number;
  total_billable_hours: number;
  total_projects: number;
}

interface ProductivityData {
  total_entries: number;
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  billable_ratio: number;
  avg_entry_duration: number;
  total_tasks_completed: number;
  categories: Array<{
    category: string;
    hours: number;
    percentage: number;
    entry_count: number;
  }>;
  peak_hours: Array<{
    hour: number;
    hours: number;
    entry_count: number;
  }>;
  daily_avg_hours: number;
  daily_avg_entries: number;
  longest_entry_hours: number;
  shortest_entry_hours: number;
}

interface TasksSummaryData {
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  overdue_tasks: number;
  tasks_by_priority: Array<{
    priority: string;
    count: number;
    completed: number;
  }>;
  tasks_by_column_type: Array<{
    column_type: string;
    column_name: string;
    count: number;
  }>;
  tasks_created_in_range: number;
  tasks_completed_in_range: number;
  weekly_velocity: Array<{
    week_start: string;
    tasks_completed: number;
  }>;
  projects_summary: Array<{
    project_name: string;
    total_tasks: number;
    completed: number;
    overdue: number;
    color: string;
  }>;
}

type ReportType = "attendance" | "work" | "projects" | "tasks" | "productivity";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#6366f1"];
const PRIORITY_COLORS: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
const COLUMN_TYPE_COLORS: Record<string, string> = {
  backlog: "#94a3b8", todo: "#3b82f6", in_progress: "#f59e0b", review: "#8b5cf6", done: "#10b981", bug: "#ef4444",
};

interface FilterProject {
  id: number;
  name: string;
}

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const pktNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const date = new Date(pktNow);
    date.setMonth(date.getMonth() - 1);
    return getDateStringPKT(date);
  });
  const [endDate, setEndDate] = useState<string>(getTodayPKT());

  // Filters
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [billableFilter, setBillableFilter] = useState<string>("all");
  const [projectsList, setProjectsList] = useState<FilterProject[]>([]);

  // Branding
  const [branding, setBranding] = useState<{ brandName?: string; logoUrl?: string; accentColor?: string }>({});

  // Data
  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [workReports, setWorkReports] = useState<WorkReport[]>([]);
  const [projectData, setProjectData] = useState<ProjectBreakdownData | null>(null);
  const [productivityData, setProductivityData] = useState<ProductivityData | null>(null);
  const [tasksData, setTasksData] = useState<TasksSummaryData | null>(null);

  // Load projects list and branding settings
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [projectsRes, settingsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/projects/`),
          axios.get(`${API_BASE_URL}/users/settings`),
        ]);
        setProjectsList(projectsRes.data.map((p: any) => ({ id: p.id, name: p.name })));
        const s = settingsRes.data;
        setBranding({
          brandName: s.report_brand_name || undefined,
          logoUrl: s.report_brand_logo_url || undefined,
          accentColor: s.report_accent_color || undefined,
        });
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, startDate, endDate, projectFilter, billableFilter]);

  const getFilters = () => {
    const filters: { project_id?: number; billable?: string } = {};
    if (projectFilter !== "all") filters.project_id = Number(projectFilter);
    if (billableFilter !== "all") filters.billable = billableFilter;
    return filters;
  };

  const loadReports = async () => {
    setLoading(true);
    const filters = getFilters();
    try {
      if (reportType === "attendance") {
        const data = await fetchAttendanceReport(startDate, endDate);
        setAttendanceData(data);
      } else if (reportType === "work") {
        const data = await fetchWorkDailyReport(startDate, endDate, filters);
        setWorkReports(data);
      } else if (reportType === "projects") {
        const data = await fetchProjectBreakdown(startDate, endDate, filters);
        setProjectData(data);
      } else if (reportType === "productivity") {
        const data = await fetchProductivityReport(startDate, endDate, filters);
        setProductivityData(data);
      } else if (reportType === "tasks") {
        const data = await fetchTasksSummaryReport(startDate, endDate, filters);
        setTasksData(data);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── PDF Export ──────────────────────────────────────────────────────────

  const handleExportPDF = () => {
    // Get the current report data for the active tab
    let data: any = null;
    if (reportType === "attendance") data = attendanceData;
    else if (reportType === "work") data = workReports;
    else if (reportType === "projects") data = projectData;
    else if (reportType === "tasks") data = tasksData;
    else if (reportType === "productivity") data = productivityData;

    if (!data) return;

    setExporting(true);
    try {
      const projectName = projectFilter !== "all"
        ? projectsList.find((p) => String(p.id) === projectFilter)?.name
        : undefined;
      const billableLabel = billableFilter === "billable" ? "Billable Only"
        : billableFilter === "non_billable" ? "Non-Billable Only"
        : undefined;

      generateReportPdf(reportType, data, {
        startDate,
        endDate,
        projectName,
        billableLabel,
        branding,
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  // ── Stat Card Component ──────────────────────────────────────────────────

  const StatCard = ({ label, value, subtitle, bgClass = "bg-white" }: {
    label: string; value: string | number; subtitle?: string; bgClass?: string;
  }) => (
    <div className={`${bgClass} rounded-xl shadow-md border border-slate-200 p-5`}>
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );

  // ── ATTENDANCE REPORT ────────────────────────────────────────────────────

  const renderAttendanceReport = () => {
    if (!attendanceData) return null;

    const attendanceChart = [
      { name: "Present", value: attendanceData.present_days, color: "#10b981" },
      { name: "Absent", value: attendanceData.absent_days, color: "#ef4444" },
    ];

    const punctualityChart = [
      { name: "On Time", value: Math.round(attendanceData.on_time_percentage), color: "#10b981" },
      { name: "Late", value: Math.round(100 - attendanceData.on_time_percentage), color: "#f59e0b" },
    ];

    const dailyChartData = attendanceData.daily_breakdown
      .filter((d) => d.present)
      .map((d) => ({
        date: formatPKTLocalDateOnly(d.date, { month: "short", day: "numeric" }),
        hours: Number(d.hours.toFixed(2)),
      }));

    return (
      <>
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Working Days" value={attendanceData.total_working_days} />
          <StatCard label="Present" value={attendanceData.present_days}
            subtitle={`${((attendanceData.present_days / attendanceData.total_working_days) * 100 || 0).toFixed(1)}%`}
            bgClass="bg-green-50" />
          <StatCard label="Absent" value={attendanceData.absent_days}
            subtitle={`${((attendanceData.absent_days / attendanceData.total_working_days) * 100 || 0).toFixed(1)}%`}
            bgClass="bg-red-50" />
          <StatCard label="Late Arrivals" value={attendanceData.late_arrivals} bgClass="bg-orange-50" />
          <StatCard label="Total Hours" value={formatHoursAsHoursMinutes(attendanceData.total_working_hours)}
            subtitle={`Avg: ${formatHoursAsHoursMinutes(attendanceData.average_daily_hours)}/day`}
            bgClass="bg-purple-50" />
          <StatCard label="Present Streak" value={`${attendanceData.longest_present_streak} days`}
            subtitle="Longest consecutive" bgClass="bg-blue-50" />
        </div>

        {/* Overtime / Undertime / Avg Times */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Overtime" value={formatHoursAsHoursMinutes(attendanceData.overtime_hours)}
            subtitle="Hours above 9h/day" bgClass="bg-emerald-50" />
          <StatCard label="Undertime" value={formatHoursAsHoursMinutes(attendanceData.undertime_hours)}
            subtitle="Hours below 9h/day" bgClass="bg-amber-50" />
          <StatCard label="Avg Check-in" value={attendanceData.avg_checkin_time || "—"}
            subtitle={`On-time: ${attendanceData.on_time_percentage.toFixed(0)}%`} />
          <StatCard label="Avg Check-out" value={attendanceData.avg_checkout_time || "—"}
            subtitle={`Early departures: ${attendanceData.early_departures}`} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Attendance Pie */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Attendance</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={attendanceChart} cx="50%" cy="50%" labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80} dataKey="value">
                  {attendanceChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Punctuality Pie */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Punctuality</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={punctualityChart} cx="50%" cy="50%" labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80} dataKey="value">
                  {punctualityChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Hours Chart */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Daily Hours</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "10px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "10px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Daily Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Punctuality</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Overtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendanceData.daily_breakdown.slice().reverse().map((day) => (
                  <tr key={day.date} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium">
                      {formatPKTLocalDateOnly(day.date, { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${day.present ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {day.present ? "Present" : "Absent"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700">{day.checkin_time || "—"}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{day.checkout_time || "—"}</td>
                    <td className="px-6 py-3 text-sm text-slate-700 font-medium">
                      {day.present ? formatHoursAsHoursMinutes(day.hours) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {day.present ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${day.is_late ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                          {day.is_late ? "Late" : "On Time"}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {day.present ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${day.is_overtime ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {day.is_overtime ? "Yes" : "No"}
                        </span>
                      ) : "—"}
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

  // ── WORK REPORT ──────────────────────────────────────────────────────────

  const renderWorkReport = () => {
    if (workReports.length === 0) {
      return (
        <div className="bg-slate-100 rounded-xl p-12 text-center">
          <p className="text-slate-600 text-lg">No work records for the selected period</p>
        </div>
      );
    }

    const chartData = workReports.map((r) => ({
      date: formatPKTLocalDateOnly(r.date, { month: "short", day: "numeric" }),
      total: Number(r.total_hours.toFixed(2)),
      billable: Number(r.billable_hours.toFixed(2)),
      nonBillable: Number(r.non_billable_hours.toFixed(2)),
      tasks: r.tasks_completed,
    }));

    const totalHours = workReports.reduce((sum, r) => sum + r.total_hours, 0);
    const totalBillable = workReports.reduce((sum, r) => sum + r.billable_hours, 0);
    const totalTasks = workReports.reduce((sum, r) => sum + r.tasks_completed, 0);
    const daysWorked = workReports.filter((r) => r.total_hours > 0).length;

    return (
      <>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Hours" value={formatHoursAsHoursMinutes(totalHours)} bgClass="bg-blue-50" />
          <StatCard label="Billable Hours" value={formatHoursAsHoursMinutes(totalBillable)}
            subtitle={`${totalHours > 0 ? ((totalBillable / totalHours) * 100).toFixed(0) : 0}% billable`}
            bgClass="bg-green-50" />
          <StatCard label="Non-Billable" value={formatHoursAsHoursMinutes(totalHours - totalBillable)}
            bgClass="bg-orange-50" />
          <StatCard label="Tasks Completed" value={totalTasks}
            subtitle={`Avg: ${daysWorked > 0 ? (totalTasks / daysWorked).toFixed(1) : 0}/day`}
            bgClass="bg-purple-50" />
          <StatCard label="Days Worked" value={daysWorked}
            subtitle={`Avg: ${daysWorked > 0 ? formatHoursAsHoursMinutes(totalHours / daysWorked) : "0h"}/day`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Billable vs Non-Billable Stacked Bar */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Daily Hours (Billable vs Non-Billable)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "11px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "11px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="billable" stackId="hours" fill="#10b981" radius={[0, 0, 0, 0]} name="Billable" />
                <Bar dataKey="nonBillable" stackId="hours" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Non-Billable" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks Trend */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Tasks Completed Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "11px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "11px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="tasks" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} name="Tasks" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Daily Work Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Billable</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Top Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {workReports.slice().reverse().map((report) => (
                  <tr key={report.date} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium">
                      {formatPKTLocalDateOnly(report.date, { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700">{formatHoursAsHoursMinutes(report.total_hours)}</td>
                    <td className="px-6 py-3 text-sm text-green-700 font-medium">{formatHoursAsHoursMinutes(report.billable_hours)}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{report.tasks_completed}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">
                      {report.projects.length > 0 ? report.projects[0].project_name : "—"}
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

  // ── PROJECTS REPORT ──────────────────────────────────────────────────────

  const renderProjectReport = () => {
    if (!projectData || projectData.projects.length === 0) {
      return (
        <div className="bg-slate-100 rounded-xl p-12 text-center">
          <p className="text-slate-600 text-lg">No project data available</p>
        </div>
      );
    }

    const { projects, total_hours, total_billable_hours, total_projects } = projectData;

    return (
      <>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Projects" value={total_projects} bgClass="bg-blue-50" />
          <StatCard label="Total Hours" value={formatHoursAsHoursMinutes(total_hours)} bgClass="bg-purple-50" />
          <StatCard label="Billable Hours" value={formatHoursAsHoursMinutes(total_billable_hours)}
            subtitle={`${total_hours > 0 ? ((total_billable_hours / total_hours) * 100).toFixed(0) : 0}% billable`}
            bgClass="bg-green-50" />
          <StatCard label="Avg Per Project" value={formatHoursAsHoursMinutes(total_projects > 0 ? total_hours / total_projects : 0)}
            bgClass="bg-amber-50" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Distribution Pie */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Time Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={projects} cx="50%" cy="50%" labelLine={false}
                  label={({ name, value }: any) => `${name}: ${formatHoursAsHoursMinutes(value)}`}
                  outerRadius={100} dataKey="value">
                  {projects.map((p, i) => <Cell key={i} fill={p.color || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatHoursAsHoursMinutes(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Billable Bar Chart */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Billable vs Non-Billable by Project</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projects} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: "11px" }} />
                <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: "11px" }} width={100} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(v: any) => formatHoursAsHoursMinutes(v)} />
                <Legend />
                <Bar dataKey="billable_hours" stackId="h" fill="#10b981" name="Billable" />
                <Bar dataKey="non_billable_hours" stackId="h" fill="#f59e0b" name="Non-Billable" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Details Table */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Project Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Billable</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Entries</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projects.map((p, i) => (
                  <tr key={p.name} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700 font-medium">{formatHoursAsHoursMinutes(p.hours)}</td>
                    <td className="px-6 py-3 text-sm text-green-700">{formatHoursAsHoursMinutes(p.billable_hours)}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{p.entry_count}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{p.task_count}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{p.completed_task_count}</td>
                    <td className="px-6 py-3 text-sm font-bold text-slate-700">
                      {total_hours > 0 ? ((p.hours / total_hours) * 100).toFixed(1) : 0}%
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

  // ── TASKS REPORT ─────────────────────────────────────────────────────────

  const renderTasksReport = () => {
    if (!tasksData) return null;

    const {
      total_tasks, completed_tasks, completion_rate, overdue_tasks,
      tasks_by_priority, tasks_by_column_type, tasks_created_in_range,
      tasks_completed_in_range, weekly_velocity, projects_summary,
    } = tasksData;

    const priorityChartData = tasks_by_priority.map((p) => ({
      ...p,
      pending: p.count - p.completed,
      color: PRIORITY_COLORS[p.priority] || "#94a3b8",
    }));

    const columnChartData = tasks_by_column_type.map((c) => ({
      ...c,
      fill: COLUMN_TYPE_COLORS[c.column_type] || "#94a3b8",
    }));

    const velocityData = weekly_velocity.map((w) => ({
      week: formatPKTLocalDateOnly(w.week_start, { month: "short", day: "numeric" }),
      completed: w.tasks_completed,
    }));

    return (
      <>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Total Tasks" value={total_tasks} bgClass="bg-blue-50" />
          <StatCard label="Completed" value={completed_tasks}
            subtitle={`${completion_rate.toFixed(0)}% rate`} bgClass="bg-green-50" />
          <StatCard label="Overdue" value={overdue_tasks} bgClass={overdue_tasks > 0 ? "bg-red-50" : "bg-white"} />
          <StatCard label="Created (Range)" value={tasks_created_in_range} bgClass="bg-purple-50" />
          <StatCard label="Done (Range)" value={tasks_completed_in_range} bgClass="bg-emerald-50" />
          <StatCard label="In Progress" value={
            tasks_by_column_type.filter((c) => c.column_type === "in_progress").reduce((s, c) => s + c.count, 0)
          } bgClass="bg-amber-50" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Priority Breakdown */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">By Priority</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="priority" stroke="#64748b" style={{ fontSize: "12px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="completed" stackId="t" fill="#10b981" name="Completed" />
                <Bar dataKey="pending" stackId="t" fill="#e2e8f0" name="Pending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Column Distribution */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">By Column</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={columnChartData} cx="50%" cy="50%" outerRadius={80}
                  dataKey="count" labelLine={false}
                  label={({ column_name, count }: any) => `${column_name}: ${count}`}>
                  {columnChartData.map((c, i) => <Cell key={i} fill={c.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Velocity */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Weekly Velocity</h2>
            {velocityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: "10px" }} />
                  <YAxis stroke="#64748b" style={{ fontSize: "10px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="completed" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400 text-sm">No velocity data</div>
            )}
          </div>
        </div>

        {/* Projects Summary Table */}
        {projects_summary.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Tasks by Project</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Overdue</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {projects_summary.map((p) => (
                    <tr key={p.project_name} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || "#3b82f6" }} />
                          <span className="text-sm font-semibold text-slate-900">{p.project_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700">{p.total_tasks}</td>
                      <td className="px-6 py-3 text-sm text-green-700 font-medium">{p.completed}</td>
                      <td className="px-6 py-3">
                        {p.overdue > 0 ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">{p.overdue}</span>
                        ) : (
                          <span className="text-sm text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[100px]">
                            <div className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${p.total_tasks > 0 ? (p.completed / p.total_tasks) * 100 : 0}%` }} />
                          </div>
                          <span className="text-xs text-slate-600 font-medium">
                            {p.total_tasks > 0 ? ((p.completed / p.total_tasks) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  // ── PRODUCTIVITY REPORT ──────────────────────────────────────────────────

  const renderProductivityReport = () => {
    if (!productivityData) return null;

    const {
      total_entries, total_hours, billable_hours, non_billable_hours,
      billable_ratio, avg_entry_duration, total_tasks_completed,
      categories, peak_hours, daily_avg_hours, daily_avg_entries,
      longest_entry_hours, shortest_entry_hours,
    } = productivityData;

    const categoryChartData = categories.map((c, i) => ({
      ...c,
      color: COLORS[i % COLORS.length],
    }));

    const peakHoursData = peak_hours.map((p) => ({
      hour: `${p.hour.toString().padStart(2, "0")}:00`,
      hours: Number(p.hours.toFixed(2)),
      entries: p.entry_count,
    }));

    const billablePie = [
      { name: "Billable", value: billable_hours, color: "#10b981" },
      { name: "Non-Billable", value: non_billable_hours, color: "#f59e0b" },
    ].filter((d) => d.value > 0);

    return (
      <>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Entries" value={total_entries}
            subtitle={`${daily_avg_entries} avg/day`} bgClass="bg-blue-50" />
          <StatCard label="Total Hours" value={formatHoursAsHoursMinutes(total_hours)}
            subtitle={`${formatHoursAsHoursMinutes(daily_avg_hours)} avg/day`} bgClass="bg-purple-50" />
          <StatCard label="Billable Ratio" value={`${billable_ratio.toFixed(0)}%`}
            subtitle={`${formatHoursAsHoursMinutes(billable_hours)} billable`} bgClass="bg-green-50" />
          <StatCard label="Avg Entry Duration" value={formatHoursAsHoursMinutes(avg_entry_duration)}
            subtitle={`Longest: ${formatHoursAsHoursMinutes(longest_entry_hours)}`} bgClass="bg-amber-50" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Billable Pie */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Billable Split</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={billablePie} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" labelLine={false}
                  label={({ name, value }: any) => `${name}: ${formatHoursAsHoursMinutes(value)}`}>
                  {billablePie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatHoursAsHoursMinutes(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">By Category</h2>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" outerRadius={80}
                    dataKey="hours" labelLine={false}
                    label={({ category, percentage }: any) => `${category}: ${percentage.toFixed(0)}%`}>
                    {categoryChartData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatHoursAsHoursMinutes(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-slate-400 text-sm">No category data</div>
            )}
          </div>

          {/* Peak Hours */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Peak Working Hours</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: "10px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "10px" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(v: any, name: string) => name === "hours" ? formatHoursAsHoursMinutes(v) : v} />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Details Table */}
        {categories.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Category Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Entries</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {categories.map((c, i) => (
                    <tr key={c.category} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-semibold text-slate-900">{c.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700">{formatHoursAsHoursMinutes(c.hours)}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">{c.entry_count}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[100px]">
                            <div className="h-2 rounded-full" style={{ width: `${c.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs text-slate-600 font-medium">{c.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  // ── Skeleton Loaders ─────────────────────────────────────────────────────

  const renderSkeleton = () => {
    if (reportType === "attendance") return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SkeletonChart height="h-64" /><SkeletonChart height="h-64" /><SkeletonChart height="h-64" />
        </div>
        <SkeletonTable rows={7} />
      </>
    );
    if (reportType === "work") return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SkeletonChart height="h-72" /><SkeletonChart height="h-72" />
        </div>
        <SkeletonTable rows={7} />
      </>
    );
    if (reportType === "projects") return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SkeletonChart height="h-72" /><SkeletonChart height="h-72" />
        </div>
        <SkeletonTable rows={5} />
      </>
    );
    if (reportType === "tasks") return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SkeletonChart height="h-64" /><SkeletonChart height="h-64" /><SkeletonChart height="h-64" />
        </div>
        <SkeletonTable rows={5} />
      </>
    );
    // productivity
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SkeletonChart height="h-64" /><SkeletonChart height="h-64" /><SkeletonChart height="h-64" />
        </div>
        <SkeletonTable rows={5} />
      </>
    );
  };

  // ── Main Render ──────────────────────────────────────────────────────────

  const tabs: { key: ReportType; label: string }[] = [
    { key: "attendance", label: "Attendance" },
    { key: "work", label: "Work" },
    { key: "projects", label: "Projects" },
    { key: "tasks", label: "Tasks" },
    { key: "productivity", label: "Productivity" },
  ];

  return (
    <div className="p-1">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              reportType === tab.key
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6 flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        <div className="flex-1" />
        {/* Project Filter */}
        {reportType !== "attendance" && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="all">All Projects</option>
            {projectsList.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
        )}
        {/* Billable Filter */}
        {reportType !== "attendance" && reportType !== "tasks" && (
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {(["all", "billable", "non_billable"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBillableFilter(b)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  billableFilter === b
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {b === "all" ? "All" : b === "billable" ? "Billable" : "Non-Billable"}
              </button>
            ))}
          </div>
        )}
        {/* Date Presets */}
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          {[
            { label: "7D", days: 7 },
            { label: "30D", days: 30 },
            { label: "90D", days: 90 },
          ].map((preset) => {
            const presetStart = (() => {
              const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
              d.setDate(d.getDate() - preset.days + 1);
              return getDateStringPKT(d);
            })();
            const isActive = startDate === presetStart && endDate === getTodayPKT();
            return (
              <button
                key={preset.days}
                onClick={() => { setStartDate(presetStart); setEndDate(getTodayPKT()); }}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  isActive
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        {/* PDF Export */}
        <button
          onClick={handleExportPDF}
          disabled={loading || exporting}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? "Exporting..." : "PDF"}
        </button>
      </div>

      {/* Content */}
      {loading ? renderSkeleton() : (
        <>
          {reportType === "attendance" && renderAttendanceReport()}
          {reportType === "work" && renderWorkReport()}
          {reportType === "projects" && renderProjectReport()}
          {reportType === "tasks" && renderTasksReport()}
          {reportType === "productivity" && renderProductivityReport()}
        </>
      )}
    </div>
  );
};

export default Reports;
