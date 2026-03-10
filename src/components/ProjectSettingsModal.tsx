import React, { useEffect, useState } from 'react';
import {
    fetchMembers,
    removeMember,
    updateMemberRole,
    inviteMember,
    fetchPendingInvitations,
    cancelInvitation,
    type ProjectMember,
    type MemberRole,
    type PendingInvitation,
} from '../api/projectMembers';
import { API_BASE_URL } from '../api/config';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface Props {
    project: Project;
    onClose: () => void;
    /** Pass true if the current user is the project owner */
    isOwner?: boolean;
    /** Current user's ID — used to detect admin-member role */
    currentUserId?: number;
}

const ROLE_META: Record<MemberRole, { label: string; color: string; desc: string }> = {
    viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-600', desc: 'Can view the board and tasks only' },
    editor: { label: 'Editor', color: 'bg-blue-100 text-blue-700', desc: 'Can create and edit tasks, log time' },
    admin:  { label: 'Admin',  color: 'bg-purple-100 text-purple-700', desc: 'Can manage members and columns' },
};

export const ProjectSettingsModal: React.FC<Props> = ({ project, onClose, isOwner = false, currentUserId }) => {
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [pending, setPending] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    // Manager = owner OR admin member
    const isManager = isOwner || members.some((m) => m.user_id === currentUserId && m.role === 'admin');
    const [email, setEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<MemberRole>('editor');
    const [adding, setAdding] = useState(false);
    const [inviteSent, setInviteSent] = useState('');
    const [error, setError] = useState('');
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
    const [cancellingInvId, setCancellingInvId] = useState<number | null>(null);

    useEffect(() => {
        loadAll();
    }, [project.id]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [m, p] = await Promise.all([
                fetchMembers(project.id),
                isOwner ? fetchPendingInvitations(project.id).catch(() => []) : Promise.resolve([]),
            ]);
            setMembers(m);
            setPending(p as PendingInvitation[]);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;
        setAdding(true);
        setError('');
        setInviteSent('');
        try {
            await inviteMember(project.id, trimmed, inviteRole);
            setInviteSent(`Invitation sent to ${trimmed}`);
            setEmail('');
            // Refresh pending list
            const updated = await fetchPendingInvitations(project.id).catch(() => []);
            setPending(updated as PendingInvitation[]);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to send invitation');
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

    const handleCancelInvitation = async (invId: number) => {
        setCancellingInvId(invId);
        setError('');
        try {
            await cancelInvitation(invId);
            setPending((prev) => prev.filter((i) => i.id !== invId));
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to cancel invitation');
        } finally {
            setCancellingInvId(null);
        }
    };

    const handleRoleChange = async (userId: number, newRole: MemberRole) => {
        setUpdatingRoleId(userId);
        setError('');
        try {
            const updated = await updateMemberRole(project.id, userId, newRole);
            setMembers((prev) => prev.map((m) => m.user_id === userId ? updated : m));
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Failed to update role');
        } finally {
            setUpdatingRoleId(null);
        }
    };

    const handleTeamRoleChange = async (userId: number, teamRole: string, teamRoleDescription?: string) => {
        try {
            const updated = await updateMemberRole(project.id, userId, undefined, teamRole, teamRoleDescription);
            setMembers((prev) => prev.map((m) => m.user_id === userId ? updated : m));
        } catch {
            // silent
        }
    };

    // Team role editor state
    const [editingRoleForUser, setEditingRoleForUser] = useState<number | null>(null);
    const [customRoleInput, setCustomRoleInput] = useState('');
    const [customRoleDesc, setCustomRoleDesc] = useState('');

    const PRESET_ROLES = [
        'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
        'Designer', 'QA Engineer', 'DevOps', 'Project Manager',
        'Product Owner', 'Data Analyst', 'Mobile Developer',
    ];

    const openRoleEditor = (member: ProjectMember) => {
        setEditingRoleForUser(member.user_id);
        setCustomRoleInput(member.team_role || '');
        setCustomRoleDesc(member.team_role_description || '');
    };

    const saveRoleEditor = async () => {
        if (editingRoleForUser === null) return;
        await handleTeamRoleChange(editingRoleForUser, customRoleInput, customRoleDesc);
        setEditingRoleForUser(null);
    };

    const cancelRoleEditor = () => {
        setEditingRoleForUser(null);
        setCustomRoleInput('');
        setCustomRoleDesc('');
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
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                    {/* Invite section — manager only */}
                    {isManager && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Send Invitation
                            </h4>

                            <form onSubmit={handleInvite} className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email address…"
                                        className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                                        className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                                    >
                                        {(Object.keys(ROLE_META) as MemberRole[]).map((r) => (
                                            <option key={r} value={r}>{ROLE_META[r].label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={adding || !email.trim()}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                                    >
                                        {adding ? '…' : 'Send'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 pl-1">{ROLE_META[inviteRole].desc}</p>
                            </form>

                            {inviteSent && (
                                <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {inviteSent}
                                </p>
                            )}
                            {error && <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>}
                        </div>
                    )}

                    {/* Pending invitations */}
                    {isManager && pending.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pending Invitations
                                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{pending.length}</span>
                            </h4>
                            <ul className="flex flex-col gap-1.5">
                                {pending.map((inv) => {
                                    const roleMeta = ROLE_META[inv.role as MemberRole] ?? ROLE_META.editor;
                                    return (
                                        <li key={inv.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate">{inv.invitee_name}</p>
                                                <p className="text-xs text-slate-500 truncate">{inv.invitee_email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3 shrink-0">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleMeta.color}`}>{roleMeta.label}</span>
                                                <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Pending</span>
                                                <button
                                                    onClick={() => handleCancelInvitation(inv.id)}
                                                    disabled={cancellingInvId === inv.id}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                                                    title="Cancel invitation"
                                                >
                                                    {cancellingInvId === inv.id ? (
                                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

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
                                No members yet. Send an invitation by email.
                            </div>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {members.map((m) => {
                                    const roleMeta = ROLE_META[m.role as MemberRole] ?? { label: m.role, color: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <li key={m.user_id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {m.profile_pic_url ? (
                                                    <img
                                                        src={`${API_BASE_URL}${m.profile_pic_url}`}
                                                        alt={m.full_name}
                                                        className="w-9 h-9 rounded-full object-cover shrink-0"
                                                    />
                                                ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                    {m.full_name.charAt(0).toUpperCase()}
                                                </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{m.full_name}</p>
                                                        {m.team_role && (
                                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 shrink-0 cursor-help" title={m.team_role_description || undefined}>{m.team_role}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                {/* Team role button */}
                                                {isManager ? (
                                                    <button
                                                        onClick={() => openRoleEditor(m)}
                                                        className={`text-[11px] px-1.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                                            m.team_role
                                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                                                        }`}
                                                        title={m.team_role_description || 'Set team role'}
                                                    >
                                                        {m.team_role || 'Set Role'}
                                                    </button>
                                                ) : null}

                                                {/* Access role */}
                                                {m.role === 'owner' ? (
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Owner</span>
                                                ) : isManager ? (
                                                    updatingRoleId === m.user_id ? (
                                                        <div className="w-20 flex justify-center">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={m.role}
                                                            onChange={(e) => handleRoleChange(m.user_id, e.target.value as MemberRole)}
                                                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${roleMeta.color}`}
                                                        >
                                                            {(Object.keys(ROLE_META) as MemberRole[]).map((r) => (
                                                                <option key={r} value={r}>{ROLE_META[r].label}</option>
                                                            ))}
                                                        </select>
                                                    )
                                                ) : (
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${roleMeta.color}`}>
                                                        {roleMeta.label}
                                                    </span>
                                                )}

                                                {isManager && m.role !== 'owner' && (
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
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Role legend */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex flex-col gap-1.5">
                        <p className="text-xs font-bold text-slate-600 mb-1">Permission Levels</p>
                        {(Object.entries(ROLE_META) as [MemberRole, typeof ROLE_META[MemberRole]][]).map(([role, meta]) => (
                            <div key={role} className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-14 text-center ${meta.color}`}>{meta.label}</span>
                                <span className="text-xs text-slate-500">{meta.desc}</span>
                            </div>
                        ))}
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

            {/* Team role editor overlay */}
            {editingRoleForUser !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={cancelRoleEditor}>
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-sm font-bold text-slate-800">Set Team Role</h3>

                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">Role</label>
                            <input
                                type="text"
                                value={customRoleInput}
                                onChange={(e) => setCustomRoleInput(e.target.value)}
                                placeholder="e.g. Frontend Developer, Content Writer..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                list="modal-preset-roles-list"
                                autoFocus
                            />
                            <datalist id="modal-preset-roles-list">
                                {PRESET_ROLES.map((r) => (
                                    <option key={r} value={r} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1 block">
                                Description <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={customRoleDesc}
                                onChange={(e) => setCustomRoleDesc(e.target.value)}
                                placeholder="Describe what this role does..."
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_ROLES.slice(0, 6).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setCustomRoleInput(r)}
                                    className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                                        customRoleInput === r
                                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={cancelRoleEditor}
                                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveRoleEditor}
                                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-lg transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
