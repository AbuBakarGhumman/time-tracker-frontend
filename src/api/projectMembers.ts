import axios from "./interceptor";
import { API_BASE_URL } from "./config";

export interface ProjectMember {
    user_id: number;
    email: string;
    full_name: string;
    role: string;
    team_role?: string | null;
    team_role_description?: string | null;
    invited_at: string;
    profile_pic_url?: string | null;
}

export const fetchMembers = async (projectId: number): Promise<ProjectMember[]> => {
    const res = await axios.get(`${API_BASE_URL}/projects/${projectId}/members`);
    return res.data;
};

export type MemberRole = "viewer" | "editor" | "admin";

export interface PendingInvitation {
    id: number;
    invitee_email: string;
    invitee_name: string;
    role: MemberRole;
    created_at: string;
}

/** Send an invitation (invitee must accept). Replaces the old addMember direct-add. */
export const inviteMember = async (projectId: number, email: string, role: MemberRole = "editor"): Promise<void> => {
    await axios.post(`${API_BASE_URL}/projects/${projectId}/invite`, { email, role });
};

export const fetchPendingInvitations = async (projectId: number): Promise<PendingInvitation[]> => {
    const res = await axios.get(`${API_BASE_URL}/projects/${projectId}/invitations`);
    return res.data;
};

/** @deprecated Direct member addition replaced by inviteMember */
export const addMember = async (projectId: number, email: string, role: MemberRole = "editor"): Promise<ProjectMember> => {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/members`, { email, role });
    return res.data;
};

export const updateMemberRole = async (
    projectId: number,
    userId: number,
    role?: MemberRole,
    teamRole?: string,
    teamRoleDescription?: string,
): Promise<ProjectMember> => {
    const body: Record<string, string | undefined> = {};
    if (role !== undefined) body.role = role;
    if (teamRole !== undefined) body.team_role = teamRole;
    if (teamRoleDescription !== undefined) body.team_role_description = teamRoleDescription;
    const res = await axios.patch(`${API_BASE_URL}/projects/${projectId}/members/${userId}`, body);
    return res.data;
};

export const removeMember = async (projectId: number, userId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/projects/${projectId}/members/${userId}`);
};

export const cancelInvitation = async (invitationId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/invitations/${invitationId}`);
};
