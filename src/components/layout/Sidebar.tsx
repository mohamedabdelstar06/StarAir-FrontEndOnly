import { NavLink, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Users, Plane,
    BookOpen, ListChecks, Watch, Database, LogOut, ChevronLeft, ChevronRight,
    Bird
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import clsx from 'clsx'

interface NavGroup {
    label: string
    items: { to: string; icon: React.ReactNode; label: string; roles?: string[] }[]
}

const navigation: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
    },
    {
        label: 'Management',
        items: [
            { to: '/users', icon: <Users size={18} />, label: 'Users', roles: ['Admin'] },
            { to: '/flights', icon: <Plane size={18} />, label: 'Flight Missions', roles: ['Admin'] },
            { to: '/checklists', icon: <ListChecks size={18} />, label: 'Checklists' },
            { to: '/audit', icon: <Database size={18} />, label: 'Audit Log', roles: ['Admin'] },
        ],
    },
    {
        label: 'Pilot Tools',
        items: [
            { to: '/smartwatch', icon: <Watch size={18} />, label: 'SmartWatch', roles: ['Pilot'] },
            { to: '/kneeboard', icon: <BookOpen size={18} />, label: 'Kneeboard', roles: ['Pilot'] },
        ],
    },
]

export function Sidebar() {
    const { user, logout } = useAuthStore()
    const { sidebarCollapsed, toggleCollapse, setSidebarOpen } = useUIStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <aside
            className={clsx(
                'flex flex-col h-full bg-slate-50 border-r border-slate-200 transition-all duration-300',
                sidebarCollapsed ? 'w-[68px]' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200">
                <button
                    onClick={toggleCollapse}
                    className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-600 hover:bg-primary-700 flex items-center justify-center shadow-glow-sm transition-colors"
                >
                    <Bird size={20} className="text-white" />
                </button>
                {!sidebarCollapsed && (
                    <div className="animate-fade-in flex-1 cursor-pointer" onClick={toggleCollapse}>
                        <div className="text-sm font-bold text-slate-900 leading-tight">EgyptAir</div>
                        <div className="text-xs text-slate-600">STAR ADM</div>
                    </div>
                )}
                <button
                    onClick={toggleCollapse}
                    className="ml-auto btn-icon hidden lg:flex"
                    aria-label="Toggle sidebar"
                >
                    {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
                {navigation.map((group) => {
                    const filtered = group.items.filter(
                        (item) => !item.roles || item.roles.some((r) => user?.roles.includes(r as 'Admin' | 'Pilot'))
                    )
                    if (!filtered.length) return null

                    return (
                        <div key={group.label}>
                            {!sidebarCollapsed && (
                                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {filtered.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setSidebarOpen(false)}
                                        className={({ isActive }) =>
                                            clsx(isActive ? 'nav-item-active' : 'nav-item', sidebarCollapsed && 'justify-center')
                                        }
                                        title={sidebarCollapsed ? item.label : undefined}
                                    >
                                        <span className="flex-shrink-0">{item.icon}</span>
                                        {!sidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </nav>

            {/* User info + logout */}
            <div className="border-t border-slate-200 px-2 py-3">
                {!sidebarCollapsed && user && (
                    <div className="px-3 py-2 mb-2 rounded-xl bg-white border border-slate-200 shadow-sm animate-fade-in flex items-center gap-2">
                        <img src={`https://ui-avatars.com/api/?name=${user.fullName.replace(' ', '+')}&background=random&color=fff`} className="w-8 h-8 rounded-full shadow-sm" alt="Pilot avatar" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{user.fullName}</p>
                            <p className="text-[10px] text-slate-600">{user.roles[0]}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={clsx('nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20', sidebarCollapsed && 'justify-center')}
                    title={sidebarCollapsed ? 'Logout' : undefined}
                >
                    <LogOut size={18} />
                    {!sidebarCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    )
}
