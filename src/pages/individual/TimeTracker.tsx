import React, { useState, useEffect } from "react";
import {
  fetchTimeEntries,
  fetchActiveEntry as fetchActiveEntryFromAPI,
  fetchProjects as fetchProjectsFromAPI,
  fetchProjectIncompleteTasks,
  fetchProjectColumns,
  createManualEntry,
  startAutomaticEntry,
  stopTimerEntry,
  updateTimeEntry,
  deleteTimeEntry,
  type ProjectTask,
  type ProjectColumn,
} from "../../api/timeentries";
import AnalogClockIcon from "../../components/AnalogClockIcon";
import { SkeletonTable } from "../../components/Skeleton";
import { getNowPKTForForm, localDateTimeToPKTISO, backendISOToDatetimeLocal, formatHoursAsHoursMinutes, formatPKTLocalTime } from "../../utils/dateUtils";
import { CacheManager } from "../../utils/cacheManager";
import { clearCacheForKey } from "../../api/fetchManager";

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
  task_id?: number;
  task?: { id: number; title: string };
  task_column_name?: string;
  task_column_type?: string;
  category?: string;
  status: string;
  notes?: string;
  description?: string;
  is_billable?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ActiveEntry {
  id: number;
  task_name: string;
  start_time: string;
  status: string;
  elapsed_time?: string;
  project_id?: number;
  project?: { id: number; name: string; color: string };
  task_id?: number;
  category?: string;
}

const TimeTracker: React.FC = () => {
  const [mode, setMode] = useState<"list" | "manual" | "automatic">("list");
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null);
  const [manualProjectTasks, setManualProjectTasks] = useState<ProjectTask[]>([]);
  const [automaticProjectTasks, setAutomaticProjectTasks] = useState<ProjectTask[]>([]);
  const [manualProjectColumns, setManualProjectColumns] = useState<ProjectColumn[]>([]);
  const [stopModalColumns, setStopModalColumns] = useState<ProjectColumn[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchEntries, setSearchEntries] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "active">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const itemsPerPage = 10;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditEntry, setSelectedEditEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({
    task_name: "",
    description: "",
    category: "",
    start_time: "",
    end_time: ""
  });
  const [showStopModal, setShowStopModal] = useState(false);
  const [stopColumnType, setStopColumnType] = useState("");

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    task_name: "",
    description: "",
    project_id: "others",
    task_id: "",
    task_column_type: "",
    category: "",
    start_time: getNowPKTForForm(),
    end_time: getNowPKTForForm(),
    is_billable: true
  });

  // Automatic entry form
  const [automaticForm, setAutomaticForm] = useState({
    task_name: "",
    description: "",
    project_id: "others",
    task_id: "",
    category: "",
    is_billable: true
  });

  useEffect(() => {
    // Always fetch fresh entries on mount — cache TTL is short (30s) anyway,
    // but we force-clear stale data from previous bugs to ensure correctness.
    clearCacheForKey("time-entries/list");
    clearCacheForKey("time-entries/active");

    Promise.all([
      fetchEntries(),
      fetchActiveEntry(),
      fetchProjects(),
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

  const loadTasksForProject = async (
    projectId: string,
    setter: React.Dispatch<React.SetStateAction<ProjectTask[]>>
  ) => {
    if (!projectId || projectId === "others") {
      setter([]);
      return;
    }
    setLoadingTasks(true);
    try {
      const tasks = await fetchProjectIncompleteTasks(parseInt(projectId));
      setter(tasks);
    } catch (error) {
      console.error("Failed to fetch project tasks:", error);
      setter([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const loadColumnsForProject = async (
    projectId: string | number,
    setter: React.Dispatch<React.SetStateAction<ProjectColumn[]>>
  ) => {
    const id = typeof projectId === "string" ? projectId : projectId.toString();
    if (!id || id === "others") {
      setter([]);
      return;
    }
    try {
      const cols = await fetchProjectColumns(parseInt(id));
      setter(cols);
    } catch (error) {
      console.error("Failed to fetch project columns:", error);
      setter([]);
    }
  };

  const handleCreateManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isRealProject = manualForm.project_id && manualForm.project_id !== "others";
      await createManualEntry({
        task_name: manualForm.task_name,
        description: manualForm.description,
        project_id: isRealProject ? parseInt(manualForm.project_id) : undefined,
        task_id: isRealProject && manualForm.task_id ? parseInt(manualForm.task_id) : undefined,
        task_column_type: isRealProject && manualForm.task_id && manualForm.task_column_type ? manualForm.task_column_type : undefined,
        category: manualForm.category,
        is_billable: manualForm.is_billable,
        // Send times in PKT format directly (no UTC conversion)
        start_time: localDateTimeToPKTISO(manualForm.start_time),
        end_time: localDateTimeToPKTISO(manualForm.end_time)
      });

      setManualForm({
        task_name: "",
        description: "",
        project_id: "others",
        task_id: "",
        task_column_type: "",
        category: "",
        start_time: getNowPKTForForm(),
        end_time: getNowPKTForForm(),
        is_billable: true
      });
      setManualProjectTasks([]);
      setManualProjectColumns([]);

      setMode("list");
      await fetchEntries();
    } catch (error: any) {
      alert(error?.message || "Failed to create entry");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAutomatic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isRealProject = automaticForm.project_id && automaticForm.project_id !== "others";
      const result = await startAutomaticEntry({
        task_name: automaticForm.task_name,
        description: automaticForm.description,
        project_id: isRealProject ? parseInt(automaticForm.project_id) : undefined,
        task_id: isRealProject && automaticForm.task_id ? parseInt(automaticForm.task_id) : undefined,
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
        task_id: result.task_id,
        category: result.category
      });
      
      setAutomaticForm({
        task_name: "",
        description: "",
        project_id: "others",
        task_id: "",
        category: "",
        is_billable: true
      });
      setAutomaticProjectTasks([]);
      
      setMode("list");
      await fetchEntries();
    } catch (error: any) {
      alert(error?.message || "Failed to start timer");
    } finally {
      setLoading(false);
    }
  };

  const handleStopAutomatic = async (taskColumnType?: string) => {
    if (!activeEntry) return;

    setLoading(true);
    setShowStopModal(false);
    try {
      await stopTimerEntry(activeEntry.id, taskColumnType ? { task_column_type: taskColumnType } : {});

      setActiveEntry(null);
      setStopColumnType("");
      await fetchEntries();
      await fetchActiveEntry();
    } catch (error: any) {
      alert(error?.message || "Failed to stop entry");
    } finally {
      setLoading(false);
    }
  };

  const handleStopClick = () => {
    if (!activeEntry) return;
    // If timer has a task, ask where to move it before stopping
    if (activeEntry.task_id) {
      setStopColumnType("");
      setStopModalColumns([]);
      setShowStopModal(true);
      if (activeEntry.project_id) {
        loadColumnsForProject(activeEntry.project_id, setStopModalColumns);
      }
    } else {
      handleStopAutomatic();
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await deleteTimeEntry(entryId);
      await fetchEntries();
    } catch (error: any) {
      alert(error?.message || "Failed to delete entry");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueEntry = async (entry: TimeEntry) => {
    if (activeEntry) {
      alert("Stop the current active timer before starting a new one.");
      return;
    }
    setLoading(true);
    try {
      const result = await startAutomaticEntry({
        task_name: entry.task_name,
        description: entry.description || entry.notes,
        project_id: entry.project_id,
        task_id: entry.task_id,
        category: entry.category,
        is_billable: entry.is_billable ?? true,
      });
      setActiveEntry({
        id: result.id,
        task_name: result.task_name,
        start_time: result.start_time,
        status: result.status,
        project_id: result.project_id,
        project: result.project,
        task_id: result.task_id,
        category: result.category,
      });
      setMode("list");
      await fetchEntries();
    } catch (error: any) {
      alert(error?.message || "Failed to start timer");
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
      category: entry.category || "",
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
        category: editForm.category,
        start_time: localDateTimeToPKTISO(editForm.start_time),
        end_time: localDateTimeToPKTISO(editForm.end_time)
      });
      
      setShowEditModal(false);
      setSelectedEditEntry(null);
      await fetchEntries();
    } catch (error: any) {
      alert(error?.message || "Failed to update entry");
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

  // Filter + Pagination logic
  const filteredEntries = entries.filter((e) => {
    if (searchEntries) {
      const q = searchEntries.toLowerCase();
      const projectName = typeof e.project === "string" ? e.project : e.project?.name || "";
      if (!e.task_name.toLowerCase().includes(q) && !projectName.toLowerCase().includes(q) && !(e.category || "").toLowerCase().includes(q)) return false;
    }
    if (statusFilter === "completed" && e.status === "active") return false;
    if (statusFilter === "active" && e.status !== "active") return false;
    if (projectFilter !== "all") {
      const pId = typeof e.project === "string" ? null : e.project?.id;
      if (projectFilter === "none" && pId) return false;
      if (projectFilter !== "none" && String(pId) !== projectFilter) return false;
    }
    return true;
  });
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

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
              onClick={handleStopClick}
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
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Entry Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Fix login bug"
                  value={manualForm.task_name}
                  onChange={(e) => setManualForm({ ...manualForm, task_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Project</label>
                <select
                  value={manualForm.project_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualForm({ ...manualForm, project_id: val, task_id: "", task_column_type: "" });
                    loadTasksForProject(val, setManualProjectTasks);
                    loadColumnsForProject(val, setManualProjectColumns);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                >
                  <option value="others">Others (General Work)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task selector + Move To — shown together when a real project is selected */}
            {manualForm.project_id && manualForm.project_id !== "others" && (
              loadingTasks ? (
                <p className="text-sm text-slate-500 px-1">Loading tasks...</p>
              ) : manualProjectTasks.length === 0 ? (
                <p className="text-sm text-amber-600 px-1">No incomplete tasks in this project. You can still log time without a task.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700">Task <span className="text-slate-400 font-normal">(optional)</span></label>
                    <select
                      value={manualForm.task_id}
                      onChange={(e) => {
                        const selectedTask = manualProjectTasks.find(t => t.id.toString() === e.target.value);
                        setManualForm({
                          ...manualForm,
                          task_id: e.target.value,
                          task_name: selectedTask?.title ?? manualForm.task_name,
                          task_column_type: selectedTask?.current_column_type ?? "",
                        });
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                    >
                      <option value="">— Select Task —</option>
                      {manualProjectTasks.map((task) => (
                        <option key={task.id} value={task.id.toString()}>
                          {task.title}{task.current_column_name ? ` (${task.current_column_name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-slate-700">Move Task To <span className="text-slate-400 font-normal">(optional)</span></label>
                    <select
                      value={manualForm.task_column_type}
                      onChange={(e) => setManualForm({ ...manualForm, task_column_type: e.target.value })}
                      disabled={!manualForm.task_id}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">— Keep Current Status —</option>
                      {manualProjectColumns.map((col) => (
                        <option key={col.id} value={col.column_type}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Category <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Development, Meeting, Support"
                  value={manualForm.category}
                  onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Billing</label>
                <select
                  value={manualForm.is_billable ? "true" : "false"}
                  onChange={(e) => setManualForm({ ...manualForm, is_billable: e.target.value === "true" })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                >
                  <option value="true">Billable</option>
                  <option value="false">Non-Billable</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Start Time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={manualForm.start_time}
                  onChange={(e) => setManualForm({ ...manualForm, start_time: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">End Time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={manualForm.end_time}
                  onChange={(e) => setManualForm({ ...manualForm, end_time: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                placeholder="Add any notes or context for this entry..."
                value={manualForm.description}
                onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Entry Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Fix login bug"
                  value={automaticForm.task_name}
                  onChange={(e) => setAutomaticForm({ ...automaticForm, task_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Project</label>
                <select
                  value={automaticForm.project_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAutomaticForm({ ...automaticForm, project_id: val, task_id: "", task_name: "" });
                    loadTasksForProject(val, setAutomaticProjectTasks);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                >
                  <option value="others">Others (General Work)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task selector — only shown when a real project is selected */}
            {automaticForm.project_id && automaticForm.project_id !== "others" && (
              loadingTasks ? (
                <p className="text-sm text-slate-500 px-1">Loading tasks...</p>
              ) : automaticProjectTasks.length === 0 ? (
                <p className="text-sm text-amber-600 px-1">No incomplete tasks in this project. You can still log time without a task.</p>
              ) : (
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700">Task <span className="text-slate-400 font-normal">(optional)</span></label>
                  <select
                    value={automaticForm.task_id}
                    onChange={(e) => {
                      const selectedTask = automaticProjectTasks.find(t => t.id.toString() === e.target.value);
                      setAutomaticForm({
                        ...automaticForm,
                        task_id: e.target.value,
                        task_name: selectedTask?.title ?? automaticForm.task_name,
                      });
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                  >
                    <option value="">— Select Task —</option>
                    {automaticProjectTasks.map((task) => (
                      <option key={task.id} value={task.id.toString()}>
                        {task.title}{task.current_column_name ? ` (${task.current_column_name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Category <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Development, Meeting, Support"
                  value={automaticForm.category}
                  onChange={(e) => setAutomaticForm({ ...automaticForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Billing</label>
                <select
                  value={automaticForm.is_billable ? "true" : "false"}
                  onChange={(e) => setAutomaticForm({ ...automaticForm, is_billable: e.target.value === "true" })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                >
                  <option value="true">Billable</option>
                  <option value="false">Non-Billable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                placeholder="Add any notes or context for this entry..."
                value={automaticForm.description}
                onChange={(e) => setAutomaticForm({ ...automaticForm, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

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
          <>
          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-6 flex gap-4 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchEntries}
                onChange={(e) => { setSearchEntries(e.target.value); setCurrentPage(1); }}
                placeholder="Search by title, project, or category..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => { setProjectFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="all">All Projects</option>
              <option value="others">Others (General Work)</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              {(["all", "completed", "active"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    statusFilter === s
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s === "all" ? "All" : s === "completed" ? "Completed" : "Running"}
                </button>
              ))}
            </div>
          </div>

          {isInitialLoading ? (
            <SkeletonTable rows={5} />
          ) : (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{searchEntries || statusFilter !== "all" || projectFilter !== "all" ? "No entries match your filters" : "No time entries yet"}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{entry.task_name}</span>
                              {entry.status !== "active" && entry.task_column_type !== "done" && (
                                <button
                                  onClick={() => handleContinueEntry(entry)}
                                  disabled={loading || !!activeEntry}
                                  className="flex-shrink-0 text-green-600 hover:text-green-800 hover:bg-green-50 p-0.5 rounded transition-colors disabled:opacity-40"
                                  title={activeEntry ? "Stop current timer first" : "Continue — start live timer with same info"}
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {typeof entry.project === 'string' ? entry.project : entry.project?.name || "Others (General Work)"}
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
                            {entry.task_column_name ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                entry.task_column_type === "done"
                                  ? "bg-green-100 text-green-800"
                                  : entry.task_column_type === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : entry.task_column_type === "review"
                                  ? "bg-purple-100 text-purple-800"
                                  : entry.task_column_type === "bug"
                                  ? "bg-red-100 text-red-800"
                                  : entry.task_column_type === "todo"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                {entry.task_column_name}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                entry.status === "active"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {entry.status}
                              </span>
                            )}
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
                {filteredEntries.length > 0 && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, filteredEntries.length)}</span> of <span className="font-semibold">{filteredEntries.length}</span> entries
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
          )}
          </>
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
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Entry Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Fix login bug"
                  value={editForm.task_name}
                  onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Category <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Development, Meeting, Support"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700">Start Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={editForm.start_time}
                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700">End Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={editForm.end_time}
                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea
                  placeholder="Add any notes or context for this entry..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
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

      {/* Stop Timer Modal — shown when stopping a timer that has a task */}
      {showStopModal && activeEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Stop Timer</h3>
              <button
                onClick={() => setShowStopModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-700 font-medium">
                Stopping timer for: <span className="font-bold text-slate-900">{activeEntry.task_name}</span>
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Move Task To...</label>
                <select
                  value={stopColumnType}
                  onChange={(e) => setStopColumnType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
                >
                  <option value="">Keep current status</option>
                  {stopModalColumns.map((col) => (
                    <option key={col.id} value={col.column_type}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowStopModal(false)}
                disabled={loading}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStopAutomatic(stopColumnType || undefined)}
                disabled={loading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Stopping..." : "Stop Timer"}
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
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Title</h4>
                <p className="text-lg font-bold text-slate-900">{selectedEntry.task_name}</p>
              </div>

              {/* Project + Task + Task Board Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Project</h4>
                  <div className="flex items-center gap-2">
                    {selectedEntry.project?.color && (
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedEntry.project.color }} />
                    )}
                    <p className="text-slate-900 font-medium">{typeof selectedEntry.project === 'string' ? selectedEntry.project : selectedEntry.project?.name || "Others (General Work)"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task</h4>
                  <p className="text-slate-900 font-medium">{selectedEntry.task?.title || "—"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Task Board Status</h4>
                  {selectedEntry.task_column_name ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      selectedEntry.task_column_type === "done"
                        ? "bg-green-100 text-green-800"
                        : selectedEntry.task_column_type === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : selectedEntry.task_column_type === "review"
                        ? "bg-purple-100 text-purple-800"
                        : selectedEntry.task_column_type === "bug"
                        ? "bg-red-100 text-red-800"
                        : selectedEntry.task_column_type === "todo"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {selectedEntry.task_column_name}
                    </span>
                  ) : (
                    <p className="text-slate-500 text-sm">—</p>
                  )}
                </div>
              </div>

              {/* Category + Billable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</h4>
                  <p className="text-slate-900 font-medium">{selectedEntry.category || "—"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Billable</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedEntry.is_billable ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {selectedEntry.is_billable ? "Billable" : "Non-Billable"}
                  </span>
                </div>
              </div>

              {/* Time block */}
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Time</h4>
                  <p className="text-sm text-slate-900 font-medium">{formatPKTTime(selectedEntry.start_time)}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Time</h4>
                  <p className="text-sm text-slate-900 font-medium">{selectedEntry.end_time ? formatPKTTime(selectedEntry.end_time) : "—"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Duration</h4>
                  <p className="text-sm font-bold text-blue-600">
                    {selectedEntry.duration_hours ? formatHoursAsHoursMinutes(selectedEntry.duration_hours) : "—"}
                  </p>
                </div>
              </div>

              {/* Entry Status + Logged At */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Entry Status</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedEntry.status === "active"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {selectedEntry.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Logged At</h4>
                  <p className="text-sm text-slate-900 font-medium">{selectedEntry.created_at ? formatPKTTime(selectedEntry.created_at) : "—"}</p>
                </div>
              </div>

              {/* Last Updated */}
              {selectedEntry.updated_at && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Updated</h4>
                  <p className="text-sm text-slate-900 font-medium">{formatPKTTime(selectedEntry.updated_at)}</p>
                </div>
              )}

              {/* Description */}
              {(selectedEntry.notes || selectedEntry.description) && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
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