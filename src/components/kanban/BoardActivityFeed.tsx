import React, { useState, useEffect } from 'react';
import { fetchBoardActivity } from '../../api/boards';
import type { TaskActivity } from '../../api/boards';

interface Props {
    projectId: number;
    onClose: () => void;
}

const actionIcons: Record<string, { icon: string; color: string }> = {
    created: { icon: 'M12 4v16m8-8H4', color: 'text-green-500' },
    moved: { icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'text-blue-500' },
    completed: { icon: 'M5 13l4 4L19 7', color: 'text-green-600' },
    reopened: { icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', color: 'text-amber-500' },
    archived: { icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', color: 'text-slate-500' },
    assigned: { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'text-purple-500' },
};

const getIcon = (action: string) => actionIcons[action] || { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-slate-400' };

export const BoardActivityFeed: React.FC<Props> = ({ projectId, onClose }) => {
    const [activities, setActivities] = useState<TaskActivity[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => { load(1); }, [projectId]);

    const load = async (p: number) => {
        setLoading(true);
        try {
            const data = await fetchBoardActivity(projectId, p, 50);
            if (p === 1) setActivities(data);
            else setActivities(prev => [...prev, ...data]);
            setHasMore(data.length === 50);
            setPage(p);
        } catch {}
        setLoading(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-bold">Board Activity</h3>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                        {activities.map(a => {
                            const { icon, color } = getIcon(a.action);
                            return (
                                <div key={a.id} className="relative pl-10 pb-4">
                                    <div className={`absolute left-2.5 top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 ${color.replace('text-', 'border-')}`} />
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-slate-700">{a.user_name || 'System'}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-600">{a.detail || a.action}</p>
                                        {a.from_column && a.to_column && (
                                            <p className="text-[10px] text-slate-400 mt-1">{a.from_column} → {a.to_column}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {loading && <div className="text-center py-4"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>}
                    {!loading && hasMore && (
                        <button onClick={() => load(page + 1)}
                            className="w-full text-sm text-blue-600 font-medium py-2 hover:bg-blue-50 rounded-lg transition">
                            Load more
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};
