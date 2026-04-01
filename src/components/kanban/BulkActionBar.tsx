import React, { useState } from 'react';
import { bulkUpdateTasks, invalidateBoardCache } from '../../api/boards';
import type { BoardColumn } from '../../api/boards';

interface Props {
    projectId: number;
    selectedIds: Set<number>;
    columns: BoardColumn[];
    onClear: () => void;
    onDone: () => void;
}

export const BulkActionBar: React.FC<Props> = ({ projectId, selectedIds, columns, onClear, onDone }) => {
    const [loading, setLoading] = useState(false);
    const count = selectedIds.size;

    const execute = async (action: string, extra: Record<string, any> = {}) => {
        if (action === 'delete' && !window.confirm(`Delete ${count} tasks?`)) return;
        setLoading(true);
        try {
            await bulkUpdateTasks(projectId, { task_ids: Array.from(selectedIds), action: action as any, ...extra });
            invalidateBoardCache(projectId);
            onDone();
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    if (count === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom">
            <span className="text-sm font-semibold">{count} selected</span>
            <div className="h-5 w-px bg-slate-600" />

            {/* Move to column */}
            <select
                onChange={e => { if (e.target.value) execute('move', { column_id: parseInt(e.target.value) }); e.target.value = ''; }}
                className="bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 cursor-pointer"
                disabled={loading} defaultValue="">
                <option value="" disabled>Move to...</option>
                {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Priority */}
            <select
                onChange={e => { if (e.target.value) execute('priority', { priority: e.target.value }); e.target.value = ''; }}
                className="bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 cursor-pointer"
                disabled={loading} defaultValue="">
                <option value="" disabled>Priority...</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </select>

            {/* Archive */}
            <button onClick={() => execute('archive')} disabled={loading}
                className="text-xs font-medium px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700">
                Archive
            </button>

            {/* Delete */}
            <button onClick={() => execute('delete')} disabled={loading}
                className="text-xs font-medium px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition">
                Delete
            </button>

            <div className="h-5 w-px bg-slate-600" />
            <button onClick={onClear} className="text-xs text-slate-400 hover:text-white transition">Clear</button>
        </div>
    );
};
