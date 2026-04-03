/**
 * Offline Sync Queue
 * Reads unsynced records from IndexedDB and pushes them to the API.
 * Call syncAll() when the app comes back online.
 */
import { db } from './db'
import { imSafeApi, paveApi, smartWatchApi, kneeboardApi, decideApi } from './apiClient'
import type {
    CreateImSafeDto, CreatePaveDto, CreateSmartWatchReadingDto,
    CreateKneeboardNoteDto, CreateDecideSessionDto
} from './types'

async function markSynced<T extends { id?: number; isSynced: boolean }>(
    table: import('dexie').Table<T>,
    id: number
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (table as any).update(id, { isSynced: true })
}

async function syncTable<T extends { id?: number; isSynced: boolean }>(
    table: import('dexie').Table<T>,
    push: (record: T) => Promise<unknown>
) {
    const pending = await table.where('isSynced').equals(0).toArray()
    for (const record of pending) {
        try {
            await push(record)
            await markSynced(table, record.id!)
        } catch (err) {
            console.warn('[sync] Failed to sync record', record.id, err)
        }
    }
}

export async function syncAll(): Promise<void> {
    console.info('[sync] Starting offline sync…')

    await syncTable(db.imSafeAssessments, async (r) => {
        const dto: CreateImSafeDto = r.data as unknown as CreateImSafeDto
        await imSafeApi.create({ ...dto, isSynced: true })
    })

    await syncTable(db.paveAssessments, async (r) => {
        const dto: CreatePaveDto = r.data as unknown as CreatePaveDto
        await paveApi.create({ ...dto, isSynced: true })
    })

    await syncTable(db.smartWatchReadings, async (r) => {
        const dto: CreateSmartWatchReadingDto = r.data as unknown as CreateSmartWatchReadingDto
        await smartWatchApi.addReading({ ...dto, isSynced: true })
    })

    await syncTable(db.kneeboardNotes, async (r) => {
        const dto: CreateKneeboardNoteDto = { title: r.title, content: r.content, tags: r.tags, isSynced: true }
        await kneeboardApi.create(dto)
    })

    await syncTable(db.decideSessions, async (r) => {
        const dto: CreateDecideSessionDto = r.data as unknown as CreateDecideSessionDto
        await decideApi.createSession(dto)
    })

    console.info('[sync] Offline sync complete.')
}

/** Register a navigator.onLine listener that auto-syncs on reconnect */
export function registerSyncListener(): () => void {
    const handler = () => { if (navigator.onLine) syncAll() }
    window.addEventListener('online', handler)
    return () => window.removeEventListener('online', handler)
}
