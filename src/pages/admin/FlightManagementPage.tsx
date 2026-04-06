import { useEffect, useState, useRef } from 'react'
import { flightApi, usersApi } from '../../lib/apiClient'
import type { FlightTripResponseDto, UserResponseDto, CreateFlightTripDto, UpdateFlightTripDto } from '../../lib/types'
import { FLIGHT_CATEGORIES, getAircraftByCategory } from '../../lib/aircraftData'
import { searchAerodromes, type Aerodrome } from '../../lib/aerodromeData'
import { useNotificationStore } from '../../stores/notificationStore'
import { TripAssessmentBadge } from '../../components/shared/TripAssessmentBadge'
import { Plus, Plane, Trash2, Calendar, User, RefreshCw, X, ShieldCheck, ClipboardCheck, Brain, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

const ITEMS_PER_PAGE = 8

// ─── Aerodrome Search Dropdown Component ─────────────────────────────────
function AerodromeDropdown({ value, onChange, label }: {
    value: string
    onChange: (icao: string) => void
    label: string
}) {
    const [query, setQuery] = useState(value)
    const [results, setResults] = useState<Aerodrome[]>([])
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setResults(searchAerodromes(query, 15))
    }, [query])

    useEffect(() => {
        setQuery(value)
    }, [value])

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const handleSelect = (a: Aerodrome) => {
        onChange(a.icao)
        setQuery(`${a.icao} — ${a.city}`)
        setOpen(false)
    }

    return (
        <div className="space-y-1.5" ref={ref}>
            <label className="text-xs font-bold text-black uppercase tracking-widest">{label}</label>
            <input
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2.5 text-black outline-none focus:border-primary-500 transition-all font-mono uppercase placeholder:text-slate-400 placeholder:normal-case text-sm"
                placeholder="Search ICAO, city, country..."
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); onChange('') }}
                onFocus={() => setOpen(true)}
                required
            />
            {open && results.length > 0 && (
                <div className="absolute z-50 w-full max-h-56 overflow-y-auto bg-white border-2 border-slate-300 rounded-xl shadow-xl mt-1">
                    {results.map(a => (
                        <button
                            key={a.icao}
                            type="button"
                            onClick={() => handleSelect(a)}
                            className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-black text-sm">{a.icao}</span>
                                <span className="text-xs text-slate-500 font-semibold">{a.iata}</span>
                            </div>
                            <div className="text-sm text-slate-700">{a.city}, {a.country}</div>
                            <div className="text-xs text-slate-400 truncate">{a.name}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export function FlightManagementPage() {
    const navigate = useNavigate()
    const [flights, setFlights] = useState<FlightTripResponseDto[]>([])
    const [pilots, setPilots] = useState<UserResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [mode, setMode] = useState<'create'|'edit'>('create')
    const [editId, setEditId] = useState<number | null>(null)
    const addNotification = useNotificationStore(s => s.addNotification)

    // Form State
    const [tripTitle, setTripTitle] = useState('')
    const [flightCategory, setFlightCategory] = useState('')
    const [aircraftType, setAircraftType] = useState('')
    const [pilotId, setPilotId] = useState('')
    const [departure, setDeparture] = useState('')
    const [arrival, setArrival] = useState('')
    const [departureTime, setDepartureTime] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [formError, setFormError] = useState('')

    const availableAircraft = flightCategory ? getAircraftByCategory(flightCategory) : []

    const loadData = async () => {
        setLoading(true)
        try {
            // Fetch users independently
            let fetchedPilots: UserResponseDto[] = [];
            try {
                const pRes = await usersApi.getAll();
                console.log("RAW USERS DATA:", pRes.data);
                fetchedPilots = (pRes.data || []);
                // If you STILL want to filter by pilot role ONLY, uncomment the following lines:
                /*
                fetchedPilots = (pRes.data || []).filter(p => {
                    const safeRoles = p.roles || (p as any).Roles || [];
                    return Array.isArray(safeRoles) && safeRoles.some(r => typeof r === 'string' && r.toLowerCase() === 'pilot');
                });
                */
            } catch (userErr) {
                console.error("Failed to fetch users:", userErr);
            }
            setPilots(fetchedPilots);

            // Fetch flights independently
            try {
                const fRes = await flightApi.getAll();
                setFlights(fRes.data || []);
            } catch (flightErr) {
                console.error("Failed to fetch flights:", flightErr);
                setFlights([]);
            }
            
        } catch (err) {
            console.error('Critical Error in loadData', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    const resetForm = () => {
        setMode('create'); setEditId(null)
        setTripTitle(''); setFlightCategory(''); setAircraftType(''); setPilotId('')
        setDeparture(''); setArrival(''); setDepartureTime(''); setDescription(''); setFormError('')
    }

    const openEditTrip = (f: FlightTripResponseDto) => {
        setMode('edit'); setEditId(f.id)
        setTripTitle(f.flightNumber || '')
        setFlightCategory(f.flightCategory)
        setAircraftType(f.aircraftType)
        setPilotId(f.pilotId) // will be disabled in edit mode
        setDeparture(f.departure)
        setArrival(f.arrival)
        const dt = new Date(f.departureTime)
        // format for datetime-local: YYYY-MM-DDThh:mm
        const tzOffset = dt.getTimezoneOffset() * 60000; // offset in milliseconds
        const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
        setDepartureTime(localISOTime)
        setShowModal(true)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError('')
        if (!pilotId) { setFormError('Please assign a pilot for this trip.'); return }
        if (!flightCategory) { setFormError('Please select a trip type.'); return }
        if (!aircraftType) { setFormError('Please select an aircraft type.'); return }
        if (!departure.trim() || !arrival.trim()) { setFormError('Please select origin and destination aerodromes.'); return }
        if (!departureTime) { setFormError('Please set the departure date & time.'); return }

        setSubmitting(true)
        try {
            if (mode === 'create') {
                const dto: CreateFlightTripDto = {
                    pilotId,
                    flightCategory,
                    aircraftType,
                    departure: departure.toUpperCase().trim(),
                    arrival: arrival.toUpperCase().trim(),
                    departureTime,
                    flightNumber: tripTitle || `${departure.toUpperCase()}-${arrival.toUpperCase()}`,
                }
                await flightApi.create(dto)

                // Notification for the assigned pilot
                const assignedPilot = pilots.find(p => p.id === pilotId)
                addNotification({
                    type: 'trip_assigned',
                    title: 'New Trip Assigned',
                    message: `Trip ${dto.flightNumber} (${departure} → ${arrival}) on ${aircraftType} has been assigned to ${assignedPilot?.email || 'pilot'}.`,
                    flightId: undefined,
                    pilotId,
                    pilotName: assignedPilot?.fullName,
                })
            } else if (mode === 'edit' && editId) {
                const dto: UpdateFlightTripDto = {
                    flightCategory,
                    aircraftType,
                    departure: departure.toUpperCase().trim(),
                    arrival: arrival.toUpperCase().trim(),
                    departureTime,
                    flightNumber: tripTitle || `${departure.toUpperCase()}-${arrival.toUpperCase()}`,
                }
                await flightApi.update(editId, dto)
            }

            setShowModal(false)
            resetForm()
            loadData()
        } catch (err: any) {
            const serverMsg = err.response?.data?.message || err.message || 'Unknown network error';
            setFormError(`Failed to create trip. Details: ${serverMsg}`)
            console.error('Error creating flight', err)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this trip assignment?')) return
        try {
            await flightApi.delete(id)
            loadData()
        } catch (err) {
            console.error('Error deleting flight', err)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Cleared': return 'bg-green-100 text-green-700 border border-green-200'
            case 'Completed': return 'bg-blue-100 text-blue-700 border border-blue-200'
            case 'Cancelled': return 'bg-red-100 text-red-700 border border-red-200'
            default: return 'bg-amber-100 text-amber-700 border border-amber-200'
        }
    }

    const getCategoryLabel = (key: string) => {
        const cat = FLIGHT_CATEGORIES.find(c => c.key === key)
        return cat ? `${cat.emoji} ${cat.label}` : key
    }

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const totalPages = Math.max(1, Math.ceil(flights.length / ITEMS_PER_PAGE))
    const paginatedFlights = flights.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    // Reset to page 1 when flights change
    useEffect(() => { setCurrentPage(1) }, [flights.length])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-black flex items-center gap-3">
                    <Plane className="text-primary-500" />
                    Trip Assignments
                </h1>
                <button
                    onClick={() => { setShowModal(true); resetForm() }}
                    className="btn-primary flex items-center gap-2 px-4 py-2.5"
                >
                    <Plus size={18} /> New Trip
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-primary-500" /></div>
            ) : (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {paginatedFlights.map(f => {
                        return (
                        <div key={f.id} className="bg-white rounded-2xl p-5 relative group overflow-hidden flex flex-col gap-4 cursor-pointer shadow-xl shadow-slate-300/80 hover:shadow-2xl hover:shadow-slate-400 hover:-translate-y-1 transition-all border-2 border-blue-400/60" onClick={() => navigate(`/trips/${f.id}`)}>
                            {/* Status + Delete */}
                            <div className="flex justify-between items-start">
                                <TripAssessmentBadge trip={f} />
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); openEditTrip(f) }} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="Edit Trip">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(f.id) }} className="text-red-500 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors pointer-events-auto opacity-100" title="Delete Trip">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Trip Title */}
                            {f.flightNumber && (
                                <div className="text-base font-bold text-black truncate">{f.flightNumber}</div>
                            )}

                            {/* Category + Aircraft */}
                            <div className="flex flex-col gap-1">
                                <span className="text-base font-semibold text-black">{getCategoryLabel(f.flightCategory)}</span>
                                <span className="text-sm text-slate-600">{f.aircraftType}</span>
                            </div>

                            {/* Pilot */}
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500"><User size={14} /></div>
                                <span className="text-sm font-semibold text-black">{f.pilotName}</span>
                            </div>

                            {/* Route */}
                            <div className="flex items-center justify-between text-sm text-black bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                                <div className="flex-1 text-center">
                                    <div className="text-xs font-bold text-slate-800 mb-0.5 uppercase tracking-widest">Origin</div>
                                    <div className="font-black text-lg text-black">{f.departure}</div>
                                </div>
                                <div className="px-3 text-primary-500 font-bold">→</div>
                                <div className="flex-1 text-center">
                                    <div className="text-xs font-bold text-slate-800 mb-0.5 uppercase tracking-widest">Dest</div>
                                    <div className="font-black text-lg text-black">{f.arrival}</div>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2 text-sm text-black">
                                <Calendar size={14} className="text-primary-500" />
                                {new Date(f.departureTime).toLocaleString()}
                            </div>

                            {/* Assessments indicator */}
                            <div className="pt-3 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-black text-black uppercase tracking-widest">Assessments</span>
                                    <div className="flex gap-2 items-center">
                                        {[
                                            { done: !!f.imSafeAssessmentId, icon: ShieldCheck, label: 'IMSAFE' },
                                            { done: !!f.paveAssessmentId, icon: ClipboardCheck, label: 'PAVE' },
                                            { done: !!f.decideSessionId, icon: Brain, label: 'DECIDE' },
                                        ].map(({ done, icon: Icon, label }) => (
                                            <div key={label} title={label} className={clsx('w-9 h-9 rounded-full flex items-center justify-center',
                                                done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')}>
                                                <Icon size={18} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )
                    })}
                    {flights.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl">
                            <Plane size={40} className="mx-auto mb-3 text-slate-400" />
                            <div className="font-bold text-black">No trips assigned yet</div>
                            <div className="text-base mt-1 text-slate-600">Click "New Trip" to create and assign a trip to a pilot.</div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={clsx('flex items-center gap-1 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all',
                                currentPage === 1 ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-black hover:bg-slate-100')}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={clsx('w-10 h-10 rounded-xl font-bold text-sm transition-all',
                                        page === currentPage
                                            ? 'bg-primary-600 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200')}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={clsx('flex items-center gap-1 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all',
                                currentPage === totalPages ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-black hover:bg-slate-100')}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
                </>
            )}

            {/* Create Trip Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 sm:pt-10 overflow-y-auto">
                    <div className="glass-card w-full sm:max-w-4xl overflow-hidden border border-slate-300 shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[95vh] sm:max-h-none overflow-y-auto">
                        {/* Header */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-primary-50">
                            <h2 className="text-xl font-bold text-black flex items-center gap-2">
                                <Plane size={20} className="text-primary-500" /> {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
                            </h2>
                            <button onClick={() => { setShowModal(false); resetForm() }} className="text-slate-500 hover:text-black transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-4 sm:p-6">
                            {formError && (
                                <div className="px-4 py-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-base">
                                    {formError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {/* Trip Title */}
                                <div className="space-y-1.5 col-span-1 md:col-span-2">
                                    <label className="text-sm font-bold text-black uppercase tracking-widest">Trip Title</label>
                                    <input
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-primary-500 transition-all placeholder:text-slate-400 text-base"
                                        placeholder="e.g. Cairo to Luxor Transfer"
                                        value={tripTitle}
                                        onChange={e => setTripTitle(e.target.value)}
                                    />
                                </div>

                                {/* Trip Type (Category) */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-black uppercase tracking-widest">Trip Type *</label>
                                    <select
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-primary-500 transition-all text-base"
                                        value={flightCategory}
                                        onChange={e => { setFlightCategory(e.target.value); setAircraftType('') }}
                                        required
                                    >
                                        <option value="">Select trip type...</option>
                                        {FLIGHT_CATEGORIES.map(c => (
                                            <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Aircraft Type (filtered by category) */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-black uppercase tracking-widest">Aircraft Type *</label>
                                    <select
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-primary-500 transition-all text-base"
                                        value={aircraftType}
                                        onChange={e => setAircraftType(e.target.value)}
                                        required
                                        disabled={!flightCategory}
                                    >
                                        <option value="">{flightCategory ? 'Select aircraft type...' : 'Select trip type first...'}</option>
                                        {availableAircraft.map(a => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Origin */}
                                <div className="relative">
                                    <AerodromeDropdown
                                        value={departure}
                                        onChange={setDeparture}
                                        label="Origin (ICAO)"
                                    />
                                </div>
                                {/* Destination */}
                                <div className="relative">
                                    <AerodromeDropdown
                                        value={arrival}
                                        onChange={setArrival}
                                        label="Destination (ICAO)"
                                    />
                                </div>

                                {/* Departure Time */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-black uppercase tracking-widest">Departure Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-primary-500 transition-all text-base"
                                        value={departureTime}
                                        onChange={e => setDepartureTime(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Assign Pilot (Email dropdown) */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-black uppercase tracking-widest">Assign Pilot (Email) {mode === 'create' && '*'}</label>
                                    <select
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-primary-500 transition-all text-base disabled:opacity-50 disabled:bg-slate-100"
                                        value={pilotId}
                                        onChange={e => setPilotId(e.target.value)}
                                        required={mode === 'create'}
                                        disabled={mode === 'edit'}
                                    >
                                        <option value="">Select pilot email...</option>
                                        {(!pilots || pilots.length === 0) ? (
                                            <option disabled value="" className="text-slate-400">No pilots available</option>
                                        ) : (
                                            pilots.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.email} ({(p.roles || (p as any).Roles || []).join(', ') || 'No Role'})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5 col-span-1 md:col-span-2">
                                    <label className="text-sm font-bold text-black uppercase tracking-widest">Description <span className="text-slate-400 normal-case">(optional)</span></label>
                                    <textarea
                                        className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black outline-none focus:border-primary-500 transition-all resize-none h-20 placeholder:text-slate-400 text-base"
                                        placeholder="Additional notes..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm() }}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl transition-all border border-slate-300 text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={clsx('flex-[2] px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base', submitting && 'opacity-50')}
                                >
                                    {submitting ? <RefreshCw className="animate-spin" size={18} /> : <><Plus size={18} /> {mode === 'create' ? 'Create & Assign Trip' : 'Save Changes'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
