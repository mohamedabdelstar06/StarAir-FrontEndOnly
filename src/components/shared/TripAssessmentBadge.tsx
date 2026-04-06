import { useEffect, useState } from 'react'
import { imSafeApi, paveApi, decideApi } from '../../lib/apiClient'
import type { FlightTripResponseDto } from '../../lib/types'
import clsx from 'clsx'

export function TripAssessmentBadge({ trip }: { trip: FlightTripResponseDto }) {
    const [status, setStatus] = useState<string | null>(null)
    const [okPercent, setOkPercent] = useState<number | null>(null)

    useEffect(() => {
        const fetchResults = async () => {
            let imResult = 'Go'; let imScore = 0; let imMax = 18; let imDone = false;
            let pResult = 'Go'; let pScore = 0; let pMax = 12; let pDone = false;
            let dDone = false;

            if (trip.imSafeAssessmentId) {
                try {
                    const res = await imSafeApi.getById(trip.imSafeAssessmentId)
                    imResult = res.data.result
                    imScore = res.data.overallRiskScore
                    imDone = true
                } catch { }
            }
            if (trip.paveAssessmentId) {
                try {
                    const res = await paveApi.getById(trip.paveAssessmentId)
                    pResult = res.data.result
                    pScore = res.data.overallRiskScore
                    pDone = true
                } catch { }
            }
            if (trip.decideSessionId) {
                 dDone = true // Decide is completion based, not a risk score here. It's 'Completed' when we have an ID
            }

            if (!imDone && !pDone && !dDone) {
                return // No assessments
            }

            // Determine if overall is NoGo, Caution, or Go
            let overallResult = 'Go'
            if (imResult === 'NoGo' || pResult === 'NoGo') overallResult = 'NoGo'
            else if (imResult === 'Caution' || pResult === 'Caution') overallResult = 'Caution'

            // Determine combined risk percentage. 
            // e.g. Max Risk combined 30. Actual risk combined imScore + pScore.
            let totalRisk = 0; let totalMax = 0;
            if (imDone) { totalRisk += imScore; totalMax += imMax; }
            if (pDone) { totalRisk += pScore; totalMax += pMax; }

            let okPerc = null
            if (totalMax > 0) {
                // Risk is inverted, 0 risk = 100% OK
                okPerc = Math.max(0, Math.round(((totalMax - totalRisk) / totalMax) * 100))
            } else if (dDone) {
                okPerc = 100 // only decide done = OK
            }

            setStatus(overallResult)
            setOkPercent(okPerc)
        }
        
        fetchResults()
    }, [trip])

    if (!trip.imSafeAssessmentId && !trip.paveAssessmentId && !trip.decideSessionId) {
        return <div className="badge bg-slate-100 text-slate-500 font-bold border-slate-200 border">Pending</div>
    }

    if (status) {
        const bg = status === 'Go' ? 'bg-green-100 text-green-700 border-green-300' 
                 : status === 'Caution' ? 'bg-amber-100 text-amber-700 border-amber-300'
                 : 'bg-red-100 text-red-700 border-red-300';
                 
        return (
            <div className="flex items-center gap-2">
                <div className={clsx('badge border font-black', bg)}>
                    {status}
                </div>
                {okPercent !== null && (
                    <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                        {okPercent}% OK
                    </span>
                )}
            </div>
        )
    }

    return <div className="badge bg-slate-100 text-slate-500 font-bold border-slate-200 border">Evaluating...</div>
}
