import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '../../stores/uiStore'
import clsx from 'clsx'

export function AppLayout() {
    const { sidebarOpen, setSidebarOpen } = useUIStore()

    return (
        <div className="flex h-dvh overflow-hidden bg-cockpit-gradient">
            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={clsx(
                    'fixed lg:relative inset-y-0 left-0 z-30 lg:z-auto transition-transform duration-300',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <Sidebar />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {/* Ambient background glow */}
                    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                        <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl" />
                    </div>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
