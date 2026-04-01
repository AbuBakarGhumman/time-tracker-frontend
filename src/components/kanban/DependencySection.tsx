import React, { useState, useEffect } from 'react';
import { fetchDependencies, createDependency, deleteDependency } from '../../api/boards';
import type { TaskDependency, Task } from '../../api/boards';

interface Props {
    projectId: number;
    taskId: number;
    allTasks: Task[];
}

export const DependencySection: React.FC<Props> = ({ projectId, taskId, allTasks }) => {
    const [deps, setDeps] = useState<TaskDependency[]>([]);
    const [showPicker, setShowPicker] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { load(); }, [taskId]);

    const load = async () => {
        try { setDeps(await fetchDependencies(projectId, taskId)); } catch {}
    };

    const handleAdd = async (dependsOnId: number) => {
        try {
            const dep = await createDependency(projectId, taskId, { depends_on_id: dependsOnId });
            setDeps(prev => [...prev, dep]);
            setShowPicker(false);
            setSearch('');
        } catch (err) { console.error(err); }
    };

    const handleRemove = async (depId: number) => {
        try {
            await deleteDependency(projectId, taskId, depId);
            setDeps(prev => prev.filter(d => d.id !== depId));
        } catch {}
    };

    const availableTasks = allTasks.filter(t =>
        t.id !== taskId &&
        !deps.some(d => d.depends_on_id === t.id) &&
        (!search || t.title.toLowerCase().includes(search.toLowerCase()) || `#${t.task_number}`.includes(search))
    );

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dependencies</h4>
                <button onClick={() => setShowPicker(!showPicker)} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                    + Add
                </button>
            </div>

            {/* Picker */}
            {showPicker && (
                <div className="mb-2 bg-white border border-slate-200 rounded-lg shadow-sm p-2">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 mb-2" />
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {availableTasks.slice(0, 10).map(t => (
                            <button key={t.id} onClick={() => handleAdd(t.id)}
                                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 transition text-xs">
                                <span className="text-slate-400 font-mono">#{t.task_number}</span>
                                <span className="text-slate-700 truncate">{t.title}</span>
                            </button>
                        ))}
                        {availableTasks.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No tasks available</p>}
                    </div>
                </div>
            )}

            {/* Dependency list */}
            {deps.length === 0 ? (
                <p className="text-xs text-slate-400">No dependencies</p>
            ) : (
                <div className="space-y-1">
                    {deps.map(d => (
                        <div key={d.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1.5 group">
                            <svg className={`w-3.5 h-3.5 shrink-0 ${d.depends_on_is_completed ? 'text-green-500' : 'text-amber-500'}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {d.depends_on_is_completed ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                )}
                            </svg>
                            <span className="text-[10px] text-slate-400 font-mono">#{d.depends_on_task_number}</span>
                            <span className={`text-xs flex-1 truncate ${d.depends_on_is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {d.depends_on_title}
                            </span>
                            <button onClick={() => handleRemove(d.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
