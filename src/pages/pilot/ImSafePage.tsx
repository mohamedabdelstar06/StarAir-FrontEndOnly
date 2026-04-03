import { useEffect, useState } from 'react'
import { imSafeApi } from '../../lib/apiClient'
import type { ImSafeResponseDto } from '../../lib/types'
import { ShieldCheck, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import clsx from 'clsx'

/**
 * ImSafePage - Admin-only read-only view of all IMSAFE assessments.
 * Pilots access IMSAFE only through their assigned trip's FlightPrepPage.
 */
export function ImSafePage() {
    const { user } = useAuthStore()
    const isAdmin = user?.roles.includes('Admin')
    const [history, setHistory] = useState<ImSafeResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<number | null>(null)

    const load = async () => {
        setLoading(true)
        try {
            const { data } = await imSafeApi.getAll()
            setHistory(data)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    if (!isAdmin) return null

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="text-blue-400" size={22} />
                    IMSAFE Assessment History
                    <span className="ml-2 text-primary-400 font-mono text-base">({history.length})</span>
                </h2>
                <button onClick={load} className="btn-icon"><RefreshCw size={16} /></button>
            </div>

            <div className="space-y-2">
                {loading ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-400" /></div>
                    : history.length === 0 ? (
                        <div className="glass-card p-10 text-center text-slate-500">
                            <ShieldCheck size={32} className="mx-auto mb-2 text-slate-700" />
                            No assessments found
                        </div>
                    ) : history.map(a => (
                        <div key={a.id} className="glass-card overflow-hidden">
                            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-900/10 transition-all" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                                <div className="flex items-center gap-3">
                                    {a.result === 'Go' ? <span className="badge-go">GO</span> : a.result === 'Caution' ? <span className="badge-caution">CAUTION</span> : <span className="badge-nogo">NO-GO</span>}
                                    <span className="text-sm font-medium text-slate-200">{a.pilotName}</span>
                                    <span className="text-xs text-slate-500">{new Date(a.assessedAt).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-400">Score: {a.overallRiskScore}/18</span>
                                    {expandedId === a.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </button>
                            {expandedId === a.id && (
                                <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-cockpit-700/30 pt-3">
                                    {[
                                        { l: 'Illness', v: a.illnessLevel, n: a.illnessNotes },
                                        { l: 'Medication', v: a.medicationLevel, n: a.medicationNotes },
                                        { l: 'Stress', v: a.stressLevel, n: a.stressNotes },
                                        { l: 'Alcohol', v: a.alcoholLevel, n: a.hoursSinceLastDrink !== undefined ? `${a.hoursSinceLastDrink}h since last drink` : undefined },
                                        { l: 'Fatigue', v: a.fatigueLevel, n: a.hoursSlept !== undefined ? `${a.hoursSlept}h sleep` : undefined },
                                        { l: 'Emotions', v: a.emotionLevel, n: a.emotionNotes },
                                    ].map(({ l, v, n }) => (
                                        <div key={l} className="glass-card-sm p-2.5">
                                            <div className="text-[10px] text-slate-500 uppercase font-semibold">{l}</div>
                                            <div className={clsx('text-xs font-bold mt-0.5', v === 'None' || v === 'Low' ? 'text-green-400' : v === 'Medium' ? 'text-amber-400' : 'text-red-400')}>{v}</div>
                                            {n && <div className="text-[10px] text-slate-500 mt-1">{n}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    )
}
