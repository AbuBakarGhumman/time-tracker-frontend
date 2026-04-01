import React, { useState, useEffect } from 'react';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../api/boards';
import type { TaskTemplate } from '../../api/boards';

interface Props {
    projectId: number;
    onClose: () => void;
}

export const TemplateManager: React.FC<Props> = ({ projectId, onClose }) => {
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [name, setName] = useState('');
    const [titleTpl, setTitleTpl] = useState('');
    const [descTpl, setDescTpl] = useState('');
    const [priority, setPriority] = useState('medium');
    const [editId, setEditId] = useState<number | null>(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try { setTemplates(await fetchTemplates(projectId)); } catch {}
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        try {
            if (editId) {
                const updated = await updateTemplate(projectId, editId, {
                    name: name.trim(), title_template: titleTpl, description_template: descTpl, default_priority: priority,
                });
                setTemplates(prev => prev.map(t => t.id === editId ? updated : t));
            } else {
                const created = await createTemplate(projectId, {
                    name: name.trim(), title_template: titleTpl, description_template: descTpl, default_priority: priority,
                });
                setTemplates(prev => [...prev, created]);
            }
            resetForm();
        } catch {}
    };

    const handleDelete = async (id: number) => {
        try { await deleteTemplate(projectId, id); setTemplates(prev => prev.filter(t => t.id !== id)); } catch {}
    };

    const startEdit = (t: TaskTemplate) => {
        setEditId(t.id);
        setName(t.name);
        setTitleTpl(t.title_template || '');
        setDescTpl(t.description_template || '');
        setPriority(t.default_priority);
    };

    const resetForm = () => { setEditId(null); setName(''); setTitleTpl(''); setDescTpl(''); setPriority('medium'); };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
                    <h3 className="text-lg font-bold">Task Templates</h3>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {/* Existing templates */}
                    {templates.map(t => (
                        <div key={t.id} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700">{t.name}</p>
                                <p className="text-[10px] text-slate-400">{t.default_priority} priority{t.title_template ? ` | "${t.title_template}"` : ''}</p>
                            </div>
                            <button onClick={() => startEdit(t)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                            <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                        </div>
                    ))}
                    {templates.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No templates yet</p>}

                    {/* Form */}
                    <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                        <h4 className="text-xs font-semibold text-slate-500">{editId ? 'Edit Template' : 'New Template'}</h4>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Template name (e.g. Bug Report)"
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
                        <input value={titleTpl} onChange={e => setTitleTpl(e.target.value)} placeholder="Title template (optional)"
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400" />
                        <textarea value={descTpl} onChange={e => setDescTpl(e.target.value)} placeholder="Description template (optional)"
                            rows={3} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                        <select value={priority} onChange={e => setPriority(e.target.value)}
                            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400">
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent Priority</option>
                        </select>
                        <div className="flex gap-2">
                            <button onClick={handleSave} disabled={!name.trim()}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                {editId ? 'Update' : 'Create'}
                            </button>
                            {editId && <button onClick={resetForm} className="px-3 py-2 bg-slate-200 text-slate-700 text-sm rounded-lg">Cancel</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
