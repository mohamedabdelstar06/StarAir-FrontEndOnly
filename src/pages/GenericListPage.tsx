import { useEffect, useState } from 'react'
import api from '../lib/api'

interface Props {
    endpoint: string
    title: string
    subtitle: string
}

export function GenericListPage({ endpoint, title, subtitle }: Props) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        api.get(endpoint)
            .then(res => {
                const responseData = res.data;
                setData(Array.isArray(responseData) ? responseData : (responseData?.items || []))
            })
            .catch(() => setData([]))
            .finally(() => setLoading(false))
    }, [endpoint])

    // Get table headers from the first data object
    const headers = data.length > 0 ? Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object').slice(0, 6) : []

    return (
        <div className="p-4 lg:p-8 animate-slide-up max-w-7xl mx-auto">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-2">{title}</h1>
            <p className="text-sm font-medium text-slate-500 mb-8">{subtitle}</p>

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="data-table">
                        <thead className="bg-slate-50/50">
                            <tr>
                                {headers.length > 0 ? headers.map(key => (
                                    <th key={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                                )) : <th>Data Information</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={Math.max(headers.length, 1)} className="py-20 text-center font-bold tracking-widest text-slate-500 animate-pulse uppercase">
                                        Loading Data...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={Math.max(headers.length, 1)} className="py-20 text-center text-slate-500 font-medium">
                                        No records found in database.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id ?? idx}>
                                        {headers.map((key) => {
                                            const val = item[key]
                                            return (
                                                <td key={key} className="max-w-[200px] truncate" title={String(val)}>
                                                    {val === null || val === undefined ? '-' : typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
