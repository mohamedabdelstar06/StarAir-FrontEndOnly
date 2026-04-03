/**
 * Aviation Weather Service
 * Fetches METAR/TAF data from avwx.rest API.
 */

export interface AvwxWeatherDetail {
    visibility: string;
    wind: string;
    wxConditions: string;
    cloudCeiling: string;
    icing: string;
    runwayConditions: string;
    tempDewPoint: string;
    rawMetar: string;
    rawTaf: string;
    flightCategory?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
}

const AVWX_TOKEN = 'WLyEyb0JDe3_dtvThr2rZNfF_Gz6S6GWDJPmz0LLh5s';
const HEADERS = { 'Authorization': AVWX_TOKEN };

function categoryColor(cat: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | undefined): string {
    return { VFR: 'text-green-400', MVFR: 'text-blue-400', IFR: 'text-red-400', LIFR: 'text-purple-400' }[cat ?? 'VFR'] ?? 'text-slate-400';
}

export async function fetchAvwxWeather(icao: string): Promise<AvwxWeatherDetail | null> {
    try {
        const [metarRes, tafRes] = await Promise.all([
            fetch(`https://avwx.rest/api/metar/${icao.toUpperCase()}`, { headers: HEADERS }),
            fetch(`https://avwx.rest/api/taf/${icao.toUpperCase()}`, { headers: HEADERS })
        ]);

        const metar = metarRes.ok ? await metarRes.json() : null;
        const taf = tafRes.ok ? await tafRes.json() : null;

        if (!metar && !taf) return null;

        // Extracting required mapped data
        const visibility = metar?.visibility?.repr || taf?.forecast?.[0]?.visibility?.repr || 'N/A';
        
        const windDir = metar?.wind_direction?.repr || 'VRB';
        const windSpd = metar?.wind_speed?.repr || '00';
        const windGust = metar?.wind_gust?.repr ? `G${metar.wind_gust.repr}` : '';
        const wind = metar ? `${windDir}${windSpd}${windGust}KT` : (taf?.forecast?.[0]?.wind_speed?.repr ? `${taf.forecast[0].wind_direction?.repr || '---'}${taf.forecast[0].wind_speed.repr}KT` : 'N/A');

        const wxCodes = metar?.wx_codes?.map((c: any) => c.repr).join(', ') || taf?.forecast?.[0]?.wx_codes?.map((c: any) => c.repr).join(', ') || 'None';
        
        const clouds = metar?.clouds || taf?.forecast?.[0]?.clouds || [];
        const ceiling = clouds.find((c: any) => ['BKN', 'OVC', 'VV'].includes(c.type));
        const cloudStr = ceiling ? `${ceiling.type}${ceiling.altitude?.toString().padStart(3, '0') || '---'}` : (clouds.length > 0 ? clouds[0].repr : 'CLR/NSC');

        const icing = taf?.forecast?.some((f: any) => f.icing && f.icing.length > 0) ? 'Reported in TAF' : 'None reported';
        
        const runwayConditions = metar?.runway_visibility?.map((r: any) => r.repr).join(', ') || 'None reported';

        const temp = metar?.temperature?.repr || 'M--';
        const dew = metar?.dewpoint?.repr || 'M--';
        const tempDewPoint = metar ? `${temp}/${dew}` : 'N/A';

        return {
            visibility: visibility === 'N/A' ? visibility : `${visibility} (+/- SM/m)`,
            wind,
            wxConditions: wxCodes,
            cloudCeiling: cloudStr,
            icing,
            runwayConditions,
            tempDewPoint,
            rawMetar: metar?.raw || 'N/A',
            rawTaf: taf?.raw || 'N/A',
            flightCategory: metar?.flight_rules || 'VFR'
        };
    } catch {
        return null;
    }
}

export { categoryColor };
