import api from '../lib/api'
import type {
    DashboardStatsDto,
    UserResponseDto, CreateUserDto, UpdateUserDto,
    AircraftResponseDto, CreateAircraftDto,
    ImSafeResponseDto, CreateImSafeDto,
    PaveResponseDto, CreatePaveDto,
    DecideSessionResponseDto, CreateDecideSessionDto, CreateDecideStepDto, DecideStepResponseDto,
    SmartWatchReadingResponseDto, CreateSmartWatchReadingDto, SmartWatchAnalysisDto,
    KneeboardNoteResponseDto, CreateKneeboardNoteDto,
    ChecklistResponseDto, CreateChecklistDto,
    AuditLogDto,
    CreateFlightTripDto, UpdateFlightTripDto, FlightTripResponseDto, LinkAssessmentDto
} from './types'

// ─── Auth ──────────────────────────────────────────────────────────────
export const authApi = {
    checkEmail: (email: string) => api.post('/api/auth/check-email', { email }),
    login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
    refreshToken: (accessToken: string, refreshToken: string) => api.post('/api/auth/refresh-token', { accessToken, refreshToken }),
    setPassword: (email: string, invitationToken: string, newPassword: string) => api.post('/api/auth/set-password', { email, invitationToken, newPassword }),
    forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
    resetPassword: (email: string, token: string, newPassword: string) => api.post('/api/auth/reset-password', { email, token, newPassword }),
}

// ─── Dashboard ──────────────────────────────────────────────────────────
export const dashboardApi = {
    getStats: () => api.get<DashboardStatsDto>('/api/dashboard'),
}

// ─── Audit ────────────────────────────────────────────────────────────
export const auditApi = {
    getAll: () => api.get<AuditLogDto[]>('/api/auditlog'),
}

// ─── Users ──────────────────────────────────────────────────────────────
export const usersApi = {
    getAll: () => api.get<UserResponseDto[]>('/api/user'),
    getById: (id: string) => api.get<UserResponseDto>(`/api/user/${id}`),
    create: (dto: CreateUserDto) => api.post<UserResponseDto>('/api/user', dto),
    update: (id: string, dto: UpdateUserDto) => api.put<UserResponseDto>(`/api/user/${id}`, dto),
    toggleStatus: (id: string) => api.patch(`/api/user/${id}/toggle-status`),
    delete: (id: string) => api.delete(`/api/user/${id}`),
}

// ─── Aircraft ──────────────────────────────────────────────────────────
export const aircraftApi = {
    getAll: () => api.get<AircraftResponseDto[]>('/api/aircraft'),
    getById: (id: number) => api.get<AircraftResponseDto>(`/api/aircraft/${id}`),
    create: (dto: CreateAircraftDto) => api.post<AircraftResponseDto>('/api/aircraft', dto),
    update: (id: number, dto: CreateAircraftDto) => api.put<AircraftResponseDto>(`/api/aircraft/${id}`, dto),
    toggleStatus: (id: number) => api.patch(`/api/aircraft/${id}/toggle-status`),
    delete: (id: number) => api.delete(`/api/aircraft/${id}`),
}

// ─── IMSAFE ──────────────────────────────────────────────────────────
export const imSafeApi = {
    create: (dto: CreateImSafeDto) => api.post<ImSafeResponseDto>('/api/imsafe', dto),
    getMy: () => api.get<ImSafeResponseDto[]>('/api/imsafe/my'),
    getAll: () => api.get<ImSafeResponseDto[]>('/api/imsafe'),
    getByPilot: (id: string) => api.get<ImSafeResponseDto[]>(`/api/imsafe/pilot/${id}`),
    getById: (id: number) => api.get<ImSafeResponseDto>(`/api/imsafe/${id}`),
    delete: (id: number) => api.delete(`/api/imsafe/${id}`),
}

// ─── PAVE ──────────────────────────────────────────────────────────────
export const paveApi = {
    create: (dto: CreatePaveDto) => api.post<PaveResponseDto>('/api/pave', dto),
    getMy: () => api.get<PaveResponseDto[]>('/api/pave/my'),
    getAll: () => api.get<PaveResponseDto[]>('/api/pave'),
    getByPilot: (id: string) => api.get<PaveResponseDto[]>(`/api/pave/pilot/${id}`),
    getById: (id: number) => api.get<PaveResponseDto>(`/api/pave/${id}`),
}

// ─── DECIDE ──────────────────────────────────────────────────────────
export const decideApi = {
    createSession: (dto: CreateDecideSessionDto) => api.post<DecideSessionResponseDto>('/api/decide/sessions', dto),
    getMySessions: () => api.get<DecideSessionResponseDto[]>('/api/decide/sessions/my'),
    getAllSessions: () => api.get<DecideSessionResponseDto[]>('/api/decide/sessions'),
    getSession: (id: number) => api.get<DecideSessionResponseDto>(`/api/decide/sessions/${id}`),
    addStep: (sessionId: number, dto: CreateDecideStepDto) => api.post<DecideStepResponseDto>(`/api/decide/sessions/${sessionId}/steps`, dto),
    completeSession: (id: number) => api.patch(`/api/decide/sessions/${id}/complete`),
}

export const smartWatchApi = {
    addReading: (dto: CreateSmartWatchReadingDto) => api.post<SmartWatchReadingResponseDto>('/api/smartwatch/readings', dto),
    getReadings: () => api.get<SmartWatchReadingResponseDto[]>('/api/smartwatch/readings'),
    getReadingById: (id: number) => api.get<SmartWatchReadingResponseDto>(`/api/smartwatch/readings/${id}`),
    getAnalysis: () => api.get<SmartWatchAnalysisDto>('/api/smartwatch/analysis'),
}

// ─── Kneeboard ──────────────────────────────────────────────────────
export const kneeboardApi = {
    create: (dto: CreateKneeboardNoteDto) => api.post<KneeboardNoteResponseDto>('/api/kneeboard', dto),
    getAll: () => api.get<KneeboardNoteResponseDto[]>('/api/kneeboard'),
    update: (id: number, dto: CreateKneeboardNoteDto) => api.put<KneeboardNoteResponseDto>(`/api/kneeboard/${id}`, dto),
    delete: (id: number) => api.delete(`/api/kneeboard/${id}`),
}

// ─── Profile ──────────────────────────────────────────────────────────
export const profileApi = {
    getMe: () => api.get<UserResponseDto>('/api/profile/me'),
    updateMe: (formData: FormData) => api.patch<UserResponseDto>('/api/profile/me', formData),
    uploadPicture: (formData: FormData) => api.post<UserResponseDto>('/api/profile/me/picture', formData),
}

// ─── Checklists ──────────────────────────────────────────────────────
export const checklistApi = {
    getAll: () => api.get<ChecklistResponseDto[]>('/api/checklist'),
    getById: (id: number) => api.get<ChecklistResponseDto>(`/api/checklist/${id}`),
    create: (dto: CreateChecklistDto) => api.post<ChecklistResponseDto>('/api/checklist', dto),
    delete: (id: number) => api.delete(`/api/checklist/${id}`),
}

// ─── Flights ──────────────────────────────────────────────────────────
export const flightApi = {
    create: (dto: CreateFlightTripDto) => api.post<FlightTripResponseDto>('/api/flight', dto),
    update: (id: number, dto: UpdateFlightTripDto) => api.put<FlightTripResponseDto>(`/api/flight/${id}`, dto),
    getMy: () => api.get<FlightTripResponseDto[]>('/api/flight/my'),
    getAll: () => api.get<FlightTripResponseDto[]>('/api/flight'),
    link: (id: number, dto: LinkAssessmentDto) => api.patch<FlightTripResponseDto>(`/api/flight/${id}/link`, dto),
    complete: (id: number) => api.patch<FlightTripResponseDto>(`/api/flight/${id}/complete`),
    delete: (id: number) => api.delete(`/api/flight/${id}`),
}
