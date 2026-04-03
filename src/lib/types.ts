     // ─── Shared ──────────────────────────────────────────────────────────
export type RiskLevel = 'None' | 'Low' | 'Medium' | 'High'
export type AssessmentResult = 'Go' | 'Caution' | 'NoGo'
export type UserStatus = 'Active' | 'Pending' | 'Inactive'
export type AircraftStatus = 'Airworthy' | 'Grounded' | 'UnderMaintenance'
export type SessionStatus = 'InProgress' | 'Completed' | 'Abandoned'
export type FlightStatus = 'Pending' | 'Cleared' | 'Completed' | 'Cancelled'

// ─── Audit Log ────────────────────────────────────────────────────────
export interface AuditLogDto {
    id: number
    userId?: string
    userName?: string
    action: string
    entityType?: string
    entityId?: string
    oldValues?: string
    newValues?: string
    ipAddress?: string
    timestamp: string
}

// ─── Dashboard ──────────────────────────────────────────────────────
export interface DashboardStatsDto {
    totalPilots: number
    activePilots: number
    pendingPilots: number
    totalAircraft: number
    airworthyAircraft: number
    totalImSafeAssessments: number
    totalPaveAssessments: number
    goCount: number
    cautionCount: number
    noGoCount: number
    recentAssessments: RecentAssessmentDto[]
}

export interface RecentAssessmentDto {
    type: string
    pilotName: string
    result: AssessmentResult
    riskScore: number
    assessedAt: string
}

// ─── Users ──────────────────────────────────────────────────────────
export interface UserResponseDto {
    id: string
    email: string
    fullName: string
    roles: string[]
    licenseNumber?: string
    medicalClass?: string
    rank?: string
    totalFlightHours: number
    profileImageUrl?: string
    status: UserStatus
    createdAt: string
}

export interface CreateUserDto {
    email: string
    fullName: string
    role: string
    licenseNumber?: string
    medicalClass?: string
    rank?: string
}

export interface UpdateUserDto {
    fullName: string
    licenseNumber?: string
    medicalClass?: string
    rank?: string
    totalFlightHours: number
    profileImageUrl?: string
}

// ─── Aircraft ──────────────────────────────────────────────────────
export interface AircraftResponseDto {
    id: number
    registrationNumber: string
    type: string
    model: string
    yearOfManufacture?: number
    lastMaintenanceDate?: string
    nextMaintenanceDate?: string
    status: AircraftStatus
}

export interface CreateAircraftDto {
    registrationNumber: string
    type: string
    model: string
    yearOfManufacture?: number
    lastMaintenanceDate?: string
    nextMaintenanceDate?: string
}

// ─── IMSAFE ──────────────────────────────────────────────────────────
export interface CreateImSafeDto {
    illnessLevel: number
    illnessNotes?: string
    medicationLevel: number
    medicationNotes?: string
    stressLevel: number
    stressNotes?: string
    alcoholLevel: number
    hoursSinceLastDrink?: number
    fatigueLevel: number
    hoursSlept?: number
    emotionLevel: number
    emotionNotes?: string
    dataSource: number
    isSynced: boolean
}

export interface ImSafeResponseDto {
    id: number
    pilotId: string
    pilotName: string
    illnessLevel: RiskLevel
    illnessNotes?: string
    medicationLevel: RiskLevel
    medicationNotes?: string
    stressLevel: RiskLevel
    stressNotes?: string
    alcoholLevel: RiskLevel
    hoursSinceLastDrink?: number
    fatigueLevel: RiskLevel
    hoursSlept?: number
    emotionLevel: RiskLevel
    emotionNotes?: string
    dataSource: string
    overallRiskScore: number
    result: AssessmentResult
    assessedAt: string
    isSynced: boolean
}

// ─── PAVE ──────────────────────────────────────────────────────────
export interface CreatePaveDto {
    aircraftId?: number
    pilotReadiness?: string
    pilotRiskLevel: number
    aircraftCondition?: string
    aircraftRiskLevel: number
    weatherSummary?: string
    metarData?: string
    tafData?: string
    environmentRiskLevel: number
    externalPressures?: string
    externalRiskLevel: number
    isSynced: boolean
}

export interface PaveResponseDto {
    id: number
    pilotId: string
    pilotName: string
    aircraftId?: number
    aircraftRegistration?: string
    pilotReadiness?: string
    pilotRiskLevel: RiskLevel
    aircraftCondition?: string
    aircraftRiskLevel: RiskLevel
    weatherSummary?: string
    metarData?: string
    tafData?: string
    environmentRiskLevel: RiskLevel
    externalPressures?: string
    externalRiskLevel: RiskLevel
    overallRiskScore: number
    result: AssessmentResult
    assessedAt: string
    isSynced: boolean
}

// ─── DECIDE ──────────────────────────────────────────────────────────
export interface CreateDecideSessionDto {
    scenario?: string
}

export interface CreateDecideStepDto {
    stepType: number
    input?: string
    notes?: string
    selectedAction?: string
}

export interface DecideStepResponseDto {
    id: number
    sessionId: number
    stepType: string
    stepOrder: number
    input?: string
    notes?: string
    suggestedActions?: string
    selectedAction?: string
    completedAt?: string
}

export interface DecideSessionResponseDto {
    id: number
    pilotId: string
    pilotName: string
    scenario?: string
    status: SessionStatus
    finalRiskScore?: number
    startedAt: string
    completedAt?: string
    isSynced: boolean
    steps: DecideStepResponseDto[]
}

// ─── SmartWatch ──────────────────────────────────────────────────────
export interface CreateSmartWatchReadingDto {
    flightTripId?: number
    heartRate?: number
    heartRateVariability?: number
    sleepHours?: number
    sleepQuality?: number
    stressIndex?: number
    spO2?: number
    skinTemperature?: number
    steps?: number
    deviceName?: string
    rawData?: string
    recordedAt?: string
    isSynced: boolean
    isManualEntry?: boolean
}

export interface SmartWatchReadingResponseDto {
    id: number
    pilotId: string
    flightTripId?: number
    heartRate?: number
    heartRateVariability?: number
    sleepHours?: number
    sleepQuality?: number
    stressIndex?: number
    spO2?: number
    skinTemperature?: number
    steps?: number
    deviceName?: string
    recordedAt: string
    isSynced: boolean
    isManualEntry?: boolean
}

export interface SmartWatchAnalysisDto {
    latestHeartRate?: number
    averageSleepHours?: number
    averageStressIndex?: number
    averageSpO2?: number
    fitnessStatus: 'Fit' | 'Caution' | 'Not Fit'
    recommendation: string
    riskScore: number
}

// ─── Kneeboard ──────────────────────────────────────────────────────
export interface CreateKneeboardNoteDto {
    title: string
    content: string
    tags?: string
    isSynced: boolean
}

export interface KneeboardNoteResponseDto {
    id: number
    pilotId: string
    title: string
    content: string
    tags?: string
    isSynced: boolean
    createdAt: string
    updatedAt?: string
}

// ─── Checklist ──────────────────────────────────────────────────────
export interface CreateChecklistDto {
    title: string
    category: string
    items: { description: string; sortOrder: number; isCritical: boolean }[]
}

export interface ChecklistItemResponseDto {
    id: number
    description: string
    sortOrder: number
    isCritical: boolean
}

export interface ChecklistResponseDto {
    id: number
    title: string
    category: string
    createdBy?: string
    createdAt: string
    items: ChecklistItemResponseDto[]
}

// ─── Flights ─────────────────────────────────────────────────────────
export interface CreateFlightTripDto {
    pilotId: string
    flightCategory: string
    aircraftType: string
    departure: string
    arrival: string
    departureTime: string
    flightNumber?: string
}

export interface UpdateFlightTripDto {
    flightCategory?: string
    aircraftType?: string
    departure?: string
    arrival?: string
    departureTime?: string
    flightNumber?: string
    status?: string
}

export interface FlightTripResponseDto {
    id: number
    pilotId: string
    pilotName: string
    flightCategory: string
    aircraftType: string
    departure: string
    arrival: string
    departureTime: string
    flightNumber?: string
    status: FlightStatus
    imSafeAssessmentId?: number
    paveAssessmentId?: number
    decideSessionId?: number
    smartWatchReadingId?: number
    createdAt: string
}

export interface LinkAssessmentDto {
    imSafeAssessmentId?: number
    paveAssessmentId?: number
    decideSessionId?: number
    smartWatchReadingId?: number
}
