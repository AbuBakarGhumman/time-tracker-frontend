import React from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../../context/AIAssistantContext";
import AIActionCard from "./AIActionCard";

interface AIChatMessageProps {
  message: ChatMessage;
}

const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? "order-2" : "order-1"}`}>
        {/* Avatar + name row */}
        <div className={`flex items-center gap-1.5 mb-1 ${isUser ? "justify-end" : "justify-start"}`}>
          {!isUser && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {isUser ? "You" : "AI Assistant"}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md"
              : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md"
          }`}
        >
          {isUser ? (
            (() => {
              // Check if message has an attached file (starts with 📎)
              if (message.content.startsWith("📎 ")) {
                const newlineIdx = message.content.indexOf("\n");
                const fileName = newlineIdx > 0
                  ? message.content.slice(2).substring(0, newlineIdx - 2).trim()
                  : message.content.slice(2).trim();
                const textContent = newlineIdx > 0
                  ? message.content.slice(newlineIdx + 1).trim()
                  : null;
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5 bg-white/15 rounded-lg px-2.5 py-1.5">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-white/90 truncate">{fileName}</span>
                    </div>
                    {textContent && <div>{textContent}</div>}
                  </div>
                );
              }
              return message.content;
            })()
          ) : (
            <div className="ai-markdown">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1.5 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2 mb-1 first:mt-0">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-2 ml-4 space-y-0.5 list-disc marker:text-slate-400 dark:marker:text-slate-500">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 ml-4 space-y-0.5 list-decimal marker:text-slate-400 dark:marker:text-slate-500">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed">{children}</li>
                  ),
                  hr: () => (
                    <hr className="my-2 border-slate-200 dark:border-slate-600" />
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <code className="block bg-slate-200 dark:bg-slate-800 rounded-lg px-3 py-2 my-2 text-xs font-mono overflow-x-auto whitespace-pre">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="bg-slate-200 dark:bg-slate-800 rounded px-1 py-0.5 text-xs font-mono">
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="my-2">{children}</pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-violet-400 dark:border-violet-500 pl-3 my-2 text-slate-600 dark:text-slate-300 italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2 rounded-lg border border-slate-200 dark:border-slate-600">
                      <table className="w-full text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-200 dark:bg-slate-800">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-2 py-1.5 text-left font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700">{children}</td>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline hover:text-violet-700">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action cards for assistant messages — only show meaningful actions */}
        {!isUser && message.actions && (() => {
          const READ_ONLY_ACTIONS = [
            "list_projects", "get_board_columns", "get_project_members", "get_project_status",
            "get_tasks", "get_active_timer", "get_time_entries", "get_attendance_status",
            "get_attendance_history", "get_attendance_stats", "get_notifications", "get_my_profile",
          ];
          const meaningful = message.actions!.filter(
            (a) => !READ_ONLY_ACTIONS.includes(a.action_type) && a.detail?.trim()
          );
          return meaningful.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {meaningful.map((action, i) => (
                <AIActionCard key={i} action={action} />
              ))}
            </div>
          ) : null;
        })()}

        {/* Timestamp */}
        <p className={`text-[10px] text-slate-400 mt-1 ${isUser ? "text-right" : "text-left"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

export default AIChatMessage;
