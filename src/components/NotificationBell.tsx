import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markRead,
  markAllRead,
  type AppNotification,
} from "../api/notifications";
import axios from "../api/interceptor";
import { API_BASE_URL } from "../api/config";
import { useWebSocket } from "../hooks/useWebSocket";
import { getStoredToken } from "../api/auth";
import CacheManager from "../utils/cacheManager";

const MAX_DROPDOWN = 6;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!getStoredToken();

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await fetchNotifications();
      // Deduplicate by id in case of any double-delivery
      const seen = new Set<number>();
      setNotifications(data.filter((n) => seen.has(n.id) ? false : (seen.add(n.id), true)));
    } catch {
      // silently ignore
    }
  }, [isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  // Sync read state when Notifications page marks items read
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("notifications-updated", handler);
    return () => window.removeEventListener("notifications-updated", handler);
  }, [load]);

  // Real-time: push new notifications over WebSocket
  const handleWsMessage = useCallback((msg: any) => {
    if (msg.type === "new_notification" && msg.data) {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === msg.data.id)) return prev;
        return [msg.data, ...prev];
      });
    }
  }, []);

  useWebSocket(handleWsMessage, isLoggedIn);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen((o) => !o);
    if (!open) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const handleMarkRead = async (n: AppNotification) => {
    if (!n.is_read) {
      await markRead(n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
    }
  };

  const handleItemClick = async (n: AppNotification) => {
    await handleMarkRead(n);
    setOpen(false);
    if ((n.type === "task_mention" || n.type === "task_assignment") && n.data?.project_id && n.data?.task_id) {
      navigate(`/projects/${n.data.project_id}/board?task=${n.data.task_id}`);
    } else {
      navigate("/notifications", { state: { highlightId: n.id } });
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
  };

  const handleAccept = async (n: AppNotification) => {
    if (!n.data?.invitation_id && !n.invitation_id) return;
    const invId = n.invitation_id ?? n.data?.invitation_id;
    setActionId(n.id);
    try {
      await axios.post(`${API_BASE_URL}/invitations/${invId}/accept`);
      CacheManager.clear("projects", {});
      setNotifications((prev) => prev.map((x) =>
        x.id === n.id
          ? { ...x, is_read: true, data: { ...(x.data ?? {}), status: "accepted" } }
          : x
      ));
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
      setNotifications((prev) => prev.map((x) =>
        x.id === n.id
          ? { ...x, is_read: true, data: { ...(x.data ?? {}), status: "declined" } }
          : x
      ));
    } catch {
      // ignore
    } finally {
      setActionId(null);
    }
  };

  if (!isLoggedIn) return null;

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const recent = unreadNotifications.slice(0, MAX_DROPDOWN);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadNotifications.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadNotifications.length > 99 ? "99+" : unreadNotifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-sm font-bold text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => { setOpen(false); navigate("/notifications"); }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                View all
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              </div>
            ) : recent.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">No unread notifications</div>
            ) : (
              recent.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  actionId={actionId}
                  onRead={() => handleItemClick(n)}
                  onAccept={() => handleAccept(n)}
                  onDecline={() => handleDecline(n)}
                />
              ))
            )}
          </div>

          {unreadNotifications.length > MAX_DROPDOWN && (
            <div className="border-t border-slate-700 px-4 py-2 text-center">
              <button
                onClick={() => { setOpen(false); navigate("/notifications"); }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                See {unreadNotifications.length - MAX_DROPDOWN} more unread
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ItemProps {
  n: AppNotification;
  actionId: number | null;
  onRead: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const NotificationItem: React.FC<ItemProps> = ({ n, actionId, onRead, onAccept, onDecline }) => {
  const isPending = n.type === "project_invitation" && n.data?.status !== "accepted" && n.data?.status !== "declined";
  const isActed = n.data?.status === "accepted" || n.data?.status === "declined";

  return (
    <div
      className={`px-4 py-3 border-b border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-700/40 transition-colors ${!n.is_read ? "bg-blue-500/5" : ""}`}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          n.type === "project_invitation" ? "bg-blue-500/20 text-blue-400" :
          n.type === "alert" ? "bg-red-500/20 text-red-400" :
          n.type === "task_mention" ? "bg-purple-500/20 text-purple-400" :
          n.type === "task_assignment" ? "bg-amber-500/20 text-amber-400" :
          "bg-green-500/20 text-green-400"
        }`}>
          {n.type === "project_invitation" ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          ) : n.type === "alert" ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : n.type === "task_mention" ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9" />
            </svg>
          ) : n.type === "task_assignment" ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className={`text-xs font-semibold truncate ${n.is_read ? "text-slate-300" : "text-white"}`}>{n.title}</p>
            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
          </div>
          {n.body && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>}
          <p className="text-[10px] text-slate-500 mt-1">{timeAgo(n.created_at)}</p>

          {/* Invitation action buttons */}
          {isPending && !isActed && (
            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onAccept}
                disabled={actionId === n.id}
                className="flex-1 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {actionId === n.id ? "…" : "Accept"}
              </button>
              <button
                onClick={onDecline}
                disabled={actionId === n.id}
                className="flex-1 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          )}
          {isActed && (
            <p className={`text-[10px] mt-1.5 font-semibold ${n.data?.status === "accepted" ? "text-green-400" : "text-slate-500"}`}>
              {n.data?.status === "accepted" ? "✓ Accepted" : "✗ Declined"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
