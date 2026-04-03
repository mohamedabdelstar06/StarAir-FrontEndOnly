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
    ChevronRight
} from 'lucide-react'
import clsx from 'clsx'
import { WeatherWidget } from '../../components/shared/WeatherWidget'

// ─── Risk Selector: -1=unselected, 0=OK, 3=No ───────────────────────────────
type RiskVal = -1 | 0 | 3

function RiskSelector({ label, value, onChange, hint }: {
    label: string; value: RiskVal; onChange: (v: RiskVal) => void; hint?: string;
}) {
    const isOk = value === 0
    const isNo = value === 3
    return (
        <div className="w-full bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between gap-4 px-5 py-6">
                <div className="flex-1 min-w-0">
                    <div className="text-2xl font-black text-black leading-snug">{label}</div>
                    {hint && <div className="text-lg text-black mt-2 font-medium leading-relaxed">{hint}</div>}
                </div>
                <div className="flex gap-4 shrink-0">
                    <button type="button" onClick={() => onChange(0)}
                        className={clsx('px-8 py-4 rounded-xl text-xl font-black border-2 transition-all',
                            isOk ? 'bg-black text-white border-black shadow-md scale-105'
                                 : 'bg-white text-black border-slate-300 hover:border-black')}>
                        Ok
                    </button>
                    <button type="button" onClick={() => onChange(3)}
                        className={clsx('px-8 py-4 rounded-xl text-xl font-black border-2 transition-all',
                            isNo ? 'bg-black text-white border-black shadow-md scale-105'
                                 : 'bg-white text-black border-slate-300 hover:border-black')}>
                        no
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ result, score, outOf }: { result: string; score: number; outOf: number }) {
    const cfg = result === 'Go'
        ? { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', icon: '✈', msg: 'Cleared for flight operations' }
        : result === 'Caution'
            ? { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', icon: '⚠', msg: 'Proceed with extra caution' }
            : { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', icon: '✕', msg: 'Do NOT fly today' }
    return (
        <div className={clsx('rounded-xl border p-5 text-center animate-slide-up', cfg.bg)}>
            <div className={clsx('text-4xl mb-2', cfg.text)}>{cfg.icon}</div>
            <div className={clsx('text-2xl font-bold', cfg.text)}>{result}</div>
            <div className="text-sm text-slate-400 mt-1">{cfg.msg}</div>
            <div className="text-xs text-slate-500 mt-1">Risk Score: <span className="font-mono font-bold text-slate-300">{score}/{outOf}</span></div>
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
        color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30'
    },
    {
        type: 1, key: 'E', label: 'Evaluate',
        desc: 'Assess severity (how big an upset could be) × likelihood (how probable). Rate as Low / Medium / High. Consider time pressure and fuel state vs. alternate distance.',
        color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30'
    },
    {
        type: 2, key: 'C', label: 'Consider',
        desc: 'Generate at least 3 workable mitigations or alternatives. Engage crew or passengers for input. Write all options on a scratchpad to keep them visible.',
        color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30',
        isConsider: true
    },
    {
        type: 3, key: 'I', label: 'Integrate',
        desc: 'Merge chosen mitigations into a coherent flight plan. Balance aircraft limits, airspace, fuel, and approach minima. Sequence tasks into a logical flow.',
        color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30'
    },
    {
        type: 4, key: 'D', label: 'Decide',
        desc: 'Select the single best plan and commit. Make a clear call-out: heading, squawk, ETA. Brief passengers and ATC without hesitation.',
        color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30'
    },
    {
        type: 5, key: 'E', label: 'Execute & Reassess',
        desc: 'Put the decision into action with precise control inputs and checklist discipline. Then continuously monitor — if conditions change, loop back to Detect–Evaluate.',
        color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30'
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

    // ── DECIDE state ──
    const [decideSessionId, setDecideSessionId] = useState<number | null>(null)
    const [decideStep, setDecideStep] = useState(0)
    const [scenario, setScenario] = useState('')
    const [stepInput, setStepInput] = useState('')
    const [stepNotes, setStepNotes] = useState('')
    const [decideSaving, setDecideSaving] = useState(false)
    const [decideStarted, setDecideStarted] = useState(false)
    const [considerOption1, setConsiderOption1] = useState('')
    const [considerOption2, setConsiderOption2] = useState('')
    const [considerOption3, setConsiderOption3] = useState('')

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
                // Determine current step from completed assessments
                if (!swDone) {
                    // Check if they have prior smartwatch data
                    try {
                        const { data: analysis } = await smartWatchApi.getAnalysis()
                        if (analysis) { setSwAnalysis(analysis); setSwDone(true) }
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

    // ── DECIDE step submit ──
    const submitDecideStep = async () => {
        if (!decideSessionId) return
        setDecideSaving(true)
        try {
            const step = DECIDE_STEPS[decideStep]
            await decideApi.addStep(decideSessionId, { stepType: step.type, input: stepInput, notes: stepNotes })
            if (decideStep < DECIDE_STEPS.length - 1) {
                setDecideStep(s => s + 1)
                setStepInput(''); setStepNotes('')
                setConsiderOption1(''); setConsiderOption2(''); setConsiderOption3('')
            } else {
                await decideApi.completeSession(decideSessionId)
                if (flight) {
                    await flightApi.link(flight.id, { decideSessionId: decideSessionId })
                }
                loadFlight()
                setActiveStep(null) // all done
            }
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
            if (imSafeDone) {
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                            <CheckCircle size={24} className="text-green-400" />
                            <div>
                                <div className="font-bold text-green-400">IMSAFE completed</div>
                                <div className="text-sm text-slate-400">Assessment linked to this trip.</div>
                            </div>
                        </div>
                        {imResult && <ResultCard result={imResult.result} score={imResult.overallRiskScore} outOf={18} />}
                        <div className="flex justify-end">
                            <button onClick={() => setActiveStep(2)}
                                className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                                Next: PAVE Assessment <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )
            }
            return (
                <form onSubmit={handleImSubmit} className="space-y-3">
                    {imResult && <ResultCard result={imResult.result} score={imResult.overallRiskScore} outOf={18} />}
                    <div className="space-y-3">
                        <RiskSelector label="🤒 I — Illness" value={imForm.illnessLevel as RiskVal} onChange={v => setImForm(f => ({ ...f, illnessLevel: v }))}
                            hint="Do you have any symptoms (fever, congestion, dizziness) that could worsen under flight stress?" />
                        <RiskSelector label="💊 M — Medication" value={imForm.medicationLevel as RiskVal} onChange={v => setImForm(f => ({ ...f, medicationLevel: v }))}
                            hint="Are you taking any medications (OTC or prescription) that could cause drowsiness, blurred vision, or impaired performance?" />
                        <RiskSelector label="😰 S — Stress" value={imForm.stressLevel as RiskVal} onChange={v => setImForm(f => ({ ...f, stressLevel: v }))}
                            hint="Are you under significant psychological pressure (work, finances, family) that could drain cognitive bandwidth during flight?" />
                        <RiskSelector label="🍺 A — Alcohol" value={imForm.alcoholLevel as RiskVal} onChange={v => setImForm(f => ({ ...f, alcoholLevel: v }))}
                            hint="Have you consumed alcohol within the last 8–12 hours? Residual effects can linger beyond the FAA minimum 'bottle-to-throttle' rule." />
                        <RiskSelector label="😴 F — Fatigue" value={imForm.fatigueLevel as RiskVal} onChange={v => setImForm(f => ({ ...f, fatigueLevel: v }))}
                            hint="Are you below your personal rest standard? Fatigue undermines every phase of flight — treat it as seriously as a mechanical failure." />
                        <RiskSelector label="😤 E — Emotions" value={imForm.emotionLevel as RiskVal} onChange={v => setImForm(f => ({ ...f, emotionLevel: v }))}
                            hint="Are you experiencing emotional volatility (anger, grief, excitement) that could hijack rational decision-making during flight?" />
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
            if (paveDone) {
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                            <CheckCircle size={24} className="text-green-400" />
                            <div>
                                <div className="font-bold text-green-400">PAVE completed</div>
                                <div className="text-sm text-slate-400">Assessment linked to this trip.</div>
                            </div>
                        </div>
                        {paveResult && (
                            <div className={clsx('rounded-xl border p-4 text-center',
                                paveResult.result === 'Go' ? 'bg-green-500/10 border-green-500/30' :
                                    paveResult.result === 'Caution' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30')}>
                                <div className={clsx('text-xl font-bold', paveResult.result === 'Go' ? 'text-green-400' : paveResult.result === 'Caution' ? 'text-amber-400' : 'text-red-400')}>
                                    PAVE Result: {paveResult.result}
                                </div>
                                <div className="text-sm text-slate-400 mt-1">Score: {paveResult.overallRiskScore}/12</div>
                            </div>
                        )}
                        <div className="flex justify-end">
                            <button onClick={() => setActiveStep(3)}
                                className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                                Next: DECIDE Model <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )
            }
            return (
                <form onSubmit={handlePaveSubmit} className="space-y-3">
                    <div className="space-y-3">
                        <RiskSelector label="✈️ P — Pilot" value={paveForm.pilotRiskLevel as RiskVal} onChange={v => setPaveForm(f => ({ ...f, pilotRiskLevel: v }))}
                            hint="Are there concerns with your health, training currency, aircraft familiarity, or personal minimums for this flight?" />
                        <RiskSelector label="🛫 A — Aircraft" value={paveForm.aircraftRiskLevel as RiskVal} onChange={v => setPaveForm(f => ({ ...f, aircraftRiskLevel: v }))}
                            hint="Are there any concerns with airworthiness, weight & balance, fuel, or performance for the assigned aircraft type?" />
                        <RiskSelector label="V — enVironment" value={paveForm.environmentRiskLevel as RiskVal} onChange={v => setPaveForm(f => ({ ...f, environmentRiskLevel: v }))} 
                            hint="Weather, NOTAMs, terrain, alternates" />
                        <RiskSelector label="E — External Pressures" value={paveForm.externalRiskLevel as RiskVal} onChange={v => setPaveForm(f => ({ ...f, externalRiskLevel: v }))} 
                            hint="Passenger expectations, time pressures, personal ambitions" />
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

        // ── DECIDE Panel ──
        if (activeStep === 3) {
            if (decideDone) {
                return (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <CheckCircle size={24} className="text-green-400" />
                        <div>
                            <div className="font-bold text-green-400">DECIDE completed</div>
                            <div className="text-sm text-slate-400">All assessments done. You may now clear for departure.</div>
                        </div>
                    </div>
                )
            }
            if (!decideStarted) {
                return (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={startDecide} disabled={decideSaving} className="btn-primary flex items-center gap-2 px-10 py-4 text-base font-bold">
                                {decideSaving ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                                Start DECIDE Session
                            </button>
                        </div>
                    </div>
                )
            }
            const currentDecideStep = DECIDE_STEPS[decideStep]
            return (
                <div className="space-y-5">
                    {/* DECIDE Step progress */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {DECIDE_STEPS.map((s, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all',
                                    i < decideStep ? 'bg-primary-600 border-primary-500 text-white' :
                                        i === decideStep ? `bg-cockpit-800 ${s.color} border-current` :
                                            'bg-cockpit-800 border-cockpit-600 text-slate-600')}>
                                    {i < decideStep ? <Check size={12} /> : s.key}
                                </div>
                                {i < DECIDE_STEPS.length - 1 && <div className={clsx('h-0.5 w-4 transition-all', i < decideStep ? 'bg-primary-600' : 'bg-cockpit-700')} />}
                            </div>
                        ))}
                    </div>
                    <div className={clsx('rounded-xl border p-5 space-y-4', currentDecideStep.bg)}>
                        <div>
                            <div className={clsx('text-xs font-semibold uppercase tracking-wider', currentDecideStep.color)}>Step {decideStep + 1} of {DECIDE_STEPS.length}</div>
                            <div className="text-lg font-bold text-slate-100 mt-1">{currentDecideStep.label}</div>
                            <div className="text-sm text-slate-400 mt-0.5 leading-relaxed">{currentDecideStep.desc}</div>
                        </div>

                        {/* Only Ok or No / Observed or Decided no text inputs */}
                        <div className="space-y-4 text-center mt-6">
                            <div className="text-xl font-black text-black">Action:</div>
                            <div className="flex gap-4 justify-center">
                                <button type="button" onClick={() => { setStepInput('Observed'); submitDecideStep() }} disabled={decideSaving}
                                    className="px-8 py-4 bg-white hover:bg-black hover:text-white text-black border-2 border-black rounded-xl text-xl font-black transition-all">
                                    Observed
                                </button>
                                <button type="button" onClick={() => { setStepInput('Decided'); submitDecideStep() }} disabled={decideSaving}
                                    className="px-8 py-4 bg-white hover:bg-black hover:text-white text-black border-2 border-black rounded-xl text-xl font-black transition-all">
                                    Decided
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return null
    }

    return (
        <div className="w-full px-8 pb-12 space-y-6 animate-fade-in">
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
                <div className="px-6 pt-4 flex gap-4 text-base text-black">
                    <span className="font-bold">{flight.flightCategory}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-700">{flight.aircraftType}</span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between text-center bg-slate-50 p-5 rounded-2xl border border-slate-200 col-span-full md:col-span-1">
                        <div className="flex-1">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Departure</div>
                            <div className="text-3xl font-black text-black">{flight.departure}</div>
                        </div>
                        <div className="px-4 flex flex-col items-center">
                            <Plane size={20} className="text-primary-500 rotate-90" />
                        </div>
                        <div className="flex-1">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Arrival</div>
                            <div className="text-3xl font-black text-black">{flight.arrival}</div>
                        </div>
                    </div>
                    <div className="space-y-2 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-base text-black"><Calendar size={14} className="text-primary-500" /> {new Date(flight.departureTime).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2 text-base text-black"><Clock size={14} className="text-primary-500" /> {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
                                    'flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all',
                                    done ? 'border-green-500/40 bg-green-500/5' :
                                        isActive ? `${step.bg}` :
                                            canOpen ? 'border-cockpit-600 hover:border-primary-500/50 bg-cockpit-800/30 cursor-pointer' :
                                                'border-cockpit-700/30 bg-cockpit-800/10 opacity-40 cursor-not-allowed'
                                )}>
                                <div className={clsx('p-3 rounded-xl mb-2', done ? 'bg-green-500/10 text-green-400' : isActive ? step.color : 'bg-slate-800 text-slate-500')}>
                                    <Icon size={22} />
                                </div>
                                <div className="text-sm font-black text-black mb-1">{step.label}</div>
                                {done ? (
                                    <div className="text-[10px] text-green-400 font-bold uppercase flex items-center gap-1">
                                        <CheckCircle size={10} /> Done
                                    </div>
                                ) : isActive ? (
                                    <div className="text-[10px] text-primary-400 font-bold uppercase">In Progress</div>
                                ) : canOpen ? (
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Tap to Start</div>
                                ) : (
                                    <div className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-1">
                                        <AlertTriangle size={10} /> Locked
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-500">
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
    )
}
