import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { flightApi, imSafeApi, paveApi } from '../lib/apiClient'
import type { ImSafeResponseDto, PaveResponseDto, FlightTripResponseDto } from '../lib/types'
import {
    Users, Activity, CheckSquare, AlertTriangle,
    Plane, Calendar, ChevronRight, ArrowRight
} from 'lucide-react'
import { AdvancedTrendChart, SystemPieChart } from '../components/shared/AdvancedCharts'

export function DashboardPage() {
    const navigate = useNavigate()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [assessments, setAssessments] = useState<(ImSafeResponseDto | PaveResponseDto)[]>([])
    const [flights, setFlights] = useState<FlightTripResponseDto[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                const [statsRes, imRes, paveRes, flightsRes] = await Promise.allSettled([
                    api.get('/api/dashboard'),
                    imSafeApi.getAll(),
                    paveApi.getAll(),
                    flightApi.getAll(),
                ])
                if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
                else setStats({ totalPilots: 0, activePilots: 0, pendingPilots: 0, goCount: 0, cautionCount: 0, noGoCount: 0, totalImSafeAssessments: 0, totalPaveAssessments: 0 })

                const allAssessments: (ImSafeResponseDto | PaveResponseDto)[] = []
                if (imRes.status === 'fulfilled') allAssessments.push(...imRes.value.data)
                if (paveRes.status === 'fulfilled') allAssessments.push(...paveRes.value.data)
                setAssessments(allAssessments)

                if (flightsRes.status === 'fulfilled') setFlights(flightsRes.value.data)
            } catch {
                setStats({ totalPilots: 0, activePilots: 0, pendingPilots: 0, goCount: 0, cautionCount: 0, noGoCount: 0, totalImSafeAssessments: 0, totalPaveAssessments: 0 })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div className="p-3 lg:p-6 animate-slide-up max-w-7xl mx-auto space-y-4 sm:space-y-5">
            <h1 className="text-xl font-black text-black tracking-tight uppercase">Admin Dashboard</h1>

            {/* ═══════════════════════════════════════════════════════════════
                CHARTS FIRST — side by side: 2/3 trend + 1/3 pie
               ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <AdvancedTrendChart
                        assessments={assessments}
                        flights={flights}
                        title="System Wide Trend Report"
                    />
                </div>
                <div className="xl:col-span-1">
                    <SystemPieChart assessments={assessments} />
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                STAT CARDS BELOW — no aircraft cards
               ═══════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="glass-card p-4 sm:p-5 flex flex-col justify-center border-2 border-slate-200">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2.5 bg-primary-100 text-primary-600 rounded-lg"><Users size={20} /></div>
                        <div className="text-2xl font-black text-black">{loading ? '-' : stats?.totalPilots ?? 0}</div>
                    </div>
                    <div className="text-sm font-black text-slate-700 uppercase tracking-widest">Total Pilots</div>
                </div>

                <div className="glass-card p-4 sm:p-5 flex flex-col justify-center border-2 border-slate-200">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2.5 bg-green-100 text-green-600 rounded-lg"><Activity size={20} /></div>
                        <div className="text-2xl font-black text-black">{loading ? '-' : stats?.activePilots ?? 0}</div>
                    </div>
                    <div className="text-sm font-black text-slate-700 uppercase tracking-widest">Active Pilots</div>
                </div>

                <div className="glass-card p-4 sm:p-5 flex flex-col justify-center border-2 border-slate-200">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg"><CheckSquare size={20} /></div>
                        <div className="text-2xl font-black text-black">{loading ? '-' : (stats?.totalImSafeAssessments ?? 0) + (stats?.totalPaveAssessments ?? 0)}</div>
                    </div>
                    <div className="text-sm font-black text-slate-700 uppercase tracking-widest">Total Assessments</div>
                </div>

                <div className="glass-card p-4 sm:p-5 flex flex-col justify-center border-2 border-slate-200">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg"><AlertTriangle size={20} /></div>
                        <div className="text-2xl font-black text-black">{loading ? '-' : stats?.pendingPilots ?? 0}</div>
                    </div>
                    <div className="text-sm font-black text-slate-700 uppercase tracking-widest">Pending Signups</div>
                </div>
            </div>

            {/* Assessment Result Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5 border-2 border-green-200 bg-green-50/50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-black text-lg">✓</div>
                    <div>
                        <div className="text-2xl font-black text-black">{loading ? '-' : stats?.goCount ?? 0}</div>
                        <div className="text-sm font-black text-green-800 uppercase tracking-widest">Go Assessments</div>
                    </div>
                </div>
                <div className="glass-card p-5 border-2 border-amber-200 bg-amber-50/50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-black text-lg">⚠</div>
                    <div>
                        <div className="text-2xl font-black text-black">{loading ? '-' : stats?.cautionCount ?? 0}</div>
                        <div className="text-sm font-black text-amber-800 uppercase tracking-widest">Caution Assessments</div>
                    </div>
                </div>
                <div className="glass-card p-5 border-2 border-red-200 bg-red-50/50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-black text-lg">✕</div>
                    <div>
                        <div className="text-2xl font-black text-black">{loading ? '-' : stats?.noGoCount ?? 0}</div>
                        <div className="text-sm font-black text-red-800 uppercase tracking-widest">No-Go Assessments</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
