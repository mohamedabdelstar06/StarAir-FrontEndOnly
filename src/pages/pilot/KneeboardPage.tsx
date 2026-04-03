import { useEffect, useState } from 'react'
import { kneeboardApi } from '../../lib/apiClient'
import type { KneeboardNoteResponseDto, CreateKneeboardNoteDto } from '../../lib/types'
import { BookOpen, Plus, Edit, Trash2, Save, X, RefreshCw, Loader2, Tag } from 'lucide-react'

const EMPTY = (): CreateKneeboardNoteDto => ({ title: '', content: '', tags: '', isSynced: true })

export function KneeboardPage() {
    const [notes, setNotes] = useState<KneeboardNoteResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<number | 'new' | null>(null)
    const [form, setForm] = useState<CreateKneeboardNoteDto>(EMPTY())
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')

    const load = async () => {
        setLoading(true)
        try { const { data } = await kneeboardApi.getAll(); setNotes(data) } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const filtered = notes.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        (n.tags ?? '').toLowerCase().includes(search.toLowerCase())
    )

    const openNew = () => { setForm(EMPTY()); setEditingId('new') }
    const openEdit = (n: KneeboardNoteResponseDto) => {
        setForm({ title: n.title, content: n.content, tags: n.tags ?? '', isSynced: n.isSynced })
        setEditingId(n.id)
    }
    const cancel = () => { setEditingId(null); setForm(EMPTY()) }

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) return
        setSaving(true)
        try {
            if (editingId === 'new') await kneeboardApi.create(form)
            else if (typeof editingId === 'number') await kneeboardApi.update(editingId, form)
            cancel(); load()
        } finally { setSaving(false) }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this note?')) return
        try { await kneeboardApi.delete(id); load() } catch { }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…" className="input pl-4" />
                </div>
                <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
                <button onClick={openNew} className="btn-primary"><Plus size={16} /> New Note</button>
            </div>

            {/* Editor */}
            {editingId !== null && (
                <div className="glass-card p-5 space-y-4 animate-slide-up">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <BookOpen size={16} className="text-primary-400" />
                        {editingId === 'new' ? 'New Note' : 'Edit Note'}
                    </h3>
                    <div>
                        <label className="label">Title *</label>
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Note title…" autoFocus />
                    </div>
                    <div>
                        <label className="label">Content *</label>
                        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input resize-none h-36" placeholder="Write your note here…" />
                    </div>
                    <div>
                        <label className="label">Tags (comma separated)</label>
                        <input value={form.tags ?? ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="input" placeholder="weather, NOTAM, runway…" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={cancel} className="btn-ghost"><X size={15} /> Cancel</button>
                        <button onClick={handleSave} disabled={saving || !form.title || !form.content} className="btn-primary">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Note
                        </button>
                    </div>
                </div>
            )}

            {/* Notes grid */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-400" /></div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-500">
                    <BookOpen size={36} className="mx-auto mb-3 text-slate-700" />
                    {search ? 'No notes match your search' : 'No kneeboard notes yet. Create your first one!'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(n => (
                        <div key={n.id} className="glass-card p-4 group hover:border-primary-600/40 transition-all flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-slate-100 flex-1 leading-snug">{n.title}</h4>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button onClick={() => openEdit(n)} className="btn-icon"><Edit size={13} /></button>
                                    <button onClick={() => handleDelete(n.id)} className="btn-icon text-red-400"><Trash2 size={13} /></button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed flex-1 line-clamp-4">{n.content}</p>
                            {n.tags && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {n.tags.split(',').filter(Boolean).map(t => (
                                        <span key={t.trim()} className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-900/50 text-primary-400 border border-primary-800/40">
                                            <Tag size={8} />{t.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <div className="text-[10px] text-slate-600 mt-auto">
                                {n.updatedAt ? `Updated ${new Date(n.updatedAt).toLocaleDateString()}` : `Created ${new Date(n.createdAt).toLocaleDateString()}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
