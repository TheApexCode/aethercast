export interface LocationData {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

export interface CurrentWeatherData {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: number;
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  surface_pressure: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
}

export interface DailyForecastDay {
  date: string;
  weather_code: number;
  temperature_max: number;
  temperature_min: number;
  apparent_temperature_max: number;
  apparent_temperature_min: number;
  sunrise: string;
  sunset: string;
  daylight_duration: number; // seconds
  sunshine_duration: number; // seconds
  uv_index_max: number;
  precipitation_sum: number;
  rain_sum: number;
  precipitation_probability_max: number;
  wind_speed_max: number;
  wind_gusts_max: number;
  wind_direction_dominant: number;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  apparent_temperature: number;
  relative_humidity: number;
  dew_point: number;
  precipitation_probability: number;
  precipitation: number;
  weather_code: number;
  pressure: number;
  cloud_cover: number;
  wind_speed: number;
  wind_direction: number;
  wind_gusts: number;
  uv_index: number;
}

export interface ForecastData {
  location: LocationData;
  current: CurrentWeatherData;
  daily: DailyForecastDay[];
  hourly: HourlyForecastItem[];
  fetchedAt: string;
}

export interface HistoricalYearSummary {
  year: number;
  meanMaxTemp: number;
  meanMinTemp: number;
  meanTemp: number;
  totalPrecipitation: number;
  maxGust: number;
  days: {
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
  }[];
}

export interface HistoricalClimateData {
  baseline30Year: {
    avgMaxTemp: number;
    avgMinTemp: number;
    avgMeanTemp: number;
    avgPrecipitationTotal: number;
    recordHigh: { temp: number; year: number; date: string };
    recordLow: { temp: number; year: number; date: string };
    max24hRain: { amount: number; year: number; date: string };
  };
  comparisonYears: HistoricalYearSummary[];
  currentVsHistoricalAnomaly: {
    tempAnomaly: number; // difference in °C from historical norm
    precipAnomalyPercent: number; // % deviation
    isWarmerThanNormal: boolean;
    rarityDescription: string;
  };
}

export interface AIWeatherInsights {
  summary: string;
  historicalAnomaly: string;
  trendAnalysis: string;
  severeWeatherRisk: {
    level: 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Severe';
    details: string;
  };
  sectorImpacts: {
    sector: string;
    impact: string;
  }[];
  confidenceScore: number;
  aiHighlights: string[];
}

export type AlertMetric = 
  | 'temp_max' 
  | 'temp_min' 
  | 'precip_prob' 
  | 'precip_sum' 
  | 'wind_gust' 
  | 'uv_index' 
  | 'pressure_drop';

export type AlertSeverity = 'advisory' | 'warning' | 'critical';

export interface AlertRule {
  id: string;
  name: string;
  metric: AlertMetric;
  operator: '>' | '<';
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  description: string;
}

export interface TriggeredAlert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  date: string;
  severity: AlertSeverity;
  metricValue: number;
  unit: string;
  timestamp: string;
}

export type UnitSystem = 'metric' | 'imperial';
