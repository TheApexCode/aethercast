import React from 'react';
import { AIWeatherInsights, LocationData } from '../types/weather';
import {
  Sparkles,
  Brain,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Compass,
  Sprout,
  Plane,
  Zap,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface AIMeteorologyCardProps {
  insights: AIWeatherInsights | null;
  location: LocationData;
  isLoading: boolean;
  onRefresh: () => void;
  onAskQuestion: (prompt: string) => void;
}

export const AIMeteorologyCard: React.FC<AIMeteorologyCardProps> = ({
  insights,
  location,
  isLoading,
  onRefresh,
  onAskQuestion,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-spin" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">
            Gemini 3.8 Flash Synthesizing Synoptic & Historical Weather Intelligence...
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Computing atmospheric pressure anomalies, 14-day frontal passages, and decadal climate drifts for {location.name}.
          </p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'severe':
        return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', badge: 'bg-rose-500' };
      case 'high':
        return { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40', badge: 'bg-orange-500' };
      case 'elevated':
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', badge: 'bg-amber-500' };
      case 'moderate':
        return { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', badge: 'bg-yellow-500' };
      default:
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', badge: 'bg-emerald-500' };
    }
  };

  const riskColor = getRiskColor(insights.severeWeatherRisk?.level || 'Low');

  return (
    <div className="rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950 border border-cyan-500/30 shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Decorative accent glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Meteorological Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synoptic synthesis bridging 14-day deterministic forecasts with 30-year historical climate patterns.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {insights.confidenceScore && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Confidence:</span>
              <span className="font-bold text-slate-200 font-mono">{insights.confidenceScore}%</span>
            </div>
          )}

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Re-run AI Synthesis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
          <Compass className="w-4 h-4" />
          <span>Executive Forecast Synthesis</span>
        </div>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans font-normal">
          {insights.summary}
        </p>
      </div>

      {/* Grid: Historical Anomaly & Synoptic Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Historical Anomaly Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Climate Anomaly & Historical Variance</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {insights.historicalAnomaly}
          </p>
        </div>

        {/* 14-Day Synoptic Trend */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Brain className="w-4 h-4" />
            <span>Two-Week Synoptic Progression</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {insights.trendAnalysis}
          </p>
        </div>
      </div>

      {/* Severe Weather Risk Assessment */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Atmospheric Hazard & Severe Weather Assessment</span>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${riskColor.bg}`}>
            Risk Level: {insights.severeWeatherRisk?.level || 'Low'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300">
          {insights.severeWeatherRisk?.details}
        </p>
      </div>

      {/* Sector Impacts */}
      {insights.sectorImpacts && insights.sectorImpacts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sectoral Impacts & Actionable Advisory
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.sectorImpacts.map((sector, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-cyan-300 block">
                  {sector.sector}
                </span>
                <p className="text-xs text-slate-400 leading-normal">
                  {sector.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Key Highlights Chips */}
      {insights.aiHighlights && (
        <div className="pt-2 flex flex-wrap gap-2">
          {insights.aiHighlights.map((highlight, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Interactive Prompt Suggestions */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ask AI Meteorologist about {location.name}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            `Is this 14-day pattern unusual for ${location.name}?`,
            `What is the best window for outdoor travel or sports?`,
            `Will rainfall affect upcoming weekend activities?`,
            `Are there frost or freeze hazards for vegetation?`,
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => onAskQuestion(prompt)}
              className="text-left px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-cyan-300 transition-colors"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
