import axios from "./interceptor";
import { API_BASE_URL } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
  created_at: string;
}

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
  task_number: number;
  project_id: number;
  column_id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  order: number;
  is_completed: boolean;
  assigned_to_id: number | null;
  assigned_to_name: string | null;
  assigned_to_avatar: string | null;
  parent_id: number | null;
  story_points: number | null;
  is_archived: boolean;
  cover_image_url: string | null;
  labels: Label[];
  subtask_count: number;
  subtask_completed: number;
  attachment_count: number;
  total_time_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface BoardView {
  columns: BoardColumn[];
  tasks: Task[];
  labels: Label[];
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
  parent_id?: number | null;
  story_points?: number | null;
  label_ids?: number[];
}

export interface UpdateTaskPayload {
  column_id?: number;
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  due_date?: string | null;
  order?: number;
  is_completed?: boolean;
  assigned_to_id?: number | null;
  parent_id?: number | null;
  story_points?: number | null;
  is_archived?: boolean;
  cover_image_url?: string | null;
}

export interface Assignee {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  team_role: string | null;
  team_role_description: string | null;
  profile_pic_url: string | null;
}

export interface TaskActivity {
  id: number;
  task_id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  detail: string | null;
  from_column: string | null;
  to_column: string | null;
  created_at: string;
}

export interface TaskNote {
  id: number;
  task_id: number;
  project_id: number;
  user_id: number | null;
  user_name: string | null;
  user_avatar: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  project_id: number;
  user_id: number | null;
  user_name: string | null;
  filename: string;
  original_filename: string;
  file_url: string;
  file_size: number | null;
  content_type: string | null;
  created_at: string;
}

export interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_id: number;
  dependency_type: string;
  depends_on_title: string | null;
  depends_on_task_number: number | null;
  depends_on_is_completed: boolean;
  created_at: string;
}

export interface TaskTemplate {
  id: number;
  project_id: number;
  name: string;
  title_template: string | null;
  description_template: string | null;
  default_priority: string;
  default_labels: string | null;
  created_at: string;
}

export interface SavedFilter {
  id: number;
  project_id: number;
  user_id: number;
  name: string;
  filter_config: string;
  created_at: string;
}

export interface BulkActionPayload {
  task_ids: number[];
  action: "move" | "priority" | "assign" | "archive" | "delete";
  column_id?: number;
  priority?: string;
  assigned_to_id?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────

// BOARD CACHE - 30-second in-memory cache
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

export const fetchTaskActivity = async (projectId: number, taskId: number): Promise<TaskActivity[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/activity`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to fetch task activity");
  }
};

export const fetchProjectAssignees = async (projectId: number): Promise<Assignee[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/assignees`);
    return response.data;
  } catch (error: any) {
    return [];
  }
};

// --- Task Notes ---

export const fetchTaskNotes = async (projectId: number, taskId: number): Promise<TaskNote[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/notes`);
  return response.data;
};

export const createTaskNote = async (projectId: number, taskId: number, content: string): Promise<TaskNote> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/notes`, { content });
  return response.data;
};

export const updateTaskNote = async (projectId: number, taskId: number, noteId: number, content: string): Promise<TaskNote> => {
  const response = await axios.put(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/notes/${noteId}`, { content });
  return response.data;
};

export const deleteTaskNote = async (projectId: number, taskId: number, noteId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/notes/${noteId}`);
};

// --- Labels ---

export const fetchLabels = async (projectId: number): Promise<Label[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/labels`);
  return response.data;
};

export const createLabel = async (projectId: number, payload: { name: string; color: string }): Promise<Label> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/labels`, payload);
  return response.data;
};

export const updateLabel = async (projectId: number, labelId: number, payload: { name?: string; color?: string }): Promise<Label> => {
  const response = await axios.put(`${API_BASE_URL}/boards/${projectId}/labels/${labelId}`, payload);
  return response.data;
};

export const deleteLabel = async (projectId: number, labelId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/boards/${projectId}/labels/${labelId}`);
};

export const addTaskLabel = async (projectId: number, taskId: number, labelId: number): Promise<void> => {
  await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/labels/${labelId}`);
};

export const removeTaskLabel = async (projectId: number, taskId: number, labelId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/labels/${labelId}`);
};

// --- Subtasks ---

export const fetchSubtasks = async (projectId: number, taskId: number): Promise<Task[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/subtasks`);
  return response.data;
};

export const createSubtask = async (projectId: number, taskId: number, title: string): Promise<Task> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/subtasks?title=${encodeURIComponent(title)}`);
  return response.data;
};

export const toggleSubtask = async (projectId: number, taskId: number, subtaskId: number): Promise<Task> => {
  const response = await axios.put(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
  return response.data;
};

// --- Attachments ---

export const fetchAttachments = async (projectId: number, taskId: number): Promise<TaskAttachment[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/attachments`);
  return response.data;
};

export const uploadAttachment = async (projectId: number, taskId: number, file: File): Promise<TaskAttachment> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/attachments`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }
  );
  return response.data;
};

export const deleteAttachment = async (projectId: number, taskId: number, attachmentId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/attachments/${attachmentId}`);
};

// --- Dependencies ---

export const fetchDependencies = async (projectId: number, taskId: number): Promise<TaskDependency[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/dependencies`);
  return response.data;
};

export const createDependency = async (projectId: number, taskId: number, payload: { depends_on_id: number; dependency_type?: string }): Promise<TaskDependency> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/dependencies`, payload);
  return response.data;
};

export const deleteDependency = async (projectId: number, taskId: number, depId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/dependencies/${depId}`);
};

// --- Templates ---

export const fetchTemplates = async (projectId: number): Promise<TaskTemplate[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/templates`);
  return response.data;
};

export const createTemplate = async (projectId: number, payload: Partial<TaskTemplate>): Promise<TaskTemplate> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/templates`, payload);
  return response.data;
};

export const updateTemplate = async (projectId: number, templateId: number, payload: Partial<TaskTemplate>): Promise<TaskTemplate> => {
  const response = await axios.put(`${API_BASE_URL}/boards/${projectId}/templates/${templateId}`, payload);
  return response.data;
};

export const deleteTemplate = async (projectId: number, templateId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/boards/${projectId}/templates/${templateId}`);
};

// --- Saved Filters ---

export const fetchSavedFilters = async (projectId: number): Promise<SavedFilter[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/filters`);
  return response.data;
};

export const createSavedFilter = async (projectId: number, payload: { name: string; filter_config: string }): Promise<SavedFilter> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/filters`, payload);
  return response.data;
};

export const deleteSavedFilter = async (projectId: number, filterId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/boards/${projectId}/filters/${filterId}`);
};

// --- Board Activity ---

export const fetchBoardActivity = async (projectId: number, page = 1, limit = 50): Promise<TaskActivity[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/activity?page=${page}&limit=${limit}`);
  return response.data;
};

// --- Bulk Actions ---

export const bulkUpdateTasks = async (projectId: number, payload: BulkActionPayload): Promise<void> => {
  await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks/bulk`, payload);
};

// --- Archive ---

export const archiveTask = async (projectId: number, taskId: number): Promise<Task> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/archive`);
  return response.data;
};

export const unarchiveTask = async (projectId: number, taskId: number): Promise<Task> => {
  const response = await axios.post(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/unarchive`);
  return response.data;
};

export const fetchArchivedTasks = async (projectId: number): Promise<Task[]> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/archive`);
  return response.data;
};

// --- Cover Image ---

export const uploadCoverImage = async (projectId: number, taskId: number, file: File): Promise<Task> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(
    `${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/cover`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" }, timeout: 30000 }
  );
  return response.data;
};

export const removeCoverImage = async (projectId: number, taskId: number): Promise<Task> => {
  const response = await axios.delete(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/cover`);
  return response.data;
};

// --- Task Time Entries ---

export interface TaskTimeData {
  total_hours: number;
  entries: {
    id: number;
    task_name: string;
    start_time: string | null;
    end_time: string | null;
    duration_hours: number | null;
    status: string;
    user_id: number;
  }[];
}

export const fetchTaskTimeEntries = async (projectId: number, taskId: number): Promise<TaskTimeData> => {
  const response = await axios.get(`${API_BASE_URL}/boards/${projectId}/tasks/${taskId}/time-entries`);
  return response.data;
};
