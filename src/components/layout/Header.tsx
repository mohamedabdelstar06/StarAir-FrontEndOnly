import { Bell, Menu, Wifi, WifiOff, X } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useNotificationStore, type AppNotification } from '../../stores/notificationStore'
import { useEffect, useState, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { notificationApi, ServerNotification } from '../../api/notificationApi'

const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/users': 'User Management',
    '/aircraft': 'Aircraft Fleet',
    '/imsafe': 'IMSAFE Assessment',
    '/pave': 'PAVE Assessment',
    '/decide': 'DECIDE Model',
    '/smartwatch': 'SmartWatch',
    '/kneeboard': 'Kneeboard',
    '/checklists': 'Checklists',
    '/flights': 'Trip Assignments',
    '/audit': 'Audit Log',
    '/profile': 'My Profile',
}

function NotificationItem({ n, onClose }: { n: AppNotification | ServerNotification; onClose: () => void }) {
    const markReadLocal = useNotificationStore(s => s.markRead)
    const navigate = useNavigate()

    const isServer = 'isRead' in n;
    const isRead = isServer ? (n as ServerNotification).isRead : (n as AppNotification).read;
    const title = isServer ? 'System Notification' : (n as AppNotification).title;
    const message = (n as AppNotification | ServerNotification).message;
    const timestamp = isServer ? (n as ServerNotification).createdAt : (n as AppNotification).timestamp;
    
    const timeAgo = getTimeAgo(timestamp)

    const handleClick = async () => {
        if (isServer) {
            await notificationApi.markAsRead((n as ServerNotification).id);
            if ((n as ServerNotification).link) {
                const linkUrl = new URL((n as ServerNotification).link as string);
                navigate(linkUrl.pathname);
            }
        } else {
            markReadLocal((n as AppNotification).id)
        }
        onClose();
        // Fire custom event to trigger refresh
        window.dispatchEvent(new Event('refreshNotifications'));
    };

    return (
        <div
            className={clsx(
                'px-4 py-3 border-b border-slate-200 hover:bg-primary-50 transition-colors cursor-pointer',
                !isRead && 'bg-blue-50'
            )}
            onClick={handleClick}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-black">{title}</div>
                    <div className="text-sm text-slate-600 mt-0.5 line-clamp-2">{message}</div>
                    {!isServer && (n as AppNotification).assessmentType && (n as AppNotification).assessmentResult && (
                        <div className="mt-1 flex items-center gap-2">
                            <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full',
                                n.assessmentResult === 'Go' ? 'bg-green-100 text-green-700' :
                                    n.assessmentResult === 'Caution' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            )}>
                                {n.assessmentResult}
                            </span>
                            {(n as AppNotification).riskScore !== undefined && (
                                <span className="text-xs text-slate-500 font-mono">Score: {(n as AppNotification).riskScore}</span>
                            )}
                        </div>
                    )}
                </div>
                {!isRead && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1" />}
            </div>
            <div className="text-xs text-slate-400 mt-1">{timeAgo}</div>
        </div>
    )
}

function getTimeAgo(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export function Header() {
    const { toggleSidebar } = useUIStore()
    const { user } = useAuthStore()
    const { notifications, unreadCount, markAllRead } = useNotificationStore()
    const location = useLocation()
    const [online, setOnline] = useState(navigator.onLine)
    const [showNotif, setShowNotif] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)
    const [serverNotifs, setServerNotifs] = useState<ServerNotification[]>([])

    const fetchServerNotifications = async () => {
        try {
            if (user) {
                const notifs = await notificationApi.getMyNotifications();
                setServerNotifs(notifs);
            }
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        }
    };

    useEffect(() => {
        fetchServerNotifications();
        const interval = setInterval(fetchServerNotifications, 30000); // 30s poll
        window.addEventListener('refreshNotifications', fetchServerNotifications);
        return () => {
            clearInterval(interval);
            window.removeEventListener('refreshNotifications', fetchServerNotifications);
        };
    }, [user]);

    const totalUnread = unreadCount + serverNotifs.filter(n => !n.isRead).length;
    const allNotifs = [...serverNotifs, ...notifications].sort((a, b) => {
        const tA = 'createdAt' in a ? new Date(a.createdAt).getTime() : new Date(a.timestamp).getTime();
        const tB = 'createdAt' in b ? new Date(b.createdAt).getTime() : new Date(b.timestamp).getTime();
        return tB - tA;
    });

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            markAllRead();
            await fetchServerNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const on = () => setOnline(true)
        const off = () => setOnline(false)
        window.addEventListener('online', on)
        window.addEventListener('offline', off)
        return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
    }, [])

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const title = routeTitles[location.pathname] ?? 'STAR Air ADM'
    const now = new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })

    return (
        <header className="flex items-center gap-3 px-3 lg:px-5 py-2.5 bg-white border-b border-slate-200">
            {/* Mobile menu toggle */}
            <button onClick={toggleSidebar} className="btn-icon lg:hidden">
                <Menu size={20} />
            </button>

            {/* Page title */}
            <div>
                <h1 className="text-base font-bold text-black">{title}</h1>
                <p className="text-xs text-slate-600 font-mono hidden sm:block">{now}</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
                {/* Online/Offline indicator */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
                </div>

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotif(!showNotif)}
                        className="btn-icon relative"
                    >
                        <Bell size={18} className="text-black" />
                        {totalUnread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                                {totalUnread > 9 ? '9+' : totalUnread}
                            </span>
                        )}
                    </button>

                    {showNotif && (
                        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-[92vw] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                                <h3 className="text-base font-bold text-black">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {totalUnread > 0 && (
                                        <button onClick={handleMarkAllRead} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                                            Mark all read
                                        </button>
                                    )}
                                    <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-black">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                        {allNotifs.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-slate-500 text-sm">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            allNotifs.map(n => (
                                                <NotificationItem key={'id' in n && 'createdAt' in n ? `server-${n.id}` : n.id} n={n} onClose={() => setShowNotif(false)} />
                                            ))
                                        )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <Link to="/profile" className="w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-700 transition-colors border border-primary-500/40 flex items-center justify-center text-xs font-bold text-white cursor-pointer" title="Go to Profile">
                    {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
                </Link>
            </div>
        </header>
    )
}
