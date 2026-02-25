import React, { useState, useEffect } from "react";
import {
  fetchAttendanceReport,
  fetchWorkDailyReport,
  fetchProjectBreakdown,
} from "../../api/analytics";
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
} from "recharts";
import { SkeletonCard, SkeletonChart, SkeletonTable } from "../../components/Skeleton";
import { getTodayPKT, formatHoursAsHoursMinutes, getDateStringPKT, formatPKTLocalDateOnly } from "../../utils/dateUtils";

interface AttendanceReport {
  total_working_days: number;
  present_days: number;
  absent_days: number;
  late_arrivals: number;
  early_departures: number;
  total_working_hours: number;
  average_daily_hours: number;
}

interface WorkReport {
  date: string;
  tasks_completed: number;
  total_hours: number;
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
}

type ReportType = "attendance" | "work" | "projects";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#f97316"];

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>(() => {
    const pktNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const date = new Date(pktNow);
    date.setMonth(date.getMonth() - 1);
    return getDateStringPKT(date);
  });
  const [endDate, setEndDate] = useState<string>(getTodayPKT());

  // Data
  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [workReports, setWorkReports] = useState<WorkReport[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [dailyWorkData, setDailyWorkData] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, startDate, endDate]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (reportType === "attendance") {
        const data = await fetchAttendanceReport(startDate, endDate);
        applyReportData({ type: "attendance", data }, reportType);
      } else if (reportType === "work") {
        const data = await fetchWorkDailyReport(startDate, endDate);
        applyReportData({ type: "work", data }, reportType);
      } else if (reportType === "projects") {
        const data = await fetchProjectBreakdown(startDate, endDate);
        applyReportData({ type: "projects", data }, reportType);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to apply cached data to state
  const applyReportData = (cachedData: any, type: ReportType) => {
    if (type === "attendance" && cachedData.data) {
      setAttendanceData(cachedData.data);
    } else if (type === "work" && cachedData.data) {
      setWorkReports(cachedData.data);
      const chartData = cachedData.data.map((report: WorkReport) => ({
        date: formatPKTLocalDateOnly(report.date, { month: "short", day: "numeric" }),
        hours: report.total_hours,
        tasks: report.tasks_completed,
      }));
      setDailyWorkData(chartData);
    } else if (type === "projects" && cachedData.data) {
      setProjectStats(cachedData.data.projects);
    }
  };

  const renderAttendanceReport = () => {
    if (!attendanceData) return null;

    const attendanceChart = [
      { name: "Present", value: attendanceData.present_days, color: "#10b981" },
      { name: "Absent", value: attendanceData.absent_days, color: "#ef4444" },
    ];

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Total Working Days</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{attendanceData.total_working_days}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Present Days</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{attendanceData.present_days}</p>
            <p className="text-xs text-green-600 mt-1">
              {((attendanceData.present_days / attendanceData.total_working_days) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Absent Days</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{attendanceData.absent_days}</p>
            <p className="text-xs text-red-600 mt-1">
              {((attendanceData.absent_days / attendanceData.total_working_days) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Late Arrivals</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{attendanceData.late_arrivals}</p>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-md border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-600 uppercase">Total Hours</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {formatHoursAsHoursMinutes(attendanceData.total_working_hours)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Avg: {formatHoursAsHoursMinutes(attendanceData.average_daily_hours)}/day
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-6 text-slate-900">Attendance Summary</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={attendanceChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {attendanceChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  };

  const renderWorkReport = () => {
    if (workReports.length === 0) {
      return (
        <div className="bg-slate-100 rounded-xl p-12 text-center">
          <p className="text-slate-600 text-lg">No work records for the selected period</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Daily Work Hours</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyWorkData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Tasks Completed</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyWorkData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Daily Work Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Tasks</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Top Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {workReports.map((report) => (
                  <tr key={report.date} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900 font-medium">
                      {formatPKTLocalDateOnly(report.date, { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700">{formatHoursAsHoursMinutes(report.total_hours)}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{report.tasks_completed}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">
                      {report.projects.length > 0 ? report.projects[0].project_name : "N/A"}
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

  const renderProjectReport = () => {
    if (projectStats.length === 0) {
      return (
        <div className="bg-slate-100 rounded-xl p-12 text-center">
          <p className="text-slate-600 text-lg">No project data available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-6 text-slate-900">Project Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: any) => `${name}: ${formatHoursAsHoursMinutes(value)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => formatHoursAsHoursMinutes(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-4 text-slate-900">Project Details</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {projectStats.map((project, index) => (
              <div key={project.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                    <p className="text-xs text-slate-500">{formatHoursAsHoursMinutes(project.hours)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700">{((project.hours / projectStats.reduce((a, p) => a + p.hours, 0)) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-1">
      {/* Report Type Selector */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setReportType("attendance")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            reportType === "attendance"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Attendance
        </button>
        <button
          onClick={() => setReportType("work")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            reportType === "work"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Work Report
        </button>
        <button
          onClick={() => setReportType("projects")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            reportType === "projects"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Projects
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6 flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <>
          {reportType === "attendance" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
              </div>
              <SkeletonChart height="h-80" />
            </>
          )}
          {reportType === "work" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <SkeletonChart height="h-72" />
                <SkeletonChart height="h-72" />
              </div>
              <SkeletonTable rows={7} />
            </>
          )}
          {reportType === "projects" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart height="h-80" />
              <SkeletonChart height="h-80" />
            </div>
          )}
        </>
      ) : (
        <>
          {reportType === "attendance" && renderAttendanceReport()}
          {reportType === "work" && renderWorkReport()}
          {reportType === "projects" && renderProjectReport()}
        </>
      )}
    </div>
  );
};

export default Reports;
