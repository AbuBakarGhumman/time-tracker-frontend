import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Task, BoardColumn, TaskActivity, Assignee, TaskNote } from '../../api/boards';
import { updateTask, deleteTask, fetchTaskActivity, fetchProjectAssignees, fetchTaskNotes, createTaskNote, deleteTaskNote } from '../../api/boards';
import { API_BASE_URL } from '../../api/config';
import { formatDate, formatDateOnly } from '../../utils/dateUtils';

const getAvatarUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined;
    return `${API_BASE_URL}${url}`;
};

/** Ensure naive ISO strings from the DB (stored as UTC) are parsed as UTC */
const asUTC = (iso: string) => (!iso ? iso : iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`);

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
    low:    { label: 'Low',    pill: 'bg-slate-100 text-slate-700 border-slate-300',  dot: 'bg-slate-400' },
    medium: { label: 'Medium', pill: 'bg-blue-100 text-blue-700 border-blue-300',     dot: 'bg-blue-500'  },
    high:   { label: 'High',   pill: 'bg-orange-100 text-orange-700 border-orange-300', dot: 'bg-orange-500' },
    urgent: { label: 'Urgent', pill: 'bg-red-100 text-red-700 border-red-300',        dot: 'bg-red-500'   },
};

function fmtDate(iso: string) {
    return formatDateOnly(asUTC(iso), { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateTime(iso: string) {
    return formatDate(asUTC(iso), { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Timeline event ──────────────────────────────────────────────────────────
interface TimelineEventProps {
    icon: 'created' | 'edited' | 'completed' | 'reopened' | 'moved';
    label: string;
    sub?: string;
    date: string;
    last?: boolean;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ icon, label, sub, date, last }) => {
    const iconMap = {
        created: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        ),
        edited: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        completed: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        reopened: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        moved: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        ),
    };

    const colorMap = {
        created:   'bg-blue-100 text-blue-600 border-blue-200',
        edited:    'bg-slate-100 text-slate-600 border-slate-200',
        completed: 'bg-green-100 text-green-600 border-green-200',
        reopened:  'bg-yellow-100 text-yellow-600 border-yellow-200',
        moved:     'bg-purple-100 text-purple-600 border-purple-200',
    };

    return (
        <div className="flex gap-3">
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${colorMap[icon]}`}>
                    {iconMap[icon]}
                </div>
                {!last && <div className="w-px flex-1 bg-slate-200 mt-1" />}
            </div>

            {/* Content */}
            <div className="pb-5 min-w-0">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                <p className="text-xs text-slate-400 mt-1">{fmtDateTime(date)}</p>
            </div>
        </div>
    );
};

// ── Main component ───────────────────────────────────────────────────────────
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
    const [copied, setCopied] = useState(false);
    const [activity, setActivity] = useState<TaskActivity[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [assignees, setAssignees] = useState<Assignee[]>([]);
    const [assigneeId, setAssigneeId] = useState<number | null>(task.assigned_to_id ?? null);
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const [descEditing, setDescEditing] = useState(false);
    const [notes, setNotes] = useState<TaskNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(true);
    const [noteInput, setNoteInput] = useState('');
    const [sendingNote, setSendingNote] = useState(false);
    const [noteMentionQuery, setNoteMentionQuery] = useState<string | null>(null);
    const [noteMentionIndex, setNoteMentionIndex] = useState(0);
    const [noteMentionStartPos, setNoteMentionStartPos] = useState(0);
    const noteInputRef = useRef<HTMLTextAreaElement>(null);
    const noteMentionRef = useRef<HTMLDivElement>(null);

    const noteMentionResults = noteMentionQuery !== null
        ? assignees.filter((a) => a.full_name.toLowerCase().includes(noteMentionQuery.toLowerCase())).slice(0, 6)
        : [];

    useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Keep local state in sync when task prop changes
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description ?? '');
        setPriority(task.priority);
        setDueDate(task.due_date ?? '');
        setIsCompleted(task.is_completed);
    }, [task.id]);

    // Load activity log
    useEffect(() => {
        setActivityLoading(true);
        fetchTaskActivity(projectId, task.id)
            .then(setActivity)
            .catch(() => setActivity([]))
            .finally(() => setActivityLoading(false));
    }, [task.id, projectId]);

    // Load assignees once
    useEffect(() => {
        fetchProjectAssignees(projectId).then(setAssignees);
    }, [projectId]);

    // Load notes
    useEffect(() => {
        setNotesLoading(true);
        fetchTaskNotes(projectId, task.id)
            .then(setNotes)
            .catch(() => setNotes([]))
            .finally(() => setNotesLoading(false));
    }, [task.id, projectId]);

    // Close assignee picker on outside click
    useEffect(() => {
        if (!showAssigneePicker) return;
        const handler = () => setShowAssigneePicker(false);
        setTimeout(() => document.addEventListener('click', handler), 0);
        return () => document.removeEventListener('click', handler);
    }, [showAssigneePicker]);

    // Sync assignee when task changes
    useEffect(() => {
        setAssigneeId(task.assigned_to_id ?? null);
    }, [task.id]);

    // ── Note @mention handling ──
    const handleNoteInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart ?? value.length;
        setNoteInput(value);

        const textBeforeCursor = value.slice(0, cursorPos);
        const match = textBeforeCursor.match(/(^|[\s])@(\w*)$/);
        if (match) {
            const atIndex = textBeforeCursor.lastIndexOf('@');
            setNoteMentionQuery(match[2]);
            setNoteMentionStartPos(atIndex);
            setNoteMentionIndex(0);
            return;
        }
        setNoteMentionQuery(null);
    }, []);

    const handleNoteMentionSelect = useCallback((member: Assignee) => {
        const before = noteInput.slice(0, noteMentionStartPos);
        const after = noteInput.slice(noteMentionStartPos + 1 + (noteMentionQuery?.length ?? 0));
        const tag = `@${member.full_name}`;
        const newInput = `${before}${tag} ${after}`;
        setNoteInput(newInput);
        setNoteMentionQuery(null);
        setTimeout(() => {
            if (noteInputRef.current) {
                const pos = before.length + tag.length + 1;
                noteInputRef.current.selectionStart = pos;
                noteInputRef.current.selectionEnd = pos;
                noteInputRef.current.focus();
            }
        }, 0);
    }, [noteInput, noteMentionStartPos, noteMentionQuery]);

    const handleSendNote = async () => {
        const trimmed = noteInput.trim();
        if (!trimmed || sendingNote) return;
        setSendingNote(true);
        try {
            const newNote = await createTaskNote(projectId, task.id, trimmed);
            setNotes((prev) => [...prev, newNote]);
            setNoteInput('');
            if (noteInputRef.current) noteInputRef.current.style.height = 'auto';
        } catch (e) {
            console.error(e);
        } finally {
            setSendingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        try {
            await deleteTaskNote(projectId, task.id, noteId);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
        } catch (e) {
            console.error(e);
        }
    };

    const handleNoteKeyDown = (e: React.KeyboardEvent) => {
        if (noteMentionQuery !== null && noteMentionResults.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setNoteMentionIndex((p) => (p + 1) % noteMentionResults.length); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setNoteMentionIndex((p) => (p - 1 + noteMentionResults.length) % noteMentionResults.length); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); handleNoteMentionSelect(noteMentionResults[noteMentionIndex]); return; }
            if (e.key === 'Escape') { e.preventDefault(); setNoteMentionQuery(null); return; }
        }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(); }
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 250);
    };

    const refreshActivity = () => {
        fetchTaskActivity(projectId, task.id).then(setActivity).catch(() => {});
    };

    const save = async (patch: Partial<Parameters<typeof updateTask>[2]>) => {
        setSaving(true);
        try {
            const updated = await updateTask(projectId, task.id, patch as any);
            onUpdated(updated);
            refreshActivity();
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
        setDescEditing(false);
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
    const handleCopyLink = () => {
        const url = `${window.location.origin}/projects/${projectId}/board?task=${task.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const actionToIcon = (action: string): TimelineEventProps['icon'] => {
        if (action === 'created') return 'created';
        if (action === 'moved') return 'moved';
        if (action === 'completed') return 'completed';
        if (action === 'reopened') return 'reopened';
        return 'edited';
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                className={`absolute inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Panel */}
            <aside
                className={`absolute top-0 right-0 z-50 h-full w-full max-w-[1000px] bg-white shadow-2xl flex flex-col transition-transform duration-250 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* ── TOP BAR ── */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            #{task.task_number}
                        </span>
                        {column && (
                            <span
                                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                                style={{
                                    backgroundColor: `${column.color}18`,
                                    color: column.color ?? '#64748b',
                                    borderColor: `${column.color}44`,
                                }}
                            >
                                {column.name}
                            </span>
                        )}
                        {saving && (
                            <span className="text-xs text-slate-400 animate-pulse">Saving…</span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {/* Copy link */}
                        <button
                            onClick={handleCopyLink}
                            title="Copy task link"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition"
                        >
                            {copied ? (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            )}
                        </button>

                        {/* Delete */}
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            title="Delete task"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>

                        {/* Close */}
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ml-1"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── TITLE SECTION ── */}
                <div className="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        className="w-full text-xl font-bold text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-400 outline-none focus:ring-2 focus:ring-blue-400/30 rounded-lg px-3 py-2 transition placeholder-slate-300"
                        placeholder="Task title"
                    />
                </div>

                {/* ── BODY: main + sidebar ── */}
                <div className="flex-1 overflow-y-auto">
                <div className="flex min-h-full">
                    {/* Main content */}
                    <div className="flex-1 px-6 py-5 space-y-7 min-w-0">
                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</p>
                                {description && !descEditing && (
                                    <button
                                        onClick={() => setDescEditing(true)}
                                        className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            {descEditing || !description ? (
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleDescBlur}
                                    onFocus={() => setDescEditing(true)}
                                    placeholder="Add a description… (supports markdown)"
                                    rows={14}
                                    autoFocus={descEditing}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-mono placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition bg-slate-50 focus:bg-white"
                                />
                            ) : (
                                <div
                                    onClick={() => setDescEditing(true)}
                                    className="task-markdown w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-slate-50 hover:bg-white hover:border-blue-300 cursor-text transition min-h-[100px] overflow-auto max-h-[400px]"
                                >
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ children }) => <h1 className="text-lg font-bold text-slate-800 mt-3 mb-1 first:mt-0">{children}</h1>,
                                            h2: ({ children }) => <h2 className="text-base font-bold text-slate-800 mt-3 mb-1 first:mt-0">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-sm font-bold text-slate-700 mt-2 mb-1 first:mt-0">{children}</h3>,
                                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
                                            ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
                                            li: ({ children }) => <li className="text-sm">{children}</li>,
                                            strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                                            em: ({ children }) => <em className="italic">{children}</em>,
                                            code: ({ children, className }) => {
                                                const isBlock = className?.includes('language-');
                                                return isBlock
                                                    ? <code className={`block bg-slate-800 text-slate-100 rounded-lg p-3 my-2 text-xs overflow-x-auto ${className || ''}`}>{children}</code>
                                                    : <code className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
                                            },
                                            pre: ({ children }) => <pre className="my-2">{children}</pre>,
                                            blockquote: ({ children }) => <blockquote className="border-l-3 border-blue-400 pl-3 my-2 text-slate-600 italic">{children}</blockquote>,
                                            a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{children}</a>,
                                            hr: () => <hr className="my-3 border-slate-200" />,
                                            input: ({ checked, ...props }) => (
                                                <input type="checkbox" checked={checked} readOnly className="mr-1.5 accent-blue-500" {...props} />
                                            ),
                                        }}
                                    >
                                        {description}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notes</p>

                            {/* Notes list */}
                            {notesLoading ? (
                                <div className="space-y-3 mb-4">
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="animate-pulse flex gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
                                            <div className="flex-1">
                                                <div className="h-3 bg-slate-200 rounded w-1/4 mb-1.5" />
                                                <div className="h-3 bg-slate-100 rounded w-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : notes.length > 0 ? (
                                <div className="space-y-3 mb-4">
                                    {notes.map((note) => (
                                        <div key={note.id} className="group flex gap-2.5">
                                            {getAvatarUrl(note.user_avatar) ? (
                                                <img src={getAvatarUrl(note.user_avatar)} className="w-7 h-7 rounded-full shrink-0 object-cover mt-0.5" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                                    <span className="text-[10px] font-bold text-white">{note.user_name?.[0] ?? '?'}</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-700">{note.user_name}</span>
                                                    <span className="text-[10px] text-slate-400">{fmtDateTime(note.created_at)}</span>
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="ml-auto p-0.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Delete note"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap break-words mt-0.5">
                                                    {note.content.split(/(@[\w][\w\s]*?)(?=\s@|\s*$|[.,!?;:\n])/).map((part, i) =>
                                                        part.startsWith('@') ? (
                                                            <span key={i} className="text-blue-600 font-medium bg-blue-50 px-0.5 rounded">{part}</span>
                                                        ) : (
                                                            <span key={i}>{part}</span>
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 mb-4">No notes yet. Write one below.</p>
                            )}

                            {/* Note input with @mention */}
                            <div className="relative">
                                {noteMentionQuery !== null && noteMentionResults.length > 0 && (
                                    <div
                                        ref={noteMentionRef}
                                        className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-48 overflow-y-auto z-30"
                                    >
                                        {noteMentionResults.map((member, i) => (
                                            <button
                                                key={member.user_id}
                                                onClick={() => handleNoteMentionSelect(member)}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                                                    i === noteMentionIndex
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                {getAvatarUrl(member.profile_pic_url) ? (
                                                    <img src={getAvatarUrl(member.profile_pic_url)} className="w-5 h-5 rounded-full shrink-0 object-cover" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                                        <span className="text-[8px] font-bold text-white">{member.full_name[0]}</span>
                                                    </div>
                                                )}
                                                <span className="font-medium truncate">{member.full_name}</span>
                                                {member.team_role && <span className="text-xs text-slate-400 ml-auto">{member.team_role}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 items-end">
                                    <textarea
                                        ref={noteInputRef}
                                        value={noteInput}
                                        onChange={(e) => {
                                            handleNoteInputChange(e);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                        }}
                                        onKeyDown={handleNoteKeyDown}
                                        placeholder="Write a note... use @ to mention a team member"
                                        rows={1}
                                        disabled={sendingNote}
                                        className="flex-1 resize-none border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-slate-50 focus:bg-white transition disabled:opacity-50"
                                        style={{ minHeight: '36px', maxHeight: '120px' }}
                                    />
                                    <button
                                        onClick={handleSendNote}
                                        disabled={!noteInput.trim() || sendingNote}
                                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        {sendingNote ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Activity / Timeline */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Activity</p>
                            {activityLoading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                    Loading activity…
                                </div>
                            ) : activity.length === 0 ? (
                                <p className="text-sm text-slate-400">No activity recorded yet.</p>
                            ) : (
                                <div>
                                    {activity.map((ev, i) => (
                                        <TimelineEvent
                                            key={ev.id}
                                            icon={actionToIcon(ev.action)}
                                            label={ev.detail ?? ev.action}
                                            sub={ev.user_name ? `by ${ev.user_name}` : undefined}
                                            date={ev.created_at}
                                            last={i === activity.length - 1}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-56 shrink-0 border-l border-slate-100 px-5 py-5 space-y-6 bg-slate-50/50">

                        {/* Assignee */}
                        <div className="relative">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assignee</p>
                            <button
                                onClick={() => setShowAssigneePicker((v) => !v)}
                                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition text-left"
                            >
                                {assigneeId ? (
                                    <>
                                        {(() => {
                                            const a = assignees.find(x => x.user_id === assigneeId);
                                            return getAvatarUrl(a?.profile_pic_url) ? (
                                                <img src={getAvatarUrl(a?.profile_pic_url)} className="w-6 h-6 rounded-full shrink-0 object-cover" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-white">{a?.full_name?.[0] ?? '?'}</span>
                                                </div>
                                            );
                                        })()}
                                        <span className="text-xs font-medium text-slate-700 truncate">
                                            {assignees.find(x => x.user_id === assigneeId)?.full_name ?? task.assigned_to_name ?? 'Assigned'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-400">Unassigned</span>
                                    </>
                                )}
                                <svg className="w-3 h-3 ml-auto text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showAssigneePicker && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                    {/* Unassign option */}
                                    <button
                                        onClick={() => {
                                            setAssigneeId(null);
                                            setShowAssigneePicker(false);
                                            save({ assigned_to_id: null });
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition text-left"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-slate-500">Unassigned</span>
                                        {!assigneeId && <svg className="w-3 h-3 ml-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </button>
                                    <div className="border-t border-slate-100" />
                                    {assignees.map((a) => (
                                        <button
                                            key={a.user_id}
                                            onClick={() => {
                                                setAssigneeId(a.user_id);
                                                setShowAssigneePicker(false);
                                                save({ assigned_to_id: a.user_id });
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition text-left"
                                        >
                                            {getAvatarUrl(a.profile_pic_url) ? (
                                                <img src={getAvatarUrl(a.profile_pic_url)} className="w-6 h-6 rounded-full shrink-0 object-cover" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-white">{a.full_name[0]}</span>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-800 truncate">{a.full_name}</p>
                                                <p className="text-[10px] text-slate-400 capitalize">{a.team_role || a.role}</p>
                                            </div>
                                            {assigneeId === a.user_id && (
                                                <svg className="w-3 h-3 ml-auto text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority</p>
                            <div className="flex flex-col gap-1">
                                {PRIORITIES.map((p) => {
                                    const cfg = priorityConfig[p];
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => handlePriority(p)}
                                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition text-left ${
                                                priority === p ? cfg.pill : 'border-transparent text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                                            {cfg.label}
                                            {priority === p && (
                                                <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Due date */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Due Date</p>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => handleDueDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                            />
                            {dueDate && (
                                <button
                                    onClick={() => handleDueDate('')}
                                    className="mt-1 text-[11px] text-slate-400 hover:text-slate-600 transition"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <hr className="border-slate-200" />

                        {/* Status */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</p>
                            <button
                                onClick={handleComplete}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold w-full transition ${
                                    isCompleted
                                        ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                                        : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} />
                                {isCompleted ? 'Completed' : 'Open'}
                            </button>
                        </div>

                        {/* Column */}
                        {column && (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Column</p>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: column.color ?? '#94a3b8' }}
                                    />
                                    <span className="text-sm text-slate-700 font-medium">{column.name}</span>
                                </div>
                            </div>
                        )}

                        {/* Created */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Created</p>
                            <p className="text-xs text-slate-600">{fmtDate(task.created_at)}</p>
                        </div>

                        {/* Updated */}
                        {task.updated_at !== task.created_at && (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Last Updated</p>
                                <p className="text-xs text-slate-600">{fmtDate(task.updated_at)}</p>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </aside>
        </>
    );
};
