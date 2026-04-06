import api from '../lib/api'

export interface ServerNotification {
    id: number
    message: string
    link?: string
    isRead: boolean
    createdAt: string
}

export const notificationApi = {
    getMyNotifications: () => api.get<ServerNotification[]>('/api/Notification').then((res: any) => res.data),
    markAsRead: (id: number) => api.patch(`/api/Notification/${id}/read`),
    markAllAsRead: () => api.patch('/api/Notification/read-all'),
}
