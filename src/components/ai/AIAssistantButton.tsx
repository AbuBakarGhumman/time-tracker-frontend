import React, { useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAIAssistant } from "../../context/AIAssistantContext";
import type { ButtonCorner } from "../../context/AIAssistantContext";
import AIAssistantPanel from "./AIAssistantPanel";

const HEADER_HEIGHT = 64; // h-16 top navbar
const PADDING = 16;

/** Get current sidebar width from the DOM (0 on mobile / hidden) */
const getSidebarWidth = (): number => {
  const aside = document.querySelector("aside");
  if (!aside || aside.offsetParent === null) return 0;
  return aside.getBoundingClientRect().width;
};

/** Build corner positions respecting header + sidebar */
const getCornerStyles = (sidebarW: number): Record<ButtonCorner, React.CSSProperties> => ({
  "bottom-right": { bottom: PADDING, right: PADDING },
  "bottom-left": { bottom: PADDING, left: sidebarW + PADDING },
  "top-right": { top: HEADER_HEIGHT + PADDING, right: PADDING },
  "top-left": { top: HEADER_HEIGHT + PADDING, left: sidebarW + PADDING },
});

const AIAssistantButton: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, isMinimized, openPanel, restorePanel, buttonCorner, setButtonCorner } = useAIAssistant();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [sidebarW, setSidebarW] = useState(getSidebarWidth);

  // Keep sidebar width in sync (collapse/expand + resize)
  useEffect(() => {
    const measure = () => setSidebarW(getSidebarWidth());
    const aside = document.querySelector("aside");
    aside?.addEventListener("transitionend", measure);
    window.addEventListener("resize", measure);
    return () => {
      aside?.removeEventListener("transitionend", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const cornerStyles = getCornerStyles(sidebarW);

  // Content area boundaries for drag clamping
  const contentLeft = sidebarW;
  const contentTop = HEADER_HEIGHT;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (!isDragging && Math.abs(dx) + Math.abs(dy) > 5) {
      setIsDragging(true);
    }
    if (isDragging || Math.abs(dx) + Math.abs(dy) > 5) {
      // Clamp to content area (below header, right of sidebar)
      const clampedX = Math.max(contentLeft + PADDING + 28, Math.min(window.innerWidth - PADDING - 28, e.clientX));
      const clampedY = Math.max(contentTop + PADDING + 28, Math.min(window.innerHeight - PADDING - 28, e.clientY));
      setDragPos({ x: clampedX, y: clampedY });
    }
  }, [isDragging, contentLeft, contentTop]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;

    if (!isDragging || !start) {
      setIsDragging(false);
      setDragPos(null);
      const dx = Math.abs(e.clientX - start!.x);
      const dy = Math.abs(e.clientY - start!.y);
      if (dx + dy < 5) {
        if (isMinimized) {
          restorePanel();
        } else {
          openPanel();
        }
      }
      return;
    }

    // Snap to nearest corner — midpoints relative to content area
    const midX = contentLeft + (window.innerWidth - contentLeft) / 2;
    const midY = contentTop + (window.innerHeight - contentTop) / 2;
    const isRight = e.clientX > midX;
    const isBottom = e.clientY > midY;

    let corner: ButtonCorner;
    if (isBottom && isRight) corner = "bottom-right";
    else if (isBottom && !isRight) corner = "bottom-left";
    else if (!isBottom && isRight) corner = "top-right";
    else corner = "top-left";

    setButtonCorner(corner);
    setIsDragging(false);
    setDragPos(null);
  }, [isDragging, isMinimized, openPanel, restorePanel, setButtonCorner, contentLeft, contentTop]);

  // Hide button when panel is fully open (not minimized)
  const showButton = !isOpen || isMinimized;

  // Midpoints for drag indicator highlight
  const midX = contentLeft + (window.innerWidth - contentLeft) / 2;
  const midY = contentTop + (window.innerHeight - contentTop) / 2;

  return (
    <>
      {/* Floating button */}
      {showButton && (
        <>
          <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`fixed w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40 select-none touch-none transition-all duration-200 ${
              isDragging
                ? "scale-110 shadow-2xl cursor-grabbing bg-gradient-to-r from-violet-600 to-blue-600"
                : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 hover:scale-110 hover:shadow-xl cursor-grab"
            }`}
            style={
              isDragging && dragPos
                ? { left: dragPos.x - 28, top: dragPos.y - 28, position: "fixed" as const, transition: "none" }
                : cornerStyles[buttonCorner]
            }
            title={isMinimized ? t("ai.restoreAssistant") : t("ai.openAssistant")}
          >
            <svg className="w-6 h-6 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {/* Minimized indicator dot */}
            {isMinimized && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>

          {/* Corner indicators while dragging */}
          {isDragging && (
            <>
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as ButtonCorner[]).map((corner) => {
                const isActive =
                  dragPos &&
                  (() => {
                    return (
                      (corner.includes("right") ? dragPos.x > midX : dragPos.x <= midX) &&
                      (corner.includes("bottom") ? dragPos.y > midY : dragPos.y <= midY)
                    );
                  })();
                return (
                  <div
                    key={corner}
                    className={`fixed w-16 h-16 rounded-full border-2 border-dashed transition-all duration-150 ${
                      isActive
                        ? "border-violet-500 bg-violet-500/20 scale-110"
                        : "border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/50"
                    }`}
                    style={cornerStyles[corner]}
                  />
                );
              })}
            </>
          )}
        </>
      )}

      {/* Chat panel */}
      <AIAssistantPanel />
    </>
  );
};

export default AIAssistantButton;
