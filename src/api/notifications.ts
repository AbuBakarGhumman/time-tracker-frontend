import axios from "./interceptor";
import { API_BASE_URL } from "./config";

export interface AppNotification {
  id: number;
  type: "project_invitation" | "info" | "alert" | "task_mention" | "task_assignment";
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
  /** Only present on project_invitation notifications pushed over WS */
  invitation_id?: number;
}

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const res = await axios.get(`${API_BASE_URL}/notifications`);
  return res.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await axios.get(`${API_BASE_URL}/notifications/unread-count`);
  return res.data.count;
};

export const markRead = async (id: number): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/notifications/${id}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/notifications/read-all`);
};

export const deleteNotification = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/notifications/${id}`);
};
