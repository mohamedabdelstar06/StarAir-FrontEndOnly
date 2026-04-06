import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Loader2, Radio, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
    const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    if (isAuthenticated) {
        const dest = user?.roles.includes('Admin') ? '/dashboard' : '/dashboard'
        return <Navigate to={dest} replace />
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)
        clearError()
        if (!email.trim()) { setFormError('Email is required'); return }
        if (!password) { setFormError('Password is required'); return }
        await login(email.trim(), password)
        const state = useAuthStore.getState()
        if (state.isAuthenticated) {
            navigate('/dashboard')
        }
    }

    const displayError = formError || error

    return (
        <div className="min-h-dvh flex bg-white">
            {/* Left — Image & Motivation */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-end p-12 lg:p-16">
                <img
                    src="https://images.unsplash.com/photo-1542296332-2e4473faf563?w=1200&auto=format&fit=crop"
                    alt="Aviation Cockpit Dashboard at Night"
                    className="absolute inset-0 w-full h-full object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
                <div className="absolute inset-0 bg-primary-900/20 mix-blend-multiply" />
                <div className="relative z-10 text-white max-w-xl animate-slide-up">
                    <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 backdrop-blur-md mb-6 border border-white/20 shadow-xl">
                        <Radio size={24} className="text-white" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black mb-5 leading-tight tracking-tight">
                        Focus on the flight.<br />
                        <span className="text-primary-400">We'll handle the risk.</span>
                    </h2>
                    <p className="text-base text-slate-300 font-medium leading-relaxed">
                        STAR Air ADM empowers commercial airline pilots with advanced biometric monitoring, dynamic safety checklists, and real-time decision support systems.
                    </p>
                </div>
            </div>

            {/* Right — Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50">
                {/* Mobile logo */}
                <div className="lg:hidden text-center mb-6 animate-slide-up">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 shadow-lg mb-2">
                        <Radio size={22} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">STAR Air ADM</h1>
                </div>

                <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
                        <h2 className="text-xl font-black text-slate-900 mb-1">Welcome back</h2>
                        <p className="text-sm font-medium text-slate-500 mb-6">Sign in to your STAR Air ADM account</p>

                        <form onSubmit={handleLogin} className="space-y-5" noValidate>
                            {/* Email */}
                            <div>
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 block" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setFormError(null); clearError() }}
                                        placeholder="pilot@starair.com"
                                        autoComplete="email"
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-300 text-base"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-800 uppercase tracking-widest" htmlFor="password">
                                        Password
                                    </label>
                                    <Link
                                        to={`/forgot-password?email=${encodeURIComponent(email)}`}
                                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setFormError(null); clearError() }}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        className="w-full pl-10 pr-11 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-primary-500 transition-colors placeholder:text-slate-300 text-base"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {displayError && (
                                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-fade-in">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                                    {displayError}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md active:scale-[0.98] text-base mt-2"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                                Sign In
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">STAR Air ADM v1.0</p>
                        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                            ← Back to Home Page
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
