import React, { useMemo, useRef, useState, useEffect } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import type { BoardColumn, Task } from '../../api/boards';
import { deleteColumn, updateColumn, createTask } from '../../api/boards';

interface KanbanColumnProps {
    column: BoardColumn;
    tasks: Task[];
    isDraggingTask?: boolean;
    onTaskClick?: (task: Task) => void;
    onColumnDeleted?: (columnId: number) => void;
    onColumnUpdated?: (columnId: number, updates: { name: string; column_type: string; color: string }) => void;
    onTaskCreated?: (task: Task) => void;
    onTaskDeleted?: (taskId: number) => void;
}

const COLUMN_TYPES = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'bug', label: 'Bug' },
    { value: 'done', label: 'Done' },
];

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    column,
    tasks,
    isDraggingTask = false,
    onTaskClick,
    onColumnDeleted,
    onColumnUpdated,
    onTaskCreated,
    onTaskDeleted,
}) => {
    const taskIds = useMemo(() => tasks.map((t) => `task-${t.id}`), [tasks]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(column.name);
    const [editType, setEditType] = useState(column.column_type);
    const [editColor, setEditColor] = useState(column.color || '#3b82f6');
    const [saving, setSaving] = useState(false);
    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const addRef = useRef<HTMLInputElement>(null);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: `col-${column.id}`,
        data: { type: 'Column', column },
        disabled: isDraggingTask,
    });

    const style = { transition, transform: CSS.Transform.toString(transform) };

    useEffect(() => { if (adding) addRef.current?.focus(); }, [adding]);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    // Sync edit state when column prop changes
    useEffect(() => {
        setEditName(column.name);
        setEditType(column.column_type);
        setEditColor(column.color || '#3b82f6');
    }, [column.name, column.column_type, column.color]);

    const openEditModal = () => {
        setEditName(column.name);
        setEditType(column.column_type);
        setEditColor(column.color || '#3b82f6');
        setMenuOpen(false);
        setShowEditModal(true);
    };

    const handleEditSave = async () => {
        const name = editName.trim();
        if (!name) return;
        setSaving(true);
        try {
            await updateColumn(column.project_id, column.id, {
                name,
                column_type: editType,
                color: editColor,
            });
            onColumnUpdated?.(column.id, { name, column_type: editType, color: editColor });
            setShowEditModal(false);
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleDelete = async () => {
        setMenuOpen(false);
        if (!window.confirm(`Delete column "${column.name}"? All tasks inside will be deleted.`)) return;
        try {
            await deleteColumn(column.project_id, column.id);
            onColumnDeleted?.(column.id);
        } catch (e) { console.error(e); }
    };

    const handleAddTask = async () => {
        const t = newTitle.trim();
        if (!t) { setAdding(false); return; }
        setCreating(true);
        try {
            const task = await createTask(column.project_id, {
                column_id: column.id,
                title: t,
                priority: 'medium',
                order: tasks.length,
            });
            onTaskCreated?.(task);
        } catch (e) { console.error(e); }
        setNewTitle('');
        setAdding(false);
        setCreating(false);
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-slate-200 border-2 border-dashed border-slate-400 rounded-xl w-[300px] min-w-[300px] opacity-40 h-64"
            />
        );
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={{ ...style, minHeight: '100%' }}
                className="bg-slate-50 border border-slate-300 rounded-xl w-[300px] min-w-[300px] flex flex-col"
            >
                {/* ── HEADER ── */}
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-xl shrink-0">
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex items-center gap-2 flex-1 cursor-grab active:cursor-grabbing min-w-0"
                    >
                        {/* Color ring indicator */}
                        <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{
                                backgroundColor: column.color || '#94a3b8',
                                boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${column.color || '#94a3b8'}`,
                            }}
                        />
                        <h3 className="font-bold text-slate-800 text-sm truncate">{column.name}</h3>
                        <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                            {tasks.length}
                        </span>
                    </div>

                    {/* ── 3-DOT MENU ── */}
                    <div className="relative ml-2 shrink-0" ref={menuRef}>
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-8 z-50 w-40 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                                <button
                                    onClick={openEditModal}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                >
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-slate-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Column
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TASKS AREA ── */}
                <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} onClick={onTaskClick} onDeleted={onTaskDeleted} />
                        ))}
                    </SortableContext>
                </div>

                {/* ── INLINE ADD TASK ── */}
                <div className="px-3 pb-3 shrink-0">
                    {adding ? (
                        <div className="bg-white border border-blue-400 rounded-lg px-3 py-2 shadow-sm">
                            <input
                                ref={addRef}
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddTask();
                                    if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
                                }}
                                placeholder="Task title…"
                                className="w-full text-sm outline-none text-slate-800 placeholder-slate-400 bg-transparent"
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleAddTask}
                                    disabled={creating}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {creating ? '…' : 'Add'}
                                </button>
                                <button
                                    onClick={() => { setAdding(false); setNewTitle(''); }}
                                    className="px-3 py-1 text-slate-500 text-xs hover:text-slate-700 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setAdding(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 font-medium hover:text-blue-600 hover:bg-blue-50 rounded-lg transition border border-dashed border-slate-300 hover:border-blue-400"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add task
                        </button>
                    )}
                </div>
            </div>

            {/* ── EDIT COLUMN MODAL ── */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                            <h3 className="text-lg font-bold">Edit Column</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Column Name <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setShowEditModal(false); }}
                                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Column Type</label>
                                <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value as BoardColumn['column_type'])}
                                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                                >
                                    {COLUMN_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Identification Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                    />
                                    <span className="text-xs text-slate-500">Appears as a ring on the column header</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={handleEditSave}
                                disabled={saving || !editName.trim()}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
