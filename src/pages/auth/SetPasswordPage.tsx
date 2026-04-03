import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Loader2, Radio, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: 'At least 8 characters', ok: password.length >= 8 },
        { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
        { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
        { label: 'Number', ok: /\d/.test(password) },
    ]
    const score = checks.filter((c) => c.ok).length
    const colors = ['bg-red-500', 'bg-amber-500', 'bg-amber-400', 'bg-green-400', 'bg-green-500']

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-cockpit-700'}`} />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-1">
                {checks.map((c) => (
                    <div key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? 'text-green-400' : 'text-slate-500'}`}>
                        <CheckCircle size={10} className={c.ok ? 'text-green-400' : 'text-slate-600'} />
                        {c.label}
                    </div>
                ))}
            </div>
        </div>
    )
}

export function SetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { setPassword, isLoading, error, clearError } = useAuthStore()

    const emailParam = searchParams.get('email') ?? ''
    const tokenParam = searchParams.get('token') ?? ''

    const [password, setPass] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [done, setDone] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    useEffect(() => { clearError() }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)
        if (password.length < 8) { setLocalError('Password must be at least 8 characters'); return }
        if (password !== confirm) { setLocalError('Passwords do not match'); return }
        if (!emailParam) { setLocalError('Invalid or missing email'); return }

        try {
            await setPassword(emailParam, tokenParam, password)
            setDone(true)
        } catch (err: unknown) {
            setLocalError((err as Error).message)
        }
    }

    if (done) {
        return (
            <div className="min-h-dvh bg-cockpit-gradient flex items-center justify-center p-4">
                <div className="w-full max-w-md glass-card p-10 text-center animate-slide-up">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mb-2">Password Set Successfully!</h2>
                    <p className="text-sm text-slate-400 mb-6">Your account is now active. You can sign in with your new password.</p>
                    <Link to="/login" className="btn-primary inline-flex">Go to Login</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-dvh bg-cockpit-gradient flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary-600/8 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,1) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="w-full max-w-md animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 shadow-glow-lg mb-4">
                        <Radio size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-100">Set Your Password</h1>
                    <p className="text-sm text-slate-500 mt-1">Activate your STAR Air ADM account</p>
                </div>

                <div className="glass-card p-8">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-900/40 border border-primary-700/30 mb-6">
                        <KeyRound size={14} className="text-primary-400 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-primary-300">Account Activation</p>
                            <p className="text-xs text-slate-500">{emailParam}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="new-pass">New Password</label>
                            <div className="relative">
                                <input
                                    id="new-pass"
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPass(e.target.value)}
                                    placeholder="••••••••"
                                    className="input pr-10"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {password && <PasswordStrength password={password} />}
                        </div>

                        <div>
                            <label className="label" htmlFor="confirm-pass">Confirm Password</label>
                            <div className="relative">
                                <input
                                    id="confirm-pass"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className="input pr-10"
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {confirm && password !== confirm && (
                                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                            )}
                        </div>

                        {(localError || error) && (
                            <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 px-3 py-2 rounded-lg">
                                {localError ?? error}
                            </p>
                        )}

                        <button type="submit" disabled={isLoading} className="btn-primary w-full">
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            Activate Account
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
