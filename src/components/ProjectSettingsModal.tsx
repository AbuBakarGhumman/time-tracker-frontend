import React, { useEffect, useState } from 'react';
import { fetchMembers, addMember, removeMember, type ProjectMember } from '../api/projectMembers';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface Props {
    project: Project;
    onClose: () => void;
}

export const ProjectSettingsModal: React.FC<Props> = ({ project, onClose }) => {
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');
    const [removingId, setRemovingId] = useState<number | null>(null);

    useEffect(() => {
        loadMembers();
    }, [project.id]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            setMembers(await fetchMembers(project.id));
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;
        setAdding(true);
        setError('');
        try {
            const member = await addMember(project.id, trimmed);
            setMembers((prev) => [...prev, member]);
            setEmail('');
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to add member');
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (userId: number) => {
        setRemovingId(userId);
        setError('');
        try {
            await removeMember(project.id, userId);
            setMembers((prev) => prev.filter((m) => m.user_id !== userId));
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to remove member');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{
                                backgroundColor: project.color,
                                boxShadow: `0 0 0 2px rgba(255,255,255,0.4), 0 0 0 3.5px ${project.color}`,
                            }}
                        />
                        <div>
                            <h3 className="text-lg font-bold leading-tight">Project Settings</h3>
                            <p className="text-sm text-blue-100 font-medium">{project.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 p-1.5 rounded-lg transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {/* Add member */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Invite Member
                        </h4>
                        <form onSubmit={handleAdd} className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address…"
                                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button
                                type="submit"
                                disabled={adding || !email.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                            >
                                {adding ? '…' : 'Invite'}
                            </button>
                        </form>
                        {error && (
                            <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>
                        )}
                    </div>

                    {/* Members list */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Members
                            {!loading && (
                                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {members.length}
                                </span>
                            )}
                        </h4>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                <svg className="w-10 h-10 mx-auto mb-2 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                No members yet. Invite someone by email.
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {members.map((m) => (
                                    <li
                                        key={m.user_id}
                                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                {m.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{m.full_name}</p>
                                                <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full capitalize">
                                                {m.role}
                                            </span>
                                            <button
                                                onClick={() => handleRemove(m.user_id)}
                                                disabled={removingId === m.user_id}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                title="Remove member"
                                            >
                                                {removingId === m.user_id ? (
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Info note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700 flex gap-2">
                        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Members can view and interact with the board. Only you (the owner) can manage members and delete the project.
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
