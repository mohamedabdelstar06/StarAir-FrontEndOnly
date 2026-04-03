import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAuth } from './components/guards/RequireAuth'
import { LoginPage } from './pages/auth/LoginPage'
import { SetPasswordPage } from './pages/auth/SetPasswordPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { UsersPage } from './pages/admin/UsersPage'
import { UserDetailsPage } from './pages/admin/UserDetailsPage'
import { SmartWatchPage } from './pages/pilot/SmartWatchPage'
import { KneeboardPage } from './pages/pilot/KneeboardPage'
import { ChecklistsPage } from './pages/pilot/ChecklistsPage'
import { AuditLogPage } from './pages/admin/AuditLogPage'
import { PilotDashboardPage } from './pages/pilot/PilotDashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { FlightManagementPage } from './pages/admin/FlightManagementPage'
import { FlightPrepPage } from './pages/pilot/FlightPrepPage'
import { TripDetailPage } from './pages/TripDetailPage'
import { useAuthStore } from './stores/authStore'
import { LandingPage } from './pages/LandingPage'

function DashboardRouter() {
    const { user } = useAuthStore()
    return user?.roles.includes('Admin') ? <DashboardPage /> : <PilotDashboardPage />
}

/**
 * PilotOnly: If a pilot tries to access an admin/neutral route that requires a trip context,
 * redirect them to their dashboard instead.
 */
function AdminOnly({ children }: { children: React.ReactNode }) {
    return <RequireAuth allowedRoles={['Admin']}>{children}</RequireAuth>
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/set-password" element={<SetPasswordPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected shell */}
                <Route path="/unauthorized" element={<RequireAuth><UnauthorizedPage /></RequireAuth>} />

                <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                    {/* Dashboard — role-aware */}
                    <Route path="/dashboard" element={<DashboardRouter />} />

                    {/* Admin-only pages */}
                    <Route path="/users" element={<AdminOnly><UsersPage /></AdminOnly>} />
                    <Route path="/users/:id" element={<AdminOnly><UserDetailsPage /></AdminOnly>} />
                    <Route path="/flights" element={<AdminOnly><FlightManagementPage /></AdminOnly>} />
                    <Route path="/audit" element={<AdminOnly><AuditLogPage /></AdminOnly>} />

                    {/* Shared */}
                    <Route path="/checklists" element={<ChecklistsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Pilot-only: Trip preparation (all assessments happen here) */}
                    <Route path="/flights/:id" element={<RequireAuth allowedRoles={['Pilot']}><FlightPrepPage /></RequireAuth>} />

                    {/* Shared: View completed trip details (admin + pilot) */}
                    <Route path="/trips/:id" element={<TripDetailPage />} />

                    {/* Pilot-only tools */}
                    <Route path="/smartwatch" element={<RequireAuth allowedRoles={['Pilot']}><SmartWatchPage /></RequireAuth>} />
                    <Route path="/kneeboard" element={<RequireAuth allowedRoles={['Pilot']}><KneeboardPage /></RequireAuth>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
