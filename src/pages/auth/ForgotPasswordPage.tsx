import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, Loader2, Radio, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '../../lib/api'

export function ForgotPasswordPage() {
    const [searchParams] = useSearchParams()
    const [email, setEmail] = useState(searchParams.get('email') ?? '')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await api.post('/api/auth/forgot-password', { email })
            setSent(true)
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh bg-cockpit-gradient flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-primary-600/8 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="w-full max-w-md animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-glow-lg mb-4">
                        <Radio size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">STAR Air ADM</h1>
                    <p className="text-sm text-slate-500 mt-1">Password Recovery</p>
                </div>

                <div className="glass-card p-8">
                    {sent ? (
                        <div className="text-center animate-fade-in">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={24} className="text-green-400" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-100 mb-2">Check your email</h2>
                            <p className="text-sm text-slate-400 mb-4">If <span className="text-primary-300">{email}</span> is registered and active, a reset link has been sent.</p>
                            <Link to="/login" className="btn-secondary inline-flex">Back to Login</Link>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 mb-4">
                                <ArrowLeft size={12} /> Back to Login
                            </Link>
                            <h2 className="text-lg font-semibold text-slate-100 mb-1">Reset Password</h2>
                            <p className="text-sm text-slate-400 mb-6">Enter your account email and we'll send you a reset link.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="label" htmlFor="fp-email">Email Address</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            id="fp-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="pilot@starair.com"
                                            className="input pl-9"
                                            required
                                        />
                                    </div>
                                    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
                                </div>

                                <button type="submit" disabled={loading} className="btn-primary w-full">
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    Send Reset Link
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
