import { useState, useEffect } from 'react';
import { fetchAvwxWeather, type AvwxWeatherDetail, categoryColor } from '../../lib/weather';
import { CloudRain, Wind, AlertTriangle, Thermometer, Plane, Activity, RefreshCw } from 'lucide-react';
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
        <div className="glass-card p-6 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="animate-spin mb-2 text-primary-500" />
            <div className="font-bold text-black uppercase tracking-widest text-sm">Fetching AVWX Data...</div>
        </div>
    );

    if (error || !data) return (
        <div className="glass-card p-6 bg-red-50 border-red-200 flex items-center justify-center text-red-500 font-bold uppercase">
            ⚠️ {error || 'No Data'}
        </div>
    );

    return (
        <div className="w-full bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-900 border-b-4 border-primary-500 p-4">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <CloudRain className="text-primary-400" /> Flight Weather Intel & Risk
                </h3>
                <div className="text-xs text-primary-200 font-bold uppercase tracking-widest mt-1">Station: {icao.toUpperCase()}</div>
                {data.flightCategory && (
                    <div className={clsx('text-xs font-black px-3 py-1 mt-2 rounded-lg inline-block text-white border-2', categoryColor(data.flightCategory).replace('text-', 'bg-').replace('400', '600') + ' border-transparent')}>
                        CONDITIONS: {data.flightCategory}
                    </div>
                )}
            </div>
            
            <div className="p-0">
                <table className="w-full text-left border-collapse bg-white">
                    <tbody>
                        {[
                            { icon: '🌫️', label: '1. Visibility', value: data.visibility },
                            { icon: '🌬️', label: '2. Wind', value: data.wind },
                            { icon: '⛈️', label: '3. Wx Conditions', value: data.wxConditions },
                            { icon: '☁️', label: '4. Cloud Ceiling', value: data.cloudCeiling },
                            { icon: '🧊', label: '5. Icing Conditions', value: data.icing },
                            { icon: '🛬', label: '6. Runway Conditions', value: data.runwayConditions },
                            { icon: '🌡️', label: '7. Temp / Dew Point', value: data.tempDewPoint }
                        ].map((row, i) => (
                            <tr key={i} className="border-b-2 border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-5 text-xl w-12 text-center">{row.icon}</td>
                                <td className="py-4 px-2 font-black text-black text-lg w-1/3">{row.label}</td>
                                <td className="py-4 px-5 font-bold text-slate-700 text-lg">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
