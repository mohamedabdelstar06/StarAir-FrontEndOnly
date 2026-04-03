import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ImSafeResponseDto, PaveResponseDto, FlightTripResponseDto } from '../../lib/types'
import { ChevronLeft, ChevronRight, AlertTriangle, Plane, Calendar, ArrowRight, X, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

interface DayTrend {
    date: string
    shortDate: string
    dayName: string
    go: number
    caution: number
    nogo: number
    pending: number
    total: number
}

const COLORS = {
    go: '#10b981',
    caution: '#f59e0b',
    nogo: '#ef4444',
    pending: '#9ca3af'
}

function getLocalDate(dateString: string | Date): string {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Smooth cubic bezier curve path from array of {x,y} points
function makeSmoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
    const path: string[] = [`M ${pts[0].x} ${pts[0].y}`]
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1]
        const curr = pts[i]
        const cp1x = prev.x + (curr.x - prev.x) * 0.5
        const cp1y = prev.y
        const cp2x = curr.x - (curr.x - prev.x) * 0.5
        const cp2y = curr.y
        path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`)
    }
    return path.join(' ')
}

export function AdvancedTrendChart({
    assessments,
    flights = [],
    title = 'Assessments Report',
}: {
    assessments: (ImSafeResponseDto | PaveResponseDto)[]
    flights?: FlightTripResponseDto[]
    title?: string
}) {
    const navigate = useNavigate()

    const datesSet = new Set<string>()
    assessments.forEach(a => {
        const dStr = getLocalDate(a.assessedAt)
        if (dStr) datesSet.add(dStr)
    })
    flights.forEach(f => {
        if (f.createdAt) {
            const dStr = getLocalDate(f.createdAt)
            if (dStr) datesSet.add(dStr)
        }
    })
    const allDates = Array.from(datesSet).sort()

    const days: DayTrend[] = []
    if (allDates.length > 0) {
        const startDate = new Date(allDates[0])
        const endDate = new Date(allDates[allDates.length - 1])
        const now = new Date()
        if (endDate < now) endDate.setTime(now.getTime())
        let curr = new Date(startDate)
        while (curr <= endDate) {
            const dateStr = getLocalDate(curr)
            if (dateStr) {
                const dStr =
                    curr.getDate().toString().padStart(2, '0') +
                    '. ' +
                    curr.toLocaleString('default', { month: 'short' })
                const dayName = curr.toLocaleString('default', { weekday: 'short' }).toUpperCase()
                days.push({ date: dateStr, shortDate: dStr, dayName, go: 0, caution: 0, nogo: 0, pending: 0, total: 0 })
            }
            curr.setDate(curr.getDate() + 1)
        }
    } else {
        const now = new Date()
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(now.getDate() - i)
            const dateStr = getLocalDate(d)
            if (dateStr) {
                const dStr =
                    d.getDate().toString().padStart(2, '0') +
                    '. ' +
                    d.toLocaleString('default', { month: 'short' })
                const dayName = d.toLocaleString('default', { weekday: 'short' }).toUpperCase()
                days.push({ date: dateStr, shortDate: dStr, dayName, go: 0, caution: 0, nogo: 0, pending: 0, total: 0 })
            }
        }
    }

    const matchedAssessmentIds = new Set<number>()

    for (const f of flights) {
        if (!f.createdAt) continue
        const dateStr = getLocalDate(f.createdAt)
        const bucket = days.find((d) => d.date === dateStr)
        if (!bucket) continue
        
        const imSafe = assessments.find(a => a.id === f.imSafeAssessmentId)
        const pave = assessments.find(a => a.id === f.paveAssessmentId)
        
        if (imSafe) matchedAssessmentIds.add(imSafe.id)
        if (pave) matchedAssessmentIds.add(pave.id)

        const results = []
        if (imSafe?.result) results.push(imSafe.result)
        if (pave?.result) results.push(pave.result)

        let finalResult = 'Pending'
        if (results.includes('No-Go')) finalResult = 'No-Go'
        else if (results.includes('Caution')) finalResult = 'Caution'
        else if (results.includes('Go')) finalResult = 'Go'

        bucket.total++
        if (finalResult === 'Go') bucket.go++
        else if (finalResult === 'Caution') bucket.caution++
        else if (finalResult === 'No-Go') bucket.nogo++
        else bucket.pending++
    }

    for (const a of assessments) {
        if (matchedAssessmentIds.has(a.id)) continue
        const dateStr = getLocalDate(a.assessedAt)
        const bucket = days.find((d) => d.date === dateStr)
        if (!bucket) continue

        bucket.total++
        if (a.result === 'Go') bucket.go++
        else if (a.result === 'Caution') bucket.caution++
        else bucket.nogo++
    }

    const [visibleEndIdx, setVisibleEndIdx] = useState(days.length - 1)
    const DAYS_TO_SHOW = 7
    const visibleStartIdx = Math.max(0, visibleEndIdx - DAYS_TO_SHOW + 1)
    const visibleDays = days.slice(visibleStartIdx, visibleEndIdx + 1)

    const handlePrev = () =>
        setVisibleEndIdx((prev) => Math.max(DAYS_TO_SHOW - 1, prev - DAYS_TO_SHOW))
    const handleNext = () =>
        setVisibleEndIdx((prev) => Math.min(days.length - 1, prev + DAYS_TO_SHOW))

    const maxTotal = Math.max(...visibleDays.map((d) => d.total), 1)
    // ── MUCH TALLER chart ──
    const chartHeight = 420
    const chartPad = 30
    const w = 1000
    const dx = visibleDays.length > 1 ? w / (visibleDays.length - 1) : 0

    const makeData = (key: 'go' | 'caution' | 'nogo' | 'pending') => {
        if (visibleDays.length === 0) return { path: '', points: [] as { x: number; y: number }[] }
        const pts = visibleDays.map((d, i) => ({
            x: i * dx,
            y: chartHeight - chartPad - ((d[key] / maxTotal) * (chartHeight - chartPad * 2)),
        }))
        return { path: makeSmoothPath(pts), points: pts }
    }

    const goData = makeData('go')
    const cautionData = makeData('caution')
    const nogoData = makeData('nogo')
    const pendingData = makeData('pending')

    const dateRangeStr =
        visibleDays.length > 0
            ? `${visibleDays[0].shortDate} — ${visibleDays[visibleDays.length - 1].shortDate}`
            : ''

    const totalInRange = visibleDays.reduce((acc, d) => acc + d.total, 0)

    // ── Hover & Click state ──
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    // Robust flight matching based on creation or linked assessments
    const selectedDayFlights = selectedDate ? flights.filter(f => {
        const isCreated = f.createdAt ? getLocalDate(f.createdAt) === selectedDate : false
        
        let isAssessed = false
        if (!isCreated) {
            const imSafe = assessments.find(a => a.id === f.imSafeAssessmentId)
            const pave = assessments.find(a => a.id === f.paveAssessmentId)
            if (imSafe && getLocalDate(imSafe.assessedAt) === selectedDate) isAssessed = true
            if (pave && getLocalDate(pave.assessedAt) === selectedDate) isAssessed = true
        }

        return isCreated || isAssessed
    }) : []

    const selectedDayData = selectedDate ? visibleDays.find(d => d.date === selectedDate) : null

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-visible font-sans">
            {/* Header */}
            <div className="bg-slate-900 border-b-4 border-primary-500 px-6 py-5 flex items-center justify-between text-white rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-black tracking-wide italic">{title}</h2>
                    <div className="flex items-center gap-3 mt-2">
                        <button
                            onClick={handlePrev}
                            disabled={visibleStartIdx === 0}
                            className="hover:text-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <span className="text-sm font-semibold tracking-wider text-slate-300">
                            {dateRangeStr}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={visibleEndIdx >= days.length - 1}
                            className="hover:text-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total in range</div>
                    <div className="text-4xl font-black">{totalInRange}</div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-8 py-4 border-b border-slate-100 bg-white">
                {[
                    { color: COLORS.go, label: 'Go' },
                    { color: COLORS.caution, label: 'Caution' },
                    { color: COLORS.nogo, label: 'No-Go' },
                    { color: COLORS.pending, label: 'Pending' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                        <span className="w-8 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                        <span className="text-sm font-bold text-black">{label}</span>
                    </div>
                ))}
            </div>

            {/* Chart Area */}
            <div className="px-6 pt-8 pb-4 bg-white relative">
                <div className="relative" style={{ height: chartHeight }}>
                    {/* Y-axis scale labels */}
                    <div className="absolute left-0 inset-y-0 flex flex-col justify-between pointer-events-none" style={{ paddingTop: chartPad, paddingBottom: chartPad }}>
                        {[...Array(5)].map((_, i) => {
                            const val = Math.round(maxTotal * (1 - i / 4))
                            return (
                                <div key={i} className="text-[10px] font-bold text-slate-400 tabular-nums -translate-x-1">{val}</div>
                            )
                        })}
                    </div>

                    {/* Horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: chartHeight }}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="border-t border-dashed border-slate-100" />
                        ))}
                    </div>

                    <svg
                        width="100%"
                        height={chartHeight}
                        viewBox={`0 0 ${w} ${chartHeight}`}
                        preserveAspectRatio="none"
                        className="absolute inset-0 overflow-visible"
                    >
                        {/* Hover visual vertical highlight */}
                        {hoveredIdx !== null && (
                            <rect
                                x={(hoveredIdx * dx) - (dx / 2)}
                                y={0}
                                width={dx || w}
                                height={chartHeight}
                                fill="#000000"
                                opacity={0.03}
                                className="transition-opacity duration-200"
                            />
                        )}

                        {/* Selected day highlight column */}
                        {selectedDate && (() => {
                            const selIdx = visibleDays.findIndex(d => d.date === selectedDate)
                            if (selIdx < 0) return null
                            const cx = selIdx * dx
                            return (
                                <rect
                                    x={cx - (dx / 2)}
                                    y={0}
                                    width={dx || w}
                                    height={chartHeight}
                                    fill="#3b82f6"
                                    opacity={0.05}
                                />
                            )
                        })()}

                        {/* Go smooth curve */}
                        <path d={goData.path} fill="none" stroke={COLORS.go} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                        {goData.points.map((p, i) => (
                            <circle key={`go-${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 5} fill={COLORS.go} stroke="#fff" strokeWidth={hoveredIdx === i ? 3 : 2}
                                className="transition-all duration-300 ease-out pointer-events-none z-10" />
                        ))}

                        {/* Caution smooth curve */}
                        <path d={cautionData.path} fill="none" stroke={COLORS.caution} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                        {cautionData.points.map((p, i) => (
                            <circle key={`cau-${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 5} fill={COLORS.caution} stroke="#fff" strokeWidth={hoveredIdx === i ? 3 : 2}
                                className="transition-all duration-300 ease-out pointer-events-none z-10" />
                        ))}

                        {/* No-Go smooth curve */}
                        <path d={nogoData.path} fill="none" stroke={COLORS.nogo} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                        {nogoData.points.map((p, i) => (
                            <circle key={`nog-${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 5} fill={COLORS.nogo} stroke="#fff" strokeWidth={hoveredIdx === i ? 3 : 2}
                                className="transition-all duration-300 ease-out pointer-events-none z-10" />
                        ))}

                        {/* Pending smooth curve */}
                        <path d={pendingData.path} fill="none" stroke={COLORS.pending} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                        {pendingData.points.map((p, i) => (
                            <circle key={`pen-${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 5} fill={COLORS.pending} stroke="#fff" strokeWidth={hoveredIdx === i ? 3 : 2}
                                className="transition-all duration-300 ease-out pointer-events-none z-10" />
                        ))}

                        {/* Invisible hover/click zones running full width and height */}
                        {visibleDays.map((d, i) => (
                            <rect
                                key={`hover-${i}`}
                                x={i * dx - (dx / 2)}
                                y={0}
                                width={dx || w}
                                height={chartHeight}
                                fill="transparent"
                                className="cursor-pointer z-50"
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                onClick={() => setSelectedDate(d.date === selectedDate ? null : d.date)}
                            />
                        ))}
                    </svg>

                    {/* ═══ Floating Tooltip Box matching user image ═══ */}
                    {hoveredIdx !== null && visibleDays[hoveredIdx] && (
                        <div
                            className="absolute pointer-events-none top-0 z-50 transition-all duration-300 ease-out"
                            style={{
                                left: hoveredIdx === 0 ? '5%' : hoveredIdx >= visibleDays.length - 1 ? '95%' : `${(hoveredIdx / (visibleDays.length - 1)) * 100}%`,
                                transform: 'translateX(-50%) translateY(-20px)',
                            }}
                        >
                            <div className="bg-white rounded shadow-xl border border-slate-200 px-4 py-3 min-w-[120px]">
                                <div className="text-sm text-slate-700 font-semibold mb-3">
                                    {visibleDays[hoveredIdx].dayName}
                                </div>
                                <div className="flex flex-col gap-2.5 text-base font-medium tracking-wide">
                                    <div className="flex items-center gap-2" style={{ color: COLORS.go }}>
                                        <span>go</span>
                                        <span>:</span>
                                        <span>{visibleDays[hoveredIdx].go}</span>
                                    </div>
                                    <div className="flex items-center gap-2" style={{ color: COLORS.caution }}>
                                        <span>caution</span>
                                        <span>:</span>
                                        <span>{visibleDays[hoveredIdx].caution}</span>
                                    </div>
                                    <div className="flex items-center gap-2" style={{ color: COLORS.nogo }}>
                                        <span>nogo</span>
                                        <span>:</span>
                                        <span>{visibleDays[hoveredIdx].nogo}</span>
                                    </div>
                                    <div className="flex items-center gap-2" style={{ color: COLORS.pending }}>
                                        <span>pending</span>
                                        <span>:</span>
                                        <span>{visibleDays[hoveredIdx].pending}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-4 px-0">
                    {visibleDays.map((d, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedDate(d.date === selectedDate ? null : d.date)}
                            className={clsx(
                                'text-xs font-bold tracking-widest text-center flex-1 py-2 rounded-lg cursor-pointer transition-all',
                                selectedDate === d.date
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'text-black hover:bg-slate-100'
                            )}
                        >
                            <div>{d.dayName}</div>
                            <div className="text-[9px] font-semibold mt-0.5 opacity-60">{d.shortDate}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════
                DRILL-DOWN: Trips for selected day — BELOW the chart
               ═════════════════════════════════════════════════════════════════ */}
            {selectedDate && (
                <div className="border-t-2 border-primary-500 bg-slate-50 px-6 py-5 rounded-b-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <Calendar size={18} className="text-primary-500" />
                            <h3 className="text-base font-black text-black uppercase tracking-widest">
                                Trips on {selectedDayData?.shortDate}
                            </h3>
                        </div>
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="p-2 rounded-xl hover:bg-slate-200 transition-colors text-slate-500 hover:text-black border border-slate-300"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {selectedDayFlights.length > 0 ? (
                        <div className="space-y-2">
                            {selectedDayFlights.map(f => {
                                const statusCfg =
                                    f.status === 'Completed' ? { bg: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' } :
                                        f.status === 'Cleared' ? { bg: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' } :
                                            f.status === 'Cancelled' ? { bg: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' } :
                                                { bg: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' }

                                return (
                                    <button
                                        key={f.id}
                                        onClick={() => navigate(`/trips/${f.id}`)}
                                        className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:shadow-lg transition-all group text-left"
                                    >
                                        <div className="p-2.5 bg-primary-50 rounded-xl text-primary-500 group-hover:bg-primary-100 transition-colors">
                                            <Plane size={20} className="rotate-45" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-black text-black text-base">{f.flightNumber || `Trip #${f.id}`}</span>
                                                <span className={clsx('px-2 py-0.5 rounded-md text-[10px] font-black uppercase border', statusCfg.bg)}>
                                                    {f.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                                                <span className="font-black">{f.departure}</span>
                                                <ArrowRight size={12} className="text-slate-400" />
                                                <span className="font-black">{f.arrival}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-primary-500 group-hover:text-primary-600 transition-colors">
                                            <span className="text-xs font-black uppercase tracking-widest hidden md:block">View Trip</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-slate-300">
                            <div className="text-4xl mb-3">📭</div>
                            <div className="text-base font-black text-black">No matching trips found</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Pie Chart for risk reasons ───────────────────────────────────────────────
export function SystemPieChart({
    assessments,
}: {
    assessments: (ImSafeResponseDto | PaveResponseDto)[]
}) {
    const riskReasons: Record<string, number> = {}

    const recordRisk = (label: string, level: string) => {
        if (level !== 'None') {
            riskReasons[label] = (riskReasons[label] || 0) + 1
        }
    }

    for (const a of assessments) {
        if ('illnessLevel' in a) {
            recordRisk('I — Illness', a.illnessLevel)
            recordRisk('M — Medication', a.medicationLevel)
            recordRisk('S — Stress', a.stressLevel)
            recordRisk('A — Alcohol', a.alcoholLevel)
            recordRisk('F — Fatigue', a.fatigueLevel)
            recordRisk('E — Emotions', a.emotionLevel)
        } else {
            recordRisk('Pilot', a.pilotRiskLevel)
            recordRisk('Aircraft', a.aircraftRiskLevel)
            recordRisk('Environment', a.environmentRiskLevel)
            recordRisk('External', a.externalRiskLevel)
        }
    }

    const pieData = Object.entries(riskReasons)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])

    const maxItemsForPie = 6
    const topReasons = pieData.slice(0, maxItemsForPie)
    const pieTotal = topReasons.reduce((acc, curr) => acc + curr[1], 0)
    const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#06b6d4']

    return (
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 px-6 py-8 flex flex-col h-full font-sans">
            <div className="mb-4 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reasons for Missing "OK"</h2>
                <div className="text-base text-slate-500 mt-1 font-medium select-none">Breakdown of reported risks</div>
            </div>

            {pieTotal > 0 ? (
                <div className="flex flex-col xl:flex-row items-center justify-start mt-10 gap-8 xl:gap-6">
                    {/* Donut Chart */}
                    <div className="relative flex justify-center items-center shrink-0 w-[200px] h-[200px] mx-auto md:mx-0">
                        <svg width={200} height={200} className="-rotate-90">
                            {/* Background ring */}
                            <circle cx={100} cy={100} r={75} fill="none" stroke="#f1f5f9" strokeWidth={35} />
                            {topReasons.reduce(
                                (acc, [, count], idx) => {
                                    const circumference = 2 * Math.PI * 75
                                    const gap = topReasons.length > 1 ? 4 : 0 // gap in px
                                    const ratio = count / pieTotal
                                    const rawDash = ratio * circumference
                                    const dash = rawDash > gap ? rawDash - gap : 0
                                    
                                    const offset = acc.currentOffset
                                    if (dash > 0) {
                                        acc.elements.push(
                                            <circle
                                                key={idx}
                                                cx={100}
                                                cy={100}
                                                r={75}
                                                fill="none"
                                                stroke={PIE_COLORS[idx % PIE_COLORS.length]}
                                                strokeWidth={35}
                                                strokeDasharray={`${dash} ${circumference - dash}`}
                                                strokeDashoffset={-offset}
                                            />
                                        )
                                    }
                                    acc.currentOffset += rawDash
                                    return acc
                                },
                                { elements: [] as JSX.Element[], currentOffset: 0 }
                            ).elements}
                        </svg>
                        {/* Center Box */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                            <span className="text-3xl font-black text-slate-800 leading-none">{pieTotal}</span>
                            <span className="text-xs font-semibold text-slate-400 mt-1 uppercase">Reasons</span>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex-1 w-full space-y-3.5 pr-4 md:pl-2">
                        {topReasons.map(([reason, count], idx) => {
                            const pct = Math.round((count / pieTotal) * 100)
                            return (
                                <div key={reason} className="flex justify-between items-center text-base">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                                        />
                                        <span className="font-semibold text-slate-500 whitespace-nowrap">{reason}</span>
                                    </div>
                                    <span className="font-bold text-slate-800 ml-4">{pct}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                    <div className="text-5xl mb-4">🏆</div>
                    <div className="text-xl font-bold text-slate-800">Perfect Record</div>
                    <div className="text-sm font-semibold text-slate-400 mt-1">No flagged risk factors!</div>
                </div>
            )}
        </div>
    )
}
