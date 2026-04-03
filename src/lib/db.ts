import Dexie, { Table } from 'dexie'

export interface LocalImSafe {
    id?: number
    remoteId?: number
    pilotId: string
    data: Record<string, unknown>
    assessedAt: string
    isSynced: boolean
}

export interface LocalPave {
    id?: number
    remoteId?: number
    pilotId: string
    data: Record<string, unknown>
    assessedAt: string
    isSynced: boolean
}

export interface LocalSmartWatchReading {
    id?: number
    remoteId?: number
    pilotId: string
    data: Record<string, unknown>
    recordedAt: string
    isSynced: boolean
}

export interface LocalKneeboardNote {
    id?: number
    remoteId?: number
    pilotId: string
    title: string
    content: string
    tags?: string
    updatedAt: string
    isSynced: boolean
}

export interface LocalDecideSession {
    id?: number
    remoteId?: number
    pilotId: string
    data: Record<string, unknown>
    startedAt: string
    isSynced: boolean
}

class StarAirDatabase extends Dexie {
    imSafeAssessments!: Table<LocalImSafe>
    paveAssessments!: Table<LocalPave>
    smartWatchReadings!: Table<LocalSmartWatchReading>
    kneeboardNotes!: Table<LocalKneeboardNote>
    decideSessions!: Table<LocalDecideSession>

    constructor() {
        super('StarAirADM')
        this.version(1).stores({
            imSafeAssessments: '++id, pilotId, isSynced, assessedAt',
            paveAssessments: '++id, pilotId, isSynced, assessedAt',
            smartWatchReadings: '++id, pilotId, isSynced, recordedAt',
            kneeboardNotes: '++id, pilotId, isSynced, updatedAt',
            decideSessions: '++id, pilotId, isSynced, startedAt',
        })
    }
}

export const db = new StarAirDatabase()
