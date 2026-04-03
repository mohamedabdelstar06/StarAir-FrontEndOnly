import { useEffect, useState } from 'react'
import { paveApi } from '../../lib/apiClient'
import type { PaveResponseDto } from '../../lib/types'
import { ClipboardCheck, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import clsx from 'clsx'

/**
 * PavePage - Admin-only read-only view of all PAVE assessments.
 * Pilots access PAVE only through their assigned trip's FlightPrepPage.
 */
export function PavePage() {
    const { user } = useAuthStore()
    const isAdmin = user?.roles.includes('Admin')
    const [history, setHistory] = useState<PaveResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await paveApi.getAll()
            setHistory(data)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    if (!isAdmin) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <ClipboardCheck className="text-purple-400" size={22} />
                    PAVE Assessment History
                    <span className="ml-2 text-primary-400 font-mono text-base">({history.length})</span>
                </h2>
                <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
            </div>

            <div className="space-y-2">
                {loading ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-400" /></div>
                    : history.length === 0 ? (
                        <div className="glass-card p-10 text-center text-slate-500">
                            <ClipboardCheck size={32} className="mx-auto mb-2 text-slate-700" />
                            No PAVE assessments yet
                        </div>
                    ) : history.map(a => (
                        <div key={a.id} className="glass-card overflow-hidden">
                            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-900/10 transition-all" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                                <div className="flex items-center gap-3">
                                    {a.result === 'Go' ? <span className="badge-go">GO</span> : a.result === 'Caution' ? <span className="badge-caution">CAUTION</span> : <span className="badge-nogo">NO-GO</span>}
                                    <span className="text-sm font-medium text-slate-200">{a.pilotName}</span>
                                    {a.aircraftRegistration && <span className="text-xs font-mono text-primary-400">{a.aircraftRegistration}</span>}
                                    <span className="text-xs text-slate-500">{new Date(a.assessedAt).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-400">Score: {a.overallRiskScore}/12</span>
                                    {expandedId === a.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </button>
                            {expandedId === a.id && (
                                <div className="px-4 pb-4 border-t border-cockpit-700/30 pt-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                        {[
                                            { l: 'Pilot', v: a.pilotRiskLevel },
                                            { l: 'Aircraft', v: a.aircraftRiskLevel },
                                            { l: 'Environment', v: a.environmentRiskLevel },
                                            { l: 'External', v: a.externalRiskLevel },
                                        ].map(({ l, v }) => (
                                            <div key={l} className="glass-card-sm p-2.5">
                                                <div className="text-[10px] text-slate-500 uppercase font-semibold">{l}</div>
                                                <div className={clsx('text-xs font-bold mt-0.5', v === 'None' || v === 'Low' ? 'text-green-400' : v === 'Medium' ? 'text-amber-400' : 'text-red-400')}>{v}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {a.weatherSummary && <p className="text-xs text-slate-400 mt-2"><span className="text-slate-500 font-semibold">Weather:</span> {a.weatherSummary}</p>}
                                    {a.metarData && <div className="mt-2 glass-card-sm p-2 bg-cockpit-800 text-[10px] font-mono text-slate-500 border-none">{a.metarData}</div>}
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    )
}
