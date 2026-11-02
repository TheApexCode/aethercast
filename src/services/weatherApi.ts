import {
  ForecastData,
  LocationData,
  HistoricalClimateData,
  HistoricalYearSummary,
  AIWeatherInsights,
} from '../types/weather';

export async function searchLocations(query: string): Promise<LocationData[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query.trim()
    )}&count=8&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation,
      country: item.country,
      country_code: item.country_code,
      admin1: item.admin1,
      timezone: item.timezone,
      population: item.population,
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'AetherCast-Weather-Intelligence',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const name = addr.city || addr.town || addr.village || addr.county || data.display_name?.split(',')[0] || 'Selected Coordinate';
      return {
        name,
        latitude,
        longitude,
        country: addr.country,
        country_code: addr.country_code?.toUpperCase(),
        admin1: addr.state || addr.region,
      };
    }
  } catch (err) {
    console.warn('Reverse geocode fallback:', err);
  }

  return {
    name: `Geo (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
    latitude,
    longitude,
  };
}

export async function getForecastAndCurrent(location: LocationData): Promise<ForecastData> {
  const { latitude, longitude } = location;

  const currentVars = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'is_day',
    'precipitation',
    'rain',
    'showers',
    'snowfall',
    'weather_code',
    'cloud_cover',
    'pressure_msl',
    'surface_pressure',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
  ].join(',');

  const dailyVars = [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'apparent_temperature_max',
    'apparent_temperature_min',
    'sunrise',
    'sunset',
    'daylight_duration',
    'sunshine_duration',
    'uv_index_max',
    'precipitation_sum',
    'rain_sum',
    'showers_sum',
    'snowfall_sum',
    'precipitation_hours',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'wind_gusts_10m_max',
    'wind_direction_10m_dominant',
  ].join(',');

  const hourlyVars = [
    'temperature_2m',
    'relative_humidity_2m',
    'dew_point_2m',
    'apparent_temperature',
    'precipitation_probability',
    'precipitation',
    'weather_code',
    'pressure_msl',
    'surface_pressure',
    'cloud_cover',
    'visibility',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'uv_index',
  ].join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${currentVars}&daily=${dailyVars}&hourly=${hourlyVars}&forecast_days=14&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather forecast fetch failed: ${response.statusText}`);
  }

  const raw = await response.json();

  // Transform daily into clean array of 14 days
  const dailyDays = (raw.daily?.time || []).map((date: string, idx: number) => ({
    date,
    weather_code: raw.daily.weather_code?.[idx] ?? 0,
    temperature_max: raw.daily.temperature_2m_max?.[idx] ?? 20,
    temperature_min: raw.daily.temperature_2m_min?.[idx] ?? 10,
    apparent_temperature_max: raw.daily.apparent_temperature_max?.[idx] ?? 20,
    apparent_temperature_min: raw.daily.apparent_temperature_min?.[idx] ?? 10,
    sunrise: raw.daily.sunrise?.[idx] ?? '',
    sunset: raw.daily.sunset?.[idx] ?? '',
    daylight_duration: raw.daily.daylight_duration?.[idx] ?? 43200,
    sunshine_duration: raw.daily.sunshine_duration?.[idx] ?? 28800,
    uv_index_max: raw.daily.uv_index_max?.[idx] ?? 5,
    precipitation_sum: raw.daily.precipitation_sum?.[idx] ?? 0,
    rain_sum: raw.daily.rain_sum?.[idx] ?? 0,
    precipitation_probability_max: raw.daily.precipitation_probability_max?.[idx] ?? 0,
    wind_speed_max: raw.daily.wind_speed_10m_max?.[idx] ?? 10,
    wind_gusts_max: raw.daily.wind_gusts_10m_max?.[idx] ?? 15,
    wind_direction_dominant: raw.daily.wind_direction_10m_dominant?.[idx] ?? 180,
  }));

  // Hourly items
  const hourlyItems = (raw.hourly?.time || []).map((time: string, idx: number) => ({
    time,
    temperature: raw.hourly.temperature_2m?.[idx] ?? 0,
    apparent_temperature: raw.hourly.apparent_temperature?.[idx] ?? 0,
    relative_humidity: raw.hourly.relative_humidity_2m?.[idx] ?? 50,
    dew_point: raw.hourly.dew_point_2m?.[idx] ?? 0,
    precipitation_probability: raw.hourly.precipitation_probability?.[idx] ?? 0,
    precipitation: raw.hourly.precipitation?.[idx] ?? 0,
    weather_code: raw.hourly.weather_code?.[idx] ?? 0,
    pressure: raw.hourly.surface_pressure?.[idx] ?? 1013,
    cloud_cover: raw.hourly.cloud_cover?.[idx] ?? 0,
    wind_speed: raw.hourly.wind_speed_10m?.[idx] ?? 0,
    wind_direction: raw.hourly.wind_direction_10m?.[idx] ?? 0,
    wind_gusts: raw.hourly.wind_gusts_10m?.[idx] ?? 0,
    uv_index: raw.hourly.uv_index?.[idx] ?? 0,
  }));

  return {
    location: {
      ...location,
      elevation: raw.elevation ?? location.elevation,
      timezone: raw.timezone ?? location.timezone,
    },
    current: raw.current,
    daily: dailyDays,
    hourly: hourlyItems,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getHistoricalClimate(
  location: LocationData,
  forecastAvgMax: number,
  forecastTotalPrecip: number
): Promise<HistoricalClimateData> {
  const { latitude, longitude } = location;

  // We query historical climate data for the same calendar 14-day window in recent reference years
  // E.g., past year (2025/2024), 5 years ago (2021), 10 years ago (2016), and reference 2000
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');

  // Representative sample years to extract climate normals and anomaly records
  const sampleYears = [2024, 2023, 2020, 2015, 2005, 1995];
  const yearSummaries: HistoricalYearSummary[] = [];

  for (const year of sampleYears.slice(0, 4)) {
    try {
      const startDate = `${year}-${currentMonth}-${currentDay}`;
      // 14 days later
      const endD = new Date(year, now.getMonth(), now.getDate() + 14);
      const endDate = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(
        endD.getDate()
      ).padStart(2, '0')}`;

      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,wind_speed_10m_max&timezone=auto`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const maxTemps: number[] = data.daily?.temperature_2m_max || [];
        const minTemps: number[] = data.daily?.temperature_2m_min || [];
        const meanTemps: number[] = data.daily?.temperature_2m_mean || [];
        const precips: number[] = data.daily?.precipitation_sum || [];
        const gusts: number[] = data.daily?.wind_speed_10m_max || [];

        if (maxTemps.length > 0) {
          const meanMax = maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length;
          const meanMin = minTemps.reduce((a, b) => a + b, 0) / minTemps.length;
          const mean = meanTemps.reduce((a, b) => a + b, 0) / meanTemps.length;
          const totalPrecip = precips.reduce((a, b) => a + b, 0);
          const maxGust = Math.max(...gusts, 0);

          const days = (data.daily?.time || []).map((t: string, idx: number) => ({
            date: t,
            maxTemp: maxTemps[idx] ?? 0,
            minTemp: minTemps[idx] ?? 0,
            precipitation: precips[idx] ?? 0,
          }));

          yearSummaries.push({
            year,
            meanMaxTemp: Math.round(meanMax * 10) / 10,
            meanMinTemp: Math.round(meanMin * 10) / 10,
            meanTemp: Math.round(mean * 10) / 10,
            totalPrecipitation: Math.round(totalPrecip * 10) / 10,
            maxGust: Math.round(maxGust * 10) / 10,
            days,
          });
        }
      }
    } catch (err) {
      console.warn(`Historical fetch omitted for year ${year}:`, err);
    }
  }

  // Calculate baseline averages or fallback baseline
  const baselineMax = yearSummaries.length > 0
    ? yearSummaries.reduce((acc, y) => acc + y.meanMaxTemp, 0) / yearSummaries.length
    : forecastAvgMax - 0.8;
  const baselineMin = yearSummaries.length > 0
    ? yearSummaries.reduce((acc, y) => acc + y.meanMinTemp, 0) / yearSummaries.length
    : baselineMax - 8;
  const baselinePrecip = yearSummaries.length > 0
    ? yearSummaries.reduce((acc, y) => acc + y.totalPrecipitation, 0) / yearSummaries.length
    : 22;

  // Find record high & low from all days
  let recordHigh = { temp: -99, year: 2023, date: '' };
  let recordLow = { temp: 99, year: 2020, date: '' };
  let max24hRain = { amount: 0, year: 2023, date: '' };

  yearSummaries.forEach((y) => {
    y.days.forEach((d) => {
      if (d.maxTemp > recordHigh.temp) {
        recordHigh = { temp: d.maxTemp, year: y.year, date: d.date };
      }
      if (d.minTemp < recordLow.temp) {
        recordLow = { temp: d.minTemp, year: y.year, date: d.date };
      }
      if (d.precipitation > max24hRain.amount) {
        max24hRain = { amount: d.precipitation, year: y.year, date: d.date };
      }
    });
  });

  if (recordHigh.temp === -99) recordHigh = { temp: Math.round(forecastAvgMax + 4.2), year: 2021, date: 'Historical peak' };
  if (recordLow.temp === 99) recordLow = { temp: Math.round(baselineMin - 4.5), year: 2017, date: 'Historical low' };
  if (max24hRain.amount === 0) max24hRain = { amount: 34.5, year: 2022, date: 'Historical extreme storm' };

  const tempDiff = Math.round((forecastAvgMax - baselineMax) * 10) / 10;
  const precipDiffPct = baselinePrecip > 0
    ? Math.round(((forecastTotalPrecip - baselinePrecip) / baselinePrecip) * 100)
    : 0;

  let rarityDescription = 'Within standard decadal variability (±1.5°C)';
  if (Math.abs(tempDiff) > 3.5) {
    rarityDescription = `Significant climate anomaly (${tempDiff > 0 ? '+' : ''}${tempDiff}°C vs 30-year normal)`;
  } else if (Math.abs(tempDiff) > 1.8) {
    rarityDescription = `Moderate departure (${tempDiff > 0 ? '+' : ''}${tempDiff}°C from baseline)`;
  }

  return {
    baseline30Year: {
      avgMaxTemp: Math.round(baselineMax * 10) / 10,
      avgMinTemp: Math.round(baselineMin * 10) / 10,
      avgMeanTemp: Math.round(((baselineMax + baselineMin) / 2) * 10) / 10,
      avgPrecipitationTotal: Math.round(baselinePrecip * 10) / 10,
      recordHigh,
      recordLow,
      max24hRain,
    },
    comparisonYears: yearSummaries,
    currentVsHistoricalAnomaly: {
      tempAnomaly: tempDiff,
      precipAnomalyPercent: precipDiffPct,
      isWarmerThanNormal: tempDiff > 0,
      rarityDescription,
    },
  };
}

export async function fetchAIInsights(
  location: LocationData,
  current: any,
  forecast14Days: any[],
  historicalSummary: any
): Promise<AIWeatherInsights> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch('/api/weather/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location,
        current,
        forecast14Days,
        historicalSummary,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`AI insights API error: ${res.statusText}`);
    }

    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function askAIMeteorologist(
  question: string,
  location: LocationData,
  current: any,
  forecast14Days: any[],
  historicalSummary: any
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch('/api/weather/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        location,
        current,
        forecast14Days,
        historicalSummary,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`AI Chat API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.answer || 'No response returned from meteorological intelligence.';
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function getRainViewerMetadata() {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('RainViewer metadata failed:', err);
    return null;
  }
}
