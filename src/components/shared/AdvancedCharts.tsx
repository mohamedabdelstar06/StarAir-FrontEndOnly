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
    
    let baseStartDate = new Date()
    if (allDates.length > 0) {
        baseStartDate = new Date(allDates[0])
    }
    baseStartDate.setHours(0, 0, 0, 0)
    
    let baseEndDate = new Date()
    baseEndDate.setHours(0, 0, 0, 0)
    
    // Ensure we have at least 1 full week (6 days after start)
    const minEndDate = new Date(baseStartDate)
    minEndDate.setDate(baseStartDate.getDate() + 6)
    
    if (baseEndDate < minEndDate) {
        baseEndDate = minEndDate
    }
    
    // Ensure the total span is a multiple of 7
    const diffTime = Math.abs(baseEndDate.getTime() - baseStartDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    const remainder = diffDays % 7
    if (remainder !== 0) {
        baseEndDate.setDate(baseEndDate.getDate() + (7 - remainder))
    }

    let curr = new Date(baseStartDate)
    while (curr <= baseEndDate) {
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
        if (results.includes('NoGo') || results.includes('No-Go')) finalResult = 'NoGo'
        else if (results.includes('Caution')) finalResult = 'Caution'
        else if (results.includes('Go')) finalResult = 'Go'

        bucket.total++
        if (finalResult === 'Go') bucket.go++
        else if (finalResult === 'Caution') bucket.caution++
        else if (finalResult === 'NoGo') bucket.nogo++
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

    const [pageOffset, setPageOffset] = useState(0) // 0 = newest 7 days
    const DAYS_TO_SHOW = 7
    const maxOffset = Math.max(0, Math.floor(days.length / DAYS_TO_SHOW) - 1)
    const currentOffset = Math.min(pageOffset, maxOffset)
    
    // offset 0 is the right-most (newest) chunk
    const visibleStartIdx = days.length - (currentOffset + 1) * DAYS_TO_SHOW
    const visibleEndIdx = visibleStartIdx + DAYS_TO_SHOW - 1
    const visibleDays = days.slice(visibleStartIdx, visibleEndIdx + 1)

    const handlePrev = () => setPageOffset(p => Math.min(maxOffset, p + 1)) // Move to older records (Left)
    const handleNext = () => setPageOffset(p => Math.max(0, p - 1))         // Move to newer records (Right)

    const maxTotal = Math.max(...visibleDays.map((d) => d.total), 1)
    // ── Responsive chart height ──
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const chartHeight = isMobile ? 260 : 420
    const chartPad = isMobile ? 20 : 30
    const w = 1000
    const dx = visibleDays.length > 1 ? w / (visibleDays.length - 1) : 0

    const makeData = (key: 'go' | 'caution' | 'nogo' | 'pending') => {
        if (visibleDays.length === 0) return { path: '', areaPath: '', points: [] as { x: number; y: number }[] }
        const pts = visibleDays.map((d, i) => ({
            x: i * dx,
            y: chartHeight - chartPad - ((d[key] / maxTotal) * (chartHeight - chartPad * 2)),
        }))
        const pathLine = makeSmoothPath(pts)
        const areaPath = pts.length > 0 ? `${pathLine} L ${pts[pts.length - 1].x} ${chartHeight - chartPad} L ${pts[0].x} ${chartHeight - chartPad} Z` : ''
        return { path: pathLine, areaPath, points: pts }
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
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden font-sans w-full relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-100 via-blue-50 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-black p-4 sm:p-5 rounded-t-2xl relative overflow-hidden">
                {/* Subtle top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500 opacity-90"></div>
                
                <div className="min-w-0 z-10">
                    <h2 className="text-lg sm:text-xl font-black tracking-tighter truncate text-slate-900">{title}</h2>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1.5">
                        <button
                            onClick={handlePrev}
                            disabled={visibleStartIdx === 0}
                            className="bg-slate-50 border border-slate-200 rounded p-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 shadow-sm"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs sm:text-sm font-bold tracking-widest text-slate-500 uppercase whitespace-nowrap">
                            {dateRangeStr}
                        </span>
                        <button
                            onClick={handleNext}
                            disabled={visibleEndIdx >= days.length - 1}
                            className="bg-slate-50 border border-slate-200 rounded p-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-600 shadow-sm"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="text-right shrink-0 z-10">
                    <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total in range</div>
                    <div className="text-2xl sm:text-3xl font-black text-black leading-none mt-0.5 tracking-tighter">{totalInRange}</div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-8 py-3 sm:py-4 px-4 border-b border-slate-100 bg-white">
                {[
                    { color: COLORS.go, label: 'Go' },
                    { color: COLORS.caution, label: 'Caution' },
                    { color: COLORS.nogo, label: 'No-Go' },
                    { color: COLORS.pending, label: 'Pending' },
                ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-5 sm:w-8 h-1 sm:h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                        <span className="text-xs sm:text-sm font-bold text-black">{label}</span>
                    </div>
                ))}
            </div>

            {/* Chart Area */}
            <div className="px-2 sm:px-6 pt-4 sm:pt-8 pb-2 sm:pb-4 bg-white relative overflow-hidden">
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
                        <defs>
                            <linearGradient id="grad-go" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={COLORS.go} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={COLORS.go} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="grad-caution" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={COLORS.caution} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={COLORS.caution} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="grad-nogo" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={COLORS.nogo} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={COLORS.nogo} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="grad-pending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={COLORS.pending} stopOpacity={0.25} />
                                <stop offset="100%" stopColor={COLORS.pending} stopOpacity={0} />
                            </linearGradient>
                        </defs>

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

                        {/* Area backgrounds */}
                        <path d={goData.areaPath} fill="url(#grad-go)" className="transition-all duration-300" />
                        <path d={cautionData.areaPath} fill="url(#grad-caution)" className="transition-all duration-300" />
                        <path d={nogoData.areaPath} fill="url(#grad-nogo)" className="transition-all duration-300" />
                        <path d={pendingData.areaPath} fill="url(#grad-pending)" className="transition-all duration-300" />

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
                            <div className="bg-white rounded shadow-xl border border-slate-200 px-3 py-2 sm:px-4 sm:py-3 min-w-[90px] sm:min-w-[120px]">
                                <div className="text-sm text-slate-900 font-black tracking-tight mb-3 border-b border-slate-100 pb-2">
                                    {visibleDays[hoveredIdx].dayName}
                                </div>
                                <div className="flex flex-col gap-1.5 sm:gap-2.5 text-xs sm:text-[13px] font-bold tracking-wide uppercase">
                                    <div className="flex items-center gap-2" style={{ color: COLORS.go }}>
                                        <span>go</span>
                                        <span className="opacity-50">:</span>
                                        <span className="text-black font-black">{visibleDays[hoveredIdx].go}</span>
                                    </div>
                                    <div className="flex items-center gap-2" style={{ color: COLORS.caution }}>
                                        <span>caution</span>
                                        <span className="opacity-50">:</span>
                                        <span className="text-black font-black">{visibleDays[hoveredIdx].caution}</span>
                                    </div>
                                    <div className="flex items-center gap-2" style={{ color: COLORS.nogo }}>
                                        <span>nogo</span>
                                        <span className="opacity-50">:</span>
                                        <span className="text-black font-black">{visibleDays[hoveredIdx].nogo}</span>
                                    </div>
                                    <div className="flex items-center gap-2" style={{ color: COLORS.pending }}>
                                        <span>pending</span>
                                        <span className="opacity-50">:</span>
                                        <span className="text-black font-black">{visibleDays[hoveredIdx].pending}</span>
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
                                'text-[10px] sm:text-[11px] font-black tracking-tight text-center flex-1 py-1.5 sm:py-2 rounded-lg cursor-pointer transition-all min-w-0 uppercase',
                                selectedDate === d.date
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                            )}
                        >
                            <div className="truncate">{d.dayName}</div>
                            <div className="text-[9px] font-bold mt-0.5 opacity-70 truncate">{d.shortDate}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════════
                DRILL-DOWN: Trips for selected day — BELOW the chart
               ═════════════════════════════════════════════════════════════════ */}
            {selectedDate && (
                <div className="border-t-2 border-primary-500 bg-slate-50 px-3 sm:px-6 py-4 sm:py-5 rounded-b-2xl">
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
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 px-4 sm:px-6 py-6 sm:py-8 flex flex-col h-full font-sans overflow-hidden w-full">
            <div className="mb-4 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Reasons for Missing "OK"</h2>
                <div className="text-base text-slate-500 mt-1 font-medium select-none">Breakdown of reported risks</div>
            </div>

            {pieTotal > 0 ? (
                <div className="flex flex-col items-center mt-8 gap-6 w-full flex-1">
                    {/* Donut Chart */}
                    <div className="relative flex justify-center items-center shrink-0 w-[160px] h-[160px] mx-auto">
                        <svg width={160} height={160} className="-rotate-90">
                            {/* Background ring */}
                            <circle cx={80} cy={80} r={60} fill="none" stroke="#f1f5f9" strokeWidth={24} />
                            {topReasons.reduce(
                                (acc, [, count], idx) => {
                                    const circumference = 2 * Math.PI * 60
                                    const gap = topReasons.length > 1 ? 4 : 0 // gap in px
                                    const ratio = count / pieTotal
                                    const rawDash = ratio * circumference
                                    const dash = rawDash > gap ? rawDash - gap : 0
                                    
                                    const offset = acc.currentOffset
                                    if (dash > 0) {
                                        acc.elements.push(
                                            <circle
                                                key={idx}
                                                cx={80}
                                                cy={80}
                                                r={60}
                                                fill="none"
                                                stroke={PIE_COLORS[idx % PIE_COLORS.length]}
                                                strokeWidth={24}
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
                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Reasons</span>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="w-full space-y-3.5 mt-2 overflow-y-auto">
                        {topReasons.map(([reason, count], idx) => {
                            const pct = Math.round((count / pieTotal) * 100)
                            return (
                                <div key={reason} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div
                                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                                        />
                                        <span className="font-semibold text-slate-600 truncate mr-2" title={reason}>{reason}</span>
                                    </div>
                                    <span className="font-bold text-slate-800 tabular-nums shrink-0">{pct}%</span>
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
