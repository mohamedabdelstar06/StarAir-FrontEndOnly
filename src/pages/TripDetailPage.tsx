import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { flightApi, imSafeApi, paveApi, decideApi } from '../lib/apiClient'
import type { FlightTripResponseDto, ImSafeResponseDto, PaveResponseDto, DecideSessionResponseDto } from '../lib/types'
import {
    ChevronLeft, Plane, Calendar, ShieldCheck, ClipboardCheck, Brain,
    CheckCircle, XCircle, RefreshCw, User, ArrowRight, Watch, Check
} from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '../stores/authStore'
import { WeatherWidget } from '../components/shared/WeatherWidget'
import { SmartWatchPanel } from '../components/shared/SmartWatchPanel'

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────
function PieChart({ percentage, color, size = 80 }: { percentage: number; color: string; size?: number }) {
    const radius = (size - 10) / 2
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * radius
    const dash = (percentage / 100) * circumference
    const gap = circumference - dash
    return (
        <svg width={size} height={size}>
            {/* Background circle */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={10} />
            {/* Progress arc */}
            <circle
                cx={cx} cy={cy} r={radius} fill="none"
                stroke={color} strokeWidth={10}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
            />
            {/* Center text */}
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={size < 70 ? 12 : 15} fontWeight="900" fill="#1e293b">
                {Math.round(percentage)}%
            </text>
        </svg>
    )
}

// ─── Risk Level helpers ──────────────────────────────────────────────────────
// Backend stores risk as: None=OK (pilot answered "OK"), High=No (pilot answered "No").
// Low and Medium are kept for compatibility but in binary mode are treated as concerns.
function riskToLabel(level: string) {
    return level === 'None' ? 'OK' : 'No'
}

function riskToIsOk(level: string) {
    // Only 'None' means the pilot answered OK. Any other value is a flagged concern.
    return level === 'None'
}

// ─── Read-only Risk Card (mirrors the pilot form) ────────────────────────────
function ReadonlyRiskCard({
    label, hint, level, notes
}: {
    label: string
    hint?: string
    level: string
    notes?: string | null
}) {
    const isOk = riskToIsOk(level)
    const display = riskToLabel(level)

    return (
        <div className="w-full bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                    <div className="text-2xl font-black text-black leading-snug">{label}</div>
                    {hint && <div className="text-base text-slate-600 mt-1 font-medium leading-relaxed">{hint}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                    <div className={clsx(
                        'px-5 py-2.5 rounded-xl text-base font-black border-2 transition-all',
                        isOk
                            ? 'bg-green-500 text-white border-green-600 shadow-md'
                            : 'bg-white text-slate-400 border-slate-200'
                    )}>✅ OK</div>
                    <div className={clsx(
                        'px-5 py-2.5 rounded-xl text-base font-black border-2 transition-all',
                        !isOk
                            ? 'bg-red-500 text-white border-red-600 shadow-md'
                            : 'bg-white text-slate-400 border-slate-200'
                    )}>❌ No</div>
                </div>
            </div>
            {!isOk && notes && (
                <div className="px-5 pb-4 border-t-2 border-red-100 bg-red-50 pt-3">
                    <div className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">⚠️ Details:</div>
                    <div className="text-base text-red-800 font-medium">{notes}</div>
                </div>
            )}
            {!isOk && !notes && (
                <div className="px-5 pb-4 border-t-2 border-red-100 bg-red-50 pt-3">
                    <div className="text-xs font-bold text-red-700 uppercase tracking-widest">⚠️ Flagged as concern — no additional notes provided.</div>
                </div>
            )}
        </div>
    )
}

// ─── Result Card with Pie ──────────────────────────────────────────────────────
function ResultCard({ result, score, outOf }: { result: string; score: number; outOf: number }) {
    // "OK" answers contribute 0 to risk score; max per item is 3
    // Score is sum of risk levels. Lower = more OK answers.
    // Percentage of "Go" = (1 - score/outOf) * 100
    const okPercent = Math.max(0, Math.round((1 - score / outOf) * 100))
    const cfg = result === 'Go'
        ? { bg: 'bg-green-50 border-green-300', text: 'text-green-700', msg: 'Cleared for flight operations', color: '#16a34a' }
        : result === 'Caution'
            ? { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-700', msg: 'Proceed with extra caution', color: '#d97706' }
            : { bg: 'bg-red-50 border-red-300', text: 'text-red-700', msg: 'Do NOT fly today', color: '#dc2626' }
    return (
        <div className={clsx('rounded-2xl border-2 p-5 flex items-center gap-5', cfg.bg)}>
            <PieChart percentage={okPercent} color={cfg.color} size={80} />
            <div>
                <div className={clsx('text-2xl font-black', cfg.text)}>{result}</div>
                <div className="text-sm text-slate-600 font-semibold mt-0.5">{cfg.msg}</div>
                <div className="text-xs text-slate-500 mt-1">Risk Score: <span className="font-mono font-black text-slate-700">{score}/{outOf}</span></div>
                <div className={clsx('text-xs font-bold mt-1', cfg.text)}>{okPercent}% OK rate</div>
            </div>
        </div>
    )
}

// ─── Step definitions (mirrors FlightPrepPage) ────────────────────────────────
const STEPS = [
    { key: 'sw', label: 'Health', icon: Watch, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
    { key: 'imsafe', label: 'IMSAFE', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    { key: 'pave', label: 'PAVE', icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    { key: 'decide', label: 'DECIDE', icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
]

const DECIDE_STEP_LABELS: Record<string, { label: string; desc: string; color: string; bg: string }> = {
    Detect: { label: 'Detect', desc: 'Scan external, internal, and personal domains', color: 'text-blue-800', bg: 'bg-blue-500/10 border-blue-500/30' },
    Evaluate: { label: 'Evaluate', desc: 'Assess severity and likelihood of risks', color: 'text-slate-900', bg: 'bg-amber-500/10 border-amber-500/30' },
    Consider: { label: 'Consider', desc: 'Generate at least 3 mitigations or alternatives', color: 'text-purple-800', bg: 'bg-purple-500/10 border-purple-500/30' },
    Integrate: { label: 'Integrate', desc: 'Merge mitigations into flight plan and limits', color: 'text-cyan-800', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    Decide: { label: 'Decide', desc: 'Commit to the best plan and communicate', color: 'text-orange-800', bg: 'bg-orange-500/10 border-orange-500/30' },
    Execute: { label: 'Execute & Reassess', desc: 'Put decision into action and continuous monitor', color: 'text-green-800', bg: 'bg-green-500/10 border-green-500/30' },
}

export function TripDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const isAdmin = user?.roles.includes('Admin')

    const [flight, setFlight] = useState<FlightTripResponseDto | null>(null)
    const [imSafe, setImSafe] = useState<ImSafeResponseDto | null>(null)
    const [pave, setPave] = useState<PaveResponseDto | null>(null)
    const [decide, setDecide] = useState<DecideSessionResponseDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [swDone, setSwDone] = useState(false)

    // Wizard step: 0=IMSAFE, 1=PAVE, 2=DECIDE
    const [activeStep, setActiveStep] = useState<number>(0)

    // Reload flight to refresh linked assessments (called after smartwatch submit)
    const loadFlight = async () => {
        if (!id) return
        setLoading(true)
        try {
            const flightsRes = isAdmin ? await flightApi.getAll() : await flightApi.getMy()
            const found = flightsRes.data.find((f: FlightTripResponseDto) => f.id === Number(id))
            if (!found) { setLoading(false); return }
            setFlight(found)
            setSwDone(!!found.smartWatchReadingId)

            const [imRes, pvRes, dcRes] = await Promise.allSettled([
                found.imSafeAssessmentId ? imSafeApi.getById(found.imSafeAssessmentId) : Promise.resolve(null),
                found.paveAssessmentId ? paveApi.getById(found.paveAssessmentId) : Promise.resolve(null),
                found.decideSessionId ? decideApi.getSession(found.decideSessionId) : Promise.resolve(null),
            ])
            if (imRes.status === 'fulfilled' && imRes.value) setImSafe((imRes.value as any).data)
            if (pvRes.status === 'fulfilled' && pvRes.value) setPave((pvRes.value as any).data)
            if (dcRes.status === 'fulfilled' && dcRes.value) setDecide((dcRes.value as any).data)
        } catch (e) {
            console.error('Error loading trip detail', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadFlight() }, [id, isAdmin])

    if (loading) return (
        <div className="flex justify-center p-16">
            <RefreshCw size={28} className="animate-spin text-primary-500" />
        </div>
    )

    if (!flight) return (
        <div className="p-12 text-center text-red-600 text-xl font-bold">
            ❌ Trip not found or you don't have access.
        </div>
    )

    const backUrl = isAdmin ? '/flights' : '/dashboard'
    const stepStatus = [swDone, !!imSafe, !!pave, !!decide]
    const stepColors = ['#f43f5e', '#3b82f6', '#a855f7', '#f59e0b']

    // ── Render SmartWatch step ──────────────────────────────────────────────
    // Pilots on Pending trips can submit health data; everyone else sees read-only
    const canSubmitHealth = !isAdmin && flight?.status === 'Pending'
    const renderSmartWatchPanel = () => (
        <div className="space-y-5">
            <SmartWatchPanel
                tripId={canSubmitHealth ? flight!.id : undefined}
                readingId={flight?.smartWatchReadingId ?? undefined}
                showEntryForm={canSubmitHealth}
                onSubmitComplete={() => { loadFlight(); setActiveStep(1) }}
            />
            {swDone && (
                <div className="flex justify-end pt-2">
                    <button onClick={() => setActiveStep(1)}
                        className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                        Next: IMSAFE Assessment <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    )

    // ── Render IMSAFE step ──────────────────────────────────────────────────
    const renderImSafePanel = () => {
        if (!imSafe) return (
            <div className="text-center py-12 text-slate-500">
                <ShieldCheck size={48} className="mx-auto text-slate-300 mb-3" />
                <div className="text-base font-semibold">IMSAFE assessment was not completed for this trip.</div>
            </div>
        )
        return (
            <div className="space-y-3">
                <ResultCard result={imSafe.result} score={imSafe.overallRiskScore} outOf={18} />
                <div className="space-y-3 pt-2">
                    <ReadonlyRiskCard
                        label="🤒 I — Illness"
                        hint="Any symptoms (fever, congestion, dizziness) that could worsen under flight stress?"
                        level={imSafe.illnessLevel}
                        notes={imSafe.illnessNotes}
                    />
                    <ReadonlyRiskCard
                        label="💊 M — Medication"
                        hint="Any medications (OTC or prescription) causing drowsiness, blurred vision, or impaired performance?"
                        level={imSafe.medicationLevel}
                        notes={imSafe.medicationNotes}
                    />
                    <ReadonlyRiskCard
                        label="😰 S — Stress"
                        hint="Significant psychological pressure (work, finances, family) that could drain cognitive bandwidth?"
                        level={imSafe.stressLevel}
                        notes={imSafe.stressNotes}
                    />
                    <ReadonlyRiskCard
                        label="🍺 A — Alcohol"
                        hint="Alcohol consumed within the last 8–12 hours?"
                        level={imSafe.alcoholLevel}
                        notes={imSafe.hoursSinceLastDrink != null ? `Hours since last drink: ${imSafe.hoursSinceLastDrink}h` : null}
                    />
                    <ReadonlyRiskCard
                        label="😴 F — Fatigue"
                        hint="Below personal rest standard? Fatigue undermines every phase of flight."
                        level={imSafe.fatigueLevel}
                        notes={imSafe.hoursSlept != null ? `Hours slept: ${imSafe.hoursSlept}h` : null}
                    />
                    <ReadonlyRiskCard
                        label="😤 E — Emotions"
                        hint="Emotional volatility (anger, grief, excitement) that could hijack rational decision-making?"
                        level={imSafe.emotionLevel}
                        notes={imSafe.emotionNotes}
                    />
                </div>
                <div className="flex justify-between pt-4">
                    <button onClick={() => setActiveStep(0)}
                        className="px-6 py-3 border-2 border-slate-300 text-black font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                        <ChevronLeft size={16} /> Back: Health Data
                    </button>
                    <button onClick={() => setActiveStep(2)}
                        className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                        Next: PAVE Assessment <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        )
    }

    // ── Render PAVE step ────────────────────────────────────────────────────
    const renderPavePanel = () => {
        if (!pave) return (
            <div className="text-center py-12 text-slate-500">
                <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-3" />
                <div className="text-base font-semibold">PAVE assessment was not completed for this trip.</div>
            </div>
        )
        return (
            <div className="space-y-3">
                <ResultCard result={pave.result} score={pave.overallRiskScore} outOf={12} />
                <div className="space-y-3 pt-2">
                    <ReadonlyRiskCard
                        label="✈️ P — Pilot"
                        hint="Concerns with health, training currency, aircraft familiarity, or personal minimums?"
                        level={pave.pilotRiskLevel}
                        notes={pave.pilotReadiness}
                    />
                    <ReadonlyRiskCard
                        label="🛫 A — Aircraft"
                        hint="Concerns with airworthiness, weight & balance, fuel, or performance?"
                        level={pave.aircraftRiskLevel}
                        notes={pave.aircraftCondition}
                    />
                    {/* Environment — special: includes weather summary */}
                    <div className="w-full bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between gap-4 px-5 py-4">
                            <div className="flex-1 min-w-0">
                                <div className="text-xl font-black text-black leading-snug">🌤️ V — enVironment</div>
                                <div className="text-base text-slate-600 mt-1 font-medium">Weather, NOTAMs, terrain, alternates</div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <div className={clsx(
                                    'px-5 py-2.5 rounded-xl text-base font-black border-2',
                                    riskToIsOk(pave.environmentRiskLevel)
                                        ? 'bg-green-500 text-white border-green-600 shadow-md'
                                        : 'bg-white text-slate-400 border-slate-200'
                                )}>✅ OK</div>
                                <div className={clsx(
                                    'px-5 py-2.5 rounded-xl text-base font-black border-2',
                                    !riskToIsOk(pave.environmentRiskLevel)
                                        ? 'bg-red-500 text-white border-red-600 shadow-md'
                                        : 'bg-white text-slate-400 border-slate-200'
                                )}>❌ No</div>
                            </div>
                        </div>
                        {pave.weatherSummary && (
                            <div className="px-5 pb-4 border-t-2 border-blue-100 bg-blue-50 pt-3">
                                <div className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">🌡️ Weather Summary:</div>
                                <div className="text-base text-blue-900 font-medium">{pave.weatherSummary}</div>
                            </div>
                        )}
                    </div>
                    <ReadonlyRiskCard
                        label="🧭 E — External Pressures"
                        hint="Passenger expectations, time pressures, personal ambitions"
                        level={pave.externalRiskLevel}
                        notes={pave.externalPressures}
                    />
                </div>
                <div className="flex justify-between pt-4">
                    <button onClick={() => setActiveStep(1)}
                        className="px-6 py-3 border-2 border-slate-300 text-black font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                        <ChevronLeft size={16} /> Back: IMSAFE
                    </button>
                    <button onClick={() => setActiveStep(3)}
                        className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                        Next: DECIDE Model <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        )
    }

    // ── Render DECIDE step ──────────────────────────────────────────────────
    const renderDecidePanel = () => {
        if (!decide) return (
            <div className="text-center py-12 text-slate-500">
                <Brain size={48} className="mx-auto text-slate-300 mb-3" />
                <div className="text-base font-semibold">DECIDE session was not completed for this trip.</div>
            </div>
        )
        return (
            <div className="space-y-4">
                {/* Scenario */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Scenario</div>
                    <div className="text-base font-semibold text-black">{decide.scenario || 'No scenario provided.'}</div>
                </div>

                {/* DECIDE steps progress pill row */}
                <div className="flex items-center gap-1 flex-wrap">
                    {decide.steps.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-primary-600 border-primary-500 text-white">
                                <Check size={12} />
                            </div>
                            {i < decide.steps.length - 1 && <div className="h-0.5 w-4 bg-primary-600" />}
                        </div>
                    ))}
                </div>

                {/* Steps */}
                {decide.steps.length > 0 ? decide.steps.map((step, idx) => {
                    const info = DECIDE_STEP_LABELS[step.stepType] || { label: step.stepType, desc: '', color: 'text-slate-400', bg: 'bg-slate-100 border-slate-300' }
                    const isConsider = step.stepType === 'Consider'
                    // Consider step stores options as "Option1 | Option2 | Option3"
                    const considerOptions = isConsider && step.input ? step.input.split(' | ').filter(Boolean) : []
                    return (
                        <div key={step.id} className={clsx('rounded-2xl border-2 p-5 space-y-3', info.bg)}>
                            <div>
                                <div className={clsx('text-xs font-semibold uppercase tracking-wider', info.color)}>Step {idx + 1} of {decide.steps.length}</div>
                                <div className="text-lg font-black text-black mt-1">{info.label}</div>
                                <div className="text-sm text-slate-500">{info.desc}</div>
                            </div>
                            {isConsider && considerOptions.length > 0 ? (
                                <div className="bg-white rounded-xl border-2 border-slate-200 px-4 py-3 space-y-2">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">📋 Alternatives considered:</div>
                                    {considerOptions.map((opt, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center">{i + 1}</span>
                                            <div className="text-base text-black font-medium leading-relaxed">{opt}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border-2 border-slate-200 px-4 py-3 flex items-start gap-4">
                                    <div className="text-xs font-black text-black uppercase tracking-widest mt-1 w-1/3">Observed / Decided:</div>
                                    <div className="text-base text-black font-bold leading-relaxed w-2/3">{step.input || '—'}</div>
                                </div>
                            )}
                            {step.notes && (
                                <div className="bg-white rounded-xl border-2 border-slate-200 px-4 py-3">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">📝 Additional Notes:</div>
                                    <div className="text-base text-black">{step.notes}</div>
                                </div>
                            )}
                        </div>
                    )
                }) : (
                    <div className="text-center py-4 text-slate-500">No DECIDE steps recorded yet.</div>
                )}

                <div className="flex justify-between pt-4">
                    <button onClick={() => setActiveStep(2)}
                        className="px-6 py-3 border-2 border-slate-300 text-black font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                        <ChevronLeft size={16} /> Back: PAVE
                    </button>
                    <div className="flex items-center gap-2 px-5 py-3 bg-green-50 border-2 border-green-300 rounded-xl">
                        <CheckCircle size={18} className="text-green-600" />
                        <span className="text-green-700 font-bold text-base">All assessments reviewed</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(backUrl)} className="p-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-all">
                    <ChevronLeft size={20} className="text-black" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-black uppercase tracking-tight">Trip Assessment Report</h1>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">{flight.flightNumber || `Trip #${flight.id}`}</p>
                </div>
            </div>

            {/* Flight Info Card */}
            {flight.departure && <WeatherWidget icao={flight.departure} />}
            <div className="glass-card overflow-hidden border-t-4 border-primary-500 mt-6">
                <div className="px-6 pt-4 flex gap-4 text-base text-black">
                    <span className="font-bold">{flight.flightCategory}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-700">{flight.aircraftType}</span>
                    <span className={clsx('ml-auto px-3 py-1 rounded-full text-xs font-black border',
                        flight.status === 'Completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            flight.status === 'Cleared' ? 'bg-green-100 text-green-700 border-green-200' :
                                flight.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                    'bg-amber-100 text-amber-700 border-amber-200')}>
                        {flight.status}
                    </span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between text-center bg-slate-50 p-5 rounded-2xl border border-slate-200 col-span-full md:col-span-1">
                        <div className="flex-1">
                            <div className="text-black text-sm font-bold uppercase tracking-widest mb-1">Departure</div>
                            <div className="text-3xl font-black text-black">{flight.departure}</div>
                        </div>
                        <div className="px-4 flex flex-col items-center">
                            <Plane size={24} className="text-primary-500 rotate-90" />
                        </div>
                        <div className="flex-1">
                            <div className="text-black text-sm font-bold uppercase tracking-widest mb-1">Arrival</div>
                            <div className="text-3xl font-black text-black">{flight.arrival}</div>
                        </div>
                    </div>
                    <div className="space-y-2 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-base text-black font-semibold">
                            <User size={14} className="text-primary-500" /> {flight.pilotName}
                        </div>
                        <div className="flex items-center gap-2 text-base text-black font-semibold">
                            <Calendar size={14} className="text-primary-500" />
                            {new Date(flight.departureTime).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Assessment Summary Scores with Pie Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {imSafe && (
                    <ResultCard result={imSafe.result} score={imSafe.overallRiskScore} outOf={18} />
                )}
                {pave && (
                    <ResultCard result={pave.result} score={pave.overallRiskScore} outOf={12} />
                )}
                {decide && (
                    <div className="rounded-2xl border-2 bg-blue-50 border-blue-300 p-5 flex items-center gap-5">
                        <PieChart percentage={Math.round((decide.steps.length / 6) * 100)} color="#2563eb" size={80} />
                        <div>
                            <div className="text-2xl font-black text-blue-700">DECIDE</div>
                            <div className="text-sm text-slate-600 font-semibold mt-0.5">{decide.steps.length} / 6 Steps Completed</div>
                            <div className="text-xs text-slate-500 mt-1">Status: {decide.status}</div>
                            <div className="text-xs font-bold mt-1 text-blue-700">{Math.round((decide.steps.length / 6) * 100)}% complete</div>
                        </div>
                    </div>
                )}
                {!imSafe && !pave && !decide && (
                    <div className="col-span-3 text-center py-6 text-slate-500 text-base bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                        ⏳ No assessments have been completed yet for this trip.
                    </div>
                )}
            </div>

            {/* Wizard Step Tabs */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="text-lg font-bold text-black uppercase tracking-widest border-b border-slate-200 pb-4">Assessment Checklist</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STEPS.map((step, i) => {
                        const done = stepStatus[i]
                        const Icon = step.icon
                        const isActive = activeStep === i
                        return (
                            <button
                                key={step.key}
                                onClick={() => setActiveStep(i)}
                                className={clsx(
                                    'flex flex-col items-center text-center p-6 rounded-2xl border-4 transition-all cursor-pointer',
                                    done ? 'border-green-500/40 bg-green-500/5' :
                                        isActive ? step.bg :
                                            'border-slate-200 hover:border-slate-300 bg-white'
                                )}>
                                <div className={clsx('p-3 rounded-xl mb-3', done ? 'bg-green-500/10 text-green-600' : isActive ? step.color : 'bg-slate-100 text-slate-500')}>
                                    <Icon size={32} />
                                </div>
                                <div className="text-lg font-black text-black mb-2">{step.label}</div>
                                {done ? (
                                    <div className="text-base text-green-700 font-black uppercase flex items-center gap-2">
                                        <CheckCircle size={18} /> Done
                                    </div>
                                ) : (
                                    <div className="text-base text-slate-800 font-black uppercase flex items-center gap-2">
                                        <XCircle size={18} /> Not Done
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-sm font-bold text-gray-800">
                        <span>Assessments Completed</span>
                        <span>{stepStatus.filter(Boolean).length} / {stepStatus.length}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-600 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(stepStatus.filter(Boolean).length / stepStatus.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Active Panel */}
            <div className="glass-card p-6 space-y-5 border-t-4" style={{ borderTopColor: stepColors[activeStep] }}>
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    {(() => { const S = STEPS[activeStep]; const Icon = S.icon; return <Icon size={22} className={S.color} /> })()}
                    <h3 className="text-xl font-black text-black">{STEPS[activeStep].label} Assessment</h3>
                    <span className="ml-auto text-xs text-slate-500 font-bold uppercase tracking-widest">Read-only Review</span>
                </div>

                {activeStep === 0 && renderSmartWatchPanel()}
                {activeStep === 1 && renderImSafePanel()}
                {activeStep === 2 && renderPavePanel()}
                {activeStep === 3 && renderDecidePanel()}
            </div>
        </div>
    )
}
