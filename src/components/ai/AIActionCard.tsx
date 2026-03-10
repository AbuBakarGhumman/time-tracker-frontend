import React from "react";
import type { AIActionResult } from "../../api/ai";

interface AIActionCardProps {
  action: AIActionResult;
}

const AIActionCard: React.FC<AIActionCardProps> = ({ action }) => {
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
        action.success
          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
      }`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${action.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
        {action.success ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${action.success ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200"}`}>
          {action.detail}
        </p>
        {action.entity_name && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {action.entity_name}
          </p>
        )}
      </div>
    </div>
  );
};

export default AIActionCard;
