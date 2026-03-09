import axios from "./interceptor";
import { API_BASE_URL } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface BoardColumn {
  id: number;
  project_id: number;
  name: string;
  column_type: "todo" | "in_progress" | "review" | "done" | "backlog" | "bug";
  order: number;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  column_id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  order: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardView {
  columns: BoardColumn[];
  tasks: Task[];
}

export interface CreateColumnPayload {
  name: string;
  column_type: string;
  order?: number;
  color?: string;
}

export interface UpdateColumnPayload {
  name?: string;
  column_type?: string;
  order?: number;
  color?: string;
}

export interface CreateTaskPayload {
  column_id: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  order?: number;
  is_completed?: boolean;
}

export interface UpdateTaskPayload {
  column_id?: number;
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  order?: number;
  is_completed?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────

// BOARD CACHE � 30-second in-memory cache
const _boardCache = new Map<number, { data: BoardView; ts: number }>();
const BOARD_TTL = 30_000;
export const invalidateBoardCache = (projectId: number) => _boardCache.delete(projectId);

export const fetchBoard = async (projectId: number): Promise<BoardView> => {
  const hit = _boardCache.get(projectId);
  if (hit && Date.now() - hit.ts < BOARD_TTL) return hit.data;
  try {
    const response = await axios.get(`${API_BASE_URL}/boards/${projectId}`);
    _boardCache.set(projectId, { data: response.data, ts: Date.now() });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch board:", error);
    throw new Error(error?.response?.data?.detail || "Failed to fetch board data");
  }
};

// --- Columns ---

export const createColumn = async (projectId: number, payload: CreateColumnPayload): Promise<BoardColumn> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/columns`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to create column");
  }
};

export const updateColumn = async (projectId: number, columnId: number, payload: UpdateColumnPayload): Promise<BoardColumn> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/boards/${projectId}/columns/${columnId}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to update column");
  }
};

export const deleteColumn = async (projectId: number, columnId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/boards/${projectId}/columns/${columnId}`);
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to delete column");
  }
};

// --- Tasks ---

export const createTask = async (projectId: number, payload: CreateTaskPayload): Promise<Task> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to create task");
  }
};

export const updateTask = async (projectId: number, taskId: number, payload: UpdateTaskPayload): Promise<Task> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to update task");
  }
};

export const deleteTask = async (projectId: number, taskId: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}`);
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to delete task");
  }
};
