import React, { useState, useMemo } from 'react';
import type { Task, BoardColumn, Label, Assignee } from '../../api/boards';
import { TaskCard } from './TaskCard';

interface Props {
    columns: BoardColumn[];
    tasks: Task[];
    groupBy: 'assignee' | 'priority' | 'label';
    onTaskClick?: (task: Task) => void;
    assignees?: Assignee[];
}

interface SwimlaneGroup {
    key: string;
    label: string;
    color?: string;
    tasks: Task[];
}

export const KanbanSwimlanes: React.FC<Props> = ({ columns, tasks, groupBy, onTaskClick, assignees = [] }) => {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const groups: SwimlaneGroup[] = useMemo(() => {
        if (groupBy === 'assignee') {
            const byAssignee = new Map<string, Task[]>();
            tasks.forEach(t => {
                const key = t.assigned_to_id ? String(t.assigned_to_id) : 'unassigned';
                if (!byAssignee.has(key)) byAssignee.set(key, []);
                byAssignee.get(key)!.push(t);
            });
            return Array.from(byAssignee.entries()).map(([key, tasks]) => ({
                key,
                label: key === 'unassigned' ? 'Unassigned' : (tasks[0]?.assigned_to_name || 'Unknown'),
                tasks,
            }));
        }
        if (groupBy === 'priority') {
            const order = ['urgent', 'high', 'medium', 'low'];
            return order.map(p => ({
                key: p,
                label: p.charAt(0).toUpperCase() + p.slice(1),
                color: { urgent: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#94a3b8' }[p],
                tasks: tasks.filter(t => t.priority === p),
            })).filter(g => g.tasks.length > 0);
        }
        if (groupBy === 'label') {
            const byLabel = new Map<string, { label: string; color: string; tasks: Task[] }>();
            byLabel.set('none', { label: 'No Label', color: '#94a3b8', tasks: [] });
            tasks.forEach(t => {
                if (!t.labels || t.labels.length === 0) {
                    byLabel.get('none')!.tasks.push(t);
                } else {
                    t.labels.forEach(l => {
                        const key = String(l.id);
                        if (!byLabel.has(key)) byLabel.set(key, { label: l.name, color: l.color, tasks: [] });
                        byLabel.get(key)!.tasks.push(t);
                    });
                }
            });
            return Array.from(byLabel.entries()).map(([key, val]) => ({
                key, label: val.label, color: val.color, tasks: val.tasks,
            })).filter(g => g.tasks.length > 0);
        }
        return [];
    }, [tasks, groupBy, assignees]);

    const toggleCollapse = (key: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
            {groups.map(group => (
                <div key={group.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {/* Swimlane header */}
                    <button onClick={() => toggleCollapse(group.key)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition">
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${collapsed.has(group.key) ? '' : 'rotate-90'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        {group.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: group.color }} />}
                        <span className="font-semibold text-sm text-slate-700">{group.label}</span>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{group.tasks.length}</span>
                    </button>

                    {/* Swimlane content - horizontal columns */}
                    {!collapsed.has(group.key) && (
                        <div className="flex overflow-x-auto gap-3 p-3">
                            {columns.map(col => {
                                const colTasks = group.tasks.filter(t => t.column_id === col.id);
                                return (
                                    <div key={col.id} className="min-w-[250px] w-[250px] shrink-0">
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color || '#94a3b8' }} />
                                            <span className="text-xs font-semibold text-slate-500">{col.name}</span>
                                            <span className="text-[10px] text-slate-400">{colTasks.length}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {colTasks.map(t => (
                                                <div key={t.id} onClick={() => onTaskClick?.(t)} className="cursor-pointer">
                                                    <TaskCard task={t} onClick={onTaskClick} />
                                                </div>
                                            ))}
                                            {colTasks.length === 0 && (
                                                <div className="text-[10px] text-slate-300 text-center py-4 border border-dashed border-slate-200 rounded-lg">Empty</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
