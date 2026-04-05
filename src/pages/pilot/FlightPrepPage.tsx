import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { flightApi, imSafeApi, paveApi, decideApi, smartWatchApi } from '../../lib/apiClient'
import type {
    FlightTripResponseDto, CreateImSafeDto, ImSafeResponseDto,
    CreatePaveDto, PaveResponseDto,
    CreateSmartWatchReadingDto, SmartWatchAnalysisDto
} from '../../lib/types'
import {
    ShieldCheck, ClipboardCheck, Brain, Plane, Calendar, Clock,
    ChevronLeft, CheckCircle, RefreshCw, Watch,
    ArrowRight, Activity, Loader2, CloudRain, Search, Check, X, AlertTriangle, Signal,
    ChevronRight,
    PieChart
} from 'lucide-react'
import clsx from 'clsx'
import { WeatherWidget } from '../../components/shared/WeatherWidget'

// ─── IMSAFE Risk Selector: 1=Low, 2=Medium, 3=High ───────────────────────────
type RiskVal = -1 | 0 | 1 | 2 | 3

// IMSAFE item data
const IMSAFE_ITEMS = [
    {
        key: 'illness', emoji: '🤒', letter: 'I', label: 'Illness',
        question: 'Do I have symptoms (fever, congestion, dizziness) that could worsen under flight stress?',
        bullets: [
            'Evaluate any current health issues that could impair judgment or physical performance.',
            'If any illness is noted, rate the likelihood of impairment as high and treat it as a go/no-go decision point.',
        ],
        tieIn: 'Integrate with PAVE framework under "Pilot" — an unexpected illness shifts your risk matrix immediately.',
    },
    {
        key: 'medication', emoji: '💊', letter: 'M', label: 'Medication',
        question: 'Am I taking any medications that could cause drowsiness, blurred vision, or impaired performance?',
        bullets: [
            'List every medication you\u2019re taking and check FAA-approved aeromedical guidance.',
            'Consider side-effects: drowsiness, blurred vision, nausea. Even "mild" meds can raise your severity rating.',
        ],
        tieIn: 'Use DECIDE\u2019s "Identify" step — spot medication as a hazard, then "Evaluate" its impact on flight tasks.',
    },
    {
        key: 'stress', emoji: '😰', letter: 'S', label: 'Stress',
        question: 'Am I under significant psychological pressure that could drain cognitive bandwidth?',
        bullets: [
            'Identify major stressors: work deadlines, family issues, financial concerns.',
            'Rate your stress: low (manageable), medium (occasional distraction), high (constant preoccupation).',
        ],
        tieIn: 'During your preflight GRM cost-benefit analysis, factor in stress as a multiplier on other risks.',
    },
    {
        key: 'alcohol', emoji: '🍺', letter: 'A', label: 'Alcohol',
        question: 'Have I consumed alcohol within the last 8\u201312 hours?',
        bullets: [
            'Confirm last drink time and consider residual impairment \u2014 even small amounts reduce situational awareness.',
            'If in doubt, treat alcohol risk as high probability until you\u2019re certain you\u2019re back to baseline performance.',
        ],
        tieIn: 'Enforce personal minimums beyond regulatory minimums, strengthening your go/no-go discipline.',
    },
    {
        key: 'fatigue', emoji: '😴', letter: 'F', label: 'Fatigue',
        question: 'Am I below my personal rest standard? Fatigue undermines every phase of flight.',
        bullets: [
            'Note hours slept in the past 24 hours, quality of rest, and recent duty periods.',
            'If you\u2019re below your personal rest standard, assign a high severity rating and plan to delay or cancel.',
        ],
        tieIn: 'Revisit this row at top-of-descent or halfway through cruise \u2014 fresh fatigue checks prevent "just one more leg" syndrome.',
    },
    {
        key: 'emotion', emoji: '😤', letter: 'E', label: 'Emotions',
        question: 'Am I experiencing emotional volatility (anger, grief, excitement) that could hijack rational decision-making?',
        bullets: [
            'Reflect on recent emotional events: conflicts, celebrations, distractions.',
            'Rate emotional intensity: low (neutral), medium (distracted), high (volatile).',
        ],
        tieIn: 'Call out your emotional state aloud in the cockpit and reenter the DECIDE loop — externalizing emotions stabilizes judgment.',
    },
]

// PAVE checklist data
const PAVE_CATEGORIES = [
    {
        key: 'pilot', emoji: '👨\u200D✈️', label: 'Pilot',
        desc: 'Your personal readiness and proficiency. Conduct a self-assessment covering health, currency, training, and mindset.',
        items: [
            'IMSAFE check: Illness, Medication, Stress, Alcohol, Fatigue, Emotion',
            'Review recent training and flight experience to confirm currency',
            'Confirm familiarity with aircraft type, avionics, and emergency procedures',
            'Establish personal minimums (e.g., crosswind limits, night takeoff minima)',
        ],
    },
    {
        key: 'aircraft', emoji: '✈️', label: 'Aircraft',
        desc: 'The condition and performance capabilities of the airplane. Confirm airworthiness, equipment, and performance.',
        items: [
            'Verify airworthiness documents (certificate, registration, maintenance logs)',
            'Perform a detailed preflight inspection (fuel, oil, control surfaces, tires)',
            'Calculate weight & balance and ensure it falls within limits',
            'Reference POH performance charts for takeoff, climb, cruise, and landing',
        ],
    },
    {
        key: 'environment', emoji: '🌤️', label: 'enVironment',
        desc: 'All external flight conditions — weather, terrain, airports, airspace — that can affect safety.',
        items: [
            'Obtain a full weather briefing (METARs, TAFs, winds aloft, AIRMETs/SIGMETs)',
            'Check NOTAMs, TFRs, and special use airspace along planned route',
            'Evaluate terrain elevation and obstacle clearance for departure and arrival',
            'Plan alternates and diversion routes in case conditions deteriorate',
        ],
    },
    {
        key: 'external', emoji: '⚖️', label: 'External Pressures',
        desc: 'Human factor influences — passenger expectations, time pressures, business demands — that can tempt unsafe decisions.',
        items: [
            'Identify passenger or organizational expectations (on-time arrival, schedules)',
            'Recognize personal goals that may add stress (e.g., completing a long cross-country)',
            'Build contingency plans and allow margin for delays or unplanned stops',
            'Establish a no-guilt go/no-go decision point and stick to it',
        ],
    },
]

function ImSafeCard({ item, value, onChange, expanded, onToggle }: {
    item: typeof IMSAFE_ITEMS[0]; value: RiskVal; onChange: (v: RiskVal) => void; expanded: boolean; onToggle: () => void;
}) {
    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm selection-none">
            {/* Header */}
            <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0 bg-blue-50 text-blue-600 w-12 h-12 flex items-center justify-center rounded-xl">{item.emoji}</div>
                    <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-black leading-snug">{item.label}</div>
                        <div className="text-sm text-slate-500 mt-0.5 truncate">{item.question}</div>
                    </div>
                </div>
                <ChevronRight size={20} className={clsx('text-slate-400 transition-transform flex-shrink-0', expanded && 'rotate-90')} />
            </button>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-5 pb-5 border-t border-slate-100 space-y-4 animate-slide-up pt-4">
                    {/* Self Assessment Row */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Self-Assessment:</span>
                        <div className="flex gap-2">
                            {([1, 2, 3] as const).map(lvl => {
                                const labels = { 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' }
                                const colors = {
                                    1: value === lvl ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-transparent text-slate-400 border border-transparent hover:bg-green-50 hover:text-green-600',
                                    2: value === lvl ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-transparent text-slate-400 border border-transparent hover:bg-amber-50 hover:text-amber-600',
                                    3: value === lvl ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-transparent text-slate-400 border border-transparent hover:bg-red-50 hover:text-red-600',
                                }
                                return (
                                    <button key={lvl} type="button" onClick={() => onChange(lvl as RiskVal)}
                                        className={clsx('px-3 py-1 rounded-lg text-xs font-bold transition-all', colors[lvl])}>
                                        {labels[lvl]}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <ul className="space-y-3 mt-2">
                        {item.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                <span className="leading-relaxed">{b}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mt-4">
                        <div className="text-xs font-bold text-blue-700 mb-1">ADM / GRM Tie-in</div>
                        <div className="text-sm text-blue-900">{item.tieIn}</div>
                    </div>
                </div>
            )}
        </div>
    )
}

function PaveChecklistCard({ category, checked, onCheck, expanded, onToggle }: {
    category: typeof PAVE_CATEGORIES[0]; checked: boolean[]; onCheck: (idx: number) => void; expanded: boolean; onToggle: () => void;
}) {
    const doneCount = checked.filter(Boolean).length
    return (
        <div className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0 bg-blue-50 text-blue-600 w-12 h-12 flex items-center justify-center rounded-xl">{category.emoji}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-black leading-snug">{category.label}</span>
                            <span className="text-xs font-medium text-slate-400">{doneCount}/{category.items.length}</span>
                        </div>
                        <div className="text-sm text-slate-500 mt-0.5 truncate">{category.desc}</div>
                    </div>
                </div>
                <ChevronRight size={20} className={clsx('text-slate-400 transition-transform flex-shrink-0', expanded && 'rotate-90')} />
            </button>
            {expanded && (
                <div className="px-5 pb-5 border-t border-slate-100 space-y-3 animate-slide-up pt-4">
                    {category.items.map((item, i) => {
                        const isChecked = checked[i]
                        return (
                            <label key={i} className={clsx(
                                'flex items-start gap-4 cursor-pointer group p-4 rounded-xl border transition-all',
                                isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300'
                            )}>
                                <input type="checkbox" className="hidden" checked={isChecked} onChange={() => onCheck(i)} />
                                <div className={clsx(
                                    'w-5 h-5 mt-0.5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors',
                                    isChecked ? 'bg-green-500 text-white border-green-500' : 'border-2 border-slate-300 group-hover:border-slate-400 bg-transparent'
                                )}>
                                    {isChecked && <Check size={14} strokeWidth={3} />}
                                </div>
                                <span className={clsx(
                                    'text-sm leading-relaxed transition-all',
                                    isChecked ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'
                                )}>
                                    {item}
                                </span>
                            </label>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── SVG Pie Chart ────────────────────────────────────────────────────────────
function SystemPieChart({ percentage, color, size = 80 }: { percentage: number; color: string; size?: number }) {
    const radius = (size - 10) / 2
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * radius
    const dash = (percentage / 100) * circumference
    const gap = circumference - dash
    return (
        <svg width={size} height={size}>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={10} />
            <circle
                cx={cx} cy={cy} r={radius} fill="none"
                stroke={color} strokeWidth={10}
                strokeDasharray={`${dash} ${gap}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
            />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize={size < 70 ? 12 : 15} fontWeight="900" fill="#1e293b">
                {Math.round(percentage)}%
            </text>
        </svg>
    )
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ result, score, outOf }: { result: string; score: number; outOf: number }) {
    const okPercent = Math.max(0, Math.round((1 - score / outOf) * 100))
    const cfg = result === 'Go'
        ? { bg: 'bg-green-50 border-green-300', text: 'text-green-700', msg: 'Cleared for flight operations', color: '#16a34a' }
        : result === 'Caution'
            ? { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-700', msg: 'Proceed with extra caution', color: '#d97706' }
            : { bg: 'bg-red-50 border-red-300', text: 'text-red-700', msg: 'Do NOT fly today', color: '#dc2626' }
    return (
        <div className={clsx('rounded-2xl border-2 p-5 flex items-center gap-5 animate-slide-up', cfg.bg)}>
            <SystemPieChart percentage={okPercent} color={cfg.color} size={80} />
            <div>
                <div className={clsx('text-2xl font-black', cfg.text)}>{result}</div>
                <div className="text-sm text-slate-800 font-bold mt-0.5">{cfg.msg}</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">Risk Score: <span className="font-mono font-black text-slate-800">{score}/{outOf}</span></div>
                <div className={clsx('text-xs font-bold mt-1', cfg.text)}>{okPercent}% OK rate</div>
            </div>
        </div>
    )
}

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
    { key: 'smartwatch', label: 'SmartWatch', icon: Watch, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    { key: 'imsafe', label: 'IMSAFE', icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    { key: 'pave', label: 'PAVE', icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    { key: 'decide', label: 'DECIDE', icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
]

const DECIDE_STEPS = [
    {
        type: 0, key: 'D', label: 'Detect',
        desc: 'Maintain continuous vigilance — scan external (weather, traffic, terrain), internal (fuel, systems, workload), and personal (IMSAFE) domains. Log emerging hazards on your kneeboard.',
        color: 'text-blue-800', bg: 'bg-blue-500/10 border-blue-500/30'
    },
    {
        type: 1, key: 'E', label: 'Evaluate',
        desc: 'Assess severity (how big an upset could be) × likelihood (how probable). Rate as Low / Medium / High. Consider time pressure and fuel state vs. alternate distance.',
        color: 'text-slate-900', bg: 'bg-amber-500/10 border-amber-500/30'
    },
    {
        type: 2, key: 'C', label: 'Consider',
        desc: 'Generate at least 3 workable mitigations or alternatives. Engage crew or passengers for input. Write all options on a scratchpad to keep them visible.',
        color: 'text-purple-800', bg: 'bg-purple-500/10 border-purple-500/30',
        isConsider: true
    },
    {
        type: 3, key: 'I', label: 'Integrate',
        desc: 'Merge chosen mitigations into a coherent flight plan. Balance aircraft limits, airspace, fuel, and approach minima. Sequence tasks into a logical flow.',
        color: 'text-cyan-800', bg: 'bg-cyan-500/10 border-cyan-500/30'
    },
    {
        type: 4, key: 'D', label: 'Decide',
        desc: 'Select the single best plan and commit. Make a clear call-out: heading, squawk, ETA. Brief passengers and ATC without hesitation.',
        color: 'text-orange-800', bg: 'bg-orange-500/10 border-orange-500/30'
    },
    {
        type: 5, key: 'E', label: 'Execute & Reassess',
        desc: 'Put the decision into action with precise control inputs and checklist discipline. Then continuously monitor — if conditions change, loop back to Detect–Evaluate.',
        color: 'text-green-800', bg: 'bg-green-500/10 border-green-500/30'
    },
]

const EMPTY_IMSAFE = (): CreateImSafeDto => ({
    illnessLevel: -1 as any, medicationLevel: -1 as any, stressLevel: -1 as any,
    alcoholLevel: -1 as any, fatigueLevel: -1 as any, emotionLevel: -1 as any,
    dataSource: 0, isSynced: true
})

const EMPTY_PAVE = (): CreatePaveDto => ({
    pilotRiskLevel: -1 as any, aircraftRiskLevel: -1 as any,
    environmentRiskLevel: -1 as any, externalRiskLevel: -1 as any, isSynced: true
})

const DEMO_SW: CreateSmartWatchReadingDto = {
    heartRate: 66, heartRateVariability: 58, sleepHours: 7.5,
    sleepQuality: 84, stressIndex: 22, spO2: 98,
    deviceName: '📱 Simulated — Garmin Forerunner 945', isSynced: true
}

export function FlightPrepPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [flight, setFlight] = useState<FlightTripResponseDto | null>(null)
    const [loading, setLoading] = useState(true)

    // Which wizard step is active: 0=smartwatch, 1=imsafe, 2=pave, 3=decide
    const [activeStep, setActiveStep] = useState<number | null>(null)

    // ── SmartWatch state ──
    const [swAnalysis, setSwAnalysis] = useState<SmartWatchAnalysisDto | null>(null)
    const [swForm, setSwForm] = useState<CreateSmartWatchReadingDto>({ isSynced: true })
    const [swSaving, setSwSaving] = useState(false)
    const [swDone, setSwDone] = useState(false)
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'notfound'>('idle')
    const [scanProgress, setScanProgress] = useState(0)

    // ── IMSAFE state ──
    const [imForm, setImForm] = useState<CreateImSafeDto>(EMPTY_IMSAFE())
    const [imSaving, setImSaving] = useState(false)
    const [imResult, setImResult] = useState<ImSafeResponseDto | null>(null)

    // ── PAVE state ──
    const [paveForm, setPaveForm] = useState<CreatePaveDto>(EMPTY_PAVE())
    const [paveSaving, setPaveSaving] = useState(false)
    const [paveResult, setPaveResult] = useState<PaveResponseDto | null>(null)
    const [icao, setIcao] = useState('')
    const [fetchingWt, setFetchingWt] = useState(false)
    const [wtError, setWtError] = useState('')
    // PAVE checklist state
    const [paveChecked, setPaveChecked] = useState<Record<string, boolean[]>>({
        pilot: [false, false, false, false],
        aircraft: [false, false, false, false],
        environment: [false, false, false, false],
        external: [false, false, false, false],
    })
    const [paveExpanded, setPaveExpanded] = useState<string | null>('pilot')
    // IMSAFE expanded state
    const [imExpanded, setImExpanded] = useState<string | null>('illness')

    // ── DECIDE state ──
    const [decideSessionId, setDecideSessionId] = useState<number | null>(null)
    const [decideStep, setDecideStep] = useState(0)
    const [scenario, setScenario] = useState('')
    const [stepInput, setStepInput] = useState('')
    const [stepNotes, setStepNotes] = useState('')
    const [decideSaving, setDecideSaving] = useState(false)
    const [decideStarted, setDecideStarted] = useState(false)
    const [decideInputs, setDecideInputs] = useState<Record<number, string>>({})

    // ── SmartWatch scan ──
    const startScan = async () => {
        setScanState('scanning'); setScanProgress(0)
        for (let i = 1; i <= 25; i++) {
            await new Promise(r => setTimeout(r, 130))
            setScanProgress(Math.round((i / 25) * 100))
        }
        setScanState('notfound')
    }

    const simulateWatchData = async () => {
        setSwSaving(true)
        try {
            const res = await smartWatchApi.addReading({ ...DEMO_SW, flightTripId: Number(id), isManualEntry: false })
            await flightApi.link(Number(id), { smartWatchReadingId: res.data.id })
            const { data: a } = await smartWatchApi.getAnalysis()
            setSwAnalysis(a); setSwDone(true); setActiveStep(1)
        } finally { setSwSaving(false) }
    }

    const loadFlight = async () => {
        if (!id) return
        setLoading(true)
        try {
            const { data } = await flightApi.getMy()
            const found = data.find(f => f.id === Number(id))
            if (found) {
                setFlight(found)
                // Pre-fill scenario
                setScenario(`Pre-flight decision analysis for Trip ${found.flightNumber || found.id} (${found.departure} → ${found.arrival})`)
                setIcao(found.departure)
                if (!swDone) {
                    try {
                        const { data: analysis } = await smartWatchApi.getAnalysis()
                        if (analysis) { setSwAnalysis(analysis); setSwDone(true) }
                    } catch { }
                }
                
                // Pre-load IMSAFE
                if (found.imSafeAssessmentId) {
                    try {
                        const { data } = await imSafeApi.getMy()
                        const target = data.find(x => x.id === found.imSafeAssessmentId)
                        if (target) {
                            setImResult(target)
                            setImForm({
                                illnessLevel: target.illnessLevel === 'None' ? 0 : 3,
                                medicationLevel: target.medicationLevel === 'None' ? 0 : 3,
                                stressLevel: target.stressLevel === 'None' ? 0 : 3,
                                alcoholLevel: target.alcoholLevel === 'None' ? 0 : 3,
                                fatigueLevel: target.fatigueLevel === 'None' ? 0 : 3,
                                emotionLevel: target.emotionLevel === 'None' ? 0 : 3,
                                dataSource: 0, isSynced: true
                            })
                        }
                    } catch { }
                }

                // Pre-load PAVE
                if (found.paveAssessmentId) {
                    try {
                        const { data } = await paveApi.getMy()
                        const target = data.find(x => x.id === found.paveAssessmentId)
                        if (target) {
                            setPaveResult(target)
                            setPaveForm({
                                pilotRiskLevel: target.pilotRiskLevel === 'None' ? 0 : 3,
                                aircraftRiskLevel: target.aircraftRiskLevel === 'None' ? 0 : 3,
                                environmentRiskLevel: target.environmentRiskLevel === 'None' ? 0 : 3,
                                externalRiskLevel: target.externalRiskLevel === 'None' ? 0 : 3,
                                isSynced: true
                            })
                        }
                    } catch { }
                }
            }
        } catch (err) {
            console.error('Error loading flight prep', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadFlight() }, [id])

    // ── Smart Watch submit ──
    const handleSwSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSwSaving(true)
        try {
            const res = await smartWatchApi.addReading({
                ...swForm,
                flightTripId: Number(id),
                isManualEntry: true
            })
            await flightApi.link(Number(id), { smartWatchReadingId: res.data.id })
            const { data: a } = await smartWatchApi.getAnalysis()
            setSwAnalysis(a)
            setSwDone(true)
            setActiveStep(1) // go to IMSAFE
        } finally { setSwSaving(false) }
    }

    // ── IMSAFE submit (sanitize -1 → 0) ──
    const handleImSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setImSaving(true)
        try {
            const sanitized: CreateImSafeDto = {
                ...imForm,
                illnessLevel: Math.max(0, imForm.illnessLevel as number),
                medicationLevel: Math.max(0, imForm.medicationLevel as number),
                stressLevel: Math.max(0, imForm.stressLevel as number),
                alcoholLevel: Math.max(0, imForm.alcoholLevel as number),
                fatigueLevel: Math.max(0, imForm.fatigueLevel as number),
                emotionLevel: Math.max(0, imForm.emotionLevel as number),
            }
            const { data } = await imSafeApi.create(sanitized)
            setImResult(data)
            if (flight) await flightApi.link(flight.id, { imSafeAssessmentId: data.id })
            setActiveStep(2)
            loadFlight()
        } finally { setImSaving(false) }
    }

    // ── PAVE submit (sanitize -1 → 0) ──
    const handlePaveSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setPaveSaving(true)
        try {
            const sanitized: CreatePaveDto = {
                ...paveForm,
                pilotRiskLevel: Math.max(0, paveForm.pilotRiskLevel as number),
                aircraftRiskLevel: Math.max(0, paveForm.aircraftRiskLevel as number),
                environmentRiskLevel: Math.max(0, paveForm.environmentRiskLevel as number),
                externalRiskLevel: Math.max(0, paveForm.externalRiskLevel as number),
            }
            const { data } = await paveApi.create(sanitized)
            setPaveResult(data)
            if (flight) await flightApi.link(flight.id, { paveAssessmentId: data.id })
            setActiveStep(3)
            loadFlight()
        } finally { setPaveSaving(false) }
    }

    // Fetch weather handles automatically via the WeatherWidget now.

    // ── DECIDE start ──
    const startDecide = async () => {
        setDecideSaving(true)
        try {
            const { data } = await decideApi.createSession({ scenario })
            setDecideSessionId(data.id)
            setDecideStarted(true)
            setDecideStep(0)
        } finally { setDecideSaving(false) }
    }

    // ── DECIDE submit ──
    const submitAllDecide = async () => {
        setDecideSaving(true)
        try {
            let sId = decideSessionId
            if (!sId) {
                const { data } = await decideApi.createSession({ scenario })
                sId = data.id
                setDecideSessionId(sId)
            }
            // Add all steps
            for (let i = 0; i < DECIDE_STEPS.length; i++) {
                const step = DECIDE_STEPS[i]
                await decideApi.addStep(sId, { stepType: step.type, input: decideInputs[i] || 'Observed' })
            }
            await decideApi.completeSession(sId)
            if (flight && sId) {
                await flightApi.link(flight.id, { decideSessionId: sId })
            }
            loadFlight()
            setActiveStep(null) // all done
        } finally { setDecideSaving(false) }
    }

    if (loading) return <div className="flex justify-center p-12"><RefreshCw className="animate-spin text-primary-400" /></div>
    if (!flight) return <div className="p-12 text-center text-red-400">Flight not found.</div>

    const imSafeDone = !!flight.imSafeAssessmentId
    const paveDone = !!flight.paveAssessmentId
    const decideDone = !!flight.decideSessionId
    const allDone = swDone && imSafeDone && paveDone && decideDone

    const stepStatus = [swDone, imSafeDone, paveDone, decideDone]

    // ── Step Panel Content ──────────────────────────────────────────────────────
    const renderActivePanel = () => {
        if (activeStep === null) return null

        // ── SmartWatch Panel ──
        if (activeStep === 0) {
            if (swDone && swAnalysis) {
                return (
                    <div className="space-y-4">
                        <div className={clsx('rounded-xl border p-5',
                            swAnalysis.fitnessStatus === 'Fit' ? 'bg-green-500/10 border-green-500/30' :
                                swAnalysis.fitnessStatus === 'Caution' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30')}>
                            <div className="flex items-center gap-3 mb-3">
                                <Watch size={24} className={
                                    swAnalysis.fitnessStatus === 'Fit' ? 'text-green-400' :
                                        swAnalysis.fitnessStatus === 'Caution' ? 'text-amber-400' : 'text-red-400'
                                } />
                                <div>
                                    <div className="text-xs text-slate-500 uppercase tracking-widest">Fitness Status</div>
                                    <div className={clsx('text-xl font-bold',
                                        swAnalysis.fitnessStatus === 'Fit' ? 'text-green-400' :
                                            swAnalysis.fitnessStatus === 'Caution' ? 'text-amber-400' : 'text-red-400')}>
                                        {swAnalysis.fitnessStatus}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mb-3">
                                {[
                                    { label: 'Heart Rate', value: `${swAnalysis.latestHeartRate ?? '–'} bpm`, color: 'text-blue-400' },
                                    { label: 'Avg Sleep', value: `${swAnalysis.averageSleepHours ?? '–'} h`, color: 'text-purple-400' },
                                    { label: 'Avg Stress', value: `${swAnalysis.averageStressIndex ?? '–'} /100`, color: 'text-amber-400' },
                                    { label: 'Avg SpO₂', value: `${swAnalysis.averageSpO2 ?? '–'} %`, color: 'text-green-400' },
                                ].map(m => (
                                    <div key={m.label} className="glass-card-sm p-3">
                                        <div className={clsx('text-lg font-bold font-mono', m.color)}>{m.value}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400">💡 {swAnalysis.recommendation}</p>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => setActiveStep(1)}
                                className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                                Next: IMSAFE Assessment <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )
            }
            // SmartWatch — scan + simulate UI
            return (
                <div className="space-y-5">
                    <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 text-center space-y-4">
                        <div className="text-5xl">⌚</div>
                        <h3 className="text-2xl font-black text-black">Connect SmartWatch</h3>
                        <p className="text-base text-slate-600">Automatically detect your nearby Bluetooth smartwatch, or simulate with qualified pilot biometric data.</p>

                        {scanState === 'idle' && (
                            <button type="button" onClick={startScan}
                                className="inline-flex items-center gap-3 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg rounded-2xl transition-all shadow-lg">
                                <Signal size={22} /> 🔍 Search for Nearby SmartWatch
                            </button>
                        )}

                        {scanState === 'scanning' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-3 text-primary-600">
                                    <Loader2 size={22} className="animate-spin" />
                                    <span className="text-lg font-bold">Scanning for devices...</span>
                                </div>
                                <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-3 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                                </div>
                                <div className="text-sm text-slate-500 space-y-1">
                                    {scanProgress > 20 && <div>📡 Checking Bluetooth Low Energy...</div>}
                                    {scanProgress > 55 && <div>📶 Scanning WiFi Direct...</div>}
                                    {scanProgress > 80 && <div>🔍 Probing ANT+ devices...</div>}
                                </div>
                            </div>
                        )}

                        {scanState === 'notfound' && (
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-5 py-3 bg-amber-50 border-2 border-amber-300 text-amber-700 font-bold rounded-xl">
                                    ⚠️ No SmartWatch Detected
                                </div>
                                <p className="text-base text-slate-600">No compatible device found. You can simulate using pre-loaded qualified pilot biometrics.</p>
                                <div className="flex gap-3 justify-center flex-wrap">
                                    <button type="button" onClick={() => setScanState('idle')}
                                        className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all">
                                        🔄 Try Again
                                    </button>
                                    <button type="button" onClick={simulateWatchData} disabled={swSaving}
                                        className="inline-flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg">
                                        {swSaving ? <Loader2 size={18} className="animate-spin" /> : '📱'}
                                        Simulate with Demo Pilot Data
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-2">
                                    {[{e:'❤️',l:'Heart Rate',v:'66 bpm'},{e:'📋',l:'HRV',v:'58 ms'},{e:'😴',l:'Sleep',v:'7.5 hrs'},{e:'💤',l:'Quality',v:'84/100'},{e:'🧠',l:'Stress',v:'22/100'},{e:'🫱',l:'SpO₂',v:'98%'}].map(d => (
                                        <div key={d.l} className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                                            <div className="text-2xl">{d.e}</div>
                                            <div className="text-base font-black text-black">{d.v}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold">{d.l}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <details className="border-2 border-slate-200 rounded-2xl overflow-hidden">
                        <summary className="px-5 py-4 cursor-pointer text-base font-bold text-slate-600 hover:text-black select-none bg-slate-50">⌨️ Or Enter Manually</summary>
                        <form onSubmit={handleSwSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { key: 'heartRate', label: '❤️ Heart Rate (bpm)', min: 30, max: 220 },
                                    { key: 'heartRateVariability', label: '📋 HRV (ms)', min: 0, max: 200 },
                                    { key: 'sleepHours', label: '😴 Sleep Hours', min: 0, max: 24, step: 0.5 },
                                    { key: 'sleepQuality', label: '💤 Sleep Quality (0–100)', min: 0, max: 100 },
                                    { key: 'stressIndex', label: '🧠 Stress (0–100)', min: 0, max: 100 },
                                    { key: 'spO2', label: '🫱 SpO₂ (%)', min: 70, max: 100 },
                                ].map(({ key, label, min, max, step }) => (
                                    <div key={key}>
                                        <label className="block text-sm font-bold text-black mb-1">{label}</label>
                                        <input type="number" min={min} max={max} step={step ?? 1}
                                            value={(swForm as any)[key] ?? ''}
                                            onChange={e => setSwForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                                            className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black outline-none text-base font-mono" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={swSaving} className="btn-primary flex items-center gap-2 px-8 py-3">
                                    {swSaving ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                                    Submit & Continue to IMSAFE
                                </button>
                            </div>
                        </form>
                    </details>
                </div>
            )
        }

        // ── IMSAFE Panel ──
        if (activeStep === 1) { 
            return (
                <form onSubmit={handleImSubmit} className="space-y-3">
                    {imResult && <ResultCard result={imResult.result} score={imResult.overallRiskScore} outOf={18} />}
                    <div className="space-y-3">
                        {IMSAFE_ITEMS.map(item => {
                            const formKey = `${item.key}Level` as keyof CreateImSafeDto
                            return (
                                <ImSafeCard
                                    key={item.key}
                                    item={item}
                                    value={(imForm as any)[formKey] as RiskVal}
                                    onChange={v => setImForm(f => ({ ...f, [formKey]: v }))}
                                    expanded={imExpanded === item.key}
                                    onToggle={() => setImExpanded(prev => prev === item.key ? null : item.key)}
                                />
                            )
                        })}
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={imSaving} className="btn-primary flex items-center gap-2 px-10 py-4 text-base font-bold">
                            {imSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                            Submit IMSAFE & Next: PAVE <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            )
        }

        // ── PAVE Panel ──
        if (activeStep === 2) {
            // Map checklist items to risk levels: 0-1 checked = None(0), 2 checked = Low(1), 3 checked = Medium(2), 4 checked = High(3)
            const mapCheckedToRisk = (checks: boolean[]): number => {
                const count = checks.filter(Boolean).length
                if (count === 0) return 0  // None - not reviewed
                if (count <= 2) return 0   // None - OK (reviewed and safe)
                if (count === 3) return 0  // OK
                return 0                    // All checked = fully reviewed = OK
            }
            // When all items are NOT checked, that means concerns exist
            const mapUncheckedToRisk = (checks: boolean[]): number => {
                const unchecked = checks.filter(c => !c).length
                if (unchecked === 0) return 0  // All reviewed = None/OK
                if (unchecked === 1) return 1  // Low concern  
                if (unchecked === 2) return 2  // Medium concern
                return 3                        // High concern (most items not reviewed)
            }

            const handlePaveCheckSubmit = async (e: React.FormEvent) => {
                e.preventDefault()
                setPaveSaving(true)
                try {
                    const sanitized: CreatePaveDto = {
                        ...paveForm,
                        pilotRiskLevel: mapUncheckedToRisk(paveChecked.pilot),
                        aircraftRiskLevel: mapUncheckedToRisk(paveChecked.aircraft),
                        environmentRiskLevel: mapUncheckedToRisk(paveChecked.environment),
                        externalRiskLevel: mapUncheckedToRisk(paveChecked.external),
                        pilotReadiness: `Checked ${paveChecked.pilot.filter(Boolean).length}/4 items`,
                        aircraftCondition: `Checked ${paveChecked.aircraft.filter(Boolean).length}/4 items`,
                        externalPressures: `Checked ${paveChecked.external.filter(Boolean).length}/4 items`,
                    }
                    const { data } = await paveApi.create(sanitized)
                    setPaveResult(data)
                    if (flight) await flightApi.link(flight.id, { paveAssessmentId: data.id })
                    setActiveStep(3)
                    loadFlight()
                } finally { setPaveSaving(false) }
            }

            return (
                <form onSubmit={handlePaveCheckSubmit} className="space-y-3">
                    {paveResult && <ResultCard result={paveResult.result} score={paveResult.overallRiskScore} outOf={12} />}
                    <div className="space-y-3">
                        {PAVE_CATEGORIES.map(cat => (
                            <PaveChecklistCard
                                key={cat.key}
                                category={cat}
                                checked={paveChecked[cat.key]}
                                onCheck={idx => setPaveChecked(prev => {
                                    const arr = [...prev[cat.key]]
                                    arr[idx] = !arr[idx]
                                    return { ...prev, [cat.key]: arr }
                                })}
                                expanded={paveExpanded === cat.key}
                                onToggle={() => setPaveExpanded(prev => prev === cat.key ? null : cat.key)}
                            />
                        ))}
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={paveSaving} className="btn-primary flex items-center gap-2 px-10 py-4 text-base font-bold">
                            {paveSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                            Submit PAVE & Next: DECIDE <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            )
        }

        if (activeStep === 3) {
            if (decideDone) {
                return (
                    <div className="space-y-4 animate-slide-up">
                        <div className="rounded-2xl border-2 p-5 flex items-center gap-5 bg-green-50 border-green-300">
                            <SystemPieChart percentage={100} color="#16a34a" size={80} />
                            <div>
                                <div className="text-2xl font-black text-green-700">DECIDE</div>
                                <div className="text-sm text-slate-800 font-bold mt-0.5">6 / 6 Steps Completed</div>
                                <div className="text-xs text-slate-500 mt-1 font-semibold">Status: <span className="text-green-600">Completed</span></div>
                                <div className="text-xs font-bold mt-1 text-green-700">100% complete</div>
                            </div>
                        </div>
                    </div>
                )
            }
            return (
                <div className="space-y-6">
                    {DECIDE_STEPS.map((s, i) => (
                        <div key={i} className={clsx('rounded-xl border p-5 space-y-4', s.bg)}>
                            <div>
                                <div className={clsx('text-xs font-semibold uppercase tracking-wider', s.color)}>Step {i + 1} of {DECIDE_STEPS.length}</div>
                                <div className="text-lg font-bold text-slate-100 mt-1">{s.label}</div>
                                <div className="text-sm text-slate-400 mt-0.5 leading-relaxed">{s.desc}</div>
                            </div>
                            <div className="space-y-4 mt-4">
                                <div className="text-sm font-black text-black">Action:</div>
                                <div className="flex gap-4">
                                    {['Observed', 'Decided'].map(act => (
                                        <button key={act} type="button" onClick={() => setDecideInputs(prev => ({ ...prev, [i]: act }))}
                                            className={clsx('px-6 py-3 border-2 rounded-xl text-lg font-black transition-all',
                                                decideInputs[i] === act ? 'bg-black text-white border-black' : 'bg-white text-black border-black/20 hover:border-black')}>
                                            {act}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <button onClick={submitAllDecide} disabled={decideSaving} className="btn-primary flex items-center gap-2 px-10 py-4 text-lg font-bold">
                            {decideSaving ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                            Submit DECIDE Form
                        </button>
                    </div>
                </div>
            )
        }

        return null
    }

    return (
        <div className="w-full px-4 xl:px-8 pb-12 flex flex-col gap-6 animate-fade-in items-start">
            {/* Header and Flight Info Box */}
            <div className="w-full space-y-6">
                {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/dashboard" className="btn-icon"><ChevronLeft size={20} /></Link>
                <div>
                    <h1 className="text-2xl font-black text-black uppercase tracking-tighter">Mission Preparation</h1>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">{flight.flightNumber || 'UNTITLED TRIP'}</p>
                </div>
            </div>

            {/* Flight Info Card */}
            <div className="glass-card overflow-hidden border-t-4 border-primary-500">
                {/* Category + Aircraft */}
                <div className="px-6 pt-4 flex gap-4 text-sm text-black">
                    <span className="font-bold">{flight.flightCategory}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-700">{flight.aircraftType}</span>
                </div>
                <div className="p-6 grid grid-cols-1 gap-6">
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
                        <div className="flex items-center gap-2 text-sm text-black"><Calendar size={14} className="text-primary-500" /> {new Date(flight.departureTime).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2 text-sm text-black"><Clock size={14} className="text-primary-500" /> {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className={clsx('text-xs font-black uppercase tracking-widest mt-2 px-3 py-1.5 rounded-lg w-fit',
                            flight.status === 'Cleared' ? 'bg-green-500/10 text-green-400' :
                                flight.status === 'Completed' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400')}>
                            Status: {flight.status}
                        </div>
                    </div>
                </div>
            </div>

            {/* Weather Element */}
            {flight.departure && <WeatherWidget icao={flight.departure} />}
        </div>
        
        {/* Right Content (Forms & steps) */}
        <div className="w-full space-y-6">

            {/* All Done Banner */}
            {allDone && (
                <div className="glass-card p-6 border-2 border-green-500/30 bg-green-500/5 text-center space-y-4">
                    <CheckCircle size={48} className="text-green-500 mx-auto" />
                    <h2 className="text-2xl font-black text-green-700 uppercase tracking-tight">All Checks Completed!</h2>
                    <p className="text-black text-base">You've completed all required assessments. This trip is now cleared.</p>
                    <button onClick={async () => { await flightApi.complete(flight.id); navigate('/dashboard') }}
                        className="px-12 py-4 bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg">
                        Clear for Departure
                    </button>
                </div>
            )}

            {/* Step Cards */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="text-lg font-bold text-black uppercase tracking-widest border-b border-slate-200 pb-4">Assessment Checklist</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STEPS.map((step, i) => {
                        const done = stepStatus[i]
                        const Icon = step.icon
                        const isActive = activeStep === i
                        // Only allow opening this step if previous steps are done
                        const canOpen = i === 0 || stepStatus[i - 1]
                        return (
                            <button
                                key={step.key}
                                onClick={() => canOpen && setActiveStep(isActive ? null : i)}
                                disabled={!canOpen}
                                className={clsx(
                                    'flex flex-col items-center text-center p-6 rounded-2xl border-4 transition-all',
                                    done ? 'border-green-500/40 bg-green-500/5' :
                                        isActive ? `${step.bg}` :
                                            canOpen ? 'border-slate-300 hover:border-slate-400 bg-white cursor-pointer' :
                                                'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                                )}>
                                <div className={clsx('p-3 rounded-xl mb-3', done ? 'bg-green-500/10 text-green-600' : isActive ? step.color : 'bg-slate-200 text-slate-700')}>
                                    <Icon size={32} />
                                </div>
                                <div className="text-lg font-black text-black mb-2">{step.label}</div>
                                {done ? (
                                    <div className="text-base text-green-700 font-black uppercase flex items-center gap-2">
                                        <CheckCircle size={18} /> Done
                                    </div>
                                ) : isActive ? (
                                    <div className="text-base text-primary-600 font-black uppercase">In Progress</div>
                                ) : canOpen ? (
                                    <div className="text-base text-black font-black uppercase">Tap to Start</div>
                                ) : (
                                    <div className="text-base text-slate-800 font-black uppercase flex items-center gap-2">
                                        <AlertTriangle size={18} /> Locked
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mt-6 pt-4 border-t border-slate-200">
                    <div className="flex justify-between text-base font-black text-black">
                        <span>Overall Progress</span>
                        <span>{stepStatus.filter(Boolean).length} / {stepStatus.length}</span>
                    </div>
                    <div className="w-full h-2 bg-cockpit-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary-600 to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(stepStatus.filter(Boolean).length / stepStatus.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Active Panel */}
            {activeStep !== null && (
                <div className="glass-card p-6 space-y-5 animate-slide-up border-t-4" style={{ borderTopColor: ['#22d3ee', '#3b82f6', '#a855f7', '#f59e0b'][activeStep] }}>
                    <div className="flex items-center justify-between border-b border-cockpit-700/50 pb-4">
                        <h3 className="text-xl font-black text-black flex items-center gap-3">
                            {(() => { const S = STEPS[activeStep]; const Icon = S.icon; return <Icon size={22} className={S.color} /> })()}
                            {STEPS[activeStep].label} Assessment
                        </h3>
                        <button onClick={() => setActiveStep(null)} className="btn-icon"><X size={18} /></button>
                    </div>
                    {renderActivePanel()}
                </div>
            )}
        </div>
        </div>
    )
}
