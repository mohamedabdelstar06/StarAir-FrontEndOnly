import { useEffect, useState } from 'react'
import { smartWatchApi } from '../../lib/apiClient'
import type { SmartWatchAnalysisDto, SmartWatchReadingResponseDto, CreateSmartWatchReadingDto } from '../../lib/types'
import { Watch, RefreshCw, Loader2, Activity, Plus, X, Heart, Moon, Brain, Wind } from 'lucide-react'
import clsx from 'clsx'

const SIMULATE_PRESETS = {
    healthy: { heartRate: 68, heartRateVariability: 58, sleepHours: 7.5, sleepQuality: 80, stressIndex: 20, spO2: 98, skinTemperature: 36.6, steps: 4200, deviceName: 'Simulator' },
    stressed: { heartRate: 95, heartRateVariability: 28, sleepHours: 5, sleepQuality: 45, stressIndex: 65, spO2: 96, skinTemperature: 37.1, steps: 2100, deviceName: 'Simulator' },
    fatigued: { heartRate: 78, heartRateVariability: 22, sleepHours: 3.5, sleepQuality: 30, stressIndex: 75, spO2: 95, skinTemperature: 36.9, steps: 800, deviceName: 'Simulator' },
}

export function SmartWatchPage() {
    const [analysis, setAnalysis] = useState<SmartWatchAnalysisDto | null>(null)
    const [readings, setReadings] = useState<SmartWatchReadingResponseDto[]>([])
    const [loading, setLoading] = useState(true)
    const [showManual, setShowManual] = useState(false)
    const [form, setForm] = useState<CreateSmartWatchReadingDto>({ isSynced: true })
    const [saving, setSaving] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const [r, a] = await Promise.allSettled([smartWatchApi.getReadings(), smartWatchApi.getAnalysis()])
            if (r.status === 'fulfilled') setReadings(r.value.data)
            if (a.status === 'fulfilled') setAnalysis(a.value.data)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const applyPreset = (preset: keyof typeof SIMULATE_PRESETS) => {
        setForm({ ...SIMULATE_PRESETS[preset], isSynced: true }); setShowManual(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true)
        try { await smartWatchApi.addReading(form); setShowManual(false); load() } finally { setSaving(false) }
    }

    const statusColor = analysis?.fitnessStatus === 'Fit'
        ? { bg: 'bg-green-50 border-green-300', title: 'text-green-700', badge: 'bg-green-600 text-white' }
        : analysis?.fitnessStatus === 'Caution'
            ? { bg: 'bg-amber-50 border-amber-300', title: 'text-amber-700', badge: 'bg-amber-600 text-white' }
            : { bg: 'bg-red-50 border-red-300', title: 'text-red-700', badge: 'bg-red-600 text-white' }

    const metrics = analysis ? [
        { label: 'Heart Rate', value: `${analysis.latestHeartRate ?? '–'}`, unit: 'bpm', icon: Heart, iconColor: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        { label: 'Avg Sleep', value: `${analysis.averageSleepHours ?? '–'}`, unit: 'hrs', icon: Moon, iconColor: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
        { label: 'Stress Index', value: `${analysis.averageStressIndex ?? '–'}`, unit: '/100', icon: Brain, iconColor: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        { label: 'Avg SpO₂', value: `${analysis.averageSpO2 ?? '–'}`, unit: '%', icon: Wind, iconColor: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
    ] : []

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-black flex items-center gap-3">
                    <Watch size={24} className="text-primary-600" /> SmartWatch Monitor
                </h1>
                <button onClick={load} className="p-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-all">
                    <RefreshCw size={16} className="text-black" />
                </button>
            </div>

            {/* Analysis card */}
            {analysis && (
                <div className={clsx('rounded-2xl border-2 p-6', statusColor.bg)}>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <Watch size={26} className={statusColor.title} />
                            <div>
                                <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">Fitness Status (7-day avg)</div>
                                <div className={clsx('text-3xl font-black', statusColor.title)}>{analysis.fitnessStatus}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Risk Score</div>
                            <div className={clsx('text-3xl font-black font-mono', statusColor.title)}>{analysis.riskScore}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {metrics.map(m => {
                            const Icon = m.icon
                            return (
                                <div key={m.label} className={clsx('rounded-2xl border-2 p-4 bg-white', m.bg)}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon size={18} className={m.iconColor} />
                                        <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">{m.label}</div>
                                    </div>
                                    <div className="text-2xl font-black text-black font-mono">
                                        {m.value}<span className="text-sm font-bold text-slate-500 ml-1">{m.unit}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-4 bg-white border-2 border-slate-200 px-4 py-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">💡 Recommendation: </span>
                        <span className="text-sm font-bold text-slate-800">{analysis.recommendation}</span>
                    </div>
                </div>
            )}

            {!analysis && !loading && (
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <Watch size={48} className="mx-auto text-slate-400 mb-3" />
                    <div className="text-lg font-black text-black mb-1">No SmartWatch Data Yet</div>
                    <div className="text-base text-slate-500">Use Manual Entry or a Simulation preset below to add data.</div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 items-center">
                <button
                    onClick={() => setShowManual(!showManual)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all text-base"
                >
                    <Plus size={18} /> Manual Entry
                </button>
                <div className="flex gap-2 ml-auto flex-wrap items-center">
                    <span className="text-sm font-bold text-black">Simulate:</span>
                    {(Object.keys(SIMULATE_PRESETS) as (keyof typeof SIMULATE_PRESETS)[]).map(p => (
                        <button key={p} onClick={() => applyPreset(p)}
                            className={clsx('px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all capitalize',
                                p === 'healthy' ? 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100' :
                                    p === 'stressed' ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100' :
                                        'border-red-400 bg-red-50 text-red-700 hover:bg-red-100')}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Manual Form */}
            {showManual && (
                <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-black flex items-center gap-2">
                            <Activity size={20} className="text-primary-600" /> SmartWatch Reading
                        </h3>
                        <button type="button" onClick={() => setShowManual(false)} className="p-2 rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-all">
                            <X size={16} className="text-black" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { key: 'heartRate', label: '❤️ Heart Rate (bpm)', min: 30, max: 220 },
                            { key: 'heartRateVariability', label: '📋 HRV (ms)', min: 0, max: 200 },
                            { key: 'sleepHours', label: '😴 Sleep Hours', min: 0, max: 24, step: 0.5 },
                            { key: 'sleepQuality', label: '💤 Sleep Quality (0–100)', min: 0, max: 100 },
                            { key: 'stressIndex', label: '🧠 Stress Index (0–100)', min: 0, max: 100 },
                            { key: 'spO2', label: '🫁 SpO₂ (%)', min: 70, max: 100 },
                        ].map(({ key, label, min, max, step }) => (
                            <div key={key}>
                                <label className="block text-sm font-bold text-black mb-1">{label}</label>
                                <input type="number" min={min} max={max} step={step ?? 1}
                                    value={(form as unknown as Record<string, number>)[key] ?? ''}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black font-mono text-base outline-none focus:border-primary-500 transition-all" />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-black mb-1">Device Name</label>
                        <input value={form.deviceName ?? ''} onChange={e => setForm(f => ({ ...f, deviceName: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-black text-base outline-none focus:border-primary-500 transition-all"
                            placeholder="Garmin / Apple Watch / Fitbit…" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => setShowManual(false)} className="px-6 py-2.5 border-2 border-slate-300 text-black font-bold rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" disabled={saving} className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all flex items-center gap-2">
                            {saving && <Loader2 size={16} className="animate-spin" />} Submit Reading
                        </button>
                    </div>
                </form>
            )}

            {/* Readings table */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b-2 border-slate-200 flex items-center justify-between">
                    <div className="text-base font-black text-black">Recent Readings</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Last 20</div>
                </div>
                {loading
                    ? <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
                    : readings.length === 0
                        ? <div className="py-12 text-center text-slate-500 text-base font-semibold">No readings yet. Use Manual Entry or Simulation above.</div>
                        : <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        {['Date', 'HR (bpm)', 'HRV (ms)', 'Sleep (h)', 'Stress', 'SpO₂ (%)', 'Device'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-black text-black uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {readings.slice(0, 20).map(r => (
                                        <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-600 font-semibold">{new Date(r.recordedAt).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-black text-black text-base">{r.heartRate ?? '—'}</td>
                                            <td className="px-4 py-3 font-black text-black text-base">{r.heartRateVariability ?? '—'}</td>
                                            <td className="px-4 py-3 font-black text-black text-base">{r.sleepHours ?? '—'}</td>
                                            <td className={clsx('px-4 py-3 font-black text-base',
                                                r.stressIndex && r.stressIndex > 70 ? 'text-red-600' :
                                                    r.stressIndex && r.stressIndex > 40 ? 'text-amber-600' : 'text-green-700')}>
                                                {r.stressIndex ?? '—'}
                                            </td>
                                            <td className={clsx('px-4 py-3 font-black text-base', r.spO2 && r.spO2 < 94 ? 'text-red-600' : 'text-black')}>{r.spO2 ?? '—'}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-600">{r.deviceName ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                }
            </div>
        </div>
    )
}
