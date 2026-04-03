import { useEffect, useState } from 'react'
import { aircraftApi } from '../../lib/apiClient'
import type { AircraftResponseDto, CreateAircraftDto } from '../../lib/types'
import { Plus, Search, Plane, Loader2, X, RefreshCw, Wrench, Trash2, Edit } from 'lucide-react'
import clsx from 'clsx'

function StatusBadge({ status }: { status: string }) {
    if (status === 'Airworthy') return <span className="badge-go">Airworthy</span>
    if (status === 'Grounded') return <span className="badge-nogo">Grounded</span>
    return <span className="badge-pending">Under Maintenance</span>
}

const EMPTY: CreateAircraftDto = { registrationNumber: '', type: '', model: '', yearOfManufacture: undefined }

export function AircraftPage() {
    const [list, setList] = useState<AircraftResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [form, setForm] = useState<CreateAircraftDto>(EMPTY)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const load = async () => { setLoading(true); try { const { data } = await aircraftApi.getAll(); setList(data) } finally { setLoading(false) } }
    useEffect(() => { load() }, [])

    const filtered = list.filter(a => a.registrationNumber.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase()) || a.model.toLowerCase().includes(search.toLowerCase()))

    const openCreate = () => { setEditId(null); setForm(EMPTY); setFormError(null); setShowModal(true) }
    const openEdit = (a: AircraftResponseDto) => {
        setEditId(a.id)
        setForm({ registrationNumber: a.registrationNumber, type: a.type, model: a.model, yearOfManufacture: a.yearOfManufacture, lastMaintenanceDate: a.lastMaintenanceDate?.split('T')[0], nextMaintenanceDate: a.nextMaintenanceDate?.split('T')[0] })
        setFormError(null); setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setFormError(null)
        try {
            if (editId) await aircraftApi.update(editId, form)
            else await aircraftApi.create(form)
            setShowModal(false); load()
        } catch (err: unknown) {
            setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed')
        } finally { setSaving(false) }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this aircraft?')) return
        try { await aircraftApi.delete(id); load() } catch { }
    }
    const handleToggle = async (id: number) => { try { await aircraftApi.toggleStatus(id); load() } catch { } }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search aircraft…" className="input pl-9" />
                </div>
                <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Aircraft</button>
                <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-400" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead><tr>
                                <th>Registration</th><th>Type / Model</th><th>Year</th><th>Last Maint.</th><th>Next Maint.</th><th>Status</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {filtered.length === 0 ? <tr><td colSpan={7} className="text-center text-slate-500 py-10">No aircraft registered</td></tr>
                                    : filtered.map(a => (
                                        <tr key={a.id}>
                                            <td><div className="flex items-center gap-2"><Plane size={14} className="text-primary-500 flex-shrink-0" /><span className="font-mono font-black text-black">{a.registrationNumber}</span></div></td>
                                            <td><div className="text-black font-bold">{a.type}</div><div className="text-sm text-slate-700">{a.model}</div></td>
                                            <td className="text-black font-semibold">{a.yearOfManufacture ?? '—'}</td>
                                            <td className="text-sm text-black font-semibold">{a.lastMaintenanceDate ? new Date(a.lastMaintenanceDate).toLocaleDateString() : '—'}</td>
                                            <td className={clsx('text-sm', a.nextMaintenanceDate && new Date(a.nextMaintenanceDate) < new Date() ? 'text-red-600 font-bold' : 'text-black font-semibold')}>
                                                {a.nextMaintenanceDate ? new Date(a.nextMaintenanceDate).toLocaleDateString() : '—'}
                                            </td>
                                            <td><StatusBadge status={a.status} /></td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button onClick={() => openEdit(a)} className="btn-icon" title="Edit"><Edit size={14} /></button>
                                                    <button onClick={() => handleToggle(a.id)} className="btn-icon" title="Toggle status"><Wrench size={14} /></button>
                                                    <button onClick={() => handleDelete(a.id)} className="btn-icon text-red-400 hover:bg-red-900/20" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md p-6 animate-slide-up">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-black text-black flex items-center gap-2">
                                <Plane size={20} className="text-primary-500" /> {editId ? 'Edit' : 'Add'} Aircraft
                            </h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Registration Number *</label>
                                <input required value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} className="input font-mono" placeholder="SU-ABC" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">Aircraft Type *</label><input required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input" placeholder="Cessna 172" /></div>
                                <div><label className="label">Model *</label><input required value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="input" placeholder="Skyhawk" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="label">Year</label><input type="number" value={form.yearOfManufacture ?? ''} onChange={e => setForm(f => ({ ...f, yearOfManufacture: e.target.value ? Number(e.target.value) : undefined }))} className="input" min={1900} max={new Date().getFullYear()} /></div>
                                <div><label className="label">Last Maintenance</label><input type="date" value={form.lastMaintenanceDate ?? ''} onChange={e => setForm(f => ({ ...f, lastMaintenanceDate: e.target.value }))} className="input" /></div>
                            </div>
                            <div><label className="label">Next Maintenance</label><input type="date" value={form.nextMaintenanceDate ?? ''} onChange={e => setForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))} className="input" /></div>
                            {formError && <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{formError}</p>}
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary">{saving && <Loader2 size={14} className="animate-spin" />} Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
