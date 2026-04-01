import React, { useState, useEffect, useRef } from 'react';
import { fetchSavedFilters, createSavedFilter, deleteSavedFilter } from '../../api/boards';
import type { SavedFilter } from '../../api/boards';

interface Props {
    projectId: number;
    currentFilter: string;
    onApply: (config: string) => void;
}

export const SavedFilterBar: React.FC<Props> = ({ projectId, currentFilter, onApply }) => {
    const [filters, setFilters] = useState<SavedFilter[]>([]);
    const [open, setOpen] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [showSave, setShowSave] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { load(); }, [projectId]);
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const load = async () => {
        try { setFilters(await fetchSavedFilters(projectId)); } catch {}
    };

    const handleSave = async () => {
        if (!saveName.trim()) return;
        try {
            const sf = await createSavedFilter(projectId, { name: saveName.trim(), filter_config: currentFilter });
            setFilters(prev => [...prev, sf]);
            setSaveName('');
            setShowSave(false);
        } catch {}
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try { await deleteSavedFilter(projectId, id); setFilters(prev => prev.filter(f => f.id !== id)); } catch {}
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                Saved Views
                {filters.length > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">{filters.length}</span>}
            </button>

            {open && (
                <div className="absolute right-0 top-10 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-slate-100">
                        <h4 className="text-xs font-bold text-slate-500 uppercase">Saved Filter Views</h4>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filters.map(f => (
                            <button key={f.id} onClick={() => { onApply(f.filter_config); setOpen(false); }}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 transition text-sm text-slate-700">
                                <span className="truncate">{f.name}</span>
                                <button onClick={e => handleDelete(f.id, e)}
                                    className="text-slate-400 hover:text-red-500 transition shrink-0 ml-2">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </button>
                        ))}
                        {filters.length === 0 && <p className="text-xs text-slate-400 text-center py-3">No saved views</p>}
                    </div>
                    <div className="p-3 border-t border-slate-100">
                        {showSave ? (
                            <div className="flex gap-2">
                                <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="View name"
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400" autoFocus />
                                <button onClick={handleSave} className="text-xs text-blue-600 font-semibold">Save</button>
                            </div>
                        ) : (
                            <button onClick={() => setShowSave(true)}
                                className="w-full text-xs text-blue-600 font-semibold hover:text-blue-700 text-center py-1">
                                + Save Current View
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
