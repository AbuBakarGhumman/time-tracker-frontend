import axios from "./interceptor";
import { API_BASE_URL } from "./config";

export interface ProjectMember {
    user_id: number;
    email: string;
    full_name: string;
    role: string;
    invited_at: string;
}

export const fetchMembers = async (projectId: number): Promise<ProjectMember[]> => {
    const res = await axios.get(`${API_BASE_URL}/projects/${projectId}/members`);
    return res.data;
};

export const addMember = async (projectId: number, email: string): Promise<ProjectMember> => {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/members`, { email });
    return res.data;
};

export const removeMember = async (projectId: number, userId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/projects/${projectId}/members/${userId}`);
};
