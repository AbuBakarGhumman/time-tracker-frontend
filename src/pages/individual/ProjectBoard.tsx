import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchBoard } from "../../api/boards";
import type { BoardView, Task, BoardColumn } from "../../api/boards";
import { KanbanBoard } from "../../components/kanban/KanbanBoard";
import { KanbanList } from "../../components/kanban/KanbanList";
import { TaskDetailPanel } from "../../components/kanban/TaskDetailPanel";
import axios from "../../api/interceptor";
import { API_BASE_URL } from "../../api/config";
import { useAIAssistant } from "../../context/AIAssistantContext";

const ProjectBoard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { setProjectContext } = useAIAssistant();
    const [searchParams, setSearchParams] = useSearchParams();
    const [board, setBoard] = useState<BoardView | null>(null);
    const [projectName, setProjectName] = useState<string>("");
    const [triggerAddColumn, setTriggerAddColumn] = useState(false);
    const [view, setView] = useState<'board' | 'list'>('board');
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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
            <div className="flex h-full flex-col p-6 space-y-4">
                {/* Header skeleton */}
                <div className="flex items-center justify-between animate-pulse">
                    <div className="h-7 w-48 bg-slate-200 rounded" />
                    <div className="flex gap-2">
                        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                        <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                    </div>
                </div>
                {/* Columns skeleton */}
                <div className="flex gap-4 flex-1 overflow-hidden">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-72 bg-slate-100 rounded-xl p-4 animate-pulse">
                            <div className="h-5 w-28 bg-slate-200 rounded mb-4" />
                            <div className="space-y-3">
                                {Array(3 - i % 2).fill(0).map((_, j) => (
                                    <div key={j} className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                                        <div className="h-4 w-full bg-slate-200 rounded mb-2" />
                                        <div className="h-3 w-2/3 bg-slate-200 rounded mb-3" />
                                        <div className="flex gap-2">
                                            <div className="h-5 w-14 bg-slate-200 rounded-full" />
                                            <div className="h-5 w-14 bg-slate-200 rounded-full" />
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
    const selectedColumn = selectedTask
        ? board.columns.find((c: BoardColumn) => c.id === selectedTask.column_id)
        : undefined;

    return (
        <div className="relative flex flex-col h-[calc(100vh-100px)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0">
                {/* Board tab */}
                <button
                    onClick={() => setView('board')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                        view === 'board'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    {projectName ? `${projectName} Board` : "Board"}
                </button>

                {/* List tab */}
                <button
                    onClick={() => setView('list')}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                        view === 'list'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                    {projectName ? `${projectName} List` : "List"}
                </button>

                <div className="flex-1" />

                {view === 'board' && (
                    <button
                        onClick={() => setTriggerAddColumn(true)}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all duration-200 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Column
                    </button>
                )}
            </div>

            {/* Board / List view */}
            <div className={`flex-1 bg-slate-100 h-full ${view === 'board' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {view === 'board' ? (
                    <KanbanBoard
                        projectId={projectId}
                        initialColumns={board.columns}
                        initialTasks={board.tasks}
                        onTaskClick={openTask}
                        openAddColumn={triggerAddColumn}
                        onAddColumnConsumed={() => setTriggerAddColumn(false)}
                    />
                ) : (
                    <KanbanList
                        columns={board.columns}
                        tasks={board.tasks}
                        onTaskClick={openTask}
                    />
                )}
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
