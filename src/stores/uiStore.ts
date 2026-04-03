import { create } from 'zustand'

interface UIState {
    sidebarOpen: boolean
    sidebarCollapsed: boolean
    darkMode: boolean
    toggleSidebar: () => void
    setSidebarOpen: (open: boolean) => void
    toggleCollapse: () => void
    toggleDarkMode: () => void
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: false,
    sidebarCollapsed: false,
    darkMode: localStorage.getItem('theme') === 'dark',

    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    toggleDarkMode: () => set((s) => {
        const newMode = !s.darkMode
        localStorage.setItem('theme', newMode ? 'dark' : 'light')
        if (newMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        return { darkMode: newMode }
    }),
}))
