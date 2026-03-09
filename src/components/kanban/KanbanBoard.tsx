import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    pointerWithin,
    rectIntersection,
    getFirstCollision,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    type UniqueIdentifier,
    type CollisionDetection,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { updateTask, updateColumn, createColumn, invalidateBoardCache } from '../../api/boards';
import type { BoardColumn as ColumnType, Task } from '../../api/boards';

// ── ID helpers ────────────────────────────────────────────────────────────────
// Prefix IDs so column "1" (col-1) and task "1" (task-1) never collide inside dnd-kit
const colId = (id: number): string => `col-${id}`;
const taskId = (id: number): string => `task-${id}`;
const isColId = (id: UniqueIdentifier) => String(id).startsWith('col-');
const isTaskId = (id: UniqueIdentifier) => String(id).startsWith('task-');
const parseColId = (id: UniqueIdentifier) => parseInt(String(id).replace('col-', ''), 10);
const parseTaskId = (id: UniqueIdentifier) => parseInt(String(id).replace('task-', ''), 10);

interface KanbanBoardProps {
    projectId: number;
    initialColumns: ColumnType[];
    initialTasks: Task[];
    onTaskClick?: (task: Task) => void;
    /** When flipped to true, opens the Add Column form; resets via onAddColumnConsumed */
    openAddColumn?: boolean;
    onAddColumnConsumed?: () => void;
}

type DragType = 'column' | 'task' | null;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    projectId,
    initialColumns,
    initialTasks,
    onTaskClick,
    openAddColumn,
    onAddColumnConsumed,
}) => {
    const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [dragType, setDragType] = useState<DragType>(null);
    const [showAddColumn, setShowAddColumn] = useState(false);

    useEffect(() => {
        if (openAddColumn) {
            setShowAddColumn(true);
            onAddColumnConsumed?.();
        }
    }, [openAddColumn]);
    const [newColName, setNewColName] = useState('');
    const [newColType, setNewColType] = useState('todo');
    const [newColColor, setNewColColor] = useState('#3b82f6');
    const [addingCol, setAddingCol] = useState(false);
    const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const lastOverId = useRef<UniqueIdentifier | null>(null);
    const recentlyMovedToNewContainer = useRef(false);
    // dragTypeRef mirrors dragType state — always current in event handlers (React 18 state closures are stale)
    const dragTypeRef = useRef<DragType>(null);
    // taskColumnsRef tracks each task's current visual column_id, updated synchronously in onDragOver.
    // Never reads from stale React state closures.
    const taskColumnsRef = useRef<Map<number, number>>(new Map(initialTasks.map(t => [t.id, t.column_id])));

    useEffect(() => {
        taskColumnsRef.current = new Map(initialTasks.map(t => [t.id, t.column_id]));
        setColumns(initialColumns);
        setTasks(initialTasks);
    }, [initialColumns, initialTasks]);

    // Prefixed ID arrays for SortableContext
    const columnsIds = useMemo(() => columns.map((c) => colId(c.id)), [columns]);

    const getTasksForColumn = useCallback(
        (numericColId: number) => tasks.filter((t) => t.column_id === numericColId),
        [tasks]
    );

    // ── CUSTOM COLLISION DETECTION ────────────────────────────────────────────
    const collisionDetection: CollisionDetection = useCallback(
        (args) => {
            if (dragTypeRef.current === 'column') {
                // Only consider column droppables
                return closestCenter({
                    ...args,
                    droppableContainers: args.droppableContainers.filter((c) => isColId(c.id)),
                });
            }

            // Task drag: pointer > rect fallback
            const pointerHits = pointerWithin(args);
            const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args);
            let overId = getFirstCollision(hits, 'id');

            if (overId !== null) {
                if (isColId(overId)) {
                    // Hovering over a column — find closest task inside it
                    const numId = parseColId(overId);
                    const colTasks = getTasksForColumn(numId);
                    if (colTasks.length > 0) {
                        const closest = closestCenter({
                            ...args,
                            droppableContainers: args.droppableContainers.filter((c) =>
                                colTasks.some((t) => taskId(t.id) === c.id)
                            ),
                        });
                        if (closest.length > 0) overId = closest[0].id;
                    }
                }
                lastOverId.current = overId;
                return [{ id: overId }];
            }

            if (recentlyMovedToNewContainer.current) lastOverId.current = null;
            return lastOverId.current ? [{ id: lastOverId.current }] : [];
        },
        [dragType, columns, getTasksForColumn]
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    // ── COLUMN CALLBACKS ──────────────────────────────────────────────────────

    const handleColumnDeleted = (columnId: number) => {
        setColumns((prev) => prev.filter((c) => c.id !== columnId));
        setTasks((prev) => prev.filter((t) => t.column_id !== columnId));
    };

    const handleColumnUpdated = (columnId: number, updates: { name: string; column_type: string; color: string }) => {
        setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, ...updates } as ColumnType : c)));
    };

    const handleAddColumn = async () => {
        const name = newColName.trim();
        if (!name) return;
        setAddingCol(true);
        try {
            const col = await createColumn(projectId, {
                name,
                column_type: newColType,
                color: newColColor,
                order: columns.length,
            });
            setColumns((prev) => [...prev, col]);
            setNewColName('');
            setNewColType('todo');
            setNewColColor('#3b82f6');
            setShowAddColumn(false);
        } catch (e) { console.error(e); }
        setAddingCol(false);
    };

    const handleTaskCreated = (task: Task) => {
        taskColumnsRef.current.set(task.id, task.column_id);
        setTasks((prev) => [...prev, task]);
    };
    const handleTaskDeleted = (taskId: number) => setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // ── DRAG HANDLERS ─────────────────────────────────────────────────────────

    const onDragStart = ({ active }: DragStartEvent) => {
        recentlyMovedToNewContainer.current = false;
        if (isColId(active.id)) {
            const col = columns.find((c) => c.id === parseColId(active.id)) ?? null;
            dragTypeRef.current = 'column';
            setDragType('column');
            setActiveColumn(col);
        } else if (isTaskId(active.id)) {
            const task = tasks.find((t) => t.id === parseTaskId(active.id)) ?? null;
            dragTypeRef.current = 'task';
            setDragType('task');
            setActiveTask(task);
        }
    };

    const onDragOver = ({ active, over }: DragOverEvent) => {
        if (!over || active.id === over.id || dragTypeRef.current !== 'task') return;

        const activeNumId = parseTaskId(active.id);
        const overIsTask = isTaskId(over.id);
        const overIsCol = isColId(over.id);

        // Update taskColumnsRef synchronously — never relies on stale React state closures
        if (overIsTask) {
            const overNumId = parseTaskId(over.id);
            const activeCol = taskColumnsRef.current.get(activeNumId);
            const overCol   = taskColumnsRef.current.get(overNumId);
            if (activeCol !== undefined && overCol !== undefined && activeCol !== overCol) {
                taskColumnsRef.current.set(activeNumId, overCol);
                recentlyMovedToNewContainer.current = true;
            }
        } else if (overIsCol) {
            const newColNum = parseColId(over.id);
            const activeCol = taskColumnsRef.current.get(activeNumId);
            if (activeCol !== undefined && activeCol !== newColNum) {
                taskColumnsRef.current.set(activeNumId, newColNum);
                recentlyMovedToNewContainer.current = true;
            }
        }

        // Visual update via state updater (gets true latest prev)
        setTasks((prev) => {
            const activeIdx = prev.findIndex((t) => t.id === activeNumId);
            if (activeIdx === -1) return prev;

            if (overIsTask) {
                const overNumId = parseTaskId(over.id);
                const overIdx = prev.findIndex((t) => t.id === overNumId);
                if (overIdx === -1) return prev;
                const updated = [...prev];
                if (updated[activeIdx].column_id !== updated[overIdx].column_id) {
                    updated[activeIdx] = { ...updated[activeIdx], column_id: updated[overIdx].column_id };
                }
                return arrayMove(updated, activeIdx, overIdx);
            }

            if (overIsCol) {
                const newColNum = parseColId(over.id);
                if (prev[activeIdx].column_id === newColNum) return prev;
                const updated = [...prev];
                updated[activeIdx] = { ...updated[activeIdx], column_id: newColNum };
                return arrayMove(updated, activeIdx, activeIdx);
            }

            return prev;
        });
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        const type = dragTypeRef.current;
        dragTypeRef.current = null;
        setDragType(null);
        setActiveColumn(null);
        setActiveTask(null);

        // Column reorder: uses over.id (column IDs are reliable)
        if (type === 'column') {
            if (!over || active.id === over.id) return;
            setColumns((prev) => {
                const from = prev.findIndex((c) => colId(c.id) === active.id);
                const to = prev.findIndex((c) => colId(c.id) === over.id);
                if (from === -1 || to === -1) return prev;
                const next = arrayMove(prev, from, to);
                const updates = next.filter((col, idx) => col.order !== idx);
                if (updates.length > 0) {
                    Promise.all(updates.map((col) => {
                        const idx = next.indexOf(col);
                        return updateColumn(projectId, col.id, { order: idx });
                    })).then(() => invalidateBoardCache(projectId)).catch(console.error);
                }
                return next.map((col, idx) => ({ ...col, order: idx }));
            });
        }

        // Task move: read the dragged task's current column directly from taskColumnsRef.
        // Never uses over.id for column resolution — collision detection can return stale/wrong IDs.
        if (type === 'task') {
            if (!over) return; // cancelled drag (e.g. Escape key)
            const activeNumId = parseTaskId(active.id);
            const targetColId = taskColumnsRef.current.get(activeNumId);
            if (targetColId !== undefined) {
                updateTask(projectId, activeNumId, {
                    column_id: targetColId,
                    order: 0,
                }).then(() => invalidateBoardCache(projectId)).catch(console.error);
            }
        }
    };

    return (
        <div className="flex w-full h-full overflow-x-auto p-4 gap-4 items-stretch">
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex gap-4 items-stretch">
                    <SortableContext items={columnsIds} strategy={horizontalListSortingStrategy}>
                        {columns.map((col) => (
                            <KanbanColumn
                                key={col.id}
                                column={col}
                                tasks={getTasksForColumn(col.id)}
                                isDraggingTask={dragType === 'task'}
                                onTaskClick={onTaskClick}
                                onColumnDeleted={handleColumnDeleted}
                                onColumnUpdated={handleColumnUpdated}
                                onTaskCreated={handleTaskCreated}
                                onTaskDeleted={handleTaskDeleted}
                            />
                        ))}
                    </SortableContext>
                </div>


                <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
                    {activeColumn && (
                        <KanbanColumn
                            column={activeColumn}
                            tasks={getTasksForColumn(activeColumn.id)}
                            isDraggingTask={false}
                        />
                    )}
                    {activeTask && <TaskCard task={activeTask} isOverlay />}
                </DragOverlay>
            </DndContext>

            {/* Add Column Modal */}
            {showAddColumn && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                            <h3 className="text-lg font-bold">New Column</h3>
                            <button
                                onClick={() => { setShowAddColumn(false); setNewColName(''); }}
                                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Column Name <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="e.g. In Review"
                                    value={newColName}
                                    onChange={(e) => setNewColName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn(); if (e.key === 'Escape') { setShowAddColumn(false); setNewColName(''); } }}
                                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Column Type</label>
                                <select
                                    value={newColType}
                                    onChange={(e) => setNewColType(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                                >
                                    <option value="backlog">Backlog</option>
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="bug">Bug</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Identification Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newColColor}
                                        onChange={(e) => setNewColColor(e.target.value)}
                                        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                    />
                                    <span className="text-xs text-slate-500">Appears as a ring on the column header</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={handleAddColumn}
                                disabled={addingCol || !newColName.trim()}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                            >
                                {addingCol ? 'Adding…' : 'Add Column'}
                            </button>
                            <button
                                onClick={() => { setShowAddColumn(false); setNewColName(''); }}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-lg transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
