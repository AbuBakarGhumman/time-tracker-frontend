import React, { useState } from 'react';
import type { Label } from '../../api/boards';
import { createLabel, updateLabel, deleteLabel, addTaskLabel, removeTaskLabel } from '../../api/boards';

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

interface LabelManagerProps {
    projectId: number;
    labels: Label[];
    taskId?: number;
    taskLabels?: Label[];
    onLabelsChanged: (labels: Label[]) => void;
    onTaskLabelsChanged?: (labels: Label[]) => void;
    onClose: () => void;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
    projectId, labels, taskId, taskLabels = [], onLabelsChanged, onTaskLabelsChanged, onClose,
}) => {
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#3b82f6');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            const label = await createLabel(projectId, { name: newName.trim(), color: newColor });
            onLabelsChanged([...labels, label]);
            setNewName('');
        } catch {}
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) return;
        try {
            const updated = await updateLabel(projectId, id, { name: editName.trim(), color: editColor });
            onLabelsChanged(labels.map(l => l.id === id ? updated : l));
            setEditingId(null);
        } catch {}
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteLabel(projectId, id);
            onLabelsChanged(labels.filter(l => l.id !== id));
        } catch {}
    };

    const toggleTaskLabel = async (label: Label) => {
        if (!taskId || !onTaskLabelsChanged) return;
        const attached = taskLabels.some(l => l.id === label.id);
        try {
            if (attached) {
                await removeTaskLabel(projectId, taskId, label.id);
                onTaskLabelsChanged(taskLabels.filter(l => l.id !== label.id));
            } else {
                await addTaskLabel(projectId, taskId, label.id);
                onTaskLabelsChanged([...taskLabels, label]);
            }
        } catch {}
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                    <h3 className="text-lg font-bold">{taskId ? 'Task Labels' : 'Manage Labels'}</h3>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                    {/* Existing labels */}
                    {labels.map(label => (
                        <div key={label.id} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                            {taskId && (
                                <button onClick={() => toggleTaskLabel(label)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${
                                        taskLabels.some(l => l.id === label.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                    }`}>
                                    {taskLabels.some(l => l.id === label.id) && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                </button>
                            )}
                            {editingId === label.id ? (
                                <div className="flex-1 flex gap-2">
                                    <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 text-sm border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400" />
                                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                                    <button onClick={() => handleUpdate(label.id)} className="text-xs text-blue-600 font-semibold">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-xs text-slate-400">Cancel</button>
                                </div>
                            ) : (
                                <>
                                    <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                                    <span className="flex-1 text-sm text-slate-700">{label.name}</span>
                                    <button onClick={() => { setEditingId(label.id); setEditName(label.name); setEditColor(label.color); }}
                                        className="text-xs text-slate-400 hover:text-slate-600">Edit</button>
                                    {!taskId && (
                                        <button onClick={() => handleDelete(label.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                                    )}
                                </>
                            )}
                        </div>
                    ))}

                    {/* Create new */}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">New Label</label>
                        <div className="flex gap-2">
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Label name"
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
                            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5" />
                        </div>
                        <div className="flex gap-1 mt-2">
                            {PRESET_COLORS.map(c => (
                                <button key={c} onClick={() => setNewColor(c)}
                                    className={`w-6 h-6 rounded-full transition ${newColor === c ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                                    style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <button onClick={handleCreate} disabled={!newName.trim()}
                            className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            Create Label
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
