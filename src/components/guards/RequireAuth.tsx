import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../stores/authStore'

interface Props {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

export function RequireAuth({ children, allowedRoles }: Props) {
    const { isAuthenticated, user } = useAuthStore()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles && user && !user.roles.some((r) => allowedRoles.includes(r))) {
        return <Navigate to="/unauthorized" replace />
    }

    return <>{children}</>
}
