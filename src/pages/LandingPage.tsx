import { Link, useNavigate } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { useEffect } from 'react'

export function LandingPage() {
    const { darkMode, toggleDarkMode } = useUIStore()
    const { isAuthenticated, user } = useAuthStore()
    const navigate = useNavigate()

    // Determine where an already-authenticated user should land
    const getDashboardPath = () => '/dashboard'

    const handleLoginClick = () => {
        if (isAuthenticated) navigate(getDashboardPath())
        else navigate('/login')
    }

    // Initialize dark mode on mount based on store
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
    }, [darkMode])

    return (
        <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark transition-none overflow-x-hidden">
            {/* Navigation */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 top-0 z-50 sticky transition-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-black text-primary-600 dark:text-primary-400">STAR</span>
                        <span className="text-xl sm:text-2xl font-light text-slate-800 dark:text-slate-100">Air</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-6">
                        <button
                            onClick={toggleDarkMode}
                            className="text-slate-500 hover:text-primary-600 dark:text-slate-400 font-bold p-2 hidden sm:block"
                            title="Toggle Dark Mode"
                            aria-label="Toggle Dark Mode"
                        >
                            {darkMode ? '☀️ Light' : '🌙 Dark'}
                        </button>
                        <button
                            onClick={handleLoginClick}
                            className="btn-primary text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 whitespace-nowrap"
                            id="landing-login-btn"
                        >
                            {isAuthenticated ? '🚀 Go to Dashboard' : 'Member Login'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="py-12 sm:py-24 lg:py-32 overflow-hidden bg-primary-50 dark:bg-slate-900 border-b border-primary-100 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 sm:gap-16 items-center">
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6 leading-tight tracking-tight">
                                Aviation Safety, <br className="hidden sm:block" />
                                <span className="text-primary-600 dark:text-primary-400">Elevated.</span>
                            </h1>
                            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 mb-4 sm:mb-8 font-medium leading-relaxed max-w-lg">
                                STAR Air ADM empowers commercial airline pilots with advanced risk assessment, biometric monitoring, and comprehensive safety toolkits.
                            </p>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
                                <Link to="/about" className="btn-primary text-sm sm:text-base lg:text-lg px-5 sm:px-8 text-center">
                                    🚀 Our Business
                                </Link>
                                <button onClick={handleLoginClick} className="btn-secondary text-sm sm:text-base lg:text-lg px-5 sm:px-8 text-center">
                                    {isAuthenticated ? '📊 My Dashboard' : "🌟 Let's Fly"}
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent-trivagoOrange translate-x-4 translate-y-4 rounded-3xl opacity-20 dark:opacity-40"></div>
                            <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop"
                                alt="Commercial Pilot"
                                className="relative rounded-2xl object-cover w-full h-[200px] sm:h-[320px] lg:h-[400px] shadow-sm border-4 border-white dark:border-slate-800" />
                        </div>
                    </div>
                </section>

                <section className="py-12 sm:py-24 bg-white dark:bg-surface-dark">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-20">
                            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3 sm:mb-5 tracking-tight">Why STAR Air?</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                We believe in uncompromised safety and peak performance. Our platform is designed by aviation experts for pilots who demand excellence in every flight.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                            <div className="glass-card p-5 sm:p-8 flex flex-col items-center text-center">
                                <div className="text-3xl sm:text-5xl mb-3 sm:mb-5">🎯</div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">Precision & Skills</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Enhance your decision-making with the DECIDE model and comprehensive pre-flight assessments.</p>
                            </div>
                            <div className="glass-card p-5 sm:p-8 flex flex-col items-center text-center">
                                <div className="text-3xl sm:text-5xl mb-3 sm:mb-5">🛡️</div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">Uncompromised Safety</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Integrated IMSAFE and PAVE checklists ensure you and your aircraft are always flight-ready.</p>
                            </div>
                            <div className="glass-card p-5 sm:p-8 flex flex-col items-center text-center sm:col-span-2 md:col-span-1">
                                <div className="text-3xl sm:text-5xl mb-3 sm:mb-5">⌚</div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">Biometric Monitoring</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Connect your smartwatch for real-time fitness analysis to maintain peak physiological performance.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-12 sm:py-24 bg-primary-900 text-center">
                    <div className="max-w-4xl mx-auto px-4">
                        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white mb-4 sm:mb-6 tracking-tight">Ready to Take Off?</h2>
                        <button
                            onClick={handleLoginClick}
                            className="btn-primary bg-white text-primary-900 hover:bg-slate-100 text-sm sm:text-lg px-6 sm:px-10 py-3 sm:py-4 shadow-none border border-white"
                        >
                            {isAuthenticated ? '✈️ Back to Dashboard' : '✨ Join the Crew ✨'}
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 text-slate-400 py-10 sm:py-16 transition-none">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-black text-white">STAR</span>
                            <span className="text-2xl font-light text-slate-300">Air</span>
                        </div>
                        <p className="font-medium max-w-sm">Empowering pilots with next-generation safety and decision-making tools.</p>
                    </div>

                    <div className="flex gap-6">
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white text-2xl font-bold">X</a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white text-2xl font-bold">In</a>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white text-2xl font-bold">Fb</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
