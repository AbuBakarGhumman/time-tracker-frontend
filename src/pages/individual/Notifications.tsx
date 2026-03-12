import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  type AppNotification,
} from "../../api/notifications";
import axios from "../../api/interceptor";
import { API_BASE_URL } from "../../api/config";
import CacheManager from "../../utils/cacheManager";
import AnalogClockIcon from "../../components/AnalogClockIcon";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

const TYPE_META: Record<string, { label: string; badge: string; icon: string; dot: string }> = {
  project_invitation: {
    label: "Invitation",
    badge: "bg-blue-100 text-blue-700",
    icon: "bg-blue-100 text-blue-600",
    dot: "bg-blue-500",
  },
  info: {
    label: "Info",
    badge: "bg-green-100 text-green-700",
    icon: "bg-green-100 text-green-600",
    dot: "bg-green-500",
  },
  alert: {
    label: "Alert",
    badge: "bg-red-100 text-red-700",
    icon: "bg-red-100 text-red-600",
    dot: "bg-red-500",
  },
  task_mention: {
    label: "Mention",
    badge: "bg-purple-100 text-purple-700",
    icon: "bg-purple-100 text-purple-600",
    dot: "bg-purple-500",
  },
  task_assignment: {
    label: "Assignment",
    badge: "bg-amber-100 text-amber-700",
    icon: "bg-amber-100 text-amber-600",
    dot: "bg-amber-500",
  },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const NotificationSkeleton: React.FC = () => (
  <div className="p-1">
    {/* Header skeleton */}
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-4 mb-6 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse" />
        <div>
          <div className="h-5 bg-white/20 rounded w-40 mb-2 animate-pulse" />
          <div className="h-3 bg-white/20 rounded w-64 animate-pulse" />
        </div>
      </div>
    </div>
    {/* Cards skeleton */}
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="h-5 bg-slate-200 rounded w-40 animate-pulse" />
        <div className="h-8 bg-slate-200 rounded-lg w-44 animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg animate-pulse">
            <div className="w-9 h-9 bg-slate-200 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const Notifications: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [highlightId, setHighlightId] = useState<number | null>(
    (location.state as any)?.highlightId ?? null
  );
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotifications(await fetchNotifications());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Scroll to and highlight the target notification, then clear after 2s
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = document.getElementById(`notif-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    highlightTimerRef.current = setTimeout(() => setHighlightId(null), 2000);
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [highlightId, loading]);

  const handleMarkRead = async (n: AppNotification) => {
    if (n.is_read) return;
    await markRead(n.id);
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((x) => x.id !== id));
  };

  const handleAccept = async (n: AppNotification) => {
    const invId = n.invitation_id ?? n.data?.invitation_id;
    if (!invId) return;
    setActionId(n.id);
    try {
      await axios.post(`${API_BASE_URL}/invitations/${invId}/accept`);
      CacheManager.clear("projects", {});
      setNotifications((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, is_read: true, data: { ...(x.data ?? {}), status: "accepted" } } : x
        )
      );
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (n: AppNotification) => {
    const invId = n.invitation_id ?? n.data?.invitation_id;
    if (!invId) return;
    setActionId(n.id);
    try {
      await axios.post(`${API_BASE_URL}/invitations/${invId}/decline`);
      setNotifications((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, is_read: true, data: { ...(x.data ?? {}), status: "declined" } } : x
        )
      );
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <NotificationSkeleton />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayed = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="p-1">
      {/* ── Gradient page header ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl px-6 py-4 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <AnalogClockIcon size={50} className="flex-shrink-0" />
            <div>
              <p className="text-base font-bold text-white mb-1 flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </p>
              <p className="text-sm text-white/90">
                Project invitations, alerts, and activity updates
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* ── Main card ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        {/* Card header with filter toggle */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {filter === "unread" ? "Unread" : "All"} Notifications
          </h2>
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${
                  filter === f
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "all"
                  ? `All (${notifications.length})`
                  : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {displayed.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-slate-600 font-semibold text-lg">
              {filter === "unread" ? "All caught up!" : "No notifications yet"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {filter === "unread"
                ? "You have no unread notifications."
                : "Notifications will appear here when you receive them."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.info;
              const isPending =
                n.type === "project_invitation" &&
                n.data?.status !== "accepted" &&
                n.data?.status !== "declined";
              const isActed =
                n.type === "project_invitation" &&
                (n.data?.status === "accepted" || n.data?.status === "declined");

              const isHighlighted = highlightId === n.id;

              return (
                <div
                  key={n.id}
                  id={`notif-${n.id}`}
                  onClick={() => {
                    if (!isPending) handleMarkRead(n);
                    if ((n.type === "task_mention" || n.type === "task_assignment") && n.data?.project_id && n.data?.task_id) {
                      navigate(`/projects/${n.data.project_id}/board?task=${n.data.task_id}`);
                    }
                  }}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-500 ${
                    isHighlighted
                      ? "bg-blue-100 border-blue-500 shadow-md shadow-blue-300/50 ring-2 ring-blue-400/40"
                      : !n.is_read
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100/70"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {/* Type icon */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.icon}`}
                  >
                    {n.type === "project_invitation" ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    ) : n.type === "alert" ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : n.type === "task_mention" ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9" />
                      </svg>
                    ) : n.type === "task_assignment" ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                          {meta.label}
                        </span>
                        <h3 className={`text-sm font-semibold ${n.is_read ? "text-slate-700" : "text-slate-900"}`}>
                          {n.title}
                        </h3>
                        {!n.is_read && (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                        <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          className="p-1 text-slate-300 hover:text-red-500 rounded transition"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {n.body && !isActed && (
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{n.body}</p>
                    )}

                    {/* Invitation action buttons */}
                    {isPending && (
                      <div
                        className="flex gap-2 mt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleAccept(n)}
                          disabled={actionId === n.id}
                          className="px-5 py-1.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                          {actionId === n.id ? "Processing…" : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDecline(n)}
                          disabled={actionId === n.id}
                          className="px-5 py-1.5 text-sm font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {isActed && (
                      <div
                        className={`mt-2 px-3 py-2 rounded-lg text-xs font-medium flex items-start gap-2 ${
                          n.data?.status === "accepted"
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : n.data?.status === "declined"
                            ? "bg-slate-100 border border-slate-200 text-slate-500"
                            : "bg-slate-100 border border-slate-200 text-slate-500"
                        }`}
                      >
                        {n.data?.status === "accepted" ? (
                          <>
                            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>
                              You accepted <strong>{n.data?.inviter_name}</strong>'s invitation to join <strong>"{n.data?.project_name}"</strong> as <strong>{n.data?.role}</strong>.
                            </span>
                          </>
                        ) : n.data?.status === "declined" ? (
                          <>
                            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>
                              You declined <strong>{n.data?.inviter_name}</strong>'s invitation to join <strong>"{n.data?.project_name}"</strong> as <strong>{n.data?.role}</strong>.
                            </span>
                          </>
                        ) : (
                          <span>This invitation has already been actioned.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
