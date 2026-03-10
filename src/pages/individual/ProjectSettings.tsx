import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/interceptor";
import { API_BASE_URL } from "../../api/config";
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
} from "../../api/projectMembers";
import { SkeletonCard, SkeletonTable } from "../../components/Skeleton";

interface ProjectDetail {
  id: number;
  name: string;
  description: string | null;
  color: string;
  ai_task_template: string | null;
  is_owner: boolean;
  member_role?: string | null;
}

type Tab = "members" | "ai";

const ROLE_META: Record<MemberRole, { label: string; color: string }> = {
  viewer: { label: "Viewer", color: "bg-slate-100 text-slate-700" },
  editor: { label: "Editor", color: "bg-blue-100 text-blue-700" },
  admin: { label: "Admin", color: "bg-violet-100 text-violet-700" },
};

const DEFAULT_TEMPLATE = `## Description
[Brief summary of what needs to be done and why]

## Tasks / Subtasks
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3`;

const ProjectSettings: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("members");

  // AI tab state
  const [taskTemplate, setTaskTemplate] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");

  // Members tab state
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("editor");
  const [inviting, setInviting] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/projects/${projectId}`);
      setProject(data);
      setTaskTemplate(data.ai_task_template || "");
    } catch {
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const [m, inv] = await Promise.all([
        fetchMembers(projectId),
        fetchPendingInvitations(projectId).catch(() => []),
      ]);
      setMembers(m);
      setInvitations(inv);
    } catch {
      // silent
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "members") loadMembers();
  }, [activeTab, loadMembers]);

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    setTemplateMessage("");
    try {
      await axios.put(`${API_BASE_URL}/projects/${projectId}`, { ai_task_template: taskTemplate });
      setTemplateMessage("Template saved");
      setTimeout(() => setTemplateMessage(""), 3000);
    } catch (err: any) {
      setTemplateMessage(err?.response?.data?.detail || "Failed to save");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember(projectId, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      loadMembers();
    } catch {
      // silent
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMember(projectId, userId);
      loadMembers();
    } catch {
      // silent
    }
  };

  const handleUpdateRole = async (userId: number, role: MemberRole) => {
    try {
      await updateMemberRole(projectId, userId, role);
      loadMembers();
    } catch {
      // silent
    }
  };

  const handleUpdateTeamRole = async (userId: number, teamRole: string, teamRoleDescription?: string) => {
    try {
      await updateMemberRole(projectId, userId, undefined, teamRole, teamRoleDescription);
      loadMembers();
    } catch {
      // silent
    }
  };

  // Track which member's role editor is open
  const [editingRoleForUser, setEditingRoleForUser] = useState<number | null>(null);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customRoleDesc, setCustomRoleDesc] = useState("");

  const PRESET_ROLES = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Designer", "QA Engineer", "DevOps", "Project Manager",
    "Product Owner", "Data Analyst", "Mobile Developer",
  ];

  const openRoleEditor = (member: ProjectMember) => {
    setEditingRoleForUser(member.user_id);
    setCustomRoleInput(member.team_role || "");
    setCustomRoleDesc(member.team_role_description || "");
  };

  const saveRoleEditor = async () => {
    if (editingRoleForUser === null) return;
    await handleUpdateTeamRole(editingRoleForUser, customRoleInput, customRoleDesc);
    setEditingRoleForUser(null);
    setCustomRoleInput("");
    setCustomRoleDesc("");
  };

  const cancelRoleEditor = () => {
    setEditingRoleForUser(null);
    setCustomRoleInput("");
    setCustomRoleDesc("");
  };

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await cancelInvitation(projectId, invitationId);
      loadMembers();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <SkeletonCard className="h-24" />
        <div className="flex gap-4 mb-4">
          <div className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (!project) return null;

  const isManager = project.is_owner || project.member_role === "admin";

  const TABS: { key: Tab; label: string }[] = [
    { key: "members", label: "Members" },
    { key: "ai", label: "AI Settings" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-1">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Tab Selector — Reports-style pill buttons */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MEMBERS TAB ──────────────────────────────────────── */}
        {activeTab === "members" && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-200">
              Team Members
            </h2>

            {/* Invite form */}
            {isManager && (
              <form onSubmit={handleInvite} className="flex gap-2 mb-6">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-sm transition-all hover:shadow-lg disabled:opacity-50"
                >
                  Invite
                </button>
              </form>
            )}

            {/* Members list */}
            {loadingMembers ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-200 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-44 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="h-8 w-24 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {m.profile_pic_url ? (
                        <img
                          src={`${API_BASE_URL}${m.profile_pic_url}`}
                          alt={m.full_name || m.email}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                          {m.full_name?.[0]?.toUpperCase() || m.email[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{m.full_name || m.email}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Team role badge + editor */}
                      {isManager ? (
                        <button
                          onClick={() => openRoleEditor(m)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                            m.team_role
                              ? "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
                              : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600"
                          }`}
                          title={m.team_role_description || "Set team role"}
                        >
                          {m.team_role || "Set Role"}
                        </button>
                      ) : m.team_role ? (
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 cursor-help"
                          title={m.team_role_description || undefined}
                        >
                          {m.team_role}
                        </span>
                      ) : null}

                      {/* Access role */}
                      {m.role === "owner" ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700">Owner</span>
                      ) : isManager ? (
                        <>
                          <select
                            value={m.role}
                            onChange={(e) => handleUpdateRole(m.user_id, e.target.value as MemberRole)}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white text-slate-700"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove member"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${ROLE_META[m.role as MemberRole]?.color || ""}`}>
                          {ROLE_META[m.role as MemberRole]?.label || m.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team role editor overlay */}
            {editingRoleForUser !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={cancelRoleEditor}>
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-5 w-96 space-y-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-sm font-bold text-slate-800">Set Team Role</h3>

                  {/* Role name input with preset suggestions */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Role</label>
                    <input
                      type="text"
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      placeholder="e.g. Frontend Developer, Content Writer..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      list="preset-roles-list"
                      autoFocus
                    />
                    <datalist id="preset-roles-list">
                      {PRESET_ROLES.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  {/* Role description */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Description <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={customRoleDesc}
                      onChange={(e) => setCustomRoleDesc(e.target.value)}
                      placeholder="Describe what this role does, e.g. 'Handles React components, Tailwind styling, and responsive layouts'"
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ROLES.slice(0, 6).map((r) => (
                      <button
                        key={r}
                        onClick={() => setCustomRoleInput(r)}
                        className={`text-[11px] px-2 py-1 rounded-md border transition-colors ${
                          customRoleInput === r
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
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

            {/* Pending invitations */}
            {invitations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Pending Invitations</h3>
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{inv.email}</p>
                        <p className="text-xs text-slate-500">Invited as {inv.role}</p>
                      </div>
                      {isManager && (
                        <button
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI SETTINGS TAB ──────────────────────────────────── */}
        {activeTab === "ai" && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2 pb-4 border-b border-slate-200">
              AI Task Template
            </h2>
            <p className="text-sm text-slate-600 mb-5">
              Define a template for how the AI assistant should format task descriptions when creating tasks for this project.
              Leave empty to use the default format.
            </p>

            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Task Description Template</label>
                  {!taskTemplate && (
                    <button
                      onClick={() => setTaskTemplate(DEFAULT_TEMPLATE)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Use default template
                    </button>
                  )}
                </div>
                <textarea
                  value={taskTemplate}
                  onChange={(e) => setTaskTemplate(e.target.value)}
                  rows={14}
                  placeholder={"Enter your task description template using markdown format...\n\nExample:\n## Description\n[What needs to be done]\n\n## Tasks\n- [ ] Step 1\n- [ ] Step 2\n\n## Acceptance Criteria\n- [ ] Criteria 1"}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {savingTemplate ? "Saving..." : "Save Template"}
                </button>
                {taskTemplate && (
                  <button
                    onClick={async () => {
                      setTaskTemplate("");
                      setSavingTemplate(true);
                      try {
                        await axios.put(`${API_BASE_URL}/projects/${projectId}`, { ai_task_template: "" });
                        setTemplateMessage("Template cleared");
                        setTimeout(() => setTemplateMessage(""), 3000);
                      } catch {
                        setTemplateMessage("Failed to clear");
                      } finally {
                        setSavingTemplate(false);
                      }
                    }}
                    className="px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Clear Template
                  </button>
                )}
                {templateMessage && (
                  <span className="text-sm text-emerald-600 font-medium">{templateMessage}</span>
                )}
              </div>

              {/* Preview */}
              {taskTemplate && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Template Preview</h3>
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{taskTemplate}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSettings;
