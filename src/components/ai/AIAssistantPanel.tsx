import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAIAssistant } from "../../context/AIAssistantContext";
import type { ChatMessage } from "../../context/AIAssistantContext";
import { uploadAIDocument, streamAIMessage, fetchAIConversations, fetchAIConversation, deleteAIConversation } from "../../api/ai";
import type { AIConversation, AIActionResult } from "../../api/ai";
import AIChatMessage from "./AIChatMessage";
import { invalidateBoardCache } from "../../api/boards";
import { fetchProjects } from "../../api/timeentries";
import type { ProjectResponse } from "../../api/timeentries";

const QUICK_ACTIONS = [
  { label: "Create a project", prompt: "I want to create a new project." },
  { label: "Project status", prompt: "What's the status of my projects?" },
  { label: "Add tasks", prompt: "I want to add some tasks." },
];

const MIN_WIDTH = 360;
const PADDING = 16;
const HEADER_HEIGHT = 64; // h-16 top navbar

/** Get the current sidebar width from the DOM (0 on mobile / when hidden) */
const getSidebarWidth = (): number => {
  const aside = document.querySelector("aside");
  if (!aside || aside.offsetParent === null) return 0; // hidden on mobile
  return aside.getBoundingClientRect().width;
};

const AIAssistantPanel: React.FC = () => {
  const {
    isOpen,
    closePanel,
    minimizePanel,
    conversationId,
    setConversationId,
    messages,
    addMessage,
    setMessages,
    isLoading,
    setLoading,
    projectContext,
    provider,
    setProvider,
    chatMode,
    setChatMode,
    clearChat,
    buttonCorner,
    panelWidth,
    setPanelWidth,
  } = useAIAssistant();

  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [allProjects, setAllProjects] = useState<ProjectResponse[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [taggedProject, setTaggedProject] = useState<{ id: number; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const modePickerRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Load history when sidebar opens
  useEffect(() => {
    if (historyOpen) loadConversations();
  }, [historyOpen]);

  // Close model picker on outside click
  useEffect(() => {
    if (!showModelPicker) return;
    const handler = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModelPicker]);

  // Close mode picker on outside click
  useEffect(() => {
    if (!showModePicker) return;
    const handler = (e: MouseEvent) => {
      if (modePickerRef.current && !modePickerRef.current.contains(e.target as Node)) {
        setShowModePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModePicker]);

  // Fetch projects for @ mention
  useEffect(() => {
    if (isOpen && allProjects.length === 0) {
      fetchProjects().then(setAllProjects).catch(() => {});
    }
  }, [isOpen]);

  // Filtered mention results
  const mentionResults = mentionQuery !== null
    ? allProjects.filter((p) => p.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : [];

  // Handle input changes for @p mention detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart ?? value.length;
    setInput(value);

    // Look backwards from cursor for @p trigger
    const textBeforeCursor = value.slice(0, cursorPos);
    // Match @p or @P followed by optional search text (no double spaces)
    const match = textBeforeCursor.match(/(^|[\s])@[pP](\S*)$/);
    if (match) {
      const atIndex = textBeforeCursor.lastIndexOf("@");
      const searchText = match[2]; // text after @p
      setMentionQuery(searchText);
      setMentionStartPos(atIndex);
      setMentionIndex(0);
      return;
    }
    setMentionQuery(null);
  }, []);

  // Select a project from mention dropdown
  const handleMentionSelect = useCallback((project: ProjectResponse) => {
    const before = input.slice(0, mentionStartPos);
    // +2 for "@p", then the search query length
    const after = input.slice(mentionStartPos + 2 + (mentionQuery?.length ?? 0));
    const tag = `@p:${project.name}`;
    const newInput = `${before}${tag} ${after}`;
    setInput(newInput);
    setTaggedProject({ id: project.id, name: project.name });
    setMentionQuery(null);
    setTimeout(() => {
      if (inputRef.current) {
        const pos = before.length + tag.length + 1; // +1 for trailing space
        inputRef.current.selectionStart = pos;
        inputRef.current.selectionEnd = pos;
        inputRef.current.focus();
      }
    }, 0);
  }, [input, mentionStartPos, mentionQuery]);

  const loadConversations = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchAIConversations();
      setConversations(data);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLoadConversation = async (convId: number) => {
    try {
      const detail = await fetchAIConversation(convId);
      setConversationId(detail.id);
      const chatMessages: ChatMessage[] = detail.messages.map((m) => ({
        id: `loaded-${m.id}`,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
      }));
      setMessages(chatMessages);
    } catch {
      // silent
    }
  };

  const handleDeleteConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteAIConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (conversationId === convId) clearChat();
    } catch {
      // silent
    }
  };

  // Resize
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;
    const isLeft = buttonCorner.includes("right");
    const maxW = window.innerWidth - getSidebarWidth() - PADDING * 2;

    const onMove = (ev: PointerEvent) => {
      if (!isResizingRef.current) return;
      const delta = ev.clientX - startX;
      const newWidth = isLeft
        ? Math.min(maxW, Math.max(MIN_WIDTH, startWidth - delta))
        : Math.min(maxW, Math.max(MIN_WIDTH, startWidth + delta));
      setPanelWidth(newWidth);
    };

    const onUp = () => {
      isResizingRef.current = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [buttonCorner, panelWidth, setPanelWidth]);

  const handleSend = async () => {
    const trimmed = input.trim();
    const file = attachedFile;
    if ((!trimmed && !file) || isLoading) return;

    // Determine effective project: tagged project > page context
    const effectiveProject = taggedProject || projectContext;

    // Build user-visible message
    const displayContent = file
      ? trimmed ? `📎 ${file.name}\n${trimmed}` : `📎 ${file.name}`
      : trimmed;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: displayContent,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput("");
    setAttachedFile(null);
    setTaggedProject(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    // File uploads use non-streaming path (multipart)
    if (file) {
      try {
        const response = await uploadAIDocument(file, effectiveProject?.id, provider, trimmed || undefined, conversationId || undefined);
        setConversationId(response.conversation_id);
        addMessage({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.message,
          actions: response.actions,
          timestamp: new Date(),
        });
        const hasModifications = response.actions.some(
          (a) => a.success && ["create_project", "create_task", "create_multiple_tasks", "assign_task"].includes(a.action_type)
        );
        if (hasModifications && (effectiveProject?.id || projectContext?.id)) {
          invalidateBoardCache((effectiveProject?.id || projectContext?.id)!);
        }
        if (historyOpen) loadConversations();
      } catch (err: any) {
        addMessage({
          id: `error-${Date.now()}`,
          role: "assistant",
          content: err?.response?.data?.detail || "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Streaming path for text messages
    const msgId = `assistant-${Date.now()}`;
    let accumulatedText = "";
    let messageAdded = false;

    // Helper: ensure the assistant message exists before updating it
    const ensureMessage = () => {
      if (!messageAdded) {
        messageAdded = true;
        streamingMsgIdRef.current = msgId;
        addMessage({ id: msgId, role: "assistant", content: "", timestamp: new Date() });
      }
    };

    const controller = streamAIMessage(
      trimmed,
      {
        onConversationId: (id) => {
          setConversationId(id);
        },
        onToken: (text) => {
          ensureMessage();
          accumulatedText += text;
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, content: accumulatedText } : m))
          );
        },
        onToolStart: (_tool) => {
          ensureMessage();
        },
        onToolResult: (_result) => {
          ensureMessage();
        },
        onDone: (actions: AIActionResult[]) => {
          ensureMessage();
          // Finalize message with actions
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId ? { ...m, content: accumulatedText, actions: actions.length > 0 ? actions : undefined } : m
            )
          );
          setLoading(false);
          streamingMsgIdRef.current = null;

          const hasModifications = actions.some(
            (a) => a.success && ["create_project", "create_task", "create_multiple_tasks", "assign_task"].includes(a.action_type)
          );
          if (hasModifications && (effectiveProject?.id || projectContext?.id)) {
            invalidateBoardCache((effectiveProject?.id || projectContext?.id)!);
          }
          if (historyOpen) loadConversations();
        },
        onError: (error) => {
          ensureMessage();
          if (!accumulatedText) {
            accumulatedText = error || "Sorry, something went wrong. Please try again.";
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, content: accumulatedText } : m))
          );
          setLoading(false);
          streamingMsgIdRef.current = null;
        },
      },
      conversationId || undefined,
      effectiveProject?.id,
      provider,
      chatMode,
    );
    streamAbortRef.current = controller;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention dropdown navigation
    if (mentionQuery !== null && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionResults.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + mentionResults.length) % mentionResults.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleMentionSelect(mentionResults[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    // Focus the input so user can type context
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNewChat = () => {
    clearChat();
    setAttachedFile(null);
    setTaggedProject(null);
    setInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (inputRef.current) inputRef.current.style.height = "auto";
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const [sidebarW, setSidebarW] = useState(getSidebarWidth);

  // Re-measure sidebar width on open & on sidebar collapse/expand (transition)
  useEffect(() => {
    if (!isOpen) return;
    const measure = () => setSidebarW(getSidebarWidth());
    measure();
    const aside = document.querySelector("aside");
    aside?.addEventListener("transitionend", measure);
    window.addEventListener("resize", measure);
    return () => {
      aside?.removeEventListener("transitionend", measure);
      window.removeEventListener("resize", measure);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isRight = buttonCorner.includes("right");
  const resizeHandleIsLeft = isRight;

  const availableWidth = window.innerWidth - sidebarW;
  const positionStyle: React.CSSProperties = {
    position: "fixed",
    top: HEADER_HEIGHT + PADDING,
    bottom: PADDING,
    ...(isRight
      ? { right: PADDING }
      : { left: sidebarW + PADDING }),
    width: Math.min(panelWidth, availableWidth - PADDING * 2),
    zIndex: 40,
  };

  return (
    <div ref={panelRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden" style={positionStyle}>
      {/* Resize handle */}
      <div
        onPointerDown={handleResizeStart}
        className={`absolute ${resizeHandleIsLeft ? "left-0" : "right-0"} top-4 bottom-4 w-2 cursor-ew-resize group z-10 flex items-center`}
      >
        <div className="w-0.5 h-10 bg-slate-300 dark:bg-slate-600 rounded-full group-hover:bg-violet-500 group-active:bg-violet-600 transition-colors mx-auto" />
      </div>

      {/* ── UNIFIED HEADER ────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          {/* History toggle */}
          <button
            onClick={() => setHistoryOpen((p) => !p)}
            className={`p-1.5 rounded-lg transition-colors ${historyOpen ? "bg-white/20 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            title={historyOpen ? "Hide history" : "Show history"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {historyOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              )}
            </svg>
          </button>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm leading-tight">AI Assistant</h3>
            {projectContext && <p className="text-white/60 text-[11px] truncate leading-tight">{projectContext.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={handleNewChat} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="New chat">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button onClick={minimizePanel} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Minimize">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button onClick={closePanel} className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Close">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── BODY (history sidebar + chat) ──────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* History sidebar */}
        {historyOpen && (
          <div className="w-[200px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-3 text-center">
                  <svg className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs text-slate-400 dark:text-slate-500">No conversations yet</p>
                </div>
              ) : (
                <div className="py-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv.id)}
                      className={`group flex items-start gap-1.5 px-3 py-2.5 cursor-pointer transition-colors w-full ${
                        conversationId === conv.id
                          ? "bg-violet-100 dark:bg-violet-900/30"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate leading-tight">
                          {conv.last_message || "New conversation"}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {conv.project_name && (
                            <span className="text-[10px] text-violet-600 dark:text-violet-400 truncate">{conv.project_name}</span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(conv.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="flex-shrink-0 p-0.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-slate-800 dark:text-slate-200 font-semibold text-sm mb-1">How can I help you?</h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
                  I can create projects, add tasks, parse documents, and manage your board.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <AIChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && !streamingMsgIdRef.current && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── INPUT AREA ──────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 px-3 pt-2.5 pb-2">
            {/* Tagged project chip */}
            {taggedProject && (
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg px-2.5 py-1 text-xs font-medium">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="truncate max-w-[200px]">{taggedProject.name}</span>
                  <button
                    onClick={() => {
                      setTaggedProject(null);
                      // Remove @p:ProjectName from input
                      setInput((prev) => prev.replace(new RegExp(`@p:${taggedProject.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s?`), ""));
                    }}
                    className="ml-0.5 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {/* Attached file chip */}
            {attachedFile && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg px-2.5 py-1.5 text-xs font-medium">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                  <button
                    onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="ml-0.5 p-0.5 hover:bg-violet-200 dark:hover:bg-violet-800 rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">Add instructions and press send</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" onChange={handleFileSelect} className="hidden" />

            {/* Combined input field with attachment & send inside */}
            <div className="relative bg-slate-100 dark:bg-slate-700 rounded-xl focus-within:ring-2 focus-within:ring-violet-500 transition-all">
              {/* @ Mention dropdown — positioned above the input wrapper */}
              {mentionQuery !== null && mentionResults.length > 0 && (
                <div
                  ref={mentionRef}
                  className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 max-h-48 overflow-y-auto z-30"
                >
                  {mentionResults.map((project, i) => (
                    <button
                      key={project.id}
                      onClick={() => handleMentionSelect(project)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        i === mentionIndex
                          ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: project.color || "#3b82f6" }}
                      />
                      <span className="truncate font-medium">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {mentionQuery !== null && mentionResults.length === 0 && mentionQuery.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-3 px-3 z-30">
                  <p className="text-xs text-slate-400 text-center">No projects found</p>
                </div>
              )}

              {/* Attachment — inside input, bottom-left */}
              <div className="absolute left-1.5 bottom-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                  title="Upload document (PDF, DOCX)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  handleInputChange(e);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 pl-9 pr-10 py-2 text-sm focus:outline-none disabled:opacity-50 overflow-y-auto"
                style={{ minHeight: "36px", maxHeight: "200px" }}
              />

              {/* Send — inside input, bottom-right */}
              <div className="absolute right-1.5 bottom-1">
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFile) || isLoading}
                  className="p-1.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Model selector + Mode selector — below input */}
            <div className="flex items-center gap-1 mt-1.5 px-1">
              {/* Model picker */}
              <div className="relative" ref={modelPickerRef}>
                <button
                  onClick={() => { setShowModelPicker((p) => !p); setShowModePicker(false); }}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {provider === "claude" ? "Claude" : "Gemini"}
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showModelPicker && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[120px] z-20">
                    <button
                      onClick={() => { setProvider("claude"); setShowModelPicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                        provider === "claude"
                          ? "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 font-medium"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${provider === "claude" ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      Claude
                    </button>
                    <button
                      onClick={() => { setProvider("gemini"); setShowModelPicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                        provider === "gemini"
                          ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${provider === "gemini" ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      Gemini
                    </button>
                  </div>
                )}
              </div>

              {/* Separator */}
              <span className="text-slate-300 dark:text-slate-600 text-[11px]">|</span>

              {/* Mode picker */}
              <div className="relative" ref={modePickerRef}>
                <button
                  onClick={() => { setShowModePicker((p) => !p); setShowModelPicker(false); }}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {chatMode === "assistant" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    )}
                  </svg>
                  {chatMode === "assistant" ? "Assistant" : "General"}
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showModePicker && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-20">
                    <button
                      onClick={() => { setChatMode("assistant"); setShowModePicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                        chatMode === "assistant"
                          ? "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 font-medium"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${chatMode === "assistant" ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      Assistant
                    </button>
                    <button
                      onClick={() => { setChatMode("general"); setShowModePicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                        chatMode === "general"
                          ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${chatMode === "general" ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`} />
                      General
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPanel;
