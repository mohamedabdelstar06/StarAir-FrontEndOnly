import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usersApi, imSafeApi, paveApi, flightApi } from '../../lib/apiClient'
import type { UserResponseDto, ImSafeResponseDto, PaveResponseDto, FlightTripResponseDto } from '../../lib/types'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { AdvancedTrendChart, SystemPieChart } from '../../components/shared/AdvancedCharts'

export function UserDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState<UserResponseDto | null>(null)
    const [assessments, setAssessments] = useState<(ImSafeResponseDto | PaveResponseDto)[]>([])
    const [flights, setFlights] = useState<FlightTripResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const userRes = await usersApi.getById(id)
                setUser(userRes.data)

                const [imRes, paveRes, flightsRes] = await Promise.all([
                    imSafeApi.getByPilot(id),
                    paveApi.getByPilot(id),
                    flightApi.getAll()
                ])
                setAssessments([...imRes.data, ...paveRes.data])
                setFlights(flightsRes.data.filter(f => f.pilotId === id))
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Failed to load user info')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    if (loading) return <div className="flex items-center justify-center p-16"><RefreshCw size={32} className="animate-spin text-primary-500" /></div>
    if (error || !user) return <div className="p-16 text-center text-red-600 text-lg font-bold">{error || 'User not found'}</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/users')} className="p-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-all text-black">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-black">Pilot Deep Dive</h1>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">{user.fullName}</p>
                </div>
            </div>

            {/* Top User Info Bar */}
            <div className="glass-card">
                <div className="bg-slate-900 border-b-4 border-primary-500 rounded-t-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold text-white shadow-xl">
                            {user.fullName[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">{user.fullName}</div>
                            <div className="text-sm font-semibold text-primary-300">{user.email}</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {user.roles.map(r => <span key={r} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider">{r}</span>)}
                    </div>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Medical Class</div>
                        <div className="text-lg font-black text-black">{user.medicalClass || '—'}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Rank</div>
                        <div className="text-lg font-black text-black">{user.rank || '—'}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">License No.</div>
                        <div className="text-lg font-black text-black">{user.licenseNumber || '—'}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Flight Hours</div>
                        <div className="text-lg font-black text-black">{user.totalFlightHours}h</div>
                    </div>
                </div>
            </div>

            {/* 2/3 - 1/3 Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 align-top">
                {/* Left 2/3: All daily trips & metrics */}
                <div className="xl:col-span-2">
                    <AdvancedTrendChart assessments={assessments} flights={flights} title="Pilot Trending Report" />
                </div>

                {/* Right 1/3: Reason Pie Chart */}
                <div className="xl:col-span-1">
                    <SystemPieChart assessments={assessments} />
                </div>
            </div>
        </div>
    )
}
