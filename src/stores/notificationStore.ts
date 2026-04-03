import { create } from 'zustand'

export interface AppNotification {
    id: string
    type: 'trip_assigned' | 'assessment_completed' | 'trip_cleared' | 'info'
    title: string
    message: string
    timestamp: string
    read: boolean
    /** Links to a specific flight or pilot */
    flightId?: number
    pilotId?: string
    pilotName?: string
    /** Assessment performance data for admin notifications */
    assessmentType?: 'IMSAFE' | 'PAVE' | 'DECIDE'
    assessmentResult?: string
    riskScore?: number
}

interface NotificationState {
    notifications: AppNotification[]
    unreadCount: number
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
    markAllRead: () => void
    markRead: (id: string) => void
    clearAll: () => void
}

let idCounter = 0

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (n) => {
        const notification: AppNotification = {
            ...n,
            id: `notif-${Date.now()}-${idCounter++}`,
            timestamp: new Date().toISOString(),
            read: false,
        }
        set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 50),
            unreadCount: state.unreadCount + 1,
        }))
    },

    markAllRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        })),

    markRead: (id) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.read) ? 1 : 0)),
        })),

    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))
