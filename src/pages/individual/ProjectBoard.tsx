import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchBoard, fetchArchivedTasks, unarchiveTask, deleteTask, invalidateBoardCache, fetchProjectAssignees } from "../../api/boards";
import type { BoardView, Task, BoardColumn, Label, Assignee } from "../../api/boards";
import { KanbanBoard } from "../../components/kanban/KanbanBoard";
import { KanbanList } from "../../components/kanban/KanbanList";
import { KanbanSwimlanes } from "../../components/kanban/KanbanSwimlanes";
import { TaskDetailPanel } from "../../components/kanban/TaskDetailPanel";
import { LabelManager } from "../../components/kanban/LabelManager";
import { TemplateManager } from "../../components/kanban/TemplateManager";
import { SavedFilterBar } from "../../components/kanban/SavedFilterBar";
import { BulkActionBar } from "../../components/kanban/BulkActionBar";
import { BoardActivityFeed } from "../../components/kanban/BoardActivityFeed";
import { ExportMenu } from "../../components/kanban/ExportMenu";
import { SelectionOverlay } from "../../components/kanban/SelectionOverlay";
import { useKanbanKeyboard } from "../../hooks/useKanbanKeyboard";
import axios from "../../api/interceptor";
import { API_BASE_URL } from "../../api/config";
import { useAIAssistant } from "../../context/AIAssistantContext";
import { getStoredUser } from "../../api/auth";

type ViewMode = 'board' | 'list';
type GroupBy = 'none' | 'assignee' | 'priority' | 'label';

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
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [groupBy, setGroupBy] = useState<GroupBy>('none');
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [showActivityFeed, setShowActivityFeed] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const currentUser = useMemo(() => getStoredUser(), []);
    const selectionMode = selectedTaskIds.size > 0;

    useEffect(() => { loadBoard(); }, [id]);

    useEffect(() => {
        if (id && projectName) setProjectContext({ id: parseInt(id, 10), name: projectName });
        return () => setProjectContext(null);
    }, [id, projectName, setProjectContext]);

    const loadBoard = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const pid = parseInt(id, 10);
            const [data, projRes, assigneeData] = await Promise.all([
                fetchBoard(pid),
                axios.get(`${API_BASE_URL}/projects/${id}`).catch(() => null),
                fetchProjectAssignees(pid),
            ]);
            setBoard(data);
            setAssignees(assigneeData);
            if (projRes?.data?.name) setProjectName(projRes.data.name);
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

    const handleSelectTask = useCallback((taskId: number, selected: boolean) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            if (selected) next.add(taskId); else next.delete(taskId);
            return next;
        });
    }, []);

    const handleLassoSelect = useCallback((ids: number[]) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => next.add(id));
            return next;
        });
    }, []);

    const handleBulkDone = () => {
        setSelectedTaskIds(new Set());
        invalidateBoardCache(parseInt(id!, 10));
        loadBoard();
    };

    const handleLabelsChanged = (labels: Label[]) => {
        setBoard(prev => prev ? { ...prev, labels } : prev);
    };

    const loadArchive = async () => {
        if (!id) return;
        try { setArchivedTasks(await fetchArchivedTasks(parseInt(id, 10))); } catch {}
    };

    const handleUnarchive = async (taskId: number) => {
        if (!id) return;
        try {
            await unarchiveTask(parseInt(id, 10), taskId);
            setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
            invalidateBoardCache(parseInt(id, 10));
            loadBoard();
        } catch {}
    };

    const handleApplySavedFilter = (config: string) => {
        try {
            const parsed = JSON.parse(config);
            if (parsed.search !== undefined) setTaskSearch(parsed.search);
            if (parsed.filter !== undefined) setActiveFilter(parsed.filter);
        } catch {}
    };

    const projectId = id ? parseInt(id, 10) : 0;

    // Keyboard navigation
    useKanbanKeyboard({
        columns: board?.columns || [],
        tasks: board?.tasks || [],
        onOpenTask: openTask,
        onDeleteTask: async (taskId) => {
            try { await deleteTask(projectId, taskId); handleTaskDeleted(taskId); } catch {}
        },
        enabled: viewMode === 'board' && !selectedTask,
    });

    if (!loading && !board) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
                <h2 className="text-xl font-bold text-slate-700">Board not found</h2>
                <button onClick={() => navigate("/projects")}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                    Back to Projects
                </button>
            </div>
        );
    }

    const today = new Date().toISOString().split("T")[0];
    const filteredTasks = (board?.tasks || []).filter((t) => {
        if (taskSearch.trim()) {
            const q = taskSearch.toLowerCase();
            if (!t.title.toLowerCase().includes(q) && !(t.description && t.description.toLowerCase().includes(q))) return false;
        }
        if (activeFilter === "assigned_to_me") return t.assigned_to_id === currentUser?.id;
        if (activeFilter === "due_today") return t.due_date?.split("T")[0] === today;
        if (activeFilter === "overdue") return t.due_date ? t.due_date.split("T")[0] < today && !t.is_completed : false;
        if (activeFilter === "high_priority") return t.priority === "high" || t.priority === "urgent";
        if (activeFilter === "unassigned") return t.assigned_to_id === null;
        return true;
    });
    const selectedColumn = selectedTask ? (board?.columns || []).find((c: BoardColumn) => c.id === selectedTask.column_id) : undefined;

    const currentFilterConfig = JSON.stringify({ search: taskSearch, filter: activeFilter });

    return (
        <div className="relative flex flex-col h-[calc(100vh-100px)] overflow-hidden p-1">
            {/* Tabs */}
            <div className="flex gap-2 mb-3 flex-wrap items-center shrink-0">
                <button className="px-6 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                    {projectName ? `${projectName} Board` : "Board"}
                </button>

                {/* View toggle */}
                <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                    <button onClick={() => { setViewMode('board'); setGroupBy('none'); }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${viewMode === 'board' && groupBy === 'none' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                        Board
                    </button>
                    <button onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                        List
                    </button>
                </div>

                {/* Group by */}
                {viewMode === 'board' && (
                    <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupBy)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 cursor-pointer outline-none focus:ring-1 focus:ring-blue-400">
                        <option value="none">No Grouping</option>
                        <option value="assignee">Group by Assignee</option>
                        <option value="priority">Group by Priority</option>
                        <option value="label">Group by Label</option>
                    </select>
                )}

                <div className="flex-1" />

                {/* Action buttons */}
                <SavedFilterBar projectId={projectId} currentFilter={currentFilterConfig} onApply={handleApplySavedFilter} />
                <ExportMenu tasks={filteredTasks} columns={board?.columns || []} projectName={projectName} />

                <button onClick={() => setShowLabelManager(true)}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    Labels
                </button>
                <button onClick={() => setShowTemplateManager(true)}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Templates
                </button>
                <button onClick={() => { setShowActivityFeed(true); }}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Activity
                </button>
                <button onClick={() => { setShowArchive(true); loadArchive(); }}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    Archive
                </button>
                <button onClick={() => setTriggerAddColumn(true)}
                    className="px-4 py-1.5 rounded-lg font-semibold text-sm bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition">
                    + Add Column
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-3 mb-3 shrink-0 flex items-center gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Search by task name or description..."
                        value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                </div>
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1 flex-wrap">
                    {[
                        { key: "all", label: "All Tasks" },
                        { key: "assigned_to_me", label: "Assigned to Me" },
                        { key: "due_today", label: "Due Today" },
                        { key: "overdue", label: "Overdue" },
                        { key: "high_priority", label: "High Priority" },
                        { key: "unassigned", label: "Unassigned" },
                    ].map((f) => (
                        <button key={f.key} onClick={() => setActiveFilter(f.key)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                                activeFilter === f.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main content */}
            <div className={`flex-1 min-h-0 ${viewMode === 'board' && groupBy === 'none' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {loading || !board ? (
                    <div className="flex gap-4 h-full overflow-hidden animate-pulse">
                        {Array(4).fill(0).map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[300px] bg-slate-50 border border-slate-300 rounded-xl flex flex-col">
                                <div className="px-4 py-3 border-b border-slate-200 bg-white rounded-t-xl flex items-center gap-2">
                                    <div className="h-4 w-24 bg-slate-200 rounded" />
                                    <div className="h-5 w-6 bg-slate-100 rounded-full" />
                                </div>
                                <div className="p-3 space-y-3">
                                    {Array(3 - i % 2).fill(0).map((_, j) => (
                                        <div key={j} className="bg-white rounded-lg shadow border border-slate-200 p-4">
                                            <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                                            <div className="h-3 w-full bg-slate-100 rounded mb-3" />
                                            <div className="flex items-center justify-between">
                                                <div className="h-5 w-14 bg-slate-200 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : viewMode === 'list' ? (
                    <KanbanList columns={board.columns} tasks={filteredTasks} onTaskClick={openTask} />
                ) : groupBy !== 'none' ? (
                    <KanbanSwimlanes columns={board.columns} tasks={filteredTasks} groupBy={groupBy} onTaskClick={openTask} assignees={assignees} />
                ) : (
                    <SelectionOverlay onSelect={handleLassoSelect} enabled={!selectedTask}>
                        <KanbanBoard
                            projectId={projectId}
                            initialColumns={board.columns}
                            initialTasks={filteredTasks}
                            onTaskClick={openTask}
                            openAddColumn={triggerAddColumn}
                            onAddColumnConsumed={() => setTriggerAddColumn(false)}
                            selectedTaskIds={selectedTaskIds}
                            onSelectTask={handleSelectTask}
                            selectionMode={selectionMode}
                        />
                    </SelectionOverlay>
                )}
            </div>

            {/* Task Detail Panel */}
            {selectedTask && (
                <TaskDetailPanel
                    task={selectedTask}
                    column={selectedColumn}
                    projectId={projectId}
                    onClose={closeTask}
                    onUpdated={handleTaskUpdated}
                    onDeleted={handleTaskDeleted}
                    allTasks={board?.tasks || []}
                    allLabels={board?.labels || []}
                    onLabelsChanged={handleLabelsChanged}
                />
            )}

            {/* Bulk Action Bar */}
            <BulkActionBar
                projectId={projectId}
                selectedIds={selectedTaskIds}
                columns={board?.columns || []}
                onClear={() => setSelectedTaskIds(new Set())}
                onDone={handleBulkDone}
            />

            {/* Label Manager Modal */}
            {showLabelManager && (
                <LabelManager
                    projectId={projectId}
                    labels={board?.labels || []}
                    onLabelsChanged={handleLabelsChanged}
                    onClose={() => setShowLabelManager(false)}
                />
            )}

            {/* Template Manager Modal */}
            {showTemplateManager && (
                <TemplateManager projectId={projectId} onClose={() => setShowTemplateManager(false)} />
            )}

            {/* Board Activity Feed */}
            {showActivityFeed && (
                <BoardActivityFeed projectId={projectId} onClose={() => setShowActivityFeed(false)} />
            )}

            {/* Archive Panel */}
            {showArchive && (
                <>
                    <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowArchive(false)} />
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold">Archived Tasks ({archivedTasks.length})</h3>
                            <button onClick={() => setShowArchive(false)} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {archivedTasks.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">No archived tasks</p>
                            ) : archivedTasks.map(t => (
                                <div key={t.id} className="bg-slate-50 rounded-lg p-3 flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">{t.title}</p>
                                        <p className="text-[10px] text-slate-400">#{t.task_number} - {t.priority}</p>
                                    </div>
                                    <button onClick={() => handleUnarchive(t.id)}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold shrink-0 px-2 py-1 bg-blue-50 rounded">
                                        Unarchive
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProjectBoard;
