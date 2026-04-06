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

    let weatherStatus = '✅ Go';
    let statusStyle = 'bg-green-500/20 text-green-100 border-green-500/30';
    let statusMsg = 'Clear for operations';
    
    if (data) {
        const cat = (data.flightCategory || '').toUpperCase();
        const cond = (data.wxConditions || '').toUpperCase();
        
        if (cat === 'IFR' || cat === 'LIFR' || cond.includes('TS') || cond.includes('FG')) {
            weatherStatus = '❌ No-Go';
            statusMsg = '(IFR / low vis / TS)';
            statusStyle = 'bg-red-500/40 text-red-50 border-red-500/50';
        } else if (cat === 'MVFR' || cond.includes('TEMPO') || cond.includes('PROB') || cond.includes('BR')) {
            weatherStatus = '⚠️ Caution';
            statusMsg = '';
            statusStyle = 'bg-amber-500/40 text-amber-50 border-amber-500/50';
        }
    }

    const getWeatherEmoji = () => {
        if (!data) return '☀️';
        const cat = (data.flightCategory || '').toUpperCase();
        const cond = (data.wxConditions || '').toUpperCase();
        
        if (cond.includes('TS')) return '⛈️';
        if (cond.includes('RA') || cond.includes('SH') || cond.includes('DZ')) return '🌧️';
        if (cond.includes('SN') || cond.includes('SG') || cond.includes('PL') || cond.includes('GR')) return '🌨️';
        if (cond.includes('FG') || cond.includes('BR') || cond.includes('HZ')) return '🌫️';
        if (cat === 'IFR' || cat === 'LIFR') return '☁️';
        if (cat === 'MVFR') return '⛅';
        return '☀️';
    };

    return (
        <div className="w-full h-full border-0 rounded-2xl overflow-hidden shadow-xl relative text-white bg-gradient-to-b from-[#4170a4] to-[#2b4c73] p-5 sm:p-6 flex flex-col justify-between min-h-[300px]">
            {/* Header */}
            <div className="z-10 w-full mb-6 relative flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold tracking-wide text-white">Current Weather</h3>
                    <div className="text-sm font-semibold text-white/80 uppercase flex items-center gap-2 mt-1.5">
                        <Plane size={16} className="text-sky-300" /> {icao.toUpperCase()}
                        {data.flightCategory && (
                            <span className={clsx('ml-3 px-5 py-1 rounded-md text-xl font-black uppercase border border-white/30', 
                                data.flightCategory === 'VFR' ? 'bg-green-600 shadow-[0_0_0px_rgba(34,197,94,0.0)]' :
                                data.flightCategory === 'MVFR' ? 'bg-blue-500 shadow-[0_0_0px_rgba(59,130,246,0.5)]' :
                                data.flightCategory === 'IFR' ? 'bg-red-500 shadow-[0_0_0px_rgba(239,68,68,0.5)]' :
                                'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]')}>
                                {data.flightCategory}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Central Big Info */}
            <div className="z-10 flex flex-col items-center justify-center -mt-2">
                <div className="flex items-center justify-center gap-6">
                    <div className="text-6xl sm:text-7xl leading-none select-none filter drop-shadow-2xl">
                        {getWeatherEmoji()}
                    </div>
                    <div className="flex flex-col items-start translate-y-3">
                        <div className="text-6xl sm:text-7xl font-black tracking-tighter drop-shadow-lg leading-none">
                            {data.tempDewPoint.split('/')[0]}<span className="text-3xl text-white/80 absolute -top-1">°c</span>
                        </div>
                    </div>
                </div>
                <div className="text-lg sm:text-xl font-bold tracking-wide mt-4 text-white drop-shadow capitalize">
                    {data.wxConditions === 'None' ? 'Clear Skies' : data.wxConditions}
                </div>
                
                {/* Assessment Badge */}
                <div className={clsx('mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border shadow-md font-bold', statusStyle)}>
                    <span className="text-xl">{weatherStatus}</span>
                    <span className="opacity-80 text-lg font-semibold">{statusMsg}</span>
                </div>
                
            </div>

            {/* Bottom Metrics Grid */}
            <div className="z-10 mt-6 grid grid-cols-4 gap-2 pt-2">
                {[
                    { icon: <Wind size={20} />, value: data.wind.split('KT')[0] + ' kt', label: 'Wind' },
                    { icon: <Eye size={20} />, value: data.visibility.replace(' (+/- SM/m)', '').toLowerCase().includes(' sm') ? data.visibility.replace(' (+/- SM/m)', '').toLowerCase() : data.visibility.replace(' (+/- SM/m)', '') + ' sm', label: ' Vis' },
                    { icon: <Cloud size={20} />, value: data.cloudCeiling === 'CLR/NSC ' ? 'CLR ' : data.cloudCeiling, label: 'Ceil ' },
                    { icon: <Thermometer size={20} />, value: data.tempDewPoint.split('/')[1] + '°', label: 'Dew' }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center justify-center text-center max-w-full overflow-hidden">
                        <div className="text-white/90 mb-2 drop-shadow-md flex-shrink-0">{item.icon}</div>
                        <div className="text-l font-black text-white  mb-1 truncate w-full px-0.5">{item.value}</div>
                        <div className="text-[12px] text-white/60 font-bold uppercase tracking-widest flex-shrink-0">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
