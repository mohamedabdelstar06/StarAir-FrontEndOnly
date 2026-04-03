import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="text-center animate-slide-up bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto mb-6">
                    <ShieldOff size={36} />
                </div>
                <h1 className="text-3xl font-black text-black mb-3">ACCESS DENIED</h1>
                <p className="text-slate-900 mb-8 font-bold">You do not have permission to view this page.</p>
                <Link to="/dashboard" className="px-8 py-4 bg-black text-white font-black rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg active:scale-95 inline-block">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    )
}
