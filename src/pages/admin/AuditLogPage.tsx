import { useEffect, useState, Fragment } from 'react'
import { auditApi } from '../../lib/apiClient'
import type { AuditLogDto } from '../../lib/types'
import { Database, Search, Loader2, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'

export function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogDto[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const load = async () => {
        setLoading(true)
        try { const { data } = await auditApi.getAll(); setLogs(data) } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const filtered = logs.filter(l =>
        (l.entityType?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (l.userName?.toLowerCase() || '').includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
    )

    const parseJson = (str?: string) => {
        if (!str) return null
        try { return JSON.parse(str) } catch { return str }
    }

    const renderJson = (obj: any) => {
        if (!obj || typeof obj !== 'object') return <span>{String(obj)}</span>
        return (
            <div className="grid grid-cols-1 gap-1">
                {Object.entries(obj).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-xs">
                        <span className="text-slate-500 w-24 text-right flex-shrink-0">{k}:</span>
                        <span className="text-slate-300 font-mono break-all">{String(v)}</span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entity, action or user…" className="input pl-9" />
                </div>
                <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-400" /></div>
                    : filtered.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Database size={32} className="mx-auto mb-3 text-slate-700" />
                            No audit logs found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>ID</th><th className="w-10"></th></tr></thead>
                                <tbody>
                                    {filtered.map(l => (
                                        <Fragment key={l.id}>
                                            <tr className="cursor-pointer hover:bg-primary-900/10" onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                                                <td className="text-xs text-slate-400 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                                                <td className="font-medium">{l.userName}</td>
                                                <td>
                                                    <span className={clsx('badge text-xs',
                                                        l.action === 'Added' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                                            l.action === 'Modified' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                                                                l.action === 'Deleted' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                                                                    'border-slate-500/30 text-slate-400 bg-slate-500/10')}>
                                                        {l.action}
                                                    </span>
                                                </td>
                                                <td className="font-mono text-xs text-slate-300">{l.entityType}</td>
                                                <td className="font-mono text-xs text-slate-500">{l.entityId ?? '—'}</td>
                                                <td className="text-slate-500 text-center">
                                                    {expandedId === l.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </td>
                                            </tr>
                                            {expandedId === l.id && (
                                                <tr>
                                                    <td colSpan={6} className="p-0 border-b border-cockpit-700/50">
                                                        <div className="p-4 bg-cockpit-800/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {l.oldValues && (
                                                                <div className="glass-card-sm p-3">
                                                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-wider">Old Values</div>
                                                                    {renderJson(parseJson(l.oldValues))}
                                                                </div>
                                                            )}
                                                            {l.newValues && (
                                                                <div className="glass-card-sm p-3 border-primary-500/20">
                                                                    <div className="text-[10px] text-primary-400 uppercase font-bold mb-2 tracking-wider">New Values</div>
                                                                    {renderJson(parseJson(l.newValues))}
                                                                </div>
                                                            )}
                                                            {l.ipAddress && (
                                                                <div className="col-span-1 md:col-span-2 text-xs text-slate-500 flex gap-2 items-center">
                                                                    <span className="font-semibold">IP Address:</span> <span className="font-mono">{l.ipAddress}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
            </div>
        </div>
    )
}
