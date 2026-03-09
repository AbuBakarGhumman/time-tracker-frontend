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
import { updateTask, updateColumn, createColumn } from '../../api/boards';
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
}

type DragType = 'column' | 'task' | null;

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    projectId,
    initialColumns,
    initialTasks,
    onTaskClick,
}) => {
    const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [dragType, setDragType] = useState<DragType>(null);
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [newColType, setNewColType] = useState('todo');
    const [newColColor, setNewColColor] = useState('#3b82f6');
    const [addingCol, setAddingCol] = useState(false);
    const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const lastOverId = useRef<UniqueIdentifier | null>(null);
    const recentlyMovedToNewContainer = useRef(false);

    useEffect(() => { setColumns(initialColumns); setTasks(initialTasks); }, [initialColumns, initialTasks]);

    // Prefixed ID arrays for SortableContext
    const columnsIds = useMemo(() => columns.map((c) => colId(c.id)), [columns]);

    const getTasksForColumn = useCallback(
        (numericColId: number) => tasks.filter((t) => t.column_id === numericColId),
        [tasks]
    );

    // ── CUSTOM COLLISION DETECTION ────────────────────────────────────────────
    const collisionDetection: CollisionDetection = useCallback(
        (args) => {
            if (dragType === 'column') {
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
        setColumns((prev) => prev.map((c) => (c.id === columnId ? { ...c, ...updates } : c)));
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

    const handleTaskCreated = (task: Task) => setTasks((prev) => [...prev, task]);
    const handleTaskDeleted = (taskId: number) => setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // ── DRAG HANDLERS ─────────────────────────────────────────────────────────

    const onDragStart = ({ active }: DragStartEvent) => {
        recentlyMovedToNewContainer.current = false;
        if (isColId(active.id)) {
            const col = columns.find((c) => c.id === parseColId(active.id)) ?? null;
            setDragType('column');
            setActiveColumn(col);
        } else if (isTaskId(active.id)) {
            const task = tasks.find((t) => t.id === parseTaskId(active.id)) ?? null;
            setDragType('task');
            setActiveTask(task);
        }
    };

    const onDragOver = ({ active, over }: DragOverEvent) => {
        if (!over || active.id === over.id || dragType !== 'task') return;

        const activeNumId = parseTaskId(active.id);
        const overIsTask = isTaskId(over.id);
        const overIsCol = isColId(over.id);

        setTasks((prev) => {
            const activeIdx = prev.findIndex((t) => t.id === activeNumId);
            if (activeIdx === -1) return prev;

            if (overIsTask) {
                const overNumId = parseTaskId(over.id);
                const overIdx = prev.findIndex((t) => t.id === overNumId);
                const updated = [...prev];
                if (updated[activeIdx].column_id !== updated[overIdx].column_id) {
                    recentlyMovedToNewContainer.current = true;
                    updated[activeIdx] = { ...updated[activeIdx], column_id: updated[overIdx].column_id };
                }
                return arrayMove(updated, activeIdx, overIdx);
            }

            if (overIsCol) {
                const newColId = parseColId(over.id);
                if (prev[activeIdx].column_id === newColId) return prev;
                recentlyMovedToNewContainer.current = true;
                const updated = [...prev];
                updated[activeIdx] = { ...updated[activeIdx], column_id: newColId };
                return arrayMove(updated, activeIdx, activeIdx);
            }

            return prev;
        });
    };

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        const type = dragType;
        setDragType(null);
        setActiveColumn(null);
        setActiveTask(null);

        if (!over || active.id === over.id) return;

        if (type === 'column') {
            setColumns((prev) => {
                const from = prev.findIndex((c) => colId(c.id) === active.id);
                const to = prev.findIndex((c) => colId(c.id) === over.id);
                if (from === -1 || to === -1) return prev;
                const next = arrayMove(prev, from, to);
                next.forEach((col, idx) => {
                    if (col.order !== idx) updateColumn(projectId, col.id, { order: idx }).catch(console.error);
                });
                return next.map((col, idx) => ({ ...col, order: idx }));
            });
        }

        if (type === 'task') {
            const numId = parseTaskId(active.id);
            const moved = tasks.find((t) => t.id === numId);
            if (moved) {
                const finalOrder = tasks.filter((t) => t.column_id === moved.column_id).findIndex((t) => t.id === numId);
                updateTask(projectId, numId, {
                    column_id: moved.column_id,
                    order: finalOrder >= 0 ? finalOrder : 0,
                }).catch(console.error);
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

                {/* Add Column button / form — outside SortableContext so it doesn't participate in drag */}
                <div className="shrink-0 self-start">
                    {showAddColumn ? (
                        <div className="bg-white border border-slate-200 rounded-xl w-[300px] p-4 flex flex-col gap-3 shadow-md">
                            <h3 className="font-bold text-slate-800 text-sm">New Column</h3>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Column Name <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="e.g. In Review"
                                    value={newColName}
                                    onChange={(e) => setNewColName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn(); if (e.key === 'Escape') setShowAddColumn(false); }}
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
                                    <span className="text-xs text-slate-500">This color appears as a ring on the column header</span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={handleAddColumn}
                                    disabled={addingCol || !newColName.trim()}
                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                                >
                                    {addingCol ? 'Adding…' : 'Add Column'}
                                </button>
                                <button
                                    onClick={() => { setShowAddColumn(false); setNewColName(''); }}
                                    className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddColumn(true)}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500 font-medium hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border-2 border-dashed border-slate-300 hover:border-blue-400 w-[300px] whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Column
                        </button>
                    )}
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
        </div>
    );
};
