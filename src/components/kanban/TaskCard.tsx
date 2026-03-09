import React, { useRef, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../api/boards';
import { deleteTask } from '../../api/boards';

interface TaskCardProps {
    task: Task;
    onClick?: (task: Task) => void;
    onDeleted?: (taskId: number) => void;
    /** When true the card is rendered inside DragOverlay — no sortable hooks needed */
    isOverlay?: boolean;
}

const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-slate-100 text-slate-800 border-slate-200',
};

interface TaskCardContentProps {
    task: Task;
    onClick?: (task: Task) => void;
    onDeleted?: (taskId: number) => void;
}

const TaskCardContent: React.FC<TaskCardContentProps> = ({ task, onClick, onDeleted }) => {
    const badgeClass = priorityColors[task.priority] || priorityColors.medium;
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        if (menuOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const handleCopyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/projects/${task.project_id}/board?task=${task.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => { setCopied(false); setMenuOpen(false); }, 1500);
        });
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Delete task "${task.title}"?`)) return;
        setDeleting(true);
        try {
            await deleteTask(task.project_id, task.id);
            onDeleted?.(task.id);
        } catch (err) {
            console.error(err);
            setDeleting(false);
        }
    };

    return (
        <div
            onClick={() => onClick?.(task)}
            className="bg-white rounded-lg shadow border border-slate-200 p-4 cursor-grab hover:shadow-md hover:border-blue-300 transition-all active:cursor-grabbing group relative"
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-semibold text-slate-800 text-sm flex-1 leading-snug">{task.title}</h4>

                {/* ── 3-DOT MENU ── */}
                <div
                    className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    ref={menuRef}
                >
                        <button
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-6 z-50 w-44 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                                {/* Copy link */}
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={handleCopyLink}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                                >
                                    {copied ? (
                                        <>
                                            <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-green-600">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Copy link
                                        </>
                                    )}
                                </button>

                                {/* Delete */}
                                <button
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-slate-100 disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {deleting ? 'Deleting…' : 'Delete task'}
                                </button>
                            </div>
                        )}
                    </div>
            </div>

            {task.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between mt-auto pt-1">
                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${badgeClass}`}>
                    {task.priority}
                </span>

                {task.due_date && (
                    <div className="flex items-center text-xs text-slate-500 font-medium">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>
        </div>
    );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDeleted, isOverlay = false }) => {
    const {
        setNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `task-${task.id}`,
        data: { type: 'Task', task },
        disabled: isOverlay,
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    // Overlay version — rendered floating under the cursor, no ref
    if (isOverlay) {
        return (
            <div className="rotate-1 scale-105 shadow-2xl opacity-95 rounded-lg ring-2 ring-blue-400">
                <TaskCardContent task={task} />
            </div>
        );
    }

    // Placeholder shown at the original position while the card floats in DragOverlay
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={{ ...style, minHeight: '72px' }}
                className="border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/60 flex items-center justify-center"
            >
                <span className="text-xs text-blue-400 font-medium select-none">Drop here</span>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <TaskCardContent task={task} onClick={onClick} onDeleted={onDeleted} />
        </div>
    );
};
