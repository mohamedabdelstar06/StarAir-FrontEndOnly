import { useEffect, useState, useRef } from 'react'
import api from '../lib/api'
import { profileApi, imSafeApi, paveApi, flightApi } from '../lib/apiClient'
import { useAuthStore } from '../stores/authStore'
import { Edit2, X } from 'lucide-react'
import type { UserResponseDto, ImSafeResponseDto, PaveResponseDto, FlightTripResponseDto } from '../lib/types'
import { AdvancedTrendChart, SystemPieChart } from '../components/shared/AdvancedCharts'

export function ProfilePage() {
    const { user } = useAuthStore()
    const [profile, setProfile] = useState<UserResponseDto | null>(null)
    const [loading, setLoading] = useState(true)

    const [fullName, setFullName] = useState('')
    const [licenseNumber, setLicenseNumber] = useState('')
    const [medicalClass, setMedicalClass] = useState('')
    const [rank, setRank] = useState('')
    const [totalFlightHours, setTotalFlightHours] = useState<number | string>(0)
    const [profileImageUrl, setProfileImageUrl] = useState('')
    const [assessments, setAssessments] = useState<(ImSafeResponseDto | PaveResponseDto)[]>([])
    const [flights, setFlights] = useState<FlightTripResponseDto[]>([])

    const [editingField, setEditingField] = useState<string | null>(null)
    const [showImageModal, setShowImageModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)
    const editInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const profileRes = await profileApi.getMe()
                const data = profileRes.data
                setProfile(data)
                setFullName(data.fullName || '')
                setLicenseNumber(data.licenseNumber || '')
                setMedicalClass(data.medicalClass || '')
                setRank(data.rank || '')
                setTotalFlightHours(data.totalFlightHours || 0)
                setProfileImageUrl(data.profileImageUrl || '')

                const [imRes, paveRes, flightsRes] = await Promise.all([
                    imSafeApi.getMy(),
                    paveApi.getMy(),
                    flightApi.getMy()
                ])
                setAssessments([...imRes.data, ...paveRes.data])
                setFlights(flightsRes.data)
            } catch (e) {
                console.error('Failed to load profile', e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    useEffect(() => {
        if (editingField && editInputRef.current) editInputRef.current.focus()
    }, [editingField])

    const isDirty =
        profile &&
        (fullName !== (profile.fullName || '') ||
            licenseNumber !== (profile.licenseNumber || '') ||
            medicalClass !== (profile.medicalClass || '') ||
            Number(totalFlightHours) !== (profile.totalFlightHours || 0))

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isDirty) return
        setSaving(true)
        setMessage('')
        setEditingField(null)
        try {
            const formData = new FormData()
            formData.append('fullName', fullName || '')
            formData.append('licenseNumber', licenseNumber || '')
            formData.append('medicalClass', medicalClass || '')
            formData.append('rank', rank || '')
            formData.append('totalFlightHours', String(totalFlightHours || 0))
            formData.append('profileImageUrl', profileImageUrl || '')
            const res = await profileApi.updateMe(formData)
            setProfile(res.data)
            setMessage('Profile updated successfully!')
        } catch {
            setMessage('Failed to update profile.')
        } finally {
            setSaving(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        setUploading(true)
        setMessage('')
        try {
            const res = await profileApi.uploadPicture(formData)
            setProfile(res.data)
            setProfileImageUrl(res.data.profileImageUrl || '')
            setMessage('Profile picture updated successfully!')
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to upload picture.')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const getAvatarSrc = () => {
        if (profileImageUrl) {
            if (profileImageUrl.startsWith('http')) return profileImageUrl
            return api.defaults.baseURL + profileImageUrl
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&size=512&background=random&color=fff`
    }

    const renderInput = (
        name: string,
        label: string,
        value: string | number,
        setter: (v: string) => void,
        canEdit = true
    ) => {
        const isEditing = editingField === name
        return (
            <div className="relative flex flex-col w-full">
                <label className="text-xs font-black text-black uppercase tracking-widest mb-2">{label}</label>
                <div className="relative group w-full flex items-center">
                    {isEditing ? (
                        <input
                            ref={editInputRef}
                            className="w-full px-4 py-3 bg-white border-2 border-primary-500 rounded-xl text-black outline-none text-sm font-black transition-all"
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => e.key === 'Escape' && setEditingField(null)}
                        />
                    ) : (
                        <input
                            className="w-full px-4 py-3 bg-slate-100 text-black border-2 border-slate-200 rounded-xl cursor-not-allowed select-none font-black"
                            style={{ pointerEvents: 'none' }}
                            value={value || '(Empty)'}
                            readOnly
                            tabIndex={-1}
                        />
                    )}
                    {canEdit && !isEditing && (
                        <button
                            type="button"
                            className="absolute right-4 p-2 text-primary-500 hover:text-white bg-primary-50 border-2 border-primary-100 transition-all hover:bg-primary-600 hover:border-primary-600 rounded-xl"
                            onClick={() => setEditingField(name)}
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                </div>
            </div>
        )
    }

    if (loading)
        return (
            <div className="p-8 text-center animate-pulse tracking-widest text-slate-500 font-bold uppercase">
                LOADING PROFILE...
            </div>
        )

    return (
        <div className="space-y-6 w-full mx-auto" style={{ maxWidth: '100%' }}>
            <h1 className="text-xl font-black text-black tracking-widest uppercase">My Profile</h1>

            <div className="glass-card w-full border-2 border-slate-200 bg-white p-6">
                <form onSubmit={handleSave} className="space-y-8 w-full">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-8 border-b-2 border-slate-100">
                        <div className="relative flex-shrink-0 group">
                            <img
                                src={getAvatarSrc()}
                                className="w-28 h-28 md:w-36 md:h-36 rounded-full shadow-md object-cover border-6 border-slate-100 cursor-pointer hover:border-primary-200 hover:scale-[1.02] transition-all"
                                alt="Avatar"
                                onClick={() => setShowImageModal(true)}
                                title="Click to view full picture"
                            />
                            <div
                                className="absolute bottom-1.5 right-1.5 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer text-white border-4 border-white shadow-lg hover:bg-primary-700 hover:scale-110 transition-all z-10"
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                            >
                                <Edit2 size={16} />
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                        <div className="flex flex-col justify-center w-full pt-4 md:pt-10 text-center md:text-left">
                            <p className="font-black text-black text-2xl tracking-tight mb-2">{profile?.email}</p>
                            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest border border-primary-200 bg-primary-50 px-3 py-1 inline-block rounded-xl self-center md:self-start">
                                {user?.roles.join(', ')}
                            </p>
                            {uploading && <p className="text-sm text-amber-500 font-bold mt-4 animate-pulse uppercase">Uploading Image...</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        {renderInput('fullName', 'Full Name', fullName, setFullName)}
                        {renderInput('licenseNumber', 'License Number', licenseNumber, setLicenseNumber)}
                        {renderInput('medicalClass', 'Medical Class', medicalClass, setMedicalClass)}
                        {renderInput('rank', 'Rank (System)', rank, setRank, false)}
                        {renderInput('totalFlightHours', 'Total Flight Hours', totalFlightHours, (v) => setTotalFlightHours(v))}
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl border-l-4 text-sm font-bold uppercase ${message.includes('success') ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                            {message}
                        </div>
                    )}

                    <div className="pt-4 border-t-2 border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            className="px-10 py-4 rounded-xl shadow-lg text-sm font-black text-white bg-primary-600 hover:bg-primary-700 transition-transform active:scale-95 uppercase disabled:opacity-50"
                            disabled={!isDirty || saving || uploading}
                        >
                            {saving ? 'SAVING...' : 'SAVE PROFILE CHANGES'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Pilot-only: Trip Analytics Charts */}
            {user?.roles.includes('Pilot') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-2 min-w-0">
                        <AdvancedTrendChart assessments={assessments} flights={flights} title="My Daily Trips Trend" />
                    </div>
                    <div className="lg:col-span-1 min-w-0">
                        <SystemPieChart assessments={assessments} />
                    </div>
                </div>
            )}

            {/* Fullscreen Image Modal */}
            {showImageModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md animate-fade-in p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    <button
                        className="absolute top-8 right-8 p-3 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 hover:scale-110 transition-all border-2 border-white/20"
                        onClick={() => setShowImageModal(false)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={getAvatarSrc()}
                        className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain border-8 border-white animate-slide-up"
                        alt="Zoomed Profile"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
