import React, { useState, useEffect, useCallback } from 'react';
import {
  LocationData,
  ForecastData,
  HistoricalClimateData,
  AIWeatherInsights,
  AlertRule,
  TriggeredAlert,
  UnitSystem,
} from './types/weather';
import {
  DEFAULT_ALERT_RULES,
  POPULAR_LOCATIONS,
  playAlertChime,
  sendBrowserNotification,
} from './utils/weatherUtils';
import {
  getForecastAndCurrent,
  getHistoricalClimate,
  fetchAIInsights,
} from './services/weatherApi';
import { Header } from './components/Header';
import { WeatherSummaryCard } from './components/WeatherSummaryCard';
import { Forecast14Days } from './components/Forecast14Days';
import { HistoricalAnalysis } from './components/HistoricalAnalysis';
import { AIMeteorologyCard } from './components/AIMeteorologyCard';
import { InteractiveMap } from './components/InteractiveMap';
import { CustomAlertsModal } from './components/CustomAlertsModal';
import { AIMeteorologistChat } from './components/AIMeteorologistChat';
import {
  Sparkles,
  Calendar,
  History,
  Layers,
  Bell,
  RefreshCw,
  Compass,
  AlertCircle,
  Activity,
  Bot,
} from 'lucide-react';

export default function App() {
  // Location & Weather Data
  const [location, setLocation] = useState<LocationData>(() => {
    const saved = localStorage.getItem('aethercast_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return POPULAR_LOCATIONS[0]; // Tokyo default
  });

  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [historical, setHistorical] = useState<HistoricalClimateData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIWeatherInsights | null>(null);

  // App Settings
  const [unit, setUnit] = useState<UnitSystem>(() => {
    return (localStorage.getItem('aethercast_unit') as UnitSystem) || 'metric';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem('aethercast_sound');
    return val !== null ? val === 'true' : true;
  });

  const [rules, setRules] = useState<AlertRule[]>(() => {
    const saved = localStorage.getItem('aethercast_alert_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_ALERT_RULES;
  });

  const [activeAlerts, setActiveAlerts] = useState<TriggeredAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'ai' | 'map' | 'historical'>('overview');
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [initialAiQuestion, setInitialAiQuestion] = useState<string | null>(null);

  // Loading States
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('aethercast_location', JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    localStorage.setItem('aethercast_unit', unit);
  }, [unit]);

  useEffect(() => {
    localStorage.setItem('aethercast_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('aethercast_alert_rules', JSON.stringify(rules));
  }, [rules]);

  // Evaluate alerts against forecast
  const evaluateAlerts = useCallback(
    (fcData: ForecastData, alertRules: AlertRule[]) => {
      const generated: TriggeredAlert[] = [];
      const enabledRules = alertRules.filter((r) => r.enabled);

      fcData.daily.forEach((day, idx) => {
        const dateLabel = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : day.date;

        enabledRules.forEach((rule) => {
          let triggered = false;
          let metricValue = 0;
          let unitLabel = '';

          switch (rule.metric) {
            case 'temp_max':
              metricValue = day.temperature_max;
              unitLabel = '°C';
              triggered = rule.operator === '>' ? metricValue > rule.threshold : metricValue < rule.threshold;
              break;
            case 'temp_min':
              metricValue = day.temperature_min;
              unitLabel = '°C';
              triggered = rule.operator === '>' ? metricValue > rule.threshold : metricValue < rule.threshold;
              break;
            case 'precip_prob':
              metricValue = day.precipitation_probability_max;
              unitLabel = '%';
              triggered = rule.operator === '>' ? metricValue > rule.threshold : metricValue < rule.threshold;
              break;
            case 'precip_sum':
              metricValue = day.precipitation_sum;
              unitLabel = 'mm';
              triggered = rule.operator === '>' ? metricValue > rule.threshold : metricValue < rule.threshold;
              break;
            case 'wind_gust':
              metricValue = day.wind_gusts_max;
              unitLabel = 'km/h';
              triggered = rule.operator === '>' ? metricValue > rule.threshold : metricValue < rule.threshold;
              break;
            case 'uv_index':
              metricValue = day.uv_index_max;
              unitLabel = 'UV';
              triggered = rule.operator === '>' ? metricValue > rule.threshold : metricValue < rule.threshold;
              break;
          }

          if (triggered) {
            const alertId = `${rule.id}-${day.date}`;
            if (!dismissedAlertIds.has(alertId)) {
              generated.push({
                id: alertId,
                ruleId: rule.id,
                title: rule.name,
                message: `Forecast indicates ${metricValue}${unitLabel} on ${dateLabel} (${rule.operator} ${rule.threshold}${unitLabel} threshold).`,
                date: day.date,
                severity: rule.severity,
                metricValue,
                unit: unitLabel,
                timestamp: new Date().toISOString(),
              });
            }
          }
        });
      });

      // Sound chime if new critical/warning alert found
      if (generated.length > 0 && soundEnabled) {
        const hasCritical = generated.some((a) => a.severity === 'critical');
        playAlertChime(hasCritical ? 'critical' : 'warning');
      }

      setActiveAlerts(generated);
    },
    [dismissedAlertIds, soundEnabled]
  );

  // Main data fetcher for location
  const loadWeatherData = useCallback(
    async (targetLocation: LocationData) => {
      setLoadingWeather(true);
      setErrorMsg(null);

      try {
        // 1. Fetch 14-day deterministic forecast & current observations
        const fcData = await getForecastAndCurrent(targetLocation);
        setForecast(fcData);
        setLoadingWeather(false);

        // Evaluate custom alert rules
        evaluateAlerts(fcData, rules);

        // 2. Fetch historical climate archive (async background)
        setLoadingHistorical(true);
        const avgMax =
          fcData.daily.reduce((acc, d) => acc + d.temperature_max, 0) / fcData.daily.length;
        const totalPrecip = fcData.daily.reduce((acc, d) => acc + d.precipitation_sum, 0);

        const histData = await getHistoricalClimate(targetLocation, avgMax, totalPrecip);
        setHistorical(histData);
        setLoadingHistorical(false);

        // 3. Fetch AI meteorological intelligence via Gemini 3.8 Flash
        setLoadingAI(true);
        try {
          const aiData = await fetchAIInsights(
            targetLocation,
            fcData.current,
            fcData.daily,
            histData
          );
          setAiInsights(aiData);
        } catch (aiErr) {
          console.warn('AI insight fetch fallback:', aiErr);
        } finally {
          setLoadingAI(false);
        }
      } catch (err: any) {
        console.error('Failed to load weather data:', err);
        setErrorMsg(err.message || 'Failed to fetch weather data for this location.');
        setLoadingWeather(false);
        setLoadingHistorical(false);
        setLoadingAI(false);
      }
    },
    [evaluateAlerts, rules]
  );

  // Load weather when location changes
  useEffect(() => {
    loadWeatherData(location);
  }, [location.latitude, location.longitude]);

  // Re-evaluate alerts when rules change
  useEffect(() => {
    if (forecast) {
      evaluateAlerts(forecast, rules);
    }
  }, [rules]);

  const handleSelectLocation = (loc: LocationData) => {
    setLocation(loc);
  };

  const handleToggleUnit = () => {
    setUnit((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const handleDismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, id]));
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleOpenAiPrompt = (prompt: string) => {
    setInitialAiQuestion(prompt);
    setIsAiChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Global Navigation & Tools Bar */}
      <Header
        currentLocation={location}
        onSelectLocation={handleSelectLocation}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        activeAlerts={activeAlerts}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => loadWeatherData(location)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-bold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Primary View Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
          {[
            { id: 'overview', label: 'Atmospheric Overview', icon: Compass },
            { id: 'forecast', label: '14-Day Deterministic Forecast', icon: Calendar },
            { id: 'ai', label: 'AI Meteorological Intel', icon: Sparkles, badge: 'Gemini 3.8' },
            { id: 'map', label: 'Interactive Radar & Maps', icon: Layers },
            { id: 'historical', label: 'Historical Climate Archive', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all flex items-center gap-2 relative ${
                  isActive
                    ? 'text-cyan-400 bg-slate-900/90 border-t border-x border-slate-700/80 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview & Vitals */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {loadingWeather || !forecast ? (
              <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                <div className="text-sm font-semibold text-slate-300">
                  Retrieving Global Meteorological Telemetry for {location.name}...
                </div>
              </div>
            ) : (
              <>
                {/* Hero Summary Card */}
                <WeatherSummaryCard
                  data={forecast}
                  historical={historical}
                  unit={unit}
                />

                {/* AI Synoptic Quick Preview Card */}
                <AIMeteorologyCard
                  insights={aiInsights}
                  location={location}
                  isLoading={loadingAI}
                  onRefresh={() => loadWeatherData(location)}
                  onAskQuestion={handleOpenAiPrompt}
                />

                {/* 14-Day Forecast Preview */}
                <Forecast14Days
                  daily={forecast.daily}
                  hourly={forecast.hourly}
                  unit={unit}
                />

                {/* Historical Climate Archive Card */}
                <HistoricalAnalysis
                  historical={historical}
                  forecast={forecast}
                  unit={unit}
                  isLoading={loadingHistorical}
                />
              </>
            )}
          </div>
        )}

        {/* Tab 2: 14-Day Deterministic Forecast */}
        {activeTab === 'forecast' && (
          <div className="space-y-6 animate-fadeIn">
            {forecast && (
              <Forecast14Days
                daily={forecast.daily}
                hourly={forecast.hourly}
                unit={unit}
              />
            )}
          </div>
        )}

        {/* Tab 3: AI Meteorological Intel */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fadeIn">
            <AIMeteorologyCard
              insights={aiInsights}
              location={location}
              isLoading={loadingAI}
              onRefresh={() => loadWeatherData(location)}
              onAskQuestion={handleOpenAiPrompt}
            />

            {/* In-tab AI Conversation Banner */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Have Specific Weather Questions for {location.name}?
                  </h4>
                  <p className="text-xs text-slate-400">
                    Consult AetherBot regarding flight conditions, sports suitability, storm risks, or crop freeze.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAiChatOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch AI Meteorologist</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Interactive World Map & Radar */}
        {activeTab === 'map' && (
          <div className="space-y-6 animate-fadeIn">
            {forecast && (
              <InteractiveMap
                location={location}
                forecast={forecast}
                unit={unit}
                onSelectCoordinates={handleSelectLocation}
              />
            )}
          </div>
        )}

        {/* Tab 5: Historical Climate Archive */}
        {activeTab === 'historical' && (
          <div className="space-y-6 animate-fadeIn">
            {forecast && (
              <HistoricalAnalysis
                historical={historical}
                forecast={forecast}
                unit={unit}
                isLoading={loadingHistorical}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Ask-AI Quick Trigger */}
      {!isAiChatOpen && (
        <button
          onClick={() => setIsAiChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 group"
        >
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
          <span>Ask AI Meteorologist</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Customizable Alerts Modal */}
      <CustomAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        rules={rules}
        onUpdateRules={setRules}
        activeAlerts={activeAlerts}
        onDismissAlert={handleDismissAlert}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        unit={unit}
      />

      {/* Interactive AI Meteorologist Chat Drawer */}
      {forecast && (
        <AIMeteorologistChat
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          location={location}
          forecast={forecast}
          historical={historical}
          initialQuestion={initialAiQuestion}
          onClearInitialQuestion={() => setInitialAiQuestion(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="font-sans font-bold text-slate-400">AetherCast AI</span>
            <span>— Global Weather Intelligence System</span>
          </div>
          <div>
            Powered by Open-Meteo Global Archives &amp; Google Gemini 3.8 Flash
          </div>
        </div>
      </footer>
    </div>
  );
}
