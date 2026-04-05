import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { usersApi, imSafeApi, paveApi, flightApi } from '../../lib/apiClient'
import type { UserResponseDto, ImSafeResponseDto, PaveResponseDto, FlightTripResponseDto } from '../../lib/types'
import { ChevronLeft, RefreshCw, X } from 'lucide-react'
import { AdvancedTrendChart, SystemPieChart } from '../../components/shared/AdvancedCharts'

export function UserDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState<UserResponseDto | null>(null)
    const [assessments, setAssessments] = useState<(ImSafeResponseDto | PaveResponseDto)[]>([])
    const [flights, setFlights] = useState<FlightTripResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const getAvatarSrc = (u: UserResponseDto) => {
        if (u.profileImageUrl) {
            if (u.profileImageUrl.startsWith('http')) return u.profileImageUrl
            return api.defaults.baseURL + u.profileImageUrl
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&size=512&background=0284c7&color=fff`
    }

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
            <div className="glass-card shadow-sm border border-slate-200">
                <div className="bg-gradient-to-r from-blue-100 via-blue-50 to-white border-b border-slate-200 rounded-t-2xl p-4 sm:p-5 flex items-center justify-between relative overflow-hidden">
                    {/* Small accent bar top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500"></div>
                    
                    <div className="flex items-center gap-4">
                        <img 
                            src={getAvatarSrc(user)}
                            alt={user.fullName}
                            className="w-14 h-14 rounded-full object-cover shadow-sm bg-primary-50 border-2 border-primary-200 cursor-pointer hover:scale-105 hover:opacity-90 transition-all shrink-0"
                            onClick={() => setSelectedImage(getAvatarSrc(user))}
                            title="View Full Picture"
                        />
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-black tracking-tight">{user.fullName}</div>
                            <div className="text-xs sm:text-sm font-bold tracking-wide text-primary-600">{user.email}</div>
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

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md animate-fade-in p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-8 right-8 p-3 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 hover:scale-110 transition-all border-2 border-white/20"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImage}
                        className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-cover border-8 border-white animate-slide-up"
                        alt="Zoomed Profile"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
