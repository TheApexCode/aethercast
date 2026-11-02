import React from 'react';
import {
  HistoricalClimateData,
  ForecastData,
  UnitSystem,
} from '../types/weather';
import {
  formatTemp,
  formatPrecip,
} from '../utils/weatherUtils';
import {
  History,
  TrendingUp,
  TrendingDown,
  Flame,
  Snowflake,
  CloudRain,
  Activity,
  Globe2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface HistoricalAnalysisProps {
  historical: HistoricalClimateData | null;
  forecast: ForecastData;
  unit: UnitSystem;
  isLoading: boolean;
}

export const HistoricalAnalysis: React.FC<HistoricalAnalysisProps> = ({
  historical,
  forecast,
  unit,
  isLoading,
}) => {
  if (isLoading || !historical) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 animate-pulse">
        <History className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
        <div className="text-sm font-semibold text-slate-300">
          Querying Global Historical Weather Archive (1990 - 2024)...
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Extracting decadal climate baselines, temperature anomalies, and precipitation variances for this coordinate.
        </p>
      </div>
    );
  }

  const { baseline30Year, comparisonYears, currentVsHistoricalAnomaly } = historical;
  const forecastMeanMax =
    forecast.daily.reduce((acc, d) => acc + d.temperature_max, 0) / forecast.daily.length;
  const forecastMeanMin =
    forecast.daily.reduce((acc, d) => acc + d.temperature_min, 0) / forecast.daily.length;
  const forecastTotalPrecip =
    forecast.daily.reduce((acc, d) => acc + d.precipitation_sum, 0);

  const isWarmAnomaly = currentVsHistoricalAnomaly.tempAnomaly > 0;
  const absTempDiff = Math.abs(currentVsHistoricalAnomaly.tempAnomaly);

  return (
    <div className="space-y-6">
      {/* Title & Global Archive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Global Historical Climate Archive & Anomaly Analysis
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              ERA5 Reanalysis Data
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing 30-year historical climate baselines vs current 14-day forecasts for {forecast.location.name}.
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          Target Window: {forecast.daily[0]?.date} → {forecast.daily[forecast.daily.length - 1]?.date}
        </div>
      </div>

      {/* Climate Anomaly Diagnosis Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Temperature Deviation Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Thermal Anomaly
            </span>
            <div className={`p-1.5 rounded-lg ${isWarmAnomaly ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              {isWarmAnomaly ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${isWarmAnomaly ? 'text-amber-400' : 'text-cyan-400'}`}>
              {isWarmAnomaly ? `+${currentVsHistoricalAnomaly.tempAnomaly}` : currentVsHistoricalAnomaly.tempAnomaly}°C
            </span>
            <span className="text-xs text-slate-400">vs 30-yr baseline</span>
          </div>

          <p className="mt-2 text-xs text-slate-300">
            {currentVsHistoricalAnomaly.rarityDescription}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Forecast Mean: {formatTemp(forecastMeanMax, unit)}</span>
            <span>Normal: {formatTemp(baseline30Year.avgMaxTemp, unit)}</span>
          </div>
        </div>

        {/* Precipitation Anomaly Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hydrological Variance
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <CloudRain className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-blue-400">
              {currentVsHistoricalAnomaly.precipAnomalyPercent > 0 ? `+${currentVsHistoricalAnomaly.precipAnomalyPercent}` : currentVsHistoricalAnomaly.precipAnomalyPercent}%
            </span>
            <span className="text-xs text-slate-400">moisture anomaly</span>
          </div>

          <p className="mt-2 text-xs text-slate-300">
            {currentVsHistoricalAnomaly.precipAnomalyPercent > 25
              ? 'Wetter than typical historical cycles with elevated rain risk.'
              : currentVsHistoricalAnomaly.precipAnomalyPercent < -25
              ? 'Drier than normal 30-year climate baseline.'
              : 'Consistent with seasonal hydrological expectations.'}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>14d Forecast: {formatPrecip(forecastTotalPrecip, unit)}</span>
            <span>Historical Avg: {formatPrecip(baseline30Year.avgPrecipitationTotal, unit)}</span>
          </div>
        </div>

        {/* Historical Record Extremes */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recorded Extremes (ERA5)
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Record High:
              </span>
              <span className="font-mono font-bold text-amber-400">
                {formatTemp(baseline30Year.recordHigh.temp, unit)} ({baseline30Year.recordHigh.year})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-cyan-400" /> Record Low:
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {formatTemp(baseline30Year.recordLow.temp, unit)} ({baseline30Year.recordLow.year})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" /> 24h Rain Record:
              </span>
              <span className="font-mono font-bold text-blue-300">
                {formatPrecip(baseline30Year.max24hRain.amount, unit)} ({baseline30Year.max24hRain.year})
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 text-[10px] text-slate-500 italic">
            Based on reanalysis dataset covering 1990 to present day.
          </div>
        </div>
      </div>

      {/* Multi-Year Comparison Table & Graphs */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Multi-Year Historical Benchmarking (Same Calendar Window)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Comparing this year's 14-day projection vs recent decades
          </span>
        </div>

        <div className="space-y-4">
          {/* Current Forecast Row */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-500 text-slate-950">
                Current 14-Day Forecast
              </span>
              <span className="text-xs text-slate-300">
                Projection (Next 14 Days)
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-slate-400">Mean Max: </span>
                <span className="text-amber-400 font-bold">{formatTemp(forecastMeanMax, unit)}</span>
              </div>
              <div>
                <span className="text-slate-400">Mean Min: </span>
                <span className="text-cyan-400 font-bold">{formatTemp(forecastMeanMin, unit)}</span>
              </div>
              <div>
                <span className="text-slate-400">Rain Sum: </span>
                <span className="text-blue-400 font-bold">{formatPrecip(forecastTotalPrecip, unit)}</span>
              </div>
            </div>
          </div>

          {/* 30-Year Baseline Row */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-200">
                30-Year Climate Normal
              </span>
              <span className="text-xs text-slate-400">
                Statistical Average (1991 - 2020)
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs font-mono">
              <div>
                <span className="text-slate-400">Mean Max: </span>
                <span className="text-slate-200 font-bold">{formatTemp(baseline30Year.avgMaxTemp, unit)}</span>
              </div>
              <div>
                <span className="text-slate-400">Mean Min: </span>
                <span className="text-slate-200 font-bold">{formatTemp(baseline30Year.avgMinTemp, unit)}</span>
              </div>
              <div>
                <span className="text-slate-400">Rain Sum: </span>
                <span className="text-slate-200 font-bold">{formatPrecip(baseline30Year.avgPrecipitationTotal, unit)}</span>
              </div>
            </div>
          </div>

          {/* Comparison past years */}
          {comparisonYears.map((cy) => (
            <div
              key={cy.year}
              className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-300 font-mono w-16">
                  Year {cy.year}
                </span>
                <span className="text-[11px] text-slate-500">
                  Historical archive observations
                </span>
              </div>
              <div className="flex items-center gap-6 font-mono text-slate-300">
                <div>
                  <span className="text-slate-500">Max: </span>
                  <span className="text-slate-200">{formatTemp(cy.meanMaxTemp, unit)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Min: </span>
                  <span className="text-slate-200">{formatTemp(cy.meanMinTemp, unit)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Precip: </span>
                  <span className="text-slate-200">{formatPrecip(cy.totalPrecipitation, unit)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Max Gust: </span>
                  <span className="text-slate-400">{cy.maxGust} km/h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
