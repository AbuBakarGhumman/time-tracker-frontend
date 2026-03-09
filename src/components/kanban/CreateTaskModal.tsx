import React, { useState } from 'react';
import { createTask } from '../../api/boards';
import type { CreateTaskPayload } from '../../api/boards';
import type { Task } from '../../api/boards';

interface CreateTaskModalProps {
    projectId: number;
    columnId: number;
    columnName: string;
    defaultOrder: number;
    onCreated: (task: Task) => void;
    onClose: () => void;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    projectId,
    columnId,
    columnName,
    defaultOrder,
    onCreated,
    onClose,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required.'); return; }
        setLoading(true);
        try {
            const payload: CreateTaskPayload = {
                column_id: columnId,
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                due_date: dueDate || null,
                order: defaultOrder,
            };
            const task = await createTask(projectId, payload);
            onCreated(task);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create task.');
        } finally {
            setLoading(false);
        }
    };

    const priorityColors: Record<string, string> = {
        low: 'border-slate-400 text-slate-600',
        medium: 'border-blue-400 text-blue-600',
        high: 'border-orange-400 text-orange-600',
        urgent: 'border-red-500 text-red-600',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">New Task</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Adding to <span className="font-semibold text-slate-700">{columnName}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            autoFocus
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); setError(''); }}
                            placeholder="What needs to be done?"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional: add more details..."
                            rows={3}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                                Priority
                            </label>
                            <div className="flex flex-col gap-1.5">
                                {PRIORITIES.map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`text-left px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition ${priority === p
                                                ? `${priorityColors[p]} bg-opacity-10 ${p === 'urgent' ? 'bg-red-50' : p === 'high' ? 'bg-orange-50' : p === 'medium' ? 'bg-blue-50' : 'bg-slate-50'}`
                                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                    >
                                        {priority === p && <span className="mr-1">✓</span>}{p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                            />
                            {dueDate && (
                                <button
                                    type="button"
                                    onClick={() => setDueDate('')}
                                    className="mt-1 text-xs text-slate-400 hover:text-slate-600 transition"
                                >
                                    Clear date
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
