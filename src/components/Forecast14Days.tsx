import React, { useState } from 'react';
import { DailyForecastDay, HourlyForecastItem, UnitSystem } from '../types/weather';
import {
  formatTemp,
  formatWind,
  formatPrecip,
  getWeatherCodeInfo,
  getUvCategory,
  getWindDirection,
} from '../utils/weatherUtils';
import { WeatherIcon } from './WeatherIcon';
import {
  Calendar,
  CloudRain,
  Wind,
  Sun,
  ChevronRight,
  TrendingUp,
  Clock,
  Droplets,
  Gauge,
  Sparkles,
  Info,
} from 'lucide-react';

interface Forecast14DaysProps {
  daily: DailyForecastDay[];
  hourly: HourlyForecastItem[];
  unit: UnitSystem;
}

export const Forecast14Days: React.FC<Forecast14DaysProps> = ({
  daily,
  hourly,
  unit,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const selectedDay = daily[selectedDayIndex] || daily[0];

  // Global bounds for temperature gradient rendering across 14 days
  const allMax = Math.max(...daily.map((d) => d.temperature_max));
  const allMin = Math.min(...daily.map((d) => d.temperature_min));
  const tempSpan = Math.max(1, allMax - allMin);

  // Filter hourly items for the selected day
  const selectedDatePrefix = selectedDay?.date;
  const dayHourly = hourly.filter((h) => h.time.startsWith(selectedDatePrefix));

  // Extremes over 14 days
  const warmestDay = [...daily].sort((a, b) => b.temperature_max - a.temperature_max)[0];
  const coldestNight = [...daily].sort((a, b) => a.temperature_min - b.temperature_min)[0];
  const totalRainForecast = daily.reduce((acc, d) => acc + (d.precipitation_sum || 0), 0);
  const rainyDaysCount = daily.filter((d) => d.precipitation_probability_max > 40).length;

  const formatDateLabel = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDayOfWeek = (dateStr: string, idx: number) => {
    if (idx === 0) return 'Today';
    if (idx === 1) return 'Tomorrow';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header & 14-Day Synoptic Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              14-Day Deterministic Forecast
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              ECMWF & GFS Hybrid
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comprehensive two-week meteorological outlook with hourly synoptic resolution.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Grid Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Detailed Matrix
          </button>
        </div>
      </div>

      {/* Quick 14-Day Synoptic Banner Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Warmest Day</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-amber-400 font-mono">
              {formatTemp(warmestDay?.temperature_max, unit)}
            </span>
            <span className="text-xs text-slate-400">
              {formatDateLabel(warmestDay?.date, daily.indexOf(warmestDay))}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Coldest Night</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-cyan-400 font-mono">
              {formatTemp(coldestNight?.temperature_min, unit)}
            </span>
            <span className="text-xs text-slate-400">
              {formatDateLabel(coldestNight?.date, daily.indexOf(coldestNight))}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Precip Forecast</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-blue-400 font-mono">
              {formatPrecip(totalRainForecast, unit)}
            </span>
            <span className="text-xs text-slate-400">14-day total</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Rain Probability</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-indigo-300 font-mono">
              {rainyDaysCount} of 14 Days
            </span>
            <span className="text-xs text-slate-400">&gt;40% chance</span>
          </div>
        </div>
      </div>

      {/* 14-Day Interactive Selector: Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {daily.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            const weather = getWeatherCodeInfo(day.weather_code);
            const uvInfo = getUvCategory(day.uv_index_max);

            // Compute relative position of high/low bar
            const leftPct = ((day.temperature_min - allMin) / tempSpan) * 100;
            const widthPct = Math.max(12, ((day.temperature_max - day.temperature_min) / tempSpan) * 100);

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`text-left p-3.5 rounded-2xl transition-all relative flex flex-col justify-between group cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-200'}`}>
                      {getDayOfWeek(day.date, idx)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {day.date.slice(5).replace('-', '/')}
                    </span>
                  </div>

                  {/* Icon & Label */}
                  <div className="my-3 flex flex-col items-center">
                    <WeatherIcon code={day.weather_code} isDay={1} className="w-9 h-9" />
                    <span className="mt-1.5 text-[11px] font-medium text-slate-300 text-center line-clamp-1">
                      {weather.label}
                    </span>
                  </div>
                </div>

                <div>
                  {/* Temp Range Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                      <span className="text-cyan-400">{formatTemp(day.temperature_min, unit)}</span>
                      <span className="text-amber-400">{formatTemp(day.temperature_max, unit)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                      <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Rain Probability & UV */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <CloudRain className="w-3 h-3 text-blue-400" />
                      <span className={day.precipitation_probability_max > 40 ? 'text-blue-300 font-medium' : ''}>
                        {day.precipitation_probability_max}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span className={uvInfo.color}>{day.uv_index_max}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Condition</th>
                <th className="py-3 px-4">Min / Max</th>
                <th className="py-3 px-4">Precip Chance</th>
                <th className="py-3 px-4">Accumulation</th>
                <th className="py-3 px-4">Peak Wind</th>
                <th className="py-3 px-4">UV Index</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {daily.map((day, idx) => {
                const isSelected = idx === selectedDayIndex;
                const weather = getWeatherCodeInfo(day.weather_code);
                const uvInfo = getUvCategory(day.uv_index_max);
                return (
                  <tr
                    key={day.date}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-500/10 text-white' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium whitespace-nowrap">
                      {formatDateLabel(day.date, idx)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <WeatherIcon code={day.weather_code} className="w-4 h-4" />
                        <span>{weather.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className="text-cyan-400 font-bold">{formatTemp(day.temperature_min, unit)}</span>
                      <span className="text-slate-500 mx-1.5">/</span>
                      <span className="text-amber-400 font-bold">{formatTemp(day.temperature_max, unit)}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${day.precipitation_probability_max}%` }}
                          />
                        </div>
                        <span className="font-mono">{day.precipitation_probability_max}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {formatPrecip(day.precipitation_sum, unit)}
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {formatWind(day.wind_gusts_max, unit)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${uvInfo.badge}`}>
                        {day.uv_index_max} {uvInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-cyan-400 font-medium hover:underline">
                        {isSelected ? 'Selected' : 'Inspect'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed Hourly Breakdown for Selected Day */}
      {selectedDay && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>24-Hour Synoptic Timeline for {formatDateLabel(selectedDay.date, selectedDayIndex)}</span>
                  <span className="text-xs text-slate-400 font-normal">({selectedDay.date})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Hourly atmospheric progression with precipitation chance, temperature curve, and wind vector.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Sunrise: {selectedDay.sunrise.split('T')[1]?.slice(0, 5) || '06:00'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                Sunset: {selectedDay.sunset.split('T')[1]?.slice(0, 5) || '18:00'}
              </span>
            </div>
          </div>

          {/* Hourly Scroller */}
          {dayHourly.length > 0 ? (
            <div className="mt-5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
              <div className="flex items-stretch gap-3 min-w-max">
                {dayHourly.map((hour, hIdx) => {
                  const hourLabel = hour.time.split('T')[1]?.slice(0, 5);
                  const isDayHour = parseInt(hourLabel.slice(0, 2), 10) >= 6 && parseInt(hourLabel.slice(0, 2), 10) < 19;
                  const weather = getWeatherCodeInfo(hour.weather_code, isDayHour ? 1 : 0);

                  return (
                    <div
                      key={hour.time}
                      className="w-24 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between items-center text-center transition-all hover:bg-slate-900/90"
                    >
                      <span className="text-xs font-bold text-slate-300 font-mono">{hourLabel}</span>

                      <div className="my-2">
                        <WeatherIcon
                          code={hour.weather_code}
                          isDay={isDayHour ? 1 : 0}
                          className="w-7 h-7 mx-auto"
                        />
                      </div>

                      <div className="text-sm font-extrabold text-white font-mono">
                        {formatTemp(hour.temperature, unit)}
                      </div>

                      <div className="mt-2 w-full pt-2 border-t border-slate-800/60 space-y-1 text-[10px]">
                        {/* Rain probability */}
                        <div className="flex items-center justify-center gap-1 text-blue-400">
                          <Droplets className="w-2.5 h-2.5" />
                          <span>{hour.precipitation_probability}%</span>
                        </div>
                        {/* Wind */}
                        <div className="flex items-center justify-center gap-1 text-slate-400 font-mono">
                          <Wind className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{formatWind(hour.wind_speed, unit).split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center py-6 text-xs text-slate-500">
              Hourly resolution data available for earlier days in the 14-day window.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
