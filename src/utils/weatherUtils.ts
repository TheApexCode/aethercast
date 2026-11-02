import { AlertRule, AlertSeverity, UnitSystem } from '../types/weather';

export interface WeatherCodeInfo {
  code: number;
  label: string;
  description: string;
  iconName: string;
  color: string;
  gradient: string;
}

export function getWeatherCodeInfo(code: number, isDay: number = 1): WeatherCodeInfo {
  switch (code) {
    case 0:
      return {
        code,
        label: isDay ? 'Clear Sky' : 'Clear Night',
        description: 'Sunlight unbroken by cloud cover with excellent horizontal visibility.',
        iconName: isDay ? 'Sun' : 'Moon',
        color: 'text-amber-400',
        gradient: 'from-amber-500/20 to-orange-500/10',
      };
    case 1:
      return {
        code,
        label: isDay ? 'Mainly Clear' : 'Mostly Clear',
        description: 'Atmosphere mostly unobstructed with isolated fair-weather cumulus.',
        iconName: isDay ? 'SunMedium' : 'MoonStar',
        color: 'text-amber-300',
        gradient: 'from-amber-500/20 to-sky-500/10',
      };
    case 2:
      return {
        code,
        label: 'Partly Cloudy',
        description: 'Scattered cumulus or stratocumulus covering roughly half the celestial dome.',
        iconName: 'CloudSun',
        color: 'text-sky-300',
        gradient: 'from-sky-500/20 to-blue-500/10',
      };
    case 3:
      return {
        code,
        label: 'Overcast',
        description: 'Uniform, opaque stratus deck suppressing solar irradiation.',
        iconName: 'Cloud',
        color: 'text-slate-300',
        gradient: 'from-slate-600/30 to-slate-800/20',
      };
    case 45:
    case 48:
      return {
        code,
        label: code === 48 ? 'Depositing Rime Fog' : 'Atmospheric Fog',
        description: 'Suspended water droplets reducing horizontal visibility beneath 1,000 meters.',
        iconName: 'CloudFog',
        color: 'text-teal-300',
        gradient: 'from-teal-600/20 to-slate-700/20',
      };
    case 51:
    case 53:
    case 55:
      return {
        code,
        label: code === 51 ? 'Light Drizzle' : code === 53 ? 'Moderate Drizzle' : 'Dense Drizzle',
        description: 'Fine uniform liquid precipitation droplets with minimal kinetic impact.',
        iconName: 'CloudDrizzle',
        color: 'text-cyan-300',
        gradient: 'from-cyan-600/20 to-blue-600/10',
      };
    case 56:
    case 57:
      return {
        code,
        label: 'Freezing Drizzle',
        description: 'Supercooled drizzle droplets freezing immediately upon surface contact.',
        iconName: 'CloudHail',
        color: 'text-cyan-200',
        gradient: 'from-cyan-400/20 to-indigo-600/20',
      };
    case 61:
      return {
        code,
        label: 'Slight Rain',
        description: 'Light continuous rainfall with minimal surface pooling.',
        iconName: 'CloudRain',
        color: 'text-blue-400',
        gradient: 'from-blue-600/20 to-indigo-700/20',
      };
    case 63:
      return {
        code,
        label: 'Moderate Rain',
        description: 'Sustained precipitation rate generating active surface runoff.',
        iconName: 'CloudRain',
        color: 'text-blue-500',
        gradient: 'from-blue-600/30 to-indigo-800/30',
      };
    case 65:
      return {
        code,
        label: 'Heavy Rain',
        description: 'High-intensity rainfall downpours with potential localized street pooling.',
        iconName: 'CloudLightning',
        color: 'text-indigo-400',
        gradient: 'from-indigo-600/30 to-blue-900/30',
      };
    case 66:
    case 67:
      return {
        code,
        label: 'Freezing Rain',
        description: 'Hazardous glaze formation creating severe black ice conditions.',
        iconName: 'CloudHail',
        color: 'text-sky-200',
        gradient: 'from-sky-400/30 to-slate-900/40',
      };
    case 71:
    case 73:
    case 75:
      return {
        code,
        label: code === 71 ? 'Slight Snow' : code === 73 ? 'Moderate Snow' : 'Heavy Snowfall',
        description: 'Aggregated ice crystal precipitation accumulating upon frozen surfaces.',
        iconName: 'CloudSnow',
        color: 'text-white',
        gradient: 'from-indigo-400/20 to-sky-300/10',
      };
    case 77:
      return {
        code,
        label: 'Snow Grains',
        description: 'Tiny opaque white grains of ice falling quietly from low stratus.',
        iconName: 'CloudSnow',
        color: 'text-slate-200',
        gradient: 'from-slate-400/20 to-indigo-900/20',
      };
    case 80:
    case 81:
    case 82:
      return {
        code,
        label: code === 82 ? 'Violent Rain Showers' : 'Passing Rain Showers',
        description: 'Convective instability producing rapid onset and cessation of rain.',
        iconName: 'CloudRainWind',
        color: 'text-cyan-400',
        gradient: 'from-cyan-500/20 to-blue-700/20',
      };
    case 85:
    case 86:
      return {
        code,
        label: 'Snow Showers',
        description: 'Intermittent convective bursts of snowfall with fluctuating visibility.',
        iconName: 'CloudSnow',
        color: 'text-cyan-100',
        gradient: 'from-cyan-300/20 to-slate-700/20',
      };
    case 95:
      return {
        code,
        label: 'Thunderstorm',
        description: 'Strong convective updrafts with active cloud-to-ground lightning discharge.',
        iconName: 'Zap',
        color: 'text-yellow-400',
        gradient: 'from-yellow-600/30 to-purple-900/30',
      };
    case 96:
    case 99:
      return {
        code,
        label: 'Severe Hail Thunderstorm',
        description: 'Violent mesoscale storm cell with solid hail stones and destructive squalls.',
        iconName: 'Zap',
        color: 'text-red-400',
        gradient: 'from-red-600/30 to-purple-950/40',
      };
    default:
      return {
        code,
        label: 'Variable Atmosphere',
        description: 'Mixed atmospheric metrics recorded at observation station.',
        iconName: 'Cloud',
        color: 'text-slate-300',
        gradient: 'from-slate-700/20 to-slate-900/20',
      };
  }
}

// Unit conversion helpers
export function formatTemp(tempC: number, unit: UnitSystem): string {
  if (tempC === undefined || tempC === null || isNaN(tempC)) return '--';
  if (unit === 'imperial') {
    const tempF = Math.round((tempC * 9) / 5 + 32);
    return `${tempF}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

export function formatTempNumber(tempC: number, unit: UnitSystem): number {
  if (unit === 'imperial') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
}

export function formatWind(kmh: number, unit: UnitSystem): string {
  if (kmh === undefined || kmh === null || isNaN(kmh)) return '--';
  if (unit === 'imperial') {
    const mph = Math.round(kmh * 0.621371);
    return `${mph} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function formatPrecip(mm: number, unit: UnitSystem): string {
  if (mm === undefined || mm === null || isNaN(mm)) return '0 mm';
  if (unit === 'imperial') {
    const inches = (mm * 0.0393701).toFixed(2);
    return `${inches} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatPressure(hpa: number, unit: UnitSystem): string {
  if (!hpa) return '--';
  if (unit === 'imperial') {
    const inhg = (hpa * 0.02953).toFixed(2);
    return `${inhg} inHg`;
  }
  return `${Math.round(hpa)} hPa`;
}

// Wind direction compass
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return directions[index];
}

// UV Danger Level
export function getUvCategory(uv: number): { label: string; color: string; badge: string } {
  if (uv < 3) return { label: 'Low', color: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (uv < 6) return { label: 'Moderate', color: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
  if (uv < 8) return { label: 'High', color: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
  if (uv < 11) return { label: 'Very High', color: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/30' };
  return { label: 'Extreme', color: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
}

// Web Audio API chime synthesizer for alerts (no external mp3 dependency required!)
export function playAlertChime(severity: AlertSeverity = 'advisory') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const baseFreq = severity === 'critical' ? 880 : severity === 'warning' ? 659.25 : 523.25;

    // Dual-tone harmonic chime
    [baseFreq, baseFreq * 1.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = severity === 'critical' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      if (severity === 'critical') {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.35);
      }

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.85);
    });
  } catch (err) {
    console.warn('Audio chime playback omitted:', err);
  }
}

// Request and trigger browser notification
export async function sendBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      return true;
    } catch (e) {
      console.warn('Notification spawn error:', e);
    }
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
        return true;
      } catch (e) {
        console.warn('Notification spawn error:', e);
      }
    }
  }
  return false;
}

// Preset customizable alert rules
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'rule-heatwave',
    name: 'Extreme Heatwave Warning',
    metric: 'temp_max',
    operator: '>',
    threshold: 33, // °C
    severity: 'critical',
    enabled: true,
    description: 'Triggered when maximum forecast temperature exceeds high heat threshold.',
  },
  {
    id: 'rule-freeze',
    name: 'Frost & Sub-Zero Hazard',
    metric: 'temp_min',
    operator: '<',
    threshold: 1, // °C
    severity: 'warning',
    enabled: true,
    description: 'Triggered when minimum night temperatures approach or dip below freezing point.',
  },
  {
    id: 'rule-heavy-rain',
    name: 'Heavy Precipitation Risk',
    metric: 'precip_sum',
    operator: '>',
    threshold: 15, // mm in 24h
    severity: 'warning',
    enabled: true,
    description: 'Triggered when daily precipitation accumulation exceeds 15mm.',
  },
  {
    id: 'rule-high-prob-rain',
    name: 'High Rain Probability',
    metric: 'precip_prob',
    operator: '>',
    threshold: 75, // %
    severity: 'advisory',
    enabled: true,
    description: 'Triggered when likelihood of rainfall exceeds 75%.',
  },
  {
    id: 'rule-severe-gale',
    name: 'High Wind Gust Advisory',
    metric: 'wind_gust',
    operator: '>',
    threshold: 55, // km/h
    severity: 'warning',
    enabled: true,
    description: 'Triggered when peak atmospheric wind gusts surpass 55 km/h.',
  },
  {
    id: 'rule-extreme-uv',
    name: 'Extreme UV Index Alert',
    metric: 'uv_index',
    operator: '>',
    threshold: 8, // UV index
    severity: 'critical',
    enabled: true,
    description: 'Triggered when peak UV solar radiation requires proactive skin protection.',
  },
];

// Curated global locations for instant discovery
export const POPULAR_LOCATIONS: import('../types/weather').LocationData[] = [
  { name: 'Tokyo', country: 'Japan', country_code: 'JP', latitude: 35.6895, longitude: 139.6917, admin1: 'Tokyo' },
  { name: 'London', country: 'United Kingdom', country_code: 'GB', latitude: 51.5085, longitude: -0.1257, admin1: 'Greater London' },
  { name: 'New York', country: 'United States', country_code: 'US', latitude: 40.7143, longitude: -74.006, admin1: 'New York' },
  { name: 'Reykjavik', country: 'Iceland', country_code: 'IS', latitude: 64.1355, longitude: -21.8954, admin1: 'Capital Region' },
  { name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', latitude: 25.2048, longitude: 55.2708, admin1: 'Dubai' },
  { name: 'Singapore', country: 'Singapore', country_code: 'SG', latitude: 1.2897, longitude: 103.8501, admin1: 'Singapore' },
  { name: 'Sydney', country: 'Australia', country_code: 'AU', latitude: -33.8679, longitude: 151.2073, admin1: 'New South Wales' },
  { name: 'São Paulo', country: 'Brazil', country_code: 'BR', latitude: -23.5475, longitude: -46.6361, admin1: 'São Paulo' },
  { name: 'Cairo', country: 'Egypt', country_code: 'EG', latitude: 30.0626, longitude: 31.2497, admin1: 'Cairo' },
  { name: 'Zurich', country: 'Switzerland', country_code: 'CH', latitude: 47.3667, longitude: 8.55, admin1: 'Zurich' },
];

