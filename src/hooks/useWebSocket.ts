import { useEffect, useRef, useCallback } from "react";
import { getStoredToken } from "../api/auth";

const WS_BASE = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";

type MessageHandler = (data: any) => void;

/**
 * Opens a WebSocket connection to /ws?token=<jwt>.
 * Automatically reconnects on disconnect (up to maxRetries times).
 * Calls onMessage for every JSON message received.
 */
export function useWebSocket(onMessage: MessageHandler, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const cancelRef = useRef(false);
  const maxRetries = 5;
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const token = getStoredToken();
    if (!token || !enabled || cancelRef.current) return;

    const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessageRef.current(parsed);
      } catch {
        // ignore non-JSON frames
      }
    };

    ws.onclose = () => {
      // If wsRef no longer points to this socket, it was intentionally closed — don't reconnect
      if (ws !== wsRef.current) return;
      wsRef.current = null;
      if (!cancelRef.current && retryRef.current < maxRetries) {
        const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
        retryRef.current += 1;
        setTimeout(connect, delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled]);

  useEffect(() => {
    cancelRef.current = false;
    connect();
    return () => {
      cancelRef.current = true;
      // Null wsRef BEFORE calling close so onclose sees a stale socket and skips reconnect
      const ws = wsRef.current;
      wsRef.current = null;
      ws?.close();
    };
  }, [connect]);
}
