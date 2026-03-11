import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { AIActionResult, AIProvider, AIConversation } from "../api/ai";
import { fetchAIConversations } from "../api/ai";
import { useUser } from "./UserContext";

export type ButtonCorner = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export type ChatMode = "assistant" | "general";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AIActionResult[];
  timestamp: Date;
}

interface AIAssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  conversationId: number | null;
  messages: ChatMessage[];
  isLoading: boolean;
  projectContext: { id: number; name: string } | null;
  provider: AIProvider;
  chatMode: ChatMode;
  buttonCorner: ButtonCorner;
  panelWidth: number;
  conversations: AIConversation[];
  conversationsLoading: boolean;
}

interface AIAssistantContextType extends AIAssistantState {
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  minimizePanel: () => void;
  restorePanel: () => void;
  setConversationId: (id: number | null) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setLoading: (loading: boolean) => void;
  setProjectContext: (ctx: { id: number; name: string } | null) => void;
  setProvider: (provider: AIProvider) => void;
  setChatMode: (mode: ChatMode) => void;
  clearChat: () => void;
  setButtonCorner: (corner: ButtonCorner) => void;
  setPanelWidth: (width: number) => void;
  refreshConversations: () => void;
  setConversations: React.Dispatch<React.SetStateAction<AIConversation[]>>;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const prevUserIdRef = useRef<number | null | undefined>(undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [projectContext, setProjectContext] = useState<{ id: number; name: string } | null>(null);
  const [provider, setProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem("ai_provider") as AIProvider) || "claude";
  });
  const [chatMode, setChatModeState] = useState<ChatMode>(() => {
    return (localStorage.getItem("ai_chat_mode") as ChatMode) || "assistant";
  });
  const [buttonCorner, setButtonCornerState] = useState<ButtonCorner>(() => {
    return (localStorage.getItem("ai_button_corner") as ButtonCorner) || "bottom-right";
  });
  const [panelWidth, setPanelWidthState] = useState<number>(() => {
    const saved = localStorage.getItem("ai_panel_width");
    return saved ? parseInt(saved, 10) : 400;
  });
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // Reset all AI state when the user changes (logout → login as different user)
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (prevUserIdRef.current === undefined) {
      // First mount — just record the user, don't reset
      prevUserIdRef.current = currentUserId;
      return;
    }
    if (currentUserId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentUserId;
      // User changed — wipe all chat state
      setIsOpen(false);
      setIsMinimized(false);
      setConversationId(null);
      setMessages([]);
      setLoading(false);
      setProjectContext(null);
      setConversations([]);
      setConversationsLoading(true);
      // Reload conversations for the new user (or clear if logged out)
      if (currentUserId) {
        fetchAIConversations()
          .then(setConversations)
          .catch(() => {})
          .finally(() => setConversationsLoading(false));
      } else {
        setConversationsLoading(false);
      }
    }
  }, [user?.id]);

  // Load conversations eagerly on mount
  const refreshConversations = useCallback(() => {
    setConversationsLoading(true);
    fetchAIConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setConversationsLoading(false));
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const handleSetProvider = useCallback((p: AIProvider) => {
    setProvider(p);
    localStorage.setItem("ai_provider", p);
  }, []);

  const setChatMode = useCallback((mode: ChatMode) => {
    setChatModeState(mode);
    localStorage.setItem("ai_chat_mode", mode);
  }, []);

  const setButtonCorner = useCallback((corner: ButtonCorner) => {
    setButtonCornerState(corner);
    localStorage.setItem("ai_button_corner", corner);
  }, []);

  const setPanelWidth = useCallback((width: number) => {
    setPanelWidthState(width);
    localStorage.setItem("ai_panel_width", String(width));
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setIsMinimized(false);
      return !prev;
    });
  }, []);
  const openPanel = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);
  const closePanel = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    // Close = clear everything, next open starts fresh
    setConversationId(null);
    setMessages([]);
  }, []);
  const minimizePanel = useCallback(() => {
    // Minimize = just hide the window, keep chat state
    setIsOpen(false);
    setIsMinimized(true);
  }, []);
  const restorePanel = useCallback(() => {
    // Restore from minimized = reopen with same chat
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const clearChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
  }, []);

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        isMinimized,
        conversationId,
        messages,
        isLoading,
        projectContext,
        provider,
        chatMode,
        buttonCorner,
        panelWidth,
        togglePanel,
        openPanel,
        closePanel,
        minimizePanel,
        restorePanel,
        setConversationId,
        addMessage,
        setMessages,
        setLoading,
        setProjectContext,
        setProvider: handleSetProvider,
        setChatMode,
        clearChat,
        setButtonCorner,
        setPanelWidth,
        conversations,
        conversationsLoading,
        refreshConversations,
        setConversations,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider");
  }
  return context;
};

export type { ChatMessage };
