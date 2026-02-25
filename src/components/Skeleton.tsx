import React from "react";

interface SkeletonProps {
  variant?: "card" | "line" | "chart" | "table";
  className?: string;
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md border border-slate-200 p-5 animate-pulse ${className}`}>
    <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
    <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
    <div className="h-3 bg-slate-200 rounded w-1/4" />
  </div>
);

export const SkeletonChart: React.FC<{ className?: string; height?: string }> = ({ 
  className = "", 
  height = "h-80" 
}) => (
  <div className={`bg-white rounded-xl shadow-md border border-slate-200 p-6 animate-pulse ${className}`}>
    <div className="h-6 bg-slate-200 rounded w-1/3 mb-6" />
    <div className={`${height} bg-gradient-to-b from-slate-200 to-slate-100 rounded-lg`} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = "" 
}) => (
  <div className={`bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-pulse ${className}`}>
    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
      <div className="h-5 bg-slate-200 rounded w-1/4" />
    </div>
    <div className="divide-y divide-slate-200">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="px-6 py-4 flex gap-4">
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded flex-1" />
          <div className="h-4 bg-slate-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`h-4 bg-slate-200 rounded animate-pulse ${className}`} />
);

const Skeleton: React.FC<SkeletonProps> = ({ variant = "card", className = "" }) => {
  switch (variant) {
    case "card":
      return <SkeletonCard className={className} />;
    case "chart":
      return <SkeletonChart className={className} />;
    case "table":
      return <SkeletonTable className={className} />;
    case "line":
      return <SkeletonLine className={className} />;
    default:
      return <SkeletonCard className={className} />;
  }
};

export default Skeleton;
