import { useState, useEffect } from 'react';
import { fetchAvwxWeather, type AvwxWeatherDetail, categoryColor } from '../../lib/weather';
import { CloudRain, Wind, AlertTriangle, Thermometer, Plane, Activity, RefreshCw, Eye, Cloud } from 'lucide-react';
import clsx from 'clsx';

export function WeatherWidget({ icao }: { icao: string }) {
    const [data, setData] = useState<AvwxWeatherDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!icao || icao.length < 3) return;
        setLoading(true);
        setError('');
        fetchAvwxWeather(icao).then(res => {
            if (res) setData(res);
            else setError('Weather data unavailable');
        }).catch(() => setError('Error fetching weather data'))
          .finally(() => setLoading(false));
    }, [icao]);

    if (!icao || icao.length < 3) return null;

    if (loading) return (
        <div className="glass-card p-6 flex flex-col items-center justify-center text-slate-500 min-h-[200px] animate-pulse">
            <RefreshCw className="animate-spin mb-4 text-sky-500" size={32} />
            <div className="font-bold text-slate-600 uppercase tracking-widest text-sm">Fetching Live Weather...</div>
        </div>
    );

    if (error || !data) return (
        <div className="glass-card p-6 bg-red-50 border-red-200 flex items-center justify-center text-red-500 font-bold uppercase min-h-[200px]">
            ⚠️ {error || 'No Data'}
        </div>
    );

    return (
        <div className="w-full bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm relative">
            {/* Header / Top Section */}
            <div className="flex justify-between items-start mb-6 relative z-10 w-full p-6 pb-0">
                <div>
                    <h2 className="text-4xl font-black text-black tracking-tight">{icao.toUpperCase()}</h2>
                    <div className="text-slate-500 font-bold tracking-wide flex items-center gap-2 mt-1 uppercase text-xs">
                        <Plane size={14} className="text-primary-500" /> Flight Station
                        {data.flightCategory && (
                            <span className={clsx('ml-2 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-white shadow-sm', 
                                data.flightCategory === 'VFR' ? 'bg-green-500' :
                                data.flightCategory === 'MVFR' ? 'bg-blue-500' :
                                data.flightCategory === 'IFR' ? 'bg-red-500' :
                                'bg-purple-500')}>
                                {data.flightCategory}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black text-black tracking-tighter">{data.tempDewPoint.split('/')[0]}°</div>
                    <div className="text-slate-500 font-bold text-sm mt-1 uppercase">Dew {data.tempDewPoint.split('/')[1] || '--'}°</div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 relative z-10">
                {[
                    { icon: <Eye size={20} className="text-primary-500" />, label: 'Visibility', value: data.visibility },
                    { icon: <Wind size={20} className="text-primary-500" />, label: 'Wind', value: data.wind },
                    { icon: <CloudRain size={20} className="text-primary-500" />, label: 'Conditions', value: data.wxConditions || 'None' },
                    { icon: <Cloud size={20} className="text-primary-500" />, label: 'Ceiling', value: data.cloudCeiling }
                ].map((item, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-center text-center">
                        <div className="flex items-center justify-center gap-2 text-slate-500 mb-2">
                            {item.icon} <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                        </div>
                        <div className="text-xl font-black text-black leading-snug break-words">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
