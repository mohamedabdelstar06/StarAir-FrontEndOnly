import { useEffect, useState } from 'react'
import { decideApi } from '../../lib/apiClient'
import type { DecideSessionResponseDto } from '../../lib/types'
import { Brain, Loader2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import clsx from 'clsx'

/**
 * DecidePage - Admin-only read-only view of all DECIDE sessions.
 * Pilots access DECIDE only through their assigned trip's FlightPrepPage.
 */
export function DecidePage() {
    const { user } = useAuthStore()
    const isAdmin = user?.roles.includes('Admin')
    const [sessions, setSessions] = useState<DecideSessionResponseDto[]>([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await decideApi.getAllSessions()
            setSessions(data)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    if (!isAdmin) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Brain className="text-amber-400" size={22} />
                    DECIDE Session History
                    <span className="ml-2 text-primary-400 font-mono text-base">({sessions.length})</span>
                </h2>
                <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
            </div>

            <div className="space-y-2">
                {loading ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-400" /></div>
                    : sessions.length === 0 ? (
                        <div className="glass-card p-10 text-center text-slate-500">
                            <Brain size={32} className="mx-auto mb-2 text-slate-700" />
                            No DECIDE sessions yet
                        </div>
                    ) : sessions.map(s => (
                        <div key={s.id} className="glass-card p-4 flex items-center justify-between hover:border-primary-700/40 transition-all">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    {s.status === 'Completed' ? <span className="badge-go">Completed</span> :
                                        s.status === 'InProgress' ? <span className="badge-pending">In Progress</span> :
                                            <span className="badge-inactive">Abandoned</span>}
                                    <span className="text-sm font-medium text-slate-200">{s.pilotName}</span>
                                </div>
                                <p className="text-sm text-slate-300 truncate">{s.scenario ?? 'No scenario'}</p>
                                <p className="text-xs text-slate-500 mt-1">{new Date(s.startedAt).toLocaleString()} · {s.steps.length}/6 steps</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                {s.finalRiskScore !== undefined && <span className="text-xs font-mono text-slate-400">Score: {s.finalRiskScore}</span>}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}
