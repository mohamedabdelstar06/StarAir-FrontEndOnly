import { useEffect, useState } from 'react'
import { smartWatchApi, flightApi } from '../../lib/apiClient'
import type { SmartWatchReadingResponseDto, SmartWatchAnalysisDto, CreateSmartWatchReadingDto } from '../../lib/types'
import {
    Watch, Heart, Activity, Moon, Zap, Droplets, Footprints,
    Thermometer, Loader2, CheckCircle, AlertTriangle, XCircle,
    RefreshCw, ChevronDown, ChevronUp, Wifi
} from 'lucide-react'
import clsx from 'clsx'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusConfig(status: 'Fit' | 'Caution' | 'Not Fit' | undefined) {
    if (status === 'Fit')
        return { bg: 'bg-green-50 border-green-400', badge: 'bg-green-500', text: 'text-green-700', icon: CheckCircle, label: 'Fit to Fly', glow: 'shadow-green-200' }
    if (status === 'Caution')
        return { bg: 'bg-amber-50 border-amber-400', badge: 'bg-amber-500', text: 'text-amber-700', icon: AlertTriangle, label: 'Caution', glow: 'shadow-amber-200' }
    return { bg: 'bg-red-50 border-red-400', badge: 'bg-red-600', text: 'text-red-700', icon: XCircle, label: 'Not Fit to Fly', glow: 'shadow-red-200' }
}

function MetricCell({ emoji, label, value, unit, color }: { emoji: string; label: string; value?: string | number | null; unit?: string; color?: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="text-2xl mb-1">{emoji}</div>
            <div className={clsx('text-xl font-black text-black leading-none', color)}>
                {value ?? '—'}
                {value != null && unit && <span className="text-xs font-semibold text-slate-400 ml-1">{unit}</span>}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{label}</div>
        </div>
    )
}

function RiskBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = Math.min(100, Math.round((value / max) * 100))
    return (
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
        </div>
    )
}

// ─── Analysis Card ────────────────────────────────────────────────────────────
function AnalysisCard({ analysis }: { analysis: SmartWatchAnalysisDto }) {
    const cfg = statusConfig(analysis.fitnessStatus as any)
    const StatusIcon = cfg.icon
    const riskPct = Math.min(100, Math.round(analysis.riskScore * 10))

    return (
        <div className={clsx('rounded-2xl border-2 p-5 shadow-lg space-y-4', cfg.bg, cfg.glow)}>
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md', cfg.badge)}>
                    <StatusIcon size={28} />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fitness Assessment</div>
                    <div className={clsx('text-2xl font-black', cfg.text)}>{cfg.label}</div>
                    <div className="text-xs text-slate-500 font-semibold mt-0.5">Based on last 7 days of biometric data</div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Risk Score</div>
                    <div className={clsx('text-3xl font-black tabular-nums', cfg.text)}>{analysis.riskScore}<span className="text-base text-slate-400">/10</span></div>
                </div>
            </div>

            {/* Risk bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                    <span>Low Risk</span><span>High Risk</span>
                </div>
                <RiskBar value={riskPct} max={100}
                    color={analysis.fitnessStatus === 'Fit' ? 'bg-green-500' : analysis.fitnessStatus === 'Caution' ? 'bg-amber-500' : 'bg-red-500'} />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { emoji: '❤️', label: 'Heart Rate', value: analysis.latestHeartRate, unit: 'bpm', color: 'text-rose-600' },
                    { emoji: '😴', label: 'Avg Sleep', value: analysis.averageSleepHours, unit: 'h', color: 'text-purple-600' },
                    { emoji: '🧠', label: 'Avg Stress', value: analysis.averageStressIndex, unit: '/100', color: 'text-amber-600' },
                    { emoji: '🫁', label: 'Avg SpO₂', value: analysis.averageSpO2, unit: '%', color: 'text-sky-600' },
                ].map(m => (
                    <div key={m.label} className="bg-white/70 rounded-xl border border-white shadow-sm text-center p-3">
                        <div className="text-xl mb-1">{m.emoji}</div>
                        <div className={clsx('text-xl font-black tabular-nums', m.color)}>
                            {m.value ?? '—'}
                            {m.value != null && <span className="text-xs font-medium text-slate-400 ml-0.5">{m.unit}</span>}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Recommendation */}
            <div className="bg-white/80 rounded-xl border border-slate-200 px-4 py-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">{analysis.recommendation}</p>
            </div>
        </div>
    )
}

// ─── Manual Entry Form ────────────────────────────────────────────────────────
const FIELDS = [
    { key: 'heartRate', emoji: '❤️', label: 'Heart Rate (bpm)', min: 30, max: 220, step: 1, unit: 'bpm', hint: 'Resting HR from this morning' },
    { key: 'heartRateVariability', emoji: '📊', label: 'HRV (ms)', min: 0, max: 200, step: 1, unit: 'ms', hint: 'Heart rate variability' },
    { key: 'sleepHours', emoji: '😴', label: 'Sleep Hours (last night)', min: 0, max: 24, step: 0.5, unit: 'h', hint: 'Total sleep duration' },
    { key: 'sleepQuality', emoji: '💤', label: 'Sleep Quality (0–100)', min: 0, max: 100, step: 1, unit: '/100', hint: 'Quality score from your device' },
    { key: 'stressIndex', emoji: '🧠', label: 'Stress Index (0–100)', min: 0, max: 100, step: 1, unit: '/100', hint: 'Lower is better' },
    { key: 'spO2', emoji: '🫁', label: 'Blood Oxygen SpO₂ (%)', min: 70, max: 100, step: 1, unit: '%', hint: 'Normal is 95–100%' },
    { key: 'skinTemperature', emoji: '🌡️', label: 'Skin Temperature (°C)', min: 30, max: 42, step: 0.1, unit: '°C', hint: 'Optional' },
    { key: 'steps', emoji: '👟', label: 'Steps Today', min: 0, max: 100000, step: 1, unit: 'steps', hint: 'Since midnight' },
] as const

interface SmartWatchPanelProps {
    tripId?: number          // if provided, links reading to trip
    readingId?: number       // if provided (from TripDetailPage), just show existing reading
    showEntryForm?: boolean  // whether to allow entering new data
    onSubmitComplete?: () => void
}

export function SmartWatchPanel({ tripId, readingId, showEntryForm = true, onSubmitComplete }: SmartWatchPanelProps) {
    const [reading, setReading] = useState<SmartWatchReadingResponseDto | null>(null)
    const [analysis, setAnalysis] = useState<SmartWatchAnalysisDto | null>(null)
    const [loadingData, setLoadingData] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [form, setForm] = useState<Partial<CreateSmartWatchReadingDto>>({})
    const [deviceName, setDeviceName] = useState('')

    // Load existing reading + analysis
    useEffect(() => {
        const load = async () => {
            setLoadingData(true)
            try {
                if (readingId) {
                    const res = await smartWatchApi.getReadingById(readingId)
                    setReading(res.data)
                }
                // Always try to load 7-day analysis
                const aRes = await smartWatchApi.getAnalysis()
                setAnalysis(aRes.data)
            } catch {
                // no data yet — that's fine
            } finally {
                setLoadingData(false)
            }
        }
        load()
    }, [readingId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        // Must have at least heart rate or sleep hours
        if (!form.heartRate && !form.sleepHours && !form.stressIndex && !form.spO2) {
            setError('Please enter at least one health metric (Heart Rate, Sleep, Stress, or SpO₂).')
            return
        }

        setSaving(true)
        try {
            const payload: CreateSmartWatchReadingDto = {
                ...form,
                deviceName: deviceName || 'Manual Entry',
                isManualEntry: true,
                isSynced: false,
                flightTripId: tripId,
            }
            const res = await smartWatchApi.addReading(payload)

            // Link to trip if tripId provided
            if (tripId) {
                await flightApi.link(tripId, { smartWatchReadingId: res.data.id })
            }

            // Refresh analysis
            const aRes = await smartWatchApi.getAnalysis()
            setAnalysis(aRes.data)
            setReading(res.data)
            setShowForm(false)
            setSuccess('Health data saved and analysis updated!')
            onSubmitComplete?.()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save health data. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loadingData) {
        return (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                <RefreshCw size={20} className="animate-spin" />
                <span className="text-sm font-semibold">Loading health data...</span>
            </div>
        )
    }

    return (
        <div className="space-y-5">

            {/* ── Analysis Card (if we have analysis data) ── */}
            {analysis && <AnalysisCard analysis={analysis} />}

            {/* ── Existing reading detail ── */}
            {reading && (
                <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Watch size={16} className="text-rose-500" />
                            <span className="text-sm font-black text-black uppercase tracking-widest">Recorded Biometrics</span>
                        </div>
                        <div className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">
                            {reading.isManualEntry ? '✏️ Manual Entry' : `⌚ ${reading.deviceName || 'Smartwatch Sync'}`}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-100">
                        <MetricCell emoji="❤️" label="Heart Rate" value={reading.heartRate} unit="bpm" color="text-rose-600" />
                        <MetricCell emoji="📊" label="HRV" value={reading.heartRateVariability} unit="ms" color="text-blue-600" />
                        <MetricCell emoji="🫁" label="SpO₂" value={reading.spO2} unit="%" color="text-sky-600" />
                        <MetricCell emoji="😴" label="Sleep" value={reading.sleepHours} unit="h" color="text-purple-600" />
                        <MetricCell emoji="🧠" label="Stress" value={reading.stressIndex} unit="/100" color="text-amber-600" />
                        <MetricCell emoji="👟" label="Steps" value={reading.steps?.toLocaleString()} color="text-green-600" />
                        <MetricCell emoji="🌡️" label="Skin Temp" value={reading.skinTemperature} unit="°C" color="text-orange-600" />
                        <MetricCell emoji="💤" label="Sleep Quality" value={reading.sleepQuality} unit="/100" color="text-indigo-600" />
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 font-semibold">
                        Recorded: {new Date(reading.recordedAt).toLocaleString()}
                    </div>
                </div>
            )}

            {/* ── No data state ── */}
            {!analysis && !reading && !showForm && (
                <div className="text-center py-12 space-y-3">
                    <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-100 flex items-center justify-center mx-auto">
                        <Watch size={36} className="text-rose-300" />
                    </div>
                    <div className="text-base font-black text-black">No Health Data Yet</div>
                    <div className="text-sm text-slate-500 max-w-sm mx-auto">
                        Enter your biometric data from your smartwatch app (Garmin Connect, Fitbit, Samsung Health, etc.) to get a fitness assessment before your flight.
                    </div>
                </div>
            )}

            {/* ── Add New Reading Button / Toggle ── */}
            {showEntryForm && (
                <div>
                    <button
                        type="button"
                        onClick={() => setShowForm(v => !v)}
                        className={clsx(
                            'w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 font-bold text-sm transition-all',
                            showForm
                                ? 'bg-slate-100 border-slate-300 text-black'
                                : 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200'
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Watch size={18} />
                            {showForm ? 'Close Manual Entry Form' : (reading ? '+ Add New Health Reading' : '+ Enter Health Data Manually')}
                        </span>
                        {showForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {/* ── Manual Entry Form ── */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="mt-4 border-2 border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm animate-slide-up">
                            {/* Form Header */}
                            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Watch size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-base">Manual Health Entry</div>
                                    <div className="text-xs text-white/80">Enter values from your smartwatch app — no device connection needed</div>
                                </div>
                            </div>

                            {/* Supported Devices Banner */}
                            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3 flex-wrap">
                                <Wifi size={14} className="text-slate-400 flex-shrink-0" />
                                <span className="text-xs text-slate-500 font-semibold">Read from your app and enter below:</span>
                                {['Garmin Connect', 'Fitbit', 'Samsung Health', 'Apple Health', 'Polar', 'Whoop'].map(app => (
                                    <span key={app} className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-600">{app}</span>
                                ))}
                            </div>

                            <div className="p-5 space-y-5">
                                {/* Device Name */}
                                <div>
                                    <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">
                                        ⌚ Device / App Name <span className="text-slate-400 normal-case font-semibold">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Garmin Fenix 7, Fitbit Charge 6..."
                                        value={deviceName}
                                        onChange={e => setDeviceName(e.target.value)}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-black text-sm font-semibold outline-none focus:border-rose-400 transition-colors bg-white"
                                    />
                                </div>

                                {/* Metric Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {FIELDS.map(({ key, emoji, label, min, max, step, unit, hint }) => (
                                        <div key={key} className="space-y-1.5">
                                            <label className="flex items-center gap-1.5 text-xs font-black text-black uppercase tracking-wide">
                                                <span>{emoji}</span>
                                                {label}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={min}
                                                    max={max}
                                                    step={step}
                                                    placeholder={hint}
                                                    value={(form as any)[key] ?? ''}
                                                    onChange={e => setForm(f => ({
                                                        ...f,
                                                        [key]: e.target.value ? Number(e.target.value) : undefined
                                                    }))}
                                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-14 text-black text-base font-mono font-bold outline-none focus:border-rose-400 transition-colors bg-white placeholder:text-slate-300 placeholder:font-normal placeholder:text-sm"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                                    {unit}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Validation note */}
                                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-semibold">
                                    <span className="text-base flex-shrink-0">ℹ️</span>
                                    Leave fields blank if your device doesn't track them. At least one metric is required (Heart Rate, Sleep, Stress, or SpO₂).
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded-xl text-sm text-red-700 font-bold">
                                        <XCircle size={16} className="flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-xl text-sm text-green-700 font-bold">
                                        <CheckCircle size={16} className="flex-shrink-0" />
                                        {success}
                                    </div>
                                )}

                                {/* Submit */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-rose-200 active:scale-95"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                                        {saving ? 'Saving & Analyzing...' : 'Save & Get Fitness Analysis'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {success && !showForm && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border-2 border-green-300 rounded-2xl text-sm text-green-700 font-bold">
                    <CheckCircle size={18} className="flex-shrink-0" />
                    {success}
                </div>
            )}
        </div>
    )
}
