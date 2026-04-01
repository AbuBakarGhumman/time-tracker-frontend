import React, { useState, useEffect, useRef } from 'react';
import { fetchAttachments, uploadAttachment, deleteAttachment } from '../../api/boards';
import type { TaskAttachment } from '../../api/boards';
import { API_BASE_URL } from '../../api/config';

interface Props {
    projectId: number;
    taskId: number;
}

const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

const isImage = (type: string | null) => type?.startsWith('image/');

export const AttachmentSection: React.FC<Props> = ({ projectId, taskId }) => {
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const baseUrl = API_BASE_URL.replace('/v1', '');

    useEffect(() => { load(); }, [taskId]);

    const load = async () => {
        try { setAttachments(await fetchAttachments(projectId, taskId)); } catch {}
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const a = await uploadAttachment(projectId, taskId, file);
                setAttachments(prev => [a, ...prev]);
            }
        } catch (err) { console.error(err); }
        setUploading(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this attachment?')) return;
        try {
            await deleteAttachment(projectId, taskId, id);
            setAttachments(prev => prev.filter(a => a.id !== id));
        } catch {}
    };

    return (
        <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attachments ({attachments.length})</h4>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
                className={`border-2 border-dashed rounded-lg p-3 mb-3 text-center transition cursor-pointer ${
                    dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
                onClick={() => fileRef.current?.click()}
            >
                <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
                {uploading ? (
                    <span className="text-xs text-blue-600 font-medium">Uploading...</span>
                ) : (
                    <span className="text-xs text-slate-400">Drop files here or click to upload (max 10MB)</span>
                )}
            </div>

            {/* Attachment list */}
            <div className="space-y-2">
                {attachments.map(a => (
                    <div key={a.id} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 group">
                        {isImage(a.content_type) ? (
                            <img src={`${baseUrl}${a.file_url}`} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                        ) : (
                            <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <a href={`${baseUrl}${a.file_url}`} target="_blank" rel="noopener noreferrer"
                                className="text-xs font-medium text-slate-700 hover:text-blue-600 truncate block">{a.original_filename}</a>
                            <span className="text-[10px] text-slate-400">{formatSize(a.file_size)}{a.user_name ? ` by ${a.user_name}` : ''}</span>
                        </div>
                        <a href={`${baseUrl}${a.file_url}`} download={a.original_filename}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition shrink-0" title="Download">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                        <button onClick={() => handleDelete(a.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition shrink-0" title="Delete">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
