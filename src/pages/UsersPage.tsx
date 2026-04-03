import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Edit2, Shield, UserX, UserCheck } from 'lucide-react'
import api from '../lib/api'

export function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters and Pagination
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('All')
    const [page, setPage] = useState(1)
    const itemsPerPage = 5

    // Create User Modal
    const [showModal, setShowModal] = useState(false)
    const [newEmail, setNewEmail] = useState('')
    const [newFullName, setNewFullName] = useState('')
    const [newRole, setNewRole] = useState('Pilot')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/api/user')
            setUsers(data)
        } catch (e) {
            console.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            const formData = new FormData()
            formData.append('email', newEmail)
            formData.append('fullName', newFullName)
            formData.append('role', newRole)

            await api.post('/api/user', formData)
            setShowModal(false)
            setNewEmail('')
            setNewFullName('')
            fetchUsers()
        } catch (e) {
            alert('Failed to create user. Email may already exist.')
        } finally {
            setCreating(false)
        }
    }

    const toggleStatus = async (id: string) => {
        try {
            await api.patch(`/api/user/${id}/toggle-status`)
            fetchUsers()
        } catch {
            alert('Failed to update status')
        }
    }

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
            const matchesRole = roleFilter === 'All' || u.roles.includes(roleFilter)
            return matchesSearch && matchesRole
        })
    }, [users, search, roleFilter])

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
    const currentUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    return (
        <div className="p-4 lg:p-8 animate-slide-up max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-sm font-medium text-slate-500">Manage admins and pilots, invite new users</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary py-3 px-6 text-base">
                    <Plus size={18} /> Add New User
                </button>
            </div>

            <div className="glass-card mb-6 p-4 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="input pl-10 py-2.5"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1) }}
                    />
                </div>
                <select
                    className="input w-full sm:w-48 py-2.5 font-semibold text-slate-700 cursor-pointer"
                    value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
                >
                    <option value="All">All Roles</option>
                    <option value="Admin">Admins</option>
                    <option value="Pilot">Pilots</option>
                </select>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Rank / License</th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-500 font-bold tracking-widest animate-pulse">LOADING USERS...</td></tr>
                            ) : currentUsers.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No users found</td></tr>
                            ) : (
                                currentUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <img src={u.profileImageUrl || `https://ui-avatars.com/api/?name=${u.fullName}&background=random&color=fff`} className="w-10 h-10 rounded-full" alt="" />
                                                <div>
                                                    <div className="font-bold text-slate-900">{u.fullName}</div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                                {u.roles.includes('Admin') && <Shield size={12} className="mr-1 text-primary-500" />}
                                                {u.roles.join(', ')}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-semibold text-slate-700">{u.rank || '-'}</div>
                                            <div className="text-xs text-slate-500">{u.licenseNumber || 'No License'}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.status === 'Active' ? 'badge-go' : u.status === 'Pending' ? 'badge-pending' : 'badge-nogo'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => toggleStatus(u.id)}
                                                className={`btn-icon ${u.status === 'Active' ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'}`}
                                                title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                                            >
                                                {u.status === 'Active' ? <UserX size={18} /> : <UserCheck size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                        <div className="text-sm font-medium text-slate-500">
                            Showing {(page - 1) * itemsPerPage + 1} to Math.min(page * itemsPerPage, filteredUsers.length) of {filteredUsers.length} entries
                        </div>
                        <div className="flex gap-2">
                            <button className="btn-ghost py-1.5 px-3 text-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                            <button className="btn-ghost py-1.5 px-3 text-sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Invite New User</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="label">Full Name</label>
                                <input className="input" required value={newFullName} onChange={e => setNewFullName(e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Email Address</label>
                                <input type="email" className="input" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Role</label>
                                <select className="input cursor-pointer" value={newRole} onChange={e => setNewRole(e.target.value)}>
                                    <option value="Pilot">Pilot</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" className="btn-ghost flex-1" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1" disabled={creating}>{creating ? 'Sending...' : 'Send Invite'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
