import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationData, ForecastData, UnitSystem } from '../types/weather';
import { formatTemp, POPULAR_LOCATIONS } from '../utils/weatherUtils';
import { getRainViewerMetadata, reverseGeocode } from '../services/weatherApi';
import {
  Layers,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  MapPin,
  Crosshair,
  Maximize2,
  Minimize2,
  Info,
  Compass,
  CloudRain,
  Eye,
} from 'lucide-react';

interface InteractiveMapProps {
  location: LocationData;
  forecast: ForecastData;
  unit: UnitSystem;
  onSelectCoordinates: (loc: LocationData) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  location,
  forecast,
  unit,
  onSelectCoordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const stationsLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Radar animation state
  const [radarFrames, setRadarFrames] = useState<any[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlayingRadar, setIsPlayingRadar] = useState(false);
  const [radarHost, setRadarHost] = useState('https://tilecache.rainviewer.com');
  const [activeBaseLayer, setActiveBaseLayer] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [showRadar, setShowRadar] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [radarOpacity, setRadarOpacity] = useState(0.75);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [location.latitude, location.longitude],
      zoom: 6,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
    });

    // Dark Matter basemap
    const darkTile = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    baseLayerRef.current = darkTile;

    // Station markers layer
    const stationsGroup = L.layerGroup().addTo(map);
    stationsLayerGroupRef.current = stationsGroup;

    // Custom pulsing beacon icon for current location
    const customIcon = L.divIcon({
      className: 'custom-weather-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
          <div class="relative w-5 h-5 bg-cyan-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-slate-950 rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([location.latitude, location.longitude], {
      icon: customIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    marker.bindPopup(
      `<div class="p-1 font-sans text-slate-900">
        <strong class="text-sm font-bold">${location.name}</strong><br/>
        <span class="text-xs">${formatTemp(forecast.current.temperature_2m, unit)}</span>
      </div>`
    );

    markerRef.current = marker;

    // Click on map to select any coordinate on earth!
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      try {
        const reverseLoc = await reverseGeocode(lat, lng);
        onSelectCoordinates(reverseLoc);
      } catch (err) {
        onSelectCoordinates({
          name: `Point (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
          latitude: lat,
          longitude: lng,
        });
      }
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center & marker when location changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([location.latitude, location.longitude], 6, {
      animate: true,
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([location.latitude, location.longitude]);
      markerRef.current.setPopupContent(
        `<div class="p-1 font-sans text-slate-900">
          <strong class="text-sm font-bold">${location.name}</strong><br/>
          <span class="text-xs">${formatTemp(forecast.current.temperature_2m, unit)} • Wind: ${forecast.current.wind_speed_10m} km/h</span>
        </div>`
      );
    }
  }, [location, forecast, unit]);

  // Load RainViewer Radar frames
  useEffect(() => {
    let isMounted = true;
    getRainViewerMetadata().then((data) => {
      if (!isMounted || !data) return;
      if (data.host) setRadarHost(data.host);
      const frames = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])];
      if (frames.length > 0) {
        setRadarFrames(frames);
        setCurrentFrameIdx(frames.length - 1); // start at latest live frame
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Radar Layer when frame or visibility changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (!showRadar || radarFrames.length === 0) return;

    const frame = radarFrames[currentFrameIdx];
    if (!frame) return;

    // RainViewer radar tile URL
    const radarTileUrl = `${radarHost}${frame.path}/512/{z}/{x}/{y}/2/1_1.png`;

    const radarLayer = L.tileLayer(radarTileUrl, {
      opacity: radarOpacity,
      zIndex: 500,
      maxZoom: 19,
    }).addTo(map);

    radarLayerRef.current = radarLayer;
  }, [currentFrameIdx, showRadar, radarFrames, radarHost, radarOpacity]);

  // Radar animation playback loop
  useEffect(() => {
    if (!isPlayingRadar || radarFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % radarFrames.length);
    }, 750);

    return () => clearInterval(interval);
  }, [isPlayingRadar, radarFrames]);

  // Switch Base Layers
  const handleSwitchBase = (layer: 'dark' | 'satellite' | 'streets') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap contributors &copy; CARTO';

    if (layer === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    } else if (layer === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    }

    const newBase = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
    baseLayerRef.current = newBase;
    setActiveBaseLayer(layer);

    // Ensure radar layer stays above basemap
    if (radarLayerRef.current) {
      radarLayerRef.current.bringToFront();
    }
  };

  // Render weather station tags across popular world hubs
  useEffect(() => {
    const group = stationsLayerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!showStations) return;

    POPULAR_LOCATIONS.forEach((loc) => {
      if (loc.name.toLowerCase() === location.name.toLowerCase()) return;

      const stationIcon = L.divIcon({
        className: 'station-badge',
        html: `
          <div class="px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-slate-200 shadow-md hover:border-cyan-400 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>${loc.name}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      });

      const stMarker = L.marker([loc.latitude, loc.longitude], {
        icon: stationIcon,
      });

      stMarker.on('click', () => {
        onSelectCoordinates(loc);
      });

      group.addLayer(stMarker);
    });
  }, [showStations, location, onSelectCoordinates]);

  // Center map on location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.latitude, location.longitude], 7, {
        animate: true,
      });
    }
  };

  const currentFrameTime = radarFrames[currentFrameIdx]
    ? new Date(radarFrames[currentFrameIdx].time * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Live';

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : ''}`}>
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interactive Global Weather & Precipitation Radar
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Multi-Layer Leaflet
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time RainViewer radar, global weather stations, and click-anywhere meteorological inspection.
          </p>
        </div>

        {/* Layer & Basemap Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Basemap buttons */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSwitchBase('dark')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeBaseLayer === 'dark'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark Matter
            </button>
            <button
              onClick={() => handleSwitchBase('satellite')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeBaseLayer === 'satellite'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => handleSwitchBase('streets')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeBaseLayer === 'streets'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Streets
            </button>
          </div>

          {/* Toggle Radar */}
          <button
            onClick={() => setShowRadar(!showRadar)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showRadar
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm shadow-blue-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Radar Layer</span>
          </button>

          {/* Toggle World Stations */}
          <button
            onClick={() => setShowStations(!showStations)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showStations
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Stations</span>
          </button>

          {/* Recenter */}
          <button
            onClick={handleRecenter}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Center on Selected Location"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-950">
        <div
          ref={mapContainerRef}
          className={`w-full ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[460px] sm:h-[540px]'}`}
        />

        {/* Radar Timeline Controller (Floating Bottom Overlay) */}
        {showRadar && radarFrames.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[1000] p-3 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingRadar(!isPlayingRadar)}
                  className="p-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  {isPlayingRadar ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() =>
                    setCurrentFrameIdx((prev) => (prev > 0 ? prev - 1 : radarFrames.length - 1))
                  }
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentFrameIdx((prev) => (prev + 1) % radarFrames.length)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-slate-200 text-xs">Precipitation Radar</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {currentFrameTime}
                </span>
                <span className="text-[10px] text-slate-400">
                  {currentFrameIdx === radarFrames.length - 1 ? '• LIVE' : 'Past Frame'}
                </span>
              </div>
            </div>

            {/* Frame scrubber bar */}
            <div className="flex items-center gap-1.5 pt-1">
              {radarFrames.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentFrameIdx(idx)}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    idx === currentFrameIdx
                      ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                      : idx < currentFrameIdx
                      ? 'bg-cyan-900/60'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Opacity slider */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Radar Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={radarOpacity}
                onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Map Information / Instructions Overlay */}
        <div className="absolute top-4 left-4 z-[1000] hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click anywhere on the world map to inspect weather</span>
        </div>

        {/* Live Coordinate Display */}
        {mouseCoords && (
          <div className="absolute top-4 right-4 z-[1000] hidden sm:block px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400">
            {mouseCoords.lat.toFixed(3)}°N, {mouseCoords.lng.toFixed(3)}°E
          </div>
        )}
      </div>
    </div>
  );
};
