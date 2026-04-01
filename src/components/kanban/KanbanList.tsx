import React, { useState } from 'react';
import type { BoardColumn, Task } from '../../api/boards';
import { API_BASE_URL } from '../../api/config';

const stripMarkdown = (md: string): string =>
    md
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/^[>\-*+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .replace(/\n{2,}/g, ' ')
        .trim();

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
        <div className="flex flex-col gap-4 p-4 min-h-full overflow-y-auto">
            {sortedColumns.map((col) => {
                const colTasks = tasks
                    .filter((t) => t.column_id === col.id)
                    .sort((a, b) => a.order - b.order);
                const isCollapsed = collapsed[col.id];
                const storyPointsSum = colTasks.reduce((s, t) => s + (t.story_points || 0), 0);

                return (
                    <div key={col.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => toggleCollapse(col.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
                        >
                            <span className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: col.color || '#94a3b8', boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${col.color || '#94a3b8'}` }} />
                            <span className="font-bold text-slate-800 text-sm">{col.name}</span>
                            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{colTasks.length}</span>
                            {storyPointsSum > 0 && (
                                <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{storyPointsSum} SP</span>
                            )}
                            <span className="ml-auto text-slate-400">
                                <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </button>

                        {!isCollapsed && (
                            <div className="border-t border-slate-100">
                                <div className="grid grid-cols-[1fr_100px_100px_100px_80px_80px_80px] gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Labels</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Points</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</span>
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                                </div>

                                {colTasks.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-slate-400">No tasks</div>
                                ) : (
                                    colTasks.map((task) => (
                                        <div key={task.id} onClick={() => onTaskClick?.(task)}
                                            className="grid grid-cols-[1fr_100px_100px_100px_80px_80px_80px] gap-2 px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors group">
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                    <span className="text-slate-500 font-mono text-sm font-semibold mr-1.5">#{task.task_number}</span>
                                                    {task.title}
                                                </p>
                                                {task.description && <p className="text-xs text-slate-400 truncate mt-0.5">{stripMarkdown(task.description)}</p>}
                                            </div>
                                            <div className="flex items-center flex-wrap gap-0.5">
                                                {task.labels?.slice(0, 2).map(l => (
                                                    <span key={l.id} className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider" style={{ backgroundColor: l.color + '20', color: l.color, borderColor: l.color + '40' }}>{l.name}</span>
                                                ))}
                                                {(task.labels?.length || 0) > 2 && <span className="text-[10px] text-slate-400">+{task.labels!.length - 2}</span>}
                                            </div>
                                            <div className="flex items-center">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${priorityColors[task.priority] || priorityColors.medium}`}>{task.priority}</span>
                                            </div>
                                            <div className="flex items-center">
                                                {task.due_date ? (
                                                    <span className="text-xs text-slate-500 font-medium">{new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                ) : <span className="text-xs text-slate-300">-</span>}
                                            </div>
                                            <div className="flex items-center">
                                                {task.story_points != null && task.story_points > 0 ? (
                                                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full">{task.story_points}</span>
                                                ) : <span className="text-xs text-slate-300">-</span>}
                                            </div>
                                            <div className="flex items-center">
                                                {task.assigned_to_id ? (
                                                    <div title={task.assigned_to_name || 'Assigned'}>
                                                        {task.assigned_to_avatar ? (
                                                            <img
                                                                src={`${API_BASE_URL.replace('/v1', '')}${task.assigned_to_avatar}`}
                                                                alt={task.assigned_to_name || ''}
                                                                className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-white">
                                                                <span className="text-[10px] font-bold text-white">
                                                                    {(task.assigned_to_name || '?').charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : <span className="text-xs text-slate-300">-</span>}
                                            </div>
                                            <div className="flex items-center">
                                                {task.is_completed ? (
                                                    <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded">Done</span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Open</span>
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
        </div>
    );
};
