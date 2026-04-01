import axios from "./interceptor";
import { API_BASE_URL } from "./config";
import { getStoredToken } from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AIActionResult {
  action_type: string;
  success: boolean;
  detail: string;
  entity_id?: number;
  entity_name?: string;
}

export interface AIChatResponse {
  conversation_id: number;
  message: string;
  actions: AIActionResult[];
}

export interface AIMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  actions_taken?: string;
  created_at: string;
}

export interface AIConversation {
  id: number;
  project_id?: number;
  project_name?: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface AIConversationDetail {
  id: number;
  project_id?: number;
  messages: AIMessage[];
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────────────────────────────────────

export type AIProvider = "claude" | "gemini";
export type AIChatMode = "assistant" | "general";

export const sendAIMessage = async (
  message: string,
  conversationId?: number,
  projectId?: number,
  provider: AIProvider = "claude",
  mode: AIChatMode = "assistant"
): Promise<AIChatResponse> => {
  const { data } = await axios.post(`${API_BASE_URL}/ai/chat`, {
    message,
    conversation_id: conversationId || null,
    project_id: projectId || null,
    provider,
    mode,
  });
  return data;
};

export const uploadAIDocument = async (
  file: File,
  projectId?: number,
  provider: AIProvider = "claude",
  message?: string,
  conversationId?: number
): Promise<AIChatResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  if (projectId) {
    formData.append("project_id", String(projectId));
  }
  formData.append("provider", provider);
  if (message) {
    formData.append("message", message);
  }
  if (conversationId) {
    formData.append("conversation_id", String(conversationId));
  }
  const { data } = await axios.post(`${API_BASE_URL}/ai/upload-document`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // 2 min for document processing
  });
  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// STREAMING
// ─────────────────────────────────────────────────────────────────────────────

export interface SSECallbacks {
  onToken: (text: string) => void;
  onToolStart?: (tool: string) => void;
  onToolResult?: (result: { tool: string; success: boolean; message: string }) => void;
  onDone: (actions: AIActionResult[]) => void;
  onError: (error: string) => void;
  onConversationId: (id: number) => void;
}

export const streamAIMessage = (
  message: string,
  callbacks: SSECallbacks,
  conversationId?: number,
  projectId?: number,
  provider: AIProvider = "claude",
  mode: AIChatMode = "assistant"
): AbortController => {
  const controller = new AbortController();
  const token = getStoredToken();

  const body = JSON.stringify({
    message,
    conversation_id: conversationId || null,
    project_id: projectId || null,
    provider,
    mode,
  });

  fetch(`${API_BASE_URL}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Request failed" }));
        callbacks.onError(errData.detail || `HTTP ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError("No response stream");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              switch (currentEvent) {
                case "conversation_id":
                  callbacks.onConversationId(parsed.conversation_id);
                  break;
                case "token":
                  callbacks.onToken(parsed.text);
                  break;
                case "tool_start":
                  callbacks.onToolStart?.(parsed.tool);
                  break;
                case "tool_result":
                  callbacks.onToolResult?.(parsed);
                  break;
                case "done":
                  callbacks.onDone(parsed.actions || []);
                  break;
                case "error":
                  callbacks.onError(parsed.error);
                  break;
              }
            } catch {
              // skip unparseable lines
            }
            currentEvent = "";
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        callbacks.onError(err.message || "Stream connection failed");
      }
    });

  return controller;
};

export const fetchAIConversations = async (): Promise<AIConversation[]> => {
  const { data } = await axios.get(`${API_BASE_URL}/ai/conversations`);
  return data;
};

export const fetchAIConversation = async (id: number): Promise<AIConversationDetail> => {
  const { data } = await axios.get(`${API_BASE_URL}/ai/conversations/${id}`);
  return data;
};

export const deleteAIConversation = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/ai/conversations/${id}`);
};

export const renameAIConversation = async (id: number, title: string): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/ai/conversations/${id}/title`, { title });
};
