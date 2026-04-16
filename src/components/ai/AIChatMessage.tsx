import React from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../../context/AIAssistantContext";
import AIActionCard from "./AIActionCard";
import AIChart from "./AIChart";
import AIDocument from "./AIDocument";
import { parseChartBlocks } from "./chartUtils";
import { parseDocumentBlocks } from "./AIDocument";

interface AIChatMessageProps {
  message: ChatMessage;
}

const READ_ONLY_ACTIONS = [
  "list_projects", "get_board_columns", "get_project_members", "get_project_status",
  "get_tasks", "get_active_timer", "get_time_entries", "get_attendance_status",
  "get_attendance_history", "get_attendance_stats", "get_notifications", "get_my_profile",
  "get_task_notes", "get_task_activity", "get_productivity_summary", "get_team_analytics",
  "get_platform_stats", "get_platform_users", "get_user_detail", "get_platform_companies",
  "get_company_detail", "get_onboarding_trends", "get_platform_recent_activity",
];

// Shared markdown component config
const markdownComponents = {
  h1: ({ children }: any) => <h1 className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2 first:mt-0">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2 first:mt-0">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-3 mb-1.5 first:mt-0">{children}</h3>,
  p: ({ children }: any) => <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3 last:mb-0">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-slate-600 dark:text-slate-300">{children}</em>,
  ul: ({ children }: any) => <ul className="mb-3 ml-4 space-y-1 list-disc marker:text-slate-400">{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-3 ml-4 space-y-1 list-decimal marker:text-slate-500">{children}</ol>,
  li: ({ children }: any) => <li className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed pl-1">{children}</li>,
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-600" />,
  code: ({ children, className }: any) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return <code className="block bg-slate-900 text-slate-100 rounded-lg px-4 py-3 my-3 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed">{children}</code>;
    }
    return <code className="bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-1.5 py-0.5 text-xs font-mono">{children}</code>;
  },
  pre: ({ children }: any) => <pre className="my-3 rounded-lg overflow-hidden">{children}</pre>,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-violet-400 pl-4 my-3 text-slate-600 italic bg-violet-50/50 py-2 rounded-r-lg">{children}</blockquote>,
  table: ({ children }: any) => <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm"><table className="w-full text-sm">{children}</table></div>,
  thead: ({ children }: any) => <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">{children}</td>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 transition-colors">{children}</a>,
};

const AIChatMessage: React.FC<AIChatMessageProps> = ({ message }) => {
  const { t } = useTranslation();
  const isUser = message.role === "user";

  // ── User message ──
  if (isUser) {
    const hasFile = message.content.startsWith("\ud83d\udcce ");
    const newlineIdx = message.content.indexOf("\n");
    const fileName = hasFile ? (newlineIdx > 0 ? message.content.slice(2, newlineIdx).trim() : message.content.slice(2).trim()) : null;
    const textContent = hasFile && newlineIdx > 0 ? message.content.slice(newlineIdx + 1).trim() : (!hasFile ? message.content : null);

    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%]">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed">
            {fileName && (
              <div className="flex items-center gap-1.5 mb-1.5 bg-white/15 rounded-lg px-2.5 py-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-medium text-white/90 truncate">{fileName}</span>
              </div>
            )}
            {textContent && <div className="whitespace-pre-wrap">{textContent}</div>}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  // ── AI message ──
  const meaningful = (message.actions || []).filter(
    (a) => !READ_ONLY_ACTIONS.includes(a.action_type) && a.detail?.trim()
  );

  // Parse charts and documents from content
  const { text: textAfterCharts, charts } = parseChartBlocks(message.content);
  const { text: cleanText, docs } = parseDocumentBlocks(textAfterCharts);
  // Split on both chart and doc placeholders, keeping the type prefix
  const segments = cleanText.split(/(<!--(?:chart|doc)-\d+-->)/);

  return (
    <div className="mb-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t("ai.title")}</span>
        <span className="text-[10px] text-slate-400">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Content — markdown + inline charts */}
      <div className="pl-9">
        {segments.map((segment, i) => {
          // Check if this is a chart placeholder
          const chartMatch = segment.match(/<!--chart-(\d+)-->/);
          if (chartMatch) {
            const config = charts[parseInt(chartMatch[1], 10)];
            return config ? <AIChart key={`chart-${i}`} config={config} /> : null;
          }
          // Check if this is a document placeholder
          const docMatch = segment.match(/<!--doc-(\d+)-->/);
          if (docMatch) {
            const config = docs[parseInt(docMatch[1], 10)];
            return config ? <AIDocument key={`doc-${i}`} config={config} /> : null;
          }
          // Regular text — render as markdown
          if (!segment.trim()) return null;
          return (
            <ReactMarkdown key={`md-${i}`} remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {segment}
            </ReactMarkdown>
          );
        })}

        {/* Action cards */}
        {meaningful.length > 0 && (
          <div className="mt-3 space-y-2">
            {meaningful.map((action, i) => (
              <AIActionCard key={i} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatMessage;
