import React, { useState, useRef, useEffect } from 'react';
import type { Task, BoardColumn } from '../../api/boards';

interface Props {
    tasks: Task[];
    columns: BoardColumn[];
    projectName: string;
}

export const ExportMenu: React.FC<Props> = ({ tasks, columns, projectName }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const colMap = new Map(columns.map(c => [c.id, c.name]));

    const exportCSV = () => {
        const header = ['Task #', 'Title', 'Column', 'Priority', 'Status', 'Assignee', 'Due Date', 'Story Points', 'Labels'];
        const rows = tasks.map(t => [
            t.task_number,
            `"${(t.title || '').replace(/"/g, '""')}"`,
            colMap.get(t.column_id) || '',
            t.priority,
            t.is_completed ? 'Done' : 'Open',
            t.assigned_to_name || '',
            t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
            t.story_points ?? '',
            (t.labels || []).map(l => l.name).join('; '),
        ]);
        const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName || 'board'}-tasks.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
    };

    const printBoard = () => {
        setOpen(false);
        window.print();
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export
            </button>
            {open && (
                <div className="absolute right-0 top-10 z-50 w-44 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                    <button onClick={exportCSV}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export as CSV
                    </button>
                    <button onClick={printBoard}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition border-t border-slate-100">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print Board
                    </button>
                </div>
            )}
        </div>
    );
};
