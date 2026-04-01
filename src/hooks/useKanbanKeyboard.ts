import { useEffect, useCallback, useRef } from 'react';
import type { Task, BoardColumn } from '../api/boards';

interface Options {
    columns: BoardColumn[];
    tasks: Task[];
    onOpenTask: (task: Task) => void;
    onDeleteTask: (taskId: number) => void;
    enabled?: boolean;
}

export const useKanbanKeyboard = ({ columns, tasks, onOpenTask, onDeleteTask, enabled = true }: Options) => {
    const focusedColIdx = useRef(0);
    const focusedTaskIdx = useRef(0);

    const getTasksForCol = useCallback((colIdx: number) => {
        if (colIdx < 0 || colIdx >= columns.length) return [];
        return tasks.filter(t => t.column_id === columns[colIdx].id);
    }, [columns, tasks]);

    const focusCard = useCallback(() => {
        const colTasks = getTasksForCol(focusedColIdx.current);
        if (colTasks.length === 0) return;
        const taskIdx = Math.min(focusedTaskIdx.current, colTasks.length - 1);
        focusedTaskIdx.current = taskIdx;
        const task = colTasks[taskIdx];
        const el = document.querySelector(`[data-task-id="task-${task.id}"]`) as HTMLElement;
        if (el) {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            el.focus();
        }
    }, [getTasksForCol]);

    useEffect(() => {
        if (!enabled) return;

        const handler = (e: KeyboardEvent) => {
            // Don't intercept when typing in inputs
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            switch (e.key) {
                case 'ArrowRight': {
                    e.preventDefault();
                    focusedColIdx.current = Math.min(focusedColIdx.current + 1, columns.length - 1);
                    focusedTaskIdx.current = 0;
                    focusCard();
                    break;
                }
                case 'ArrowLeft': {
                    e.preventDefault();
                    focusedColIdx.current = Math.max(focusedColIdx.current - 1, 0);
                    focusedTaskIdx.current = 0;
                    focusCard();
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    const colTasks = getTasksForCol(focusedColIdx.current);
                    focusedTaskIdx.current = Math.min(focusedTaskIdx.current + 1, colTasks.length - 1);
                    focusCard();
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    focusedTaskIdx.current = Math.max(focusedTaskIdx.current - 1, 0);
                    focusCard();
                    break;
                }
                case 'Enter': {
                    e.preventDefault();
                    const colTasks = getTasksForCol(focusedColIdx.current);
                    const idx = Math.min(focusedTaskIdx.current, colTasks.length - 1);
                    if (colTasks[idx]) onOpenTask(colTasks[idx]);
                    break;
                }
                case 'Delete':
                case 'Backspace': {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const colTasks = getTasksForCol(focusedColIdx.current);
                        const idx = Math.min(focusedTaskIdx.current, colTasks.length - 1);
                        if (colTasks[idx] && window.confirm(`Delete "${colTasks[idx].title}"?`)) {
                            onDeleteTask(colTasks[idx].id);
                        }
                    }
                    break;
                }
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [enabled, columns, tasks, getTasksForCol, focusCard, onOpenTask, onDeleteTask]);
};
