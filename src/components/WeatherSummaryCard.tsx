import React from 'react';
import {
  ForecastData,
  HistoricalClimateData,
  UnitSystem,
} from '../types/weather';
import {
  formatTemp,
  formatWind,
  formatPressure,
  formatPrecip,
  getWindDirection,
  getWeatherCodeInfo,
  getUvCategory,
} from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';
import {
  Droplets,
  Wind,
  Gauge,
  Sun,
  Eye,
  Cloud,
  Sunrise,
  Sunset,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface WeatherSummaryCardProps {
  data: ForecastData;
  historical: HistoricalClimateData | null;
  unit: UnitSystem;
}

export const WeatherSummaryCard: React.FC<WeatherSummaryCardProps> = ({
  data,
  historical,
  unit,
}) => {
  const { location, current, daily } = data;
  const today = daily[0];

  const weatherInfo = getWeatherCodeInfo(current.weather_code, current.is_day);
  const uvCategory = getUvCategory(today?.uv_index_max ?? 3);
  const windDir = getWindDirection(current.wind_direction_10m);

  // Calculate daylight progress percentage
  let daylightPct = 50;
  let sunriseStr = today?.sunrise ? today.sunrise.split('T')[1]?.slice(0, 5) : '06:00';
  let sunsetStr = today?.sunset ? today.sunset.split('T')[1]?.slice(0, 5) : '18:00';

  if (today?.sunrise && today?.sunset) {
    const riseTime = new Date(today.sunrise).getTime();
    const setTime = new Date(today.sunset).getTime();
    const nowTime = new Date().getTime();
    if (nowTime <= riseTime) daylightPct = 0;
    else if (nowTime >= setTime) daylightPct = 100;
    else daylightPct = Math.round(((nowTime - riseTime) / (setTime - riseTime)) * 100);
  }

  // Dew point estimation approx
  const temp = current.temperature_2m;
  const rh = current.relative_humidity_2m;
  const dewPoint = Math.round(temp - (100 - rh) / 5);

  const anomaly = historical?.currentVsHistoricalAnomaly;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl p-6 sm:p-8">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Location details & Historical anomaly alert badge */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {location.name}
            </h1>
            {location.country && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {location.country}
              </span>
            )}
            {location.admin1 && (
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                • {location.admin1}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
            <span>Lat: {location.latitude.toFixed(3)}°</span>
            <span>Lon: {location.longitude.toFixed(3)}°</span>
            {location.elevation !== undefined && (
              <span>Elev: {location.elevation}m</span>
            )}
            <span>TZ: {location.timezone || 'Local'}</span>
          </div>
        </div>

        {/* Historical Anomaly Badge */}
        {anomaly && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 shadow-inner">
            <div className={`p-1.5 rounded-lg ${
              anomaly.tempAnomaly > 1.5
                ? 'bg-amber-500/20 text-amber-400'
                : anomaly.tempAnomaly < -1.5
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {anomaly.tempAnomaly > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Climate Archive Anomaly
              </div>
              <div className="text-xs font-bold text-slate-200">
                <span className={anomaly.tempAnomaly > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                  {anomaly.tempAnomaly > 0 ? `+${anomaly.tempAnomaly}` : anomaly.tempAnomaly}°C
                </span>{' '}
                vs 30-Year Normal
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Temperature & Visual Section */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 py-6 items-center">
        {/* Left: Big Temp & Condition (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="flex items-baseline gap-4">
            <span className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white font-mono">
              {formatTemp(current.temperature_2m, unit)}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-400">Feels like</span>
              <span className="text-xl font-bold text-slate-200 font-mono">
                {formatTemp(current.apparent_temperature, unit)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-lg">
              <WeatherIcon code={current.weather_code} isDay={current.is_day} className="w-8 h-8" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">{weatherInfo.label}</div>
              <div className="text-xs text-slate-400 max-w-sm line-clamp-1">
                {weatherInfo.description}
              </div>
            </div>
          </div>

          {/* Diurnal High / Low */}
          {today && (
            <div className="mt-5 flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Max: {formatTemp(today.temperature_max, unit)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Min: {formatTemp(today.temperature_min, unit)}</span>
              </div>
              <div className="text-slate-400">
                Swing: {Math.abs(Math.round(today.temperature_max - today.temperature_min))}°C
              </div>
            </div>
          )}
        </div>

        {/* Center: Sun Position / Daylight Arc (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span className="flex items-center gap-1.5">
              <Sunrise className="w-3.5 h-3.5 text-amber-400" />
              {sunriseStr}
            </span>
            <span className="flex items-center gap-1.5">
              {sunsetStr}
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
            </span>
          </div>

          {/* Daylight progress bar */}
          <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, Math.max(0, daylightPct))}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Daylight: {today ? Math.round(today.daylight_duration / 3600) : 12}h</span>
            <span className="text-amber-400 font-medium">
              {daylightPct >= 100 ? 'Nightfall' : daylightPct <= 0 ? 'Before Dawn' : `${daylightPct}% Elapsed`}
            </span>
          </div>
        </div>

        {/* Right: Quick Atmosphere Vitals (4 cols) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3">
          {/* Wind */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind
              </span>
              <span className="font-mono text-[10px] text-cyan-300 font-bold">{windDir}</span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatWind(current.wind_speed_10m, unit)}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Gusts: {formatWind(current.wind_gusts_10m, unit)}
            </div>
          </div>

          {/* Humidity */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {current.relative_humidity_2m}%
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Dew point: {formatTemp(dewPoint, unit)}
            </div>
          </div>

          {/* Pressure */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" /> Pressure
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {formatPressure(current.surface_pressure, unit)}
            </div>
            <div className="text-[10px] text-slate-400">
              {current.surface_pressure > 1013 ? 'High pressure' : 'Low trough'}
            </div>
          </div>

          {/* UV Index */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> UV Index
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${uvCategory.badge}`}>
                {uvCategory.label}
              </span>
            </div>
            <div className="text-base font-bold text-white font-mono">
              {today?.uv_index_max ?? 0}
            </div>
            <div className="text-[10px] text-slate-400">Max midday UV</div>
          </div>
        </div>
      </div>
    </div>
  );
};
