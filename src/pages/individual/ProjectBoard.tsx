import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchBoard } from "../../api/boards";
import type { BoardView, Task, BoardColumn } from "../../api/boards";
import { KanbanBoard } from "../../components/kanban/KanbanBoard";
import { TaskDetailPanel } from "../../components/kanban/TaskDetailPanel";
import axios from "../../api/interceptor";
import { API_BASE_URL } from "../../api/config";
import { useAIAssistant } from "../../context/AIAssistantContext";
import { getStoredUser } from "../../api/auth";

const ProjectBoard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { setProjectContext } = useAIAssistant();
    const [searchParams, setSearchParams] = useSearchParams();
    const [board, setBoard] = useState<BoardView | null>(null);
    const [projectName, setProjectName] = useState<string>("");
    const [triggerAddColumn, setTriggerAddColumn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskSearch, setTaskSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const currentUser = useMemo(() => getStoredUser(), []);

    useEffect(() => { loadBoard(); }, [id]);

    // Set AI assistant project context when on a board page
    useEffect(() => {
        if (id && projectName) {
            setProjectContext({ id: parseInt(id, 10), name: projectName });
        }
        return () => setProjectContext(null);
    }, [id, projectName, setProjectContext]);

    const loadBoard = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [data, projRes] = await Promise.all([
                fetchBoard(parseInt(id, 10)),
                axios.get(`${API_BASE_URL}/projects/${id}`).catch(() => null),
            ]);
            setBoard(data);
            if (projRes?.data?.name) setProjectName(projRes.data.name);
            // Open task from URL query param ?task=<id>
            const taskParam = searchParams.get('task');
            if (taskParam) {
                const taskId = parseInt(taskParam, 10);
                const task = data.tasks.find((t) => t.id === taskId);
                if (task) setSelectedTask(task);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openTask = (task: Task) => {
        setSelectedTask(task);
        setSearchParams({ task: String(task.id) }, { replace: true });
    };

    const closeTask = () => {
        setSelectedTask(null);
        setSearchParams({}, { replace: true });
    };

    const handleTaskUpdated = (updated: Task) => {
        setBoard((prev) => {
            if (!prev) return prev;
            return { ...prev, tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)) };
        });
        setSelectedTask(updated);
    };

    const handleTaskDeleted = (taskId: number) => {
        setBoard((prev) => {
            if (!prev) return prev;
            return { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) };
        });
        closeTask();
    };

    if (loading) {
        return (
            <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden p-1 animate-pulse">
                {/* Tab bar skeleton */}
                <div className="flex gap-3 mb-3 items-center shrink-0">
                    <div className="h-9 w-40 bg-slate-200 rounded-lg" />
                    <div className="flex-1" />
                    <div className="h-9 w-28 bg-slate-200 rounded-lg" />
                </div>
                {/* Search & filter bar skeleton */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-3 shrink-0 flex items-center gap-3">
                    <div className="flex-1 h-10 bg-slate-100 rounded-lg" />
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-7 w-20 bg-slate-200 rounded-md" />
                        ))}
                    </div>
                </div>
                {/* Columns skeleton */}
                <div className="flex gap-4 flex-1 overflow-hidden">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[300px] bg-slate-50 border border-slate-300 rounded-xl flex flex-col">
                            {/* Column header */}
                            <div className="px-4 py-3 border-b border-slate-200 bg-white rounded-t-xl flex items-center gap-2">
                                <div className="h-4 w-24 bg-slate-200 rounded" />
                                <div className="h-5 w-6 bg-slate-100 rounded-full" />
                            </div>
                            {/* Task cards */}
                            <div className="p-3 space-y-3">
                                {Array(3 - i % 2).fill(0).map((_, j) => (
                                    <div key={j} className="bg-white rounded-lg shadow border border-slate-200 p-4">
                                        <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                                        <div className="h-3 w-full bg-slate-100 rounded mb-1" />
                                        <div className="h-3 w-2/3 bg-slate-100 rounded mb-3" />
                                        <div className="flex items-center justify-between">
                                            <div className="h-5 w-14 bg-slate-200 rounded" />
                                            <div className="h-4 w-16 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!board) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
                <h2 className="text-xl font-bold text-slate-700">Board not found</h2>
                <button
                    onClick={() => navigate("/projects")}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                    Back to Projects
                </button>
            </div>
        );
    }

    const projectId = parseInt(id as string, 10);
    const today = new Date().toISOString().split("T")[0];
    const filteredTasks = board.tasks.filter((t) => {
        // Text search
        if (taskSearch.trim()) {
            const q = taskSearch.toLowerCase();
            if (!t.title.toLowerCase().includes(q) && !(t.description && t.description.toLowerCase().includes(q))) return false;
        }
        // Filter
        if (activeFilter === "assigned_to_me") return t.assigned_to_id === currentUser?.id;
        if (activeFilter === "due_today") return t.due_date?.split("T")[0] === today;
        if (activeFilter === "overdue") return t.due_date ? t.due_date.split("T")[0] < today && !t.is_completed : false;
        if (activeFilter === "high_priority") return t.priority === "high" || t.priority === "urgent";
        if (activeFilter === "unassigned") return t.assigned_to_id === null;
        return true;
    });
    const selectedColumn = selectedTask
        ? board.columns.find((c: BoardColumn) => c.id === selectedTask.column_id)
        : undefined;

    return (
        <div className="relative flex flex-col h-[calc(100vh-100px)] overflow-hidden p-1">
            {/* Tabs */}
            <div className="flex gap-3 mb-3 flex-wrap items-center shrink-0">
                <button
                    className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                >
                    {projectName ? `${projectName} Board` : "Board"}
                </button>
                <div className="flex-1" />
                <button
                    onClick={() => setTriggerAddColumn(true)}
                    className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 text-sm bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                >
                    + Add Column
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-3 shrink-0 flex items-center gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by task name or description..."
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                    {[
                        { key: "all", label: "All Tasks" },
                        { key: "assigned_to_me", label: "Assigned to Me" },
                        { key: "due_today", label: "Due Today" },
                        { key: "overdue", label: "Overdue" },
                        { key: "high_priority", label: "High Priority" },
                        { key: "unassigned", label: "Unassigned" },
                    ].map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
                                activeFilter === f.key
                                    ? "bg-white text-slate-800 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Board view */}
            <div className="flex-1 min-h-0 overflow-hidden">
            <KanbanBoard
                projectId={projectId}
                initialColumns={board.columns}
                initialTasks={filteredTasks}
                onTaskClick={openTask}
                openAddColumn={triggerAddColumn}
                onAddColumnConsumed={() => setTriggerAddColumn(false)}
            />
            </div>

            {/* Task Detail Slide-in Panel */}
            {selectedTask && (
                <TaskDetailPanel
                    task={selectedTask}
                    column={selectedColumn}
                    projectId={projectId}
                    onClose={closeTask}
                    onUpdated={handleTaskUpdated}
                    onDeleted={handleTaskDeleted}
                />
            )}
        </div>
    );
};

export default ProjectBoard;
