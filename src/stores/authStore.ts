import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export type UserRole = 'Admin' | 'Pilot'

export interface AuthUser {
    id: string
    email: string
    fullName: string
    roles: UserRole[]
}

interface AuthState {
    user: AuthUser | null
    accessToken: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null

    login: (email: string, password: string) => Promise<void>
    logout: () => void
    setPassword: (email: string, token: string, newPassword: string) => Promise<void>
    checkEmail: (email: string) => Promise<{ exists: boolean; hasPassword: boolean; status: string }>
    clearError: () => void
}

// Decode JWT payload without a library
function decodeJwt(token: string): Record<string, string> | null {
    try {
        const payload = token.split('.')[1]
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        return JSON.parse(decoded)
    } catch {
        return null
    }
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null })
                try {
                    const { data } = await api.post('/api/auth/login', { email, password })

                    localStorage.setItem('accessToken', data.accessToken)
                    localStorage.setItem('refreshToken', data.refreshToken)

                    const payload = decodeJwt(data.accessToken)
                    const rolesClaim = (
                        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
                        payload?.role ?? payload?.Role ?? payload?.roles ?? payload?.Roles
                    )

                    let roleArray: UserRole[] = []
                    if (rolesClaim) {
                        roleArray = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim as UserRole]
                    }

                    const user: AuthUser = {
                        id: payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? payload?.nameid ?? payload?.sub ?? '',
                        email: payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? payload?.email ?? email,
                        fullName: payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? payload?.unique_name ?? payload?.name ?? '',
                        roles: roleArray,
                    }

                    set({ user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true, isLoading: false })
                } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid email or password'
                    set({ error: msg, isLoading: false })
                }
            },

            logout: () => {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
            },

            setPassword: async (email, token, newPassword) => {
                set({ isLoading: true, error: null })
                try {
                    await api.post('/api/auth/set-password', { email, invitationToken: token, newPassword })
                    set({ isLoading: false })
                } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to set password'
                    set({ error: msg, isLoading: false })
                    throw new Error(msg)
                }
            },

            checkEmail: async (email) => {
                try {
                    const { data } = await api.post('/api/auth/check-email', { email })
                    return data
                } catch (error: any) {
                    if (error.response?.status === 404) {
                        return { exists: false, hasPassword: false, status: '' }
                    }
                    throw error
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'star-air-auth',
            partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken, isAuthenticated: state.isAuthenticated }),
        }
    )
)
