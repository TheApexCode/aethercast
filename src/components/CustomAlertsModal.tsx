import React, { useState } from 'react';
import {
  AlertRule,
  AlertSeverity,
  AlertMetric,
  TriggeredAlert,
  UnitSystem,
} from '../types/weather';
import {
  DEFAULT_ALERT_RULES,
  playAlertChime,
  sendBrowserNotification,
  formatTemp,
  formatWind,
  formatPrecip,
} from '../utils/weatherUtils';
import {
  Bell,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Flame,
  Snowflake,
  CloudRain,
  Wind,
  Sun,
  Gauge,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: AlertRule[];
  onUpdateRules: (newRules: AlertRule[]) => void;
  activeAlerts: TriggeredAlert[];
  onDismissAlert: (id: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  unit: UnitSystem;
}

export const CustomAlertsModal: React.FC<CustomAlertsModalProps> = ({
  isOpen,
  onClose,
  rules,
  onUpdateRules,
  activeAlerts,
  onDismissAlert,
  soundEnabled,
  onToggleSound,
  unit,
}) => {
  const [activeTab, setActiveTab] = useState<'triggered' | 'rules'>('triggered');
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // New rule state
  const [newRuleName, setNewRuleName] = useState('');
  const [newMetric, setNewMetric] = useState<AlertMetric>('temp_max');
  const [newOperator, setNewOperator] = useState<'>' | '<'>('>');
  const [newThreshold, setNewThreshold] = useState<number>(30);
  const [newSeverity, setNewSeverity] = useState<AlertSeverity>('warning');

  if (!isOpen) return null;

  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    onUpdateRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    onUpdateRules(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const created: AlertRule = {
      id: `custom-rule-${Date.now()}`,
      name: newRuleName.trim(),
      metric: newMetric,
      operator: newOperator,
      threshold: Number(newThreshold),
      severity: newSeverity,
      enabled: true,
      description: `Alert triggered when ${newMetric} is ${newOperator} ${newThreshold}`,
    };

    onUpdateRules([...rules, created]);
    setIsAddingRule(false);
    setNewRuleName('');
  };

  const handleResetDefaults = () => {
    onUpdateRules(DEFAULT_ALERT_RULES);
  };

  // Test / Simulation Alert
  const handleTestAlert = async () => {
    if (soundEnabled) {
      playAlertChime('critical');
    }
    await sendBrowserNotification(
      'AetherCast AI Alert Simulation',
      'Test notification: Atmospheric monitoring system active and responsive!'
    );

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    setTestSuccessMessage('Alert dispatched! Audio chime sounded and notification sent.');
    setTimeout(() => setTestSuccessMessage(null), 4000);
  };

  const getMetricLabel = (metric: AlertMetric) => {
    switch (metric) {
      case 'temp_max':
        return 'Max Temperature (°C)';
      case 'temp_min':
        return 'Min Temperature (°C)';
      case 'precip_prob':
        return 'Precipitation Chance (%)';
      case 'precip_sum':
        return 'Daily Rain Accumulation (mm)';
      case 'wind_gust':
        return 'Wind Gust (km/h)';
      case 'uv_index':
        return 'UV Solar Index';
      case 'pressure_drop':
        return 'Pressure Drop (hPa)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Atmospheric Alert Center</span>
                {activeAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                    {activeAlerts.length} Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Customizable meteorological threshold monitors evaluated continuously against 14-day forecasts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Alert Notification Settings & Test Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Chime: {soundEnabled ? 'Enabled' : 'Muted'}</span>
            </button>

            <button
              onClick={() => sendBrowserNotification('AetherCast Alerts', 'Browser push notifications verified.')}
              className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Request Browser Permissions</span>
            </button>
          </div>

          <button
            onClick={handleTestAlert}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Alert</span>
          </button>
        </div>

        {testSuccessMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{testSuccessMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 flex items-center gap-3 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('triggered')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'triggered'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Triggered Forecast Alerts ({activeAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'rules'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Rule Thresholds ({rules.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'triggered' ? (
            activeAlerts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Atmospheric Parameters Normal</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No 14-day forecast metrics currently exceed your enabled alert rules. You can adjust thresholds or add custom rules.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      alert.severity === 'critical'
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                        : alert.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.severity === 'critical'
                            ? 'text-rose-400'
                            : alert.severity === 'warning'
                            ? 'text-amber-400'
                            : 'text-cyan-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{alert.title}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            alert.severity === 'critical'
                              ? 'bg-rose-500/30 text-rose-300'
                              : alert.severity === 'warning'
                              ? 'bg-amber-500/30 text-amber-300'
                              : 'bg-cyan-500/30 text-cyan-300'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-slate-300">{alert.message}</p>
                        <div className="mt-2 text-[10px] font-mono text-slate-400">
                          Forecast Target: {alert.date}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Dismiss Alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Rules Management */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsAddingRule(!isAddingRule)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-400 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingRule ? 'Cancel Form' : 'Create Custom Rule'}</span>
                </button>

                <button
                  onClick={handleResetDefaults}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Reset Default Rules
                </button>
              </div>

              {/* Add Custom Rule Form */}
              {isAddingRule && (
                <form
                  onSubmit={handleAddRule}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-700 space-y-3"
                >
                  <div className="font-bold text-xs uppercase text-cyan-400 tracking-wider">
                    New Threshold Configuration
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Rule Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Extreme Freezing Alert, High Wind Watch..."
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Metric</label>
                      <select
                        value={newMetric}
                        onChange={(e) => setNewMetric(e.target.value as AlertMetric)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="temp_max">Max Temp (°C)</option>
                        <option value="temp_min">Min Temp (°C)</option>
                        <option value="precip_prob">Precipitation Chance (%)</option>
                        <option value="precip_sum">24h Rain Total (mm)</option>
                        <option value="wind_gust">Wind Gusts (km/h)</option>
                        <option value="uv_index">UV Solar Index</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Operator</label>
                      <select
                        value={newOperator}
                        onChange={(e) => setNewOperator(e.target.value as '>' | '<')}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value=">">Greater than (&gt;)</option>
                        <option value="<">Less than (&lt;)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Threshold Value</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={newThreshold}
                        onChange={(e) => setNewThreshold(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Severity</label>
                      <select
                        value={newSeverity}
                        onChange={(e) => setNewSeverity(e.target.value as AlertSeverity)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="advisory">Advisory (Low/Info)</option>
                        <option value="warning">Warning (Moderate)</option>
                        <option value="critical">Critical (Severe)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                      >
                        Save Rule
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="space-y-2.5">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${rule.enabled ? 'text-white' : 'text-slate-500 line-through'}`}>
                            {rule.name}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            rule.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : rule.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {rule.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Trigger when {getMetricLabel(rule.metric)} is {rule.operator} {rule.threshold}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
