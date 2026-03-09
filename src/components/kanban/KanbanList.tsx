import React, { useState } from 'react';
import type { BoardColumn, Task } from '../../api/boards';

interface KanbanListProps {
    columns: BoardColumn[];
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const KanbanList: React.FC<KanbanListProps> = ({ columns, tasks, onTaskClick }) => {
    const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

    const toggleCollapse = (colId: number) =>
        setCollapsed((prev) => ({ ...prev, [colId]: !prev[colId] }));

    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

    return (
        <div className="flex flex-col gap-4 p-4 min-h-full">
            {sortedColumns.map((col) => {
                const colTasks = tasks
                    .filter((t) => t.column_id === col.id)
                    .sort((a, b) => a.order - b.order);
                const isCollapsed = collapsed[col.id];

                return (
                    <div key={col.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Group header */}
                        <button
                            onClick={() => toggleCollapse(col.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
                        >
                            <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{
                                    backgroundColor: col.color || '#94a3b8',
                                    boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${col.color || '#94a3b8'}`,
                                }}
                            />
                            <span className="font-bold text-slate-800 text-sm">{col.name}</span>
                            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {colTasks.length}
                            </span>
                            <span className="ml-auto text-slate-400">
                                <svg
                                    className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </button>

                        {/* Task rows */}
                        {!isCollapsed && (
                            <div className="border-t border-slate-100">
                                {/* Column headings */}
                                <div className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-4 py-2 bg-slate-50 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                                </div>

                                {colTasks.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                                        No tasks in this column
                                    </div>
                                ) : (
                                    colTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => onTaskClick?.(task)}
                                            className="grid grid-cols-[1fr_120px_120px_100px] gap-4 px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors group"
                                        >
                                            {/* Title + description */}
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="text-xs text-slate-400 truncate mt-0.5">{task.description}</p>
                                                )}
                                            </div>

                                            {/* Priority badge */}
                                            <div className="flex items-center">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${priorityColors[task.priority] || priorityColors.medium}`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            {/* Due date */}
                                            <div className="flex items-center">
                                                {task.due_date ? (
                                                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-300">—</span>
                                                )}
                                            </div>

                                            {/* Completion status */}
                                            <div className="flex items-center">
                                                {task.is_completed ? (
                                                    <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded">
                                                        Done
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                                        Open
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {sortedColumns.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <p className="text-sm">No columns yet. Add a column to get started.</p>
                </div>
            )}
        </div>
    );
};
