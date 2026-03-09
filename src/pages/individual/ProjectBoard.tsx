import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { fetchBoard } from "../../api/boards";
import type { BoardView, Task, BoardColumn } from "../../api/boards";
import { KanbanBoard } from "../../components/kanban/KanbanBoard";
import { TaskDetailPanel } from "../../components/kanban/TaskDetailPanel";

const ProjectBoard: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [board, setBoard] = useState<BoardView | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    useEffect(() => { loadBoard(); }, [id]);

    const loadBoard = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await fetchBoard(parseInt(id, 10));
            setBoard(data);
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
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
            <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                <button
                    onClick={() => navigate("/projects")}
                    className="text-slate-500 hover:text-slate-700 transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Project Board
                </h1>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-hidden bg-slate-100 h-full">
                <KanbanBoard
                    projectId={projectId}
                    initialColumns={board.columns}
                    initialTasks={board.tasks}
                    onTaskClick={openTask}
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
