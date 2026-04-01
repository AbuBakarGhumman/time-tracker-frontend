import React, { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
    onSelect: (taskIds: number[]) => void;
    children: React.ReactNode;
    enabled: boolean;
}

export const SelectionOverlay: React.FC<Props> = ({ onSelect, children, enabled }) => {
    const [dragging, setDragging] = useState(false);
    const [start, setStart] = useState({ x: 0, y: 0 });
    const [current, setCurrent] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const getRect = () => {
        const x1 = Math.min(start.x, current.x);
        const y1 = Math.min(start.y, current.y);
        const x2 = Math.max(start.x, current.x);
        const y2 = Math.max(start.y, current.y);
        return { left: x1, top: y1, width: x2 - x1, height: y2 - y1 };
    };

    const findIntersectingTasks = useCallback(() => {
        if (!containerRef.current) return [];
        const rect = getRect();
        const selRect = {
            left: rect.left,
            right: rect.left + rect.width,
            top: rect.top,
            bottom: rect.top + rect.height,
        };
        const ids: number[] = [];
        const cards = containerRef.current.querySelectorAll('[data-task-id]');
        cards.forEach(card => {
            const cr = card.getBoundingClientRect();
            const container = containerRef.current!.getBoundingClientRect();
            const cardRect = {
                left: cr.left - container.left + containerRef.current!.scrollLeft,
                right: cr.right - container.left + containerRef.current!.scrollLeft,
                top: cr.top - container.top + containerRef.current!.scrollTop,
                bottom: cr.bottom - container.top + containerRef.current!.scrollTop,
            };
            if (!(cardRect.right < selRect.left || cardRect.left > selRect.right ||
                  cardRect.bottom < selRect.top || cardRect.top > selRect.bottom)) {
                const id = card.getAttribute('data-task-id');
                if (id) ids.push(parseInt(id.replace('task-', ''), 10));
            }
        });
        return ids;
    }, [start, current]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!enabled) return;
        // Only start lasso on empty space (not on cards)
        const target = e.target as HTMLElement;
        if (target.closest('[data-task-id]') || target.closest('button') || target.closest('input')) return;
        if (!e.ctrlKey && !e.metaKey) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
        const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
        setStart({ x, y });
        setCurrent({ x, y });
        setDragging(true);
    };

    useEffect(() => {
        if (!dragging) return;
        const handleMove = (e: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setCurrent({
                x: e.clientX - rect.left + (containerRef.current?.scrollLeft || 0),
                y: e.clientY - rect.top + (containerRef.current?.scrollTop || 0),
            });
        };
        const handleUp = () => {
            setDragging(false);
            const ids = findIntersectingTasks();
            if (ids.length > 0) onSelect(ids);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [dragging, findIntersectingTasks, onSelect]);

    const rect = getRect();

    return (
        <div ref={containerRef} className="relative w-full h-full" onMouseDown={handleMouseDown}>
            {children}
            {dragging && rect.width > 5 && rect.height > 5 && (
                <div className="absolute pointer-events-none border-2 border-blue-400 bg-blue-100/30 rounded z-30"
                    style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />
            )}
        </div>
    );
};
