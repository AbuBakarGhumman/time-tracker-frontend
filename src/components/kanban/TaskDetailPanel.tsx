import React, { useState, useEffect, useRef } from 'react';
import type { Task, BoardColumn } from '../../api/boards';
import { updateTask, deleteTask } from '../../api/boards';

interface TaskDetailPanelProps {
    task: Task;
    column: BoardColumn | undefined;
    projectId: number;
    onClose: () => void;
    onUpdated: (task: Task) => void;
    onDeleted: (taskId: number) => void;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const priorityConfig: Record<string, { label: string; pill: string; dot: string }> = {
    low: { label: 'Low', pill: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
    medium: { label: 'Medium', pill: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500' },
    high: { label: 'High', pill: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500' },
    urgent: { label: 'Urgent', pill: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' },
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
    task,
    column,
    projectId,
    onClose,
    onUpdated,
    onDeleted,
}) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState(task.due_date ?? '');
    const [isCompleted, setIsCompleted] = useState(task.is_completed);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [visible, setVisible] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);

    // Animate in
    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 250);
    };

    const save = async (patch: Partial<{ title: string; description: string; priority: string; due_date: string | null; is_completed: boolean }>) => {
        setSaving(true);
        try {
            const updated = await updateTask(projectId, task.id, patch as any);
            onUpdated(updated);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleTitleBlur = () => {
        if (title.trim() && title !== task.title) save({ title: title.trim() });
    };

    const handleDescBlur = () => {
        if (description !== (task.description ?? '')) save({ description });
    };

    const handlePriority = (p: typeof PRIORITIES[number]) => {
        setPriority(p);
        save({ priority: p });
    };

    const handleDueDate = (v: string) => {
        setDueDate(v);
        save({ due_date: v || null });
    };

    const handleComplete = () => {
        const next = !isCompleted;
        setIsCompleted(next);
        save({ is_completed: next });
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete task "${task.title}"?`)) return;
        setDeleting(true);
        try {
            await deleteTask(projectId, task.id);
            onDeleted(task.id);
            handleClose();
        } catch (e) {
            console.error(e);
            setDeleting(false);
        }
    };

    const pc = priorityConfig[priority] ?? priorityConfig.medium;
    const created = new Date(task.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                className={`absolute inset-0 z-40 bg-black/20 transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Slide-in Panel */}
            <aside
                className={`absolute top-0 right-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* ── TOP BAR ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Completion toggle */}
                        <button
                            onClick={handleComplete}
                            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${isCompleted
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-slate-300 hover:border-green-400'
                                }`}
                        >
                            {isCompleted && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider shrink-0">
                            #{task.id}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${pc.pill} shrink-0`}>
                            {pc.label}
                        </span>
                        {column && (
                            <span className="text-xs font-medium text-slate-500 truncate">
                                {column.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {saving && <span className="text-xs text-slate-400 animate-pulse">Saving…</span>}
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                            title="Delete task"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── SCROLLABLE BODY ── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Title */}
                    <div>
                        <input
                            ref={titleRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            className="w-full text-xl font-bold text-slate-900 bg-transparent border-none outline-none focus:bg-slate-50 rounded-lg px-2 py-1 -ml-2 transition"
                            placeholder="Task title"
                        />
                    </div>

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</p>
                            <div className="flex flex-col gap-1.5">
                                {PRIORITIES.map((p) => {
                                    const cfg = priorityConfig[p];
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => handlePriority(p)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition text-left ${priority === p ? cfg.pill : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                            {p}
                                            {priority === p && <span className="ml-auto">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            {/* Due date */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</p>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => handleDueDate(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                />
                                {dueDate && (
                                    <button
                                        onClick={() => handleDueDate('')}
                                        className="mt-1 text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</p>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${isCompleted ? 'bg-green-50 text-green-700 border-green-300' : 'bg-blue-50 text-blue-700 border-blue-300'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} />
                                    {isCompleted ? 'Completed' : 'In progress'}
                                </span>
                            </div>

                            {/* Created */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Created</p>
                                <p className="text-sm text-slate-600">{created}</p>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-slate-200" />

                    {/* Description */}
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescBlur}
                            placeholder="Add a description…"
                            rows={6}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition bg-slate-50 focus:bg-white"
                        />
                    </div>
                </div>
            </aside>
        </>
    );
};
