import { useEffect, useState } from 'react'
import { flightApi, smartWatchApi } from '../../lib/apiClient'
import type { FlightTripResponseDto, SmartWatchAnalysisDto } from '../../lib/types'
import { LayoutDashboard, Plane, Calendar, CheckCircle, Clock, Watch, ShieldCheck, ClipboardCheck, Brain, ChevronRight, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import clsx from 'clsx'

function TripStatusBadge({ flight, swDone }: { flight: FlightTripResponseDto; swDone: boolean }) {
    const imDone = !!flight.imSafeAssessmentId
    const paveDone = !!flight.paveAssessmentId
    const decideDone = !!flight.decideSessionId
    const allDone = swDone && imDone && paveDone && decideDone

    if (flight.status === 'Completed') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Completed</span>
    if (flight.status === 'Cleared' || allDone) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Cleared</span>
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Pending</span>
}

export function PilotDashboardPage() {
    const { user } = useAuthStore()
    const [flights, setFlights] = useState<FlightTripResponseDto[]>([])
    const [swAnalysis, setSwAnalysis] = useState<SmartWatchAnalysisDto | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [f, sw] = await Promise.allSettled([
                    flightApi.getMy(),
                    smartWatchApi.getAnalysis()
                ])
                if (f.status === 'fulfilled') setFlights(f.value.data)
                if (sw.status === 'fulfilled') setSwAnalysis(sw.value.data)
            } catch (err) { console.error('Error loading pilot dashboard data') }
            finally { setLoading(false) }
        }
        load()
    }, [])

    const swDone = !!swAnalysis
    const pendingFlights = flights.filter(f => f.status === 'Pending' || f.status === 'Cleared')
    const completedFlights = flights.filter(f => f.status === 'Completed')

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-black flex items-center gap-3">
                <LayoutDashboard className="text-primary-500" />
                Pilot Dashboard
            </h1>

            {/* Welcome + SmartWatch Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 flex items-start gap-4">
                    <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                        <Plane size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-black">Welcome, {user?.fullName?.split(' ')[0] || 'Pilot'}</h3>
                        <p className="text-base text-slate-700 mt-1">
                            You have <span className="text-primary-600 font-bold">{pendingFlights.length}</span> active trip{pendingFlights.length !== 1 ? 's' : ''} awaiting preparation.
                            Complete all assessments for each assigned trip before departure.
                        </p>
                    </div>
                </div>
                <div className={clsx('glass-card p-6 flex items-start gap-4 border-l-4',
                    swDone ? (swAnalysis!.fitnessStatus === 'Fit' ? 'border-green-500' : swAnalysis!.fitnessStatus === 'Caution' ? 'border-amber-500' : 'border-red-500') : 'border-slate-300')}>
                    <div className={clsx('p-3 rounded-xl', swDone ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500')}>
                        <Watch size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-slate-600 uppercase tracking-widest font-bold">SmartWatch Status</div>
                        {swDone && swAnalysis ? (
                            <>
                                <div className={clsx('text-xl font-black mt-1',
                                    swAnalysis.fitnessStatus === 'Fit' ? 'text-green-700' :
                                        swAnalysis.fitnessStatus === 'Caution' ? 'text-amber-700' : 'text-red-700')}>
                                    {swAnalysis.fitnessStatus}
                                </div>
                                <div className="text-sm text-black mt-1">
                                    HR: {swAnalysis.latestHeartRate ?? '—'} bpm · SpO₂: {swAnalysis.averageSpO2 ?? '—'}%
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-base font-bold text-black mt-1">No Data Yet</div>
                                <div className="text-sm text-slate-600 mt-1">Submit smartwatch data via your trip preparation page.</div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Trips */}
            {pendingFlights.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-black flex items-center gap-2">
                        <Plane className="text-primary-500" size={20} />
                        My Assigned Trips
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {pendingFlights.map(f => {
                            const imDone = !!f.imSafeAssessmentId
                            const paveDone = !!f.paveAssessmentId
                            const decideDone = !!f.decideSessionId
                            const completedCount = [swDone, imDone, paveDone, decideDone].filter(Boolean).length

                            return (
                                <div key={f.id} className="glass-card p-5 relative overflow-hidden group flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                                <Plane size={20} />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-black">{f.flightNumber || 'FLIGHT'}</div>
                                                <div className="text-sm text-slate-600">{f.aircraftType}</div>
                                            </div>
                                        </div>
                                        <TripStatusBadge flight={f} swDone={swDone} />
                                    </div>

                                    {/* Route */}
                                    <div className="flex items-center justify-between text-black bg-slate-50 px-4 py-4 rounded-xl border border-slate-200">
                                        <div className="text-center flex-1 font-black text-2xl text-black">{f.departure}</div>
                                        <div className="px-3 text-primary-500 font-black text-2xl">→</div>
                                        <div className="text-center flex-1 font-black text-2xl text-black">{f.arrival}</div>
                                    </div>

                                    {/* Date */}
                                    <div className="flex items-center gap-2 text-sm text-black">
                                        <Calendar size={14} className="text-primary-500" />
                                        {new Date(f.departureTime).toLocaleString()}
                                    </div>

                                    {/* Assessment progress */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-600 uppercase tracking-widest">
                                            <span>Required Checks</span>
                                            <span>{completedCount}/4</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {[
                                                { label: 'SW', done: swDone, icon: Watch },
                                                { label: 'IM', done: imDone, icon: ShieldCheck },
                                                { label: 'PV', done: paveDone, icon: ClipboardCheck },
                                                { label: 'DC', done: decideDone, icon: Brain },
                                            ].map(({ label, done, icon: Icon }) => (
                                                <div key={label} className={clsx('flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border',
                                                    done ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-black border-slate-200')}>
                                                    <Icon size={16} className={done ? "text-green-700" : "text-black"} />
                                                    <span className="text-sm font-black text-black">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary-500 to-green-500 rounded-full transition-all duration-500"
                                                style={{ width: `${(completedCount / 4) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Link to={`/flights/${f.id}`}
                                        className="mt-auto block w-full text-center py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                        {completedCount === 4 ? <><CheckCircle size={14} /> View Trip</> : <><Clock size={14} /> Continue Preparation</>}
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* No pending trips */}
            {!loading && pendingFlights.length === 0 && (
                <div className="glass-card p-12 text-center border-2 border-dashed border-slate-300">
                    <Plane size={48} className="mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-black">No Active Trips</h3>
                    <p className="text-base text-slate-600 mt-2">
                        Your admin has not yet assigned any trips to you. Check back later or contact your flight operations center.
                    </p>
                </div>
            )}

            {/* Completed Trips */}
            {completedFlights.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-base font-bold text-black flex items-center gap-2">
                        <CheckCircle size={16} className="text-slate-500" />
                        Completed Trips ({completedFlights.length})
                    </h2>
                    <div className="space-y-3">
                        {completedFlights.map(f => (
                            <Link key={f.id} to={`/trips/${f.id}`}
                                className="glass-card px-5 py-4 flex items-center justify-between hover:shadow-md hover:border-primary-300 transition-all cursor-pointer">
                                <div className="flex items-center gap-6">
                                    <div className="text-lg font-black text-black">{f.departure} → {f.arrival}</div>
                                    <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded">{f.flightNumber || '—'}</div>
                                    <div className="text-sm font-bold text-slate-700">{f.aircraftType}</div>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-bold text-slate-800">
                                    <Calendar size={14} className="text-primary-500" />
                                    {new Date(f.departureTime).toLocaleString()}
                                    <div className="flex items-center gap-1 text-primary-600 font-bold uppercase transition-transform group-hover:translate-x-1">
                                        <Eye size={16} /> View Report
                                    </div>
                                    <ChevronRight size={16} className="text-primary-500" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
