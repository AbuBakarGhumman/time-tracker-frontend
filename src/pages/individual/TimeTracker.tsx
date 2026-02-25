import React, { useState, useEffect } from "react";
import {
  fetchTimeEntries,
  fetchActiveEntry as fetchActiveEntryFromAPI,
  fetchProjects as fetchProjectsFromAPI,
  createManualEntry,
  startAutomaticEntry,
  stopTimerEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from "../../api/timeentries";
import AnalogClockIcon from "../../components/AnalogClockIcon";
import { SkeletonTable } from "../../components/Skeleton";
import { getNowPKTForForm, localDateTimeToPKTISO, backendISOToDatetimeLocal, formatHoursAsHoursMinutes, formatPKTLocalTime } from "../../utils/dateUtils";
import { CacheManager } from "../../utils/cacheManager";

interface Project {
  id: number;
  name: string;
  color: string;
}

interface TimeEntry {
  id: number;
  task_name: string;
  start_time: string;
  end_time?: string;
  duration_hours?: number;
  project_id?: number;
  project?: { id: number; name: string; color: string };
  category?: string;
  status: string;
  notes?: string;
  description?: string;
}

interface ActiveEntry {
  id: number;
  task_name: string;
  start_time: string;
  status: string;
  elapsed_time?: string;
  project_id?: number;
  project?: { id: number; name: string; color: string };
  category?: string;
}

const TimeTracker: React.FC = () => {
  const [mode, setMode] = useState<"list" | "manual" | "automatic">("list");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditEntry, setSelectedEditEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({
    task_name: "",
    description: "",
    project_id: "",
    category: "",
    start_time: "",
    end_time: ""
  });

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    task_name: "",
    description: "",
    project_id: "",
    category: "",
    start_time: getNowPKTForForm(),
    end_time: getNowPKTForForm(),
    is_billable: 1
  });

  // Automatic entry form
  const [automaticForm, setAutomaticForm] = useState({
    task_name: "",
    description: "",
    project_id: "",
    category: "",
    is_billable: 1
  });

  useEffect(() => {
    // Load initial data - entries, active entry, and projects
    // Each function checks cache and returns early if valid
    Promise.all([
      fetchEntries(),        // Uses cache if valid
      fetchActiveEntry(),    // Uses cache if valid
      fetchProjects(),       // Uses cache if valid
    ]).finally(() => setIsInitialLoading(false));
    
    // Smart polling for active entry:
    // - If cache is valid, poll less frequently (30s)
    // - If cache is expired, poll more frequently (10s) to get updates
    let pollInterval: ReturnType<typeof setInterval>;
    
    const setupPolling = () => {
      // Clear existing interval
      if (pollInterval) clearInterval(pollInterval);
      
      // Determine polling frequency based on cache validity
      const pollFrequency = CacheManager.isValid("time-entries/active", {}) ? 30_000 : 10_000;
      
      pollInterval = setInterval(async () => {
        await fetchActiveEntry();
        // After fetch, re-evaluate polling frequency
        setupPolling();
      }, pollFrequency);
    };
    
    setupPolling();
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    if (!activeEntry?.start_time) {
      setElapsedTime("");
      return;
    }
    
    // Helper to calculate and update elapsed time
    const updateElapsed = () => {
      try {
        const startTime = new Date(activeEntry.start_time);
        const now = new Date();
        
        // Calculate the difference - both are absolute times so timezone doesn't matter
        const diff = now.getTime() - startTime.getTime();
        
        // Only show elapsed time if it's positive (handles edge cases)
        if (diff >= 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setElapsedTime(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setElapsedTime("0h 0m 0s");
        }
      } catch (e) {
        console.error("Error calculating elapsed time:", e);
        setElapsedTime("0h 0m 0s");
      }
    };
    
    // Calculate immediately so timer shows correct value on first render
    updateElapsed();
    
    // Then update every second
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [activeEntry]);

  const fetchEntries = async () => {
    try {
      const data = await fetchTimeEntries();
      const sortedEntries = [...data].sort((a, b) => {
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      });
      setEntries(sortedEntries);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch entries:", error);
    }
  };

  const fetchActiveEntry = async () => {
    try {
      const data = await fetchActiveEntryFromAPI();
      setActiveEntry(data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error("Failed to fetch active entry:", error);
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await fetchProjectsFromAPI();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const handleCreateManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createManualEntry({
        task_name: manualForm.task_name,
        description: manualForm.description,
        project_id: manualForm.project_id ? parseInt(manualForm.project_id) : undefined,
        category: manualForm.category,
        is_billable: manualForm.is_billable,
        // Send times in PKT format directly (no UTC conversion)
        start_time: localDateTimeToPKTISO(manualForm.start_time),
        end_time: localDateTimeToPKTISO(manualForm.end_time)
      });
      
      setManualForm({
        task_name: "",
        description: "",
        project_id: "",
        category: "",
        start_time: getNowPKTForForm(),
        end_time: getNowPKTForForm(),
        is_billable: 1
      });
      
      setMode("list");
      // Clear cache so fresh data is fetched
      CacheManager.clear("time-entries/list");
      await fetchEntries();
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to create entry");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAutomatic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await startAutomaticEntry({
        task_name: automaticForm.task_name,
        description: automaticForm.description,
        project_id: automaticForm.project_id ? parseInt(automaticForm.project_id) : undefined,
        category: automaticForm.category,
        is_billable: automaticForm.is_billable
      });
      
      // Set activeEntry directly from the API response - don't wait for fetch!
      setActiveEntry({
        id: result.id,
        task_name: result.task_name,
        start_time: result.start_time,
        status: result.status,
        project_id: result.project_id,
        project: result.project,
        category: result.category
      });
      
      setAutomaticForm({
        task_name: "",
        description: "",
        project_id: "",
        category: "",
        is_billable: 1
      });
      
      setMode("list");
      // Clear cache so fresh data is fetched on next poll
      CacheManager.clear("time-entries/list");
      CacheManager.clear("time-entries/active");
      // Fetch entries list in background
      await fetchEntries();
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to start timer");
    } finally {
      setLoading(false);
    }
  };

  const handleStopAutomatic = async () => {
    if (!activeEntry) return;
    
    setLoading(true);
    try {
      await stopTimerEntry(activeEntry.id);
      
      setActiveEntry(null);
      // Clear cache so fresh data is fetched
      CacheManager.clear("time-entries/list");
      CacheManager.clear("time-entries/active");
      await fetchEntries();
      await fetchActiveEntry();
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to stop entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await deleteTimeEntry(entryId);
      // Clear cache so fresh data is fetched
      CacheManager.clear("time-entries/list");
      await fetchEntries();
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to delete entry");
    } finally {
      setLoading(false);
    }
  };

  const handleViewEntry = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedEditEntry(entry);
    setEditForm({
      task_name: entry.task_name,
      description: entry.notes || entry.description || "",
      project_id: entry.project_id?.toString() || "",
      category: entry.category || "",
      // Convert backend ISO times to datetime-local format for form input
      start_time: backendISOToDatetimeLocal(entry.start_time),
      end_time: backendISOToDatetimeLocal(entry.end_time || "")
    });
    setShowEditModal(true);
  };

  const handleUpdateEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEditEntry) return;

    setLoading(true);
    try {
      await updateTimeEntry(selectedEditEntry.id, {
        task_name: editForm.task_name,
        description: editForm.description,
        project_id: editForm.project_id ? parseInt(editForm.project_id) : undefined,
        category: editForm.category,
        // Send times with PKT timezone offset (+05:00)
        // Both CREATE and UPDATE now use the same conversion function
        start_time: localDateTimeToPKTISO(editForm.start_time),
        end_time: localDateTimeToPKTISO(editForm.end_time)
      });
      
      setShowEditModal(false);
      setSelectedEditEntry(null);
      // Clear cache so fresh data is fetched
      CacheManager.clear("time-entries/list");
      await fetchEntries();
    } catch (error: any) {
      alert(error?.response?.data?.detail || "Failed to update entry");
    } finally {
      setLoading(false);
    }
  };

  const formatPKTTime = (dateString: string) => {
    // Times from API are already in PKT, no timezone conversion needed
    return formatPKTLocalTime(dateString, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(entries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = entries.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="p-1">
      {/* Mode Tabs */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={() => setMode("list")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            mode === "list"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          My Entries
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            mode === "manual"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setMode("automatic")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
            mode === "automatic"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Live Entry
        </button>
      </div>

      {/* Active Entry Status */}
      {activeEntry && (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-4 mb-6 text-white shadow-xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left — timer display with icon */}
            <div className="flex items-center gap-4 min-w-0">
              <AnalogClockIcon size={50} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-tight truncate">
                  {activeEntry.task_name}
                </p>
                <p className="text-2xl font-bold font-mono tracking-tight leading-tight mt-0.5">
                  {elapsedTime}
                </p>
              </div>
            </div>

            {/* Right — stop button */}
            <button
              onClick={handleStopAutomatic}
              disabled={loading}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow flex-shrink-0
                ${loading
                  ? "bg-white/20 text-white/60 cursor-default"
                  : "bg-white text-red-600 hover:bg-red-50 hover:scale-105 cursor-pointer"
                }
                disabled:cursor-not-allowed
              `}
            >
              {loading ? "Stopping…" : "Stop Timer"}
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      {mode === "manual" && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Create Manual Entry</h2>
          <form onSubmit={handleCreateManual} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Task Name *"
                value={manualForm.task_name}
                onChange={(e) => setManualForm({ ...manualForm, task_name: e.target.value })}
                required
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <select
                value={manualForm.project_id}
                onChange={(e) => setManualForm({ ...manualForm, project_id: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="">Select Project (Optional)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Category (e.g., Development, Meeting)"
                value={manualForm.category}
                onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <select
                value={manualForm.is_billable}
                onChange={(e) => setManualForm({ ...manualForm, is_billable: parseInt(e.target.value) })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value={1}>Billable</option>
                <option value={0}>Non-Billable</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">Start Time *</label>
                <input
                  type="datetime-local"
                  value={manualForm.start_time}
                  onChange={(e) => setManualForm({ ...manualForm, start_time: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">End Time *</label>
                <input
                  type="datetime-local"
                  value={manualForm.end_time}
                  onChange={(e) => setManualForm({ ...manualForm, end_time: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <textarea
              placeholder="Description (optional)"
              value={manualForm.description}
              onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition-all duration-200 shadow-lg hover:scale-[1.02]"
            >
              {loading ? "Creating..." : "Create Entry"}
            </button>
          </form>
        </div>
      )}

      {/* Automatic Timer Form */}
      {mode === "automatic" && !activeEntry && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Start Timer</h2>
          <form onSubmit={handleStartAutomatic} className="space-y-4">
            <input
              type="text"
              placeholder="Task Name *"
              value={automaticForm.task_name}
              onChange={(e) => setAutomaticForm({ ...automaticForm, task_name: e.target.value })}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={automaticForm.project_id}
                onChange={(e) => setAutomaticForm({ ...automaticForm, project_id: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="">Select Project (Optional)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Category"
                value={automaticForm.category}
                onChange={(e) => setAutomaticForm({ ...automaticForm, category: e.target.value })}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <select
              value={automaticForm.is_billable}
              onChange={(e) => setAutomaticForm({ ...automaticForm, is_billable: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              <option value={1}>Billable</option>
              <option value={0}>Non-Billable</option>
            </select>

            <textarea
              placeholder="Description (optional)"
              value={automaticForm.description}
              onChange={(e) => setAutomaticForm({ ...automaticForm, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg text-lg disabled:opacity-50 transition-all duration-200 shadow-lg hover:scale-[1.02]"
            >
              {loading ? "Starting..." : "Start Timer"}
            </button>
          </form>
        </div>
      )}

      {/* Entries List */}
      {mode === "list" && (
        isInitialLoading ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Recent Entries</h2>
            </div>
            
            {entries.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No time entries yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Task</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">View</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Edit</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-900">{entry.task_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {typeof entry.project === 'string' ? entry.project : entry.project?.name || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {formatPKTTime(entry.start_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                            {entry.end_time ? formatPKTTime(entry.end_time) : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-900">
                              {entry.duration_hours ? formatHoursAsHoursMinutes(entry.duration_hours) : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entry.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleViewEntry(entry)}
                              disabled={loading}
                              className="inline-flex text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                              title="View entry details"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleEditEntry(entry)}
                              disabled={loading}
                              className="inline-flex text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                              title="Edit entry"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={loading}
                              className="inline-flex text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors disabled:opacity-50"
                              title="Delete entry"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {entries.length > 0 && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, entries.length)}</span> of <span className="font-semibold">{entries.length}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              page === currentPage
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || loading}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )
      )}

      {/* Edit Modal - UPDATED with rounded corners */}
      {showEditModal && selectedEditEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit Entry</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleUpdateEntry} id="editEntryForm" className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Task Name *"
                  value={editForm.task_name}
                  onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })}
                  required
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <select
                  value={editForm.project_id}
                  onChange={(e) => setEditForm({ ...editForm, project_id: e.target.value })}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                >
                  <option value="">Select Project (Optional)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">Start Time *</label>
                  <input
                    type="datetime-local"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">End Time *</label>
                  <input
                    type="datetime-local"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <textarea
                placeholder="Description (optional)"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </form>

            {/* Modal Footer */}
            <div className="flex-shrink-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="editEntryForm"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-all duration-200"
              >
                {loading ? "Updating..." : "Update Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - UPDATED with rounded corners */}
      {showDetailModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-xl font-bold">Entry Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Task Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Task Name</h4>
                <p className="text-lg font-bold text-slate-900">{selectedEntry.task_name}</p>
              </div>

              {/* Grid Layout for Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Project</h4>
                  <p className="text-slate-900 font-medium">{typeof selectedEntry.project === 'string' ? selectedEntry.project : selectedEntry.project?.name || "N/A"}</p>
                </div>

                {/* Category */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Category</h4>
                  <p className="text-slate-900 font-medium">{selectedEntry.category || "N/A"}</p>
                </div>
              </div>

              {/* Time Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg">
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Start Time</h4>
                  <p className="text-sm text-slate-900 font-medium">{formatPKTTime(selectedEntry.start_time)}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">End Time</h4>
                  <p className="text-sm text-slate-900 font-medium">
                    {selectedEntry.end_time ? formatPKTTime(selectedEntry.end_time) : "N/A"}
                  </p>
                </div>
              </div>

              {/* Duration and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Duration</h4>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedEntry.duration_hours ? formatHoursAsHoursMinutes(selectedEntry.duration_hours) : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Status</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedEntry.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {selectedEntry.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {(selectedEntry.notes || selectedEntry.description) && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Description</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap break-words">{selectedEntry.notes || selectedEntry.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;