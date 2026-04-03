import { useEffect, useState } from 'react'
import { dashboardApi, imSafeApi, paveApi, flightApi } from '../../lib/apiClient'
import type { DashboardStatsDto, ImSafeResponseDto, PaveResponseDto, FlightTripResponseDto } from '../../lib/types'
import {
    Users, Plane, ShieldCheck, ClipboardCheck,
    TrendingUp, AlertTriangle, XCircle, CheckCircle,
    Activity, RefreshCw, BarChart3
} from 'lucide-react'
import { AdvancedTrendChart, SystemPieChart } from '../../components/shared/AdvancedCharts'

function ResultBadge({ result }: { result: string }) {
    if (result === 'Go') return <span className="badge-go">{result}</span>
    if (result === 'Caution') return <span className="badge-caution">{result}</span>
    return <span className="badge-nogo">{result}</span>
}

function MetricCard({ value, label, icon, color = 'text-primary-600' }: {
    value: number | string; label: string; icon: React.ReactNode; color?: string
}) {
    return (
        <div className="metric-card">
            <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-slate-100">{icon}</span>
            </div>
            <div className={`metric-value ${color}`}>{value}</div>
            <div className="metric-label">{label}</div>
        </div>
    )
}

interface PilotPerformance {
    pilotName: string
    goCount: number
    cautionCount: number
    noGoCount: number
    total: number
}

function PilotPerformanceChart({ data }: { data: PilotPerformance[] }) {
    if (data.length === 0)
        return <div className="text-center py-8 text-slate-500">No assessment data available yet.</div>

    const maxTotal = Math.max(...data.map((d) => d.total), 1)

    return (
        <div className="space-y-4">
            {data.map((pilot) => {
                const goPercent = pilot.total > 0 ? (pilot.goCount / pilot.total) * 100 : 0
                const cautionPercent = pilot.total > 0 ? (pilot.cautionCount / pilot.total) * 100 : 0
                const noGoPercent = pilot.total > 0 ? (pilot.noGoCount / pilot.total) * 100 : 0
                const barWidth = (pilot.total / maxTotal) * 100

                return (
                    <div key={pilot.pilotName} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-black">{pilot.pilotName}</span>
                            <span className="text-sm text-slate-600 font-semibold">{pilot.total} assessments</span>
                        </div>
                        <div
                            className="h-8 rounded-lg overflow-hidden bg-slate-100 flex"
                            style={{ width: `${barWidth}%`, minWidth: '40%' }}
                        >
                            {goPercent > 0 && (
                                <div
                                    className="h-full bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                                    style={{ width: `${goPercent}%` }}
                                >
                                    {pilot.goCount}
                                </div>
                            )}
                            {cautionPercent > 0 && (
                                <div
                                    className="h-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold"
                                    style={{ width: `${cautionPercent}%` }}
                                >
                                    {pilot.cautionCount}
                                </div>
                            )}
                            {noGoPercent > 0 && (
                                <div
                                    className="h-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                                    style={{ width: `${noGoPercent}%` }}
                                >
                                    {pilot.noGoCount}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" /> Go: {pilot.goCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500" /> Caution: {pilot.cautionCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500" /> No-Go: {pilot.noGoCount}
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export function DashboardPage() {
    const [stats, setStats] = useState<DashboardStatsDto | null>(null)
    const [pilotPerformance, setPilotPerformance] = useState<PilotPerformance[]>([])
    const [allAssessments, setAllAssessments] = useState<(ImSafeResponseDto | PaveResponseDto)[]>([])
    const [flights, setFlights] = useState<FlightTripResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [{ data: dashData }, imRes, paveRes, flightsRes] = await Promise.all([
                dashboardApi.getStats(),
                imSafeApi.getAll(),
                paveApi.getAll(),
                flightApi.getAll()
            ])
            setStats(dashData)
            setFlights(flightsRes.data)

            const combined = [...(imRes.data || []), ...(paveRes.data || [])]
            setAllAssessments(combined)

            const performanceMap = new Map<string, PilotPerformance>()
            const process = (arr: (ImSafeResponseDto | PaveResponseDto)[]) => {
                for (const a of arr) {
                    const name = a.pilotName
                    if (!performanceMap.has(name))
                        performanceMap.set(name, { pilotName: name, goCount: 0, cautionCount: 0, noGoCount: 0, total: 0 })
                    const p = performanceMap.get(name)!
                    p.total++
                    if (a.result === 'Go') p.goCount++
                    else if (a.result === 'Caution') p.cautionCount++
                    else p.noGoCount++
                }
            }
            process(imRes.data)
            process(paveRes.data)
            setPilotPerformance(Array.from(performanceMap.values()).sort((a, b) => b.total - a.total))
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to load dashboard data.'
            setError(`Failed to load dashboard. Details: ${msg}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    if (loading)
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw size={28} className="animate-spin text-primary-500" />
            </div>
        )
    if (error || !stats)
        return (
            <div className="flex items-center justify-center h-64 text-red-600 text-base font-bold">
                {error}
            </div>
        )

    const totalAssessments = stats.totalImSafeAssessments + stats.totalPaveAssessments
    const goRate = totalAssessments > 0 ? Math.round((stats.goCount / totalAssessments) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Top metrics */}
            <div className="grid grid-cols-2 gap-4">
                <MetricCard value={stats.totalPilots} label="Total Pilots" icon={<Users size={18} className="text-primary-500" />} />
                <MetricCard value={stats.activePilots} label="Active Pilots" icon={<Activity size={18} className="text-green-600" />} color="text-green-600" />
            </div>

            {/* 2/3 + 1/3 grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT 2/3 */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard value={stats.totalImSafeAssessments} label="IMSAFE" icon={<ShieldCheck size={18} className="text-primary-500" />} />
                        <MetricCard value={stats.totalPaveAssessments} label="PAVE" icon={<ClipboardCheck size={18} className="text-primary-500" />} />
                        <MetricCard value={`${goRate}%`} label="Go Rate" icon={<TrendingUp size={18} className="text-green-600" />} color="text-green-600" />
                        <MetricCard value={stats.noGoCount} label="No-Go" icon={<XCircle size={18} className="text-red-600" />} color="text-red-600" />
                    </div>

                    {/* Smooth curve chart */}
                    <AdvancedTrendChart assessments={allAssessments} flights={flights} title="System Wide Trend Report" />

                    {/* Pilot performance bars */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                            <BarChart3 size={22} className="text-primary-500" /> Pilot Performance
                        </h2>
                        <PilotPerformanceChart data={pilotPerformance} />
                    </div>
                </div>

                {/* RIGHT 1/3 */}
                <div className="xl:col-span-1 space-y-6">
                    <SystemPieChart assessments={allAssessments} />

                    {stats.pendingPilots > 0 && (
                        <div className="glass-card p-5 border-2 border-amber-300 bg-amber-50">
                            <div className="flex items-start gap-3 text-amber-800">
                                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-lg font-black uppercase tracking-tight">Action Required</div>
                                    <div className="text-sm font-semibold mt-1">
                                        {stats.pendingPilots} pilot{stats.pendingPilots > 1 ? 's are' : ' is'} pending account activation.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="glass-card overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-base font-bold text-black uppercase tracking-widest">Recent Activity</h2>
                            <button onClick={load} className="btn-icon"><RefreshCw size={14} /></button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {stats.recentAssessments.length === 0 ? (
                                <div className="text-center text-slate-500 py-6 text-sm">No assessments yet</div>
                            ) : (
                                stats.recentAssessments.slice(0, 5).map((a, i) => (
                                    <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-black">{a.pilotName}</div>
                                            <ResultBadge result={a.result} />
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
                                            <span>{a.type} · Score: {a.riskScore}</span>
                                            <span>{new Date(a.assessedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
