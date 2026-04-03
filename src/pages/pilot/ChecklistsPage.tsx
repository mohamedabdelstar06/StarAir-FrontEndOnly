import { useEffect, useState } from 'react'
import { checklistApi } from '../../lib/apiClient'
import type { ChecklistResponseDto, CreateChecklistDto } from '../../lib/types'
import { ListChecks, Plus, ChevronDown, ChevronUp, Trash2, RefreshCw, Loader2, CheckCircle, Circle, X, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import clsx from 'clsx'

const CATEGORIES = ['Preflight', 'InFlight', 'PostFlight', 'Emergency', 'Other']

export function ChecklistsPage() {
    const { user } = useAuthStore()
    const isAdmin = user?.roles.includes('Admin')
    const [checklists, setChecklists] = useState<ChecklistResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<string>('All')
    const [showCreate, setShowCreate] = useState(false)
    const [checkedItems, setCheckedItems] = useState<Record<number, Set<number>>>({})
    const [form, setForm] = useState<CreateChecklistDto>({ title: '', category: 'Preflight', items: [] })
    const [newItemDesc, setNewItemDesc] = useState('')
    const [saving, setSaving] = useState(false)

    const load = async () => {
        setLoading(true)
        try { const { data } = await checklistApi.getAll(); setChecklists(data) } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const filtered = checklists.filter(c => categoryFilter === 'All' || c.category === categoryFilter)

    const toggleItem = (checklistId: number, itemId: number) => {
        setCheckedItems(prev => {
            const set = new Set(prev[checklistId] ?? [])
            set.has(itemId) ? set.delete(itemId) : set.add(itemId)
            return { ...prev, [checklistId]: set }
        })
    }

    const resetChecklist = (id: number) => setCheckedItems(prev => ({ ...prev, [id]: new Set() }))

    const addItem = () => {
        if (!newItemDesc.trim()) return
        setForm(f => ({ ...f, items: [...f.items, { description: newItemDesc.trim(), sortOrder: f.items.length + 1, isCritical: false }] }))
        setNewItemDesc('')
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true)
        try { await checklistApi.create(form); setShowCreate(false); setForm({ title: '', category: 'Preflight', items: [] }); load() }
        finally { setSaving(false) }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this checklist?')) return
        try { await checklistApi.delete(id); load() } catch { }
    }

    const getCategoryColor = (cat: string) => ({
        Preflight: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        InFlight: 'text-green-400 bg-green-500/10 border-green-500/30',
        Emergency: 'text-red-400 bg-red-500/10 border-red-500/30',
        PostFlight: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        Other: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    }[cat] ?? 'text-slate-400')

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1.5 flex-wrap">
                    {['All', ...CATEGORIES].map(c => (
                        <button key={c} onClick={() => setCategoryFilter(c)}
                            className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                                categoryFilter === c ? 'bg-primary-600 border-primary-500 text-white' : 'border-cockpit-600 text-slate-400 hover:border-primary-600')}>
                            {c}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex gap-2">
                    <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
                    {isAdmin && <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={16} /> New Checklist</button>}
                </div>
            </div>

            {/* Create form (admin) */}
            {showCreate && isAdmin && (
                <form onSubmit={handleCreate} className="glass-card p-5 space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2"><ListChecks size={16} className="text-primary-400" /> Create Checklist</h3>
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-icon"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Title *</label>
                            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Preflight Inspection…" />
                        </div>
                        <div>
                            <label className="label">Category *</label>
                            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Items</label>
                        <div className="space-y-2 mb-2">
                            {form.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cockpit-800/50 border border-cockpit-700/30">
                                    <span className="text-xs font-mono text-slate-500">{i + 1}.</span>
                                    <span className="flex-1 text-sm text-slate-200">{item.description}</span>
                                    <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} className="btn-icon"><X size={12} /></button>
                                    <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.map((it, j) => j === i ? { ...it, isCritical: !it.isCritical } : it) }))}
                                        className={clsx('btn-icon text-xs', item.isCritical ? 'text-red-400' : 'text-slate-500')} title="Toggle critical">
                                        <AlertTriangle size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} className="input flex-1" placeholder="Add item… (Enter to add)" />
                            <button type="button" onClick={addItem} className="btn-secondary px-3">Add</button>
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving || !form.title || form.items.length === 0} className="btn-primary">
                            {saving && <Loader2 size={14} className="animate-spin" />} Create Checklist
                        </button>
                    </div>
                </form>
            )}

            {/* Checklists */}
            {loading ? <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-400" /></div>
                : filtered.length === 0 ? (
                    <div className="glass-card p-12 text-center text-slate-500">
                        <ListChecks size={36} className="mx-auto mb-3 text-slate-700" /> No checklists found
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(cl => {
                            const checked = checkedItems[cl.id] ?? new Set<number>()
                            const total = cl.items.length
                            const done = checked.size
                            const allDone = total > 0 && done === total
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0

                            return (
                                <div key={cl.id} className={clsx('glass-card overflow-hidden transition-all', allDone && 'border-green-500/30')}>
                                    <button className="w-full px-5 py-4 flex items-center gap-3 hover:bg-primary-900/10 transition-all" onClick={() => setExpandedId(expandedId === cl.id ? null : cl.id)}>
                                        <span className={clsx('badge border text-xs', getCategoryColor(cl.category))}>{cl.category}</span>
                                        <span className="font-semibold text-slate-100 flex-1 text-left">{cl.title}</span>
                                        {total > 0 && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-1.5 rounded-full bg-cockpit-700 overflow-hidden">
                                                    <div className={clsx('h-full rounded-full transition-all', allDone ? 'bg-green-500' : 'bg-primary-500')} style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{done}/{total}</span>
                                            </div>
                                        )}
                                        {isAdmin && <button onClick={e => { e.stopPropagation(); handleDelete(cl.id) }} className="btn-icon text-red-400"><Trash2 size={14} /></button>}
                                        {expandedId === cl.id ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </button>

                                    {expandedId === cl.id && (
                                        <div className="px-5 pb-4 border-t border-cockpit-700/30 space-y-2 pt-3">
                                            {cl.items.map(item => (
                                                <button key={item.id} onClick={() => toggleItem(cl.id, item.id)}
                                                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-primary-900/10 transition-all text-left group">
                                                    {checked.has(item.id)
                                                        ? <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                                                        : <Circle size={18} className="text-slate-600 group-hover:text-primary-400 flex-shrink-0 transition-colors" />}
                                                    <span className={clsx('flex-1 text-sm transition-all', checked.has(item.id) ? 'line-through text-slate-500' : 'text-slate-200')}>
                                                        {item.description}
                                                    </span>
                                                    {item.isCritical && <span title="Critical item"><AlertTriangle size={14} className="text-red-400 flex-shrink-0" /></span>}
                                                </button>
                                            ))}
                                            {total > 0 && (
                                                <div className="flex items-center justify-between pt-2">
                                                    {allDone && <span className="text-xs text-green-400 font-semibold">✓ Checklist Complete</span>}
                                                    <button onClick={() => resetChecklist(cl.id)} className="btn-ghost text-xs ml-auto">Reset</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
        </div>
    )
}
