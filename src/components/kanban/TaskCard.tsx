import React, { useRef, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../api/boards';
import { deleteTask, archiveTask } from '../../api/boards';
import { API_BASE_URL } from '../../api/config';
import { formatHoursAsHoursMinutes } from '../../utils/dateUtils';

/** Strip markdown syntax for clean plaintext previews */
const stripMarkdown = (md: string): string =>
    md
        .replace(/^#{1,6}\s+/gm, '')          // headings
        .replace(/\*\*(.+?)\*\*/g, '$1')      // bold
        .replace(/__(.+?)__/g, '$1')           // bold alt
        .replace(/\*(.+?)\*/g, '$1')           // italic
        .replace(/_(.+?)_/g, '$1')             // italic alt
        .replace(/~~(.+?)~~/g, '$1')           // strikethrough
        .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))  // inline/block code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // images
        .replace(/^[>\-*+]\s+/gm, '')         // blockquotes, list markers
        .replace(/^\d+\.\s+/gm, '')           // ordered lists
        .replace(/\n{2,}/g, ' ')              // collapse newlines
        .trim();

interface TaskCardProps {
    task: Task;
    onClick?: (task: Task) => void;
    onDeleted?: (taskId: number) => void;
    isOverlay?: boolean;
    isSelected?: boolean;
    onSelect?: (taskId: number, selected: boolean) => void;
    selectionMode?: boolean;
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
    isSelected?: boolean;
    onSelect?: (taskId: number, selected: boolean) => void;
    selectionMode?: boolean;
}

const getDueDateStatus = (dueDateStr: string | null, isCompleted: boolean): 'overdue' | 'today' | 'soon' | 'normal' => {
    if (!dueDateStr || isCompleted) return 'normal';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    const dayMs = 86400000;
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    if (diff <= dayMs) return 'soon';
    return 'normal';
};

const dueDateStyles: Record<string, string> = {
    overdue: 'text-red-600 bg-red-50',
    today: 'text-amber-600 bg-amber-50',
    soon: 'text-amber-500',
    normal: 'text-slate-500',
};

const TaskCardContent: React.FC<TaskCardContentProps> = ({ task, onClick, onDeleted, isSelected, onSelect, selectionMode }) => {
    const badgeClass = priorityColors[task.priority] || priorityColors.medium;
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const dueDateStatus = getDueDateStatus(task.due_date, task.is_completed);

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

    const handleArchive = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await archiveTask(task.project_id, task.id);
            onDeleted?.(task.id); // Remove from board view
        } catch (err) { console.error(err); }
        setMenuOpen(false);
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(task.id, !isSelected);
    };

    const baseUrl = API_BASE_URL.replace('/v1', '');

    return (
        <div
            onClick={() => onClick?.(task)}
            className={`bg-white rounded-lg shadow border p-4 cursor-grab hover:shadow-md transition-all active:cursor-grabbing group relative ${
                isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
            }`}
        >
            {/* Selection checkbox */}
            {selectionMode && (
                <div className="absolute top-2 left-2 z-10" onClick={handleCheckboxClick} onPointerDown={e => e.stopPropagation()}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition cursor-pointer ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white hover:border-blue-400'
                    }`}>
                        {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Cover image */}
            {task.cover_image_url && (
                <div className="-mx-4 -mt-4 mb-3">
                    <img
                        src={`${baseUrl}${task.cover_image_url}`}
                        alt=""
                        className="w-full h-32 object-cover rounded-t-lg"
                    />
                </div>
            )}

            <div className={`flex justify-between items-start mb-2 gap-2 ${selectionMode ? 'ml-6' : ''}`}>
                <h4 className="font-semibold text-slate-800 text-sm flex-1 leading-snug">{task.title}</h4>

                {/* 3-DOT MENU */}
                <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
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
                            <button onPointerDown={e => e.stopPropagation()} onClick={handleCopyLink}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                                {copied ? (
                                    <><svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-green-600">Copied!</span></>
                                ) : (
                                    <><svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>Copy link</>
                                )}
                            </button>
                            <button onPointerDown={e => e.stopPropagation()} onClick={handleArchive}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition border-t border-slate-100">
                                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                Archive
                            </button>
                            <button onPointerDown={e => e.stopPropagation()} onClick={handleDelete} disabled={deleting}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-slate-100 disabled:opacity-50">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                {deleting ? 'Deleting...' : 'Delete task'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Labels + Assignee row */}
            {(task.labels?.length > 0 || task.assigned_to_id) && (
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex flex-wrap gap-1 flex-1">
                        {task.labels?.slice(0, 3).map(l => (
                            <span key={l.id} className="text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider"
                                style={{ backgroundColor: l.color + '20', color: l.color, borderColor: l.color + '40' }}>
                                {l.name}
                            </span>
                        ))}
                        {(task.labels?.length || 0) > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium px-1 self-center">+{task.labels!.length - 3}</span>
                        )}
                    </div>
                    {task.assigned_to_id && (
                        <div className="shrink-0" title={task.assigned_to_name || 'Assigned'}>
                            {task.assigned_to_avatar ? (
                                <img
                                    src={`${baseUrl}${task.assigned_to_avatar}`}
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
                    )}
                </div>
            )}

            {task.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{stripMarkdown(task.description)}</p>
            )}

            {/* Subtask progress bar */}
            {task.subtask_count > 0 && (
                <div className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        <span className="text-[10px] text-slate-500 font-medium">{task.subtask_completed}/{task.subtask_count}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(task.subtask_completed / task.subtask_count) * 100}%` }} />
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-auto pt-1 flex-wrap gap-1.5">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${badgeClass}`}>{task.priority}</span>
                    {/* Story points */}
                    {task.story_points != null && task.story_points > 0 && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full">{task.story_points}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Time tracked */}
                    {task.total_time_hours != null && task.total_time_hours > 0 && (
                        <div className="flex items-center text-[10px] text-slate-400 font-medium" title={`${formatHoursAsHoursMinutes(task.total_time_hours)} tracked`}>
                            <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {formatHoursAsHoursMinutes(task.total_time_hours)}
                        </div>
                    )}
                    {/* Attachment count */}
                    {task.attachment_count > 0 && (
                        <div className="flex items-center text-[10px] text-slate-400 font-medium" title={`${task.attachment_count} attachments`}>
                            <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            {task.attachment_count}
                        </div>
                    )}
                    {/* Due date */}
                    {task.due_date && (
                        <div className={`flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${dueDateStyles[dueDateStatus]}`}>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDeleted, isOverlay = false, isSelected, onSelect, selectionMode }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: `task-${task.id}`,
        data: { type: 'Task', task },
        disabled: isOverlay,
    });

    const style = { transition, transform: CSS.Transform.toString(transform) };

    if (isOverlay) {
        return (
            <div className="rotate-1 scale-105 shadow-2xl opacity-95 rounded-lg ring-2 ring-blue-400">
                <TaskCardContent task={task} />
            </div>
        );
    }

    if (isDragging) {
        return (
            <div ref={setNodeRef} style={{ ...style, minHeight: '72px' }}
                className="border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/60 flex items-center justify-center">
                <span className="text-xs text-blue-400 font-medium select-none">Drop here</span>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCardContent task={task} onClick={onClick} onDeleted={onDeleted} isSelected={isSelected} onSelect={onSelect} selectionMode={selectionMode} />
        </div>
    );
};
