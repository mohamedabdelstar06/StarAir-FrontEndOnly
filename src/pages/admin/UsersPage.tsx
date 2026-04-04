import { useEffect, useState } from 'react'
import { usersApi } from '../../lib/apiClient'
import type { UserResponseDto, CreateUserDto, UpdateUserDto } from '../../lib/types'
import { Plus, Search, UserCog, Loader2, X, RefreshCw, Trash2, Edit, Power } from 'lucide-react'
import clsx from 'clsx'

const ROLES = ['Pilot', 'Admin']
const MEDICAL_CLASSES = ['Class 1', 'Class 2', 'Class 3']

function StatusBadge({ status }: { status: string }) {
    if (status === 'Active')
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black bg-green-100 text-green-700 border-2 border-green-300">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" /> Active
        </span>
    if (status === 'Pending')
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black bg-amber-100 text-amber-700 border-2 border-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending
        </span>
    return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black bg-red-100 text-red-700 border-2 border-red-300">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Inactive
    </span>
}

type FormMode = 'create' | 'edit'
const EMPTY_FORM: CreateUserDto = { email: '', fullName: '', role: 'Pilot', licenseNumber: '', medicalClass: '', rank: '' }

export function UsersPage() {
    const [users, setUsers] = useState<UserResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('All')
    const [showModal, setShowModal] = useState(false)
    const [mode, setMode] = useState<FormMode>('create')
    const [editId, setEditId] = useState<string | null>(null)
    const [form, setForm] = useState<CreateUserDto>(EMPTY_FORM)
    const [updateForm, setUpdateForm] = useState<UpdateUserDto>({ fullName: '', totalFlightHours: 0 })
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        try { const { data } = await usersApi.getAll(); setUsers(data) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const filtered = users.filter(u => {
        const matchRole = roleFilter === 'All' || u.roles.includes(roleFilter)
        const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
        return matchRole && matchSearch
    })

    const openCreate = () => { setMode('create'); setForm(EMPTY_FORM); setFormError(null); setShowModal(true) }
    const openEdit = (u: UserResponseDto) => {
        setMode('edit'); setEditId(u.id)
        setUpdateForm({ fullName: u.fullName, email: u.email, licenseNumber: u.licenseNumber, medicalClass: u.medicalClass, rank: u.rank, totalFlightHours: u.totalFlightHours })
        setFormError(null); setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true); setFormError(null)
        try {
            if (mode === 'create') await usersApi.create(form)
            else if (editId) await usersApi.update(editId, updateForm)
            setShowModal(false); load()
        } catch (err: unknown) {
            setFormError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Operation failed')
        } finally { setSaving(false) }
    }

    const handleToggle = async (id: string) => {
        try { await usersApi.toggleStatus(id); load() } catch { }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) return
        try { await usersApi.delete(id); load() } catch { }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" className="input pl-9" />
                </div>
                <div className="flex gap-2">
                    {['All', 'Pilot', 'Admin'].map(r => (
                        <button key={r} onClick={() => setRoleFilter(r)}
                            className={clsx('px-3 py-2 rounded-xl text-xs font-semibold transition-all', roleFilter === r ? 'bg-primary-600 text-white' : 'btn-secondary')}>
                            {r}
                        </button>
                    ))}
                </div>
                <button onClick={openCreate} className="btn-primary gap-2 text-sm sm:text-base"><Plus size={16} /> <span className="hidden sm:inline">Add</span> User</button>
                <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-400" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead><tr>
                                <th>Name</th><th>Email</th><th>Role</th><th>License</th><th>Status</th><th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center text-slate-500 py-10">No users found</td></tr>
                                ) : filtered.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div 
                                                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
                                                onClick={() => window.location.href = `/users/${u.id}`}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center text-xs font-bold text-primary-200">
                                                    {u.fullName[0]?.toUpperCase()}
                                                </div>
                                                <span className="font-bold text-primary-600 hover:underline">{u.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="text-black font-medium">{u.email}</td>
                                        <td>{u.roles.map(r => <span key={r} className="badge-active mr-1">{r}</span>)}</td>
                                        <td className="font-mono text-sm text-slate-600 font-bold">{u.licenseNumber ?? '—'}</td>
                                        <td><StatusBadge status={u.status} /></td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                {/* Edit Button — Blue, clear */}
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors font-bold text-sm"
                                                    title="Edit User"
                                                >
                                                    <Edit size={16} />
                                                    <span className="hidden lg:inline">Edit</span>
                                                </button>

                                                {/* Toggle Status — Green/Red, prominent */}
                                                <button
                                                    onClick={() => handleToggle(u.id)}
                                                    className={clsx(
                                                        'flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors font-bold text-sm',
                                                        u.status === 'Active'
                                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                                    )}
                                                    title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                                                >
                                                    <Power size={16} />
                                                    <span className="hidden lg:inline">{u.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                                </button>

                                                {/* Delete — Red, bold, clear */}
                                                <button
                                                    onClick={() => handleDelete(u.id, u.fullName)}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 transition-colors font-bold text-sm"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                    <span className="hidden lg:inline">Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-card w-full sm:max-w-3xl p-4 sm:p-6 transition-none shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4 sm:mb-6 bg-primary-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-2xl -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 border-b border-slate-200">
                            <h2 className="text-xl font-black text-black flex items-center gap-2">
                                <UserCog size={22} className="text-primary-500" />
                                {mode === 'create' ? 'Add New User' : 'Edit User'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-black transition-colors"><X size={20} /></button>
                        </div>
                        
                        {formError && (
                            <div className="flex items-center gap-4 bg-red-500 text-white p-5 rounded-xl shadow-lg mb-6 border-4 border-red-500">
                                <div className="text-3xl">🚨</div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black uppercase tracking-widest mb-1">Error!</h3>
                                    <p className="text-lg font-bold">{formError}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            {mode === 'create' ? (
                                <>
                                    <div>
                                        <label className="label">Email *</label>
                                        <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="pilot@starair.com" />
                                    </div>
                                    <div>
                                        <label className="label">Full Name *</label>
                                        <input required value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label className="label">Role *</label>
                                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input">
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">License No.</label>
                                            <input value={form.licenseNumber ?? ''} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} className="input" placeholder="PL-123456" />
                                        </div>
                                        <div>
                                            <label className="label">Rank</label>
                                            <input value={form.rank ?? ''} onChange={e => setForm(f => ({ ...f, rank: e.target.value }))} className="input" placeholder="Captain" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label">Medical Class</label>
                                        <select value={form.medicalClass ?? ''} onChange={e => setForm(f => ({ ...f, medicalClass: e.target.value }))} className="input">
                                            <option value="">— Select —</option>
                                            {MEDICAL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="label">Email</label>
                                        <input type="email" value={updateForm.email ?? ''} onChange={e => setUpdateForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="user@starair.com" />
                                    </div>
                                    <div>
                                        <label className="label">Full Name *</label>
                                        <input required value={updateForm.fullName} onChange={e => setUpdateForm(f => ({ ...f, fullName: e.target.value }))} className="input" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">License No.</label>
                                            <input value={updateForm.licenseNumber ?? ''} onChange={e => setUpdateForm(f => ({ ...f, licenseNumber: e.target.value }))} className="input" />
                                        </div>
                                        <div>
                                            <label className="label">Rank</label>
                                            <input value={updateForm.rank ?? ''} onChange={e => setUpdateForm(f => ({ ...f, rank: e.target.value }))} className="input" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label">Medical Class</label>
                                            <select value={updateForm.medicalClass ?? ''} onChange={e => setUpdateForm(f => ({ ...f, medicalClass: e.target.value }))} className="input">
                                                <option value="">— Select —</option>
                                                {MEDICAL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Flight Hours</label>
                                            <input type="number" min={0} value={updateForm.totalFlightHours} onChange={e => setUpdateForm(f => ({ ...f, totalFlightHours: Number(e.target.value) }))} className="input" />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-200 pt-4 sm:pt-5 mt-2 gap-3">
                                <p className="text-sm font-semibold text-slate-500">
                                    {mode === 'create' ? 'A welcome email will be sent to activate their account.' : ''}
                                </p>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl transition-all border border-slate-300 text-base">Cancel</button>
                                    <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base">
                                        {saving && <Loader2 size={18} className="animate-spin" />}
                                        {mode === 'create' ? 'Create & Send Invite' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
