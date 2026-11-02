import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  Globe,
  Sliders,
} from 'lucide-react';
import { LocationData, UnitSystem, TriggeredAlert } from '../types/weather';
import { searchLocations, reverseGeocode } from '../services/weatherApi';
import { POPULAR_LOCATIONS } from '../utils/weatherUtils';

interface HeaderProps {
  currentLocation: LocationData;
  onSelectLocation: (loc: LocationData) => void;
  unit: UnitSystem;
  onToggleUnit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAlerts: () => void;
  onOpenAiChat: () => void;
  activeAlerts: TriggeredAlert[];
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  unit,
  onToggleUnit,
  soundEnabled,
  onToggleSound,
  onOpenAlerts,
  onOpenAiChat,
  activeAlerts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsOpenDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setIsOpenDropdown(results.length > 0);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpenDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const loc = await reverseGeocode(lat, lon);
          onSelectLocation(loc);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3.5">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectLocation(POPULAR_LOCATIONS[0])}>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-500" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    AetherCast
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
                    AI 3.8
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Globe className="w-3 h-3 text-cyan-500" />
                  Global Climate & 14-Day Intel
                </p>
              </div>
            </div>

            {/* Mobile quick action items */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onOpenAlerts}
                className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Alert Center"
              >
                <Bell className="w-4 h-4" />
                {activeAlerts.length > 0 && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    criticalCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {activeAlerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={onToggleUnit}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-cyan-400"
              >
                {unit === 'metric' ? '°C' : '°F'}
              </button>
            </div>
          </div>

          {/* Search Bar & Auto-suggestions */}
          <div ref={searchContainerRef} className="relative w-full md:max-w-md">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setIsOpenDropdown(true);
                }}
                placeholder="Search global city, coordinate, region..."
                className="w-full pl-10 pr-10 py-2 text-sm bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 shadow-inner transition-all font-sans"
              />
              {isSearching ? (
                <Loader2 className="absolute right-3.5 w-4 h-4 text-cyan-400 animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLocating}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                  title="Detect My Location"
                >
                  <MapPin className={`w-4 h-4 ${isLocating ? 'animate-bounce text-cyan-400' : ''}`} />
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {isOpenDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/60 flex items-center justify-between">
                  <span>Locations Found ({searchResults.length})</span>
                  <span className="text-[10px] text-cyan-400">Global Registry</span>
                </div>
                {searchResults.map((loc) => (
                  <button
                    key={`${loc.name}-${loc.latitude}-${loc.longitude}-${loc.id}`}
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc);
                      setIsOpenDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <MapPin className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                      <div className="truncate">
                        <span className="font-medium text-slate-200 group-hover:text-white text-sm">
                          {loc.name}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5">
                          {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono shrink-0 pl-2">
                      {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Tools & Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Ask AI Meteorologist */}
            <button
              onClick={onOpenAiChat}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm hover:shadow-cyan-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Ask AI</span>
            </button>

            {/* Alert Center Trigger */}
            <button
              onClick={onOpenAlerts}
              className="relative px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Custom Alert Thresholds"
            >
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Alerts</span>
              {activeAlerts.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  criticalCount > 0
                    ? 'bg-rose-500 text-white animate-pulse'
                    : warningCount > 0
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-cyan-500 text-slate-950'
                }`}>
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {/* Sound toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                soundEnabled
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Alert Chime Sound: ON' : 'Alert Chime Sound: MUTED'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Unit Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => unit !== 'metric' && onToggleUnit()}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                  unit === 'metric'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => unit !== 'imperial' && onToggleUnit()}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                  unit === 'imperial'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °F
              </button>
            </div>
          </div>
        </div>

        {/* Global Hotspots Pills for Fast Discovery */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Sliders className="w-3 h-3 text-slate-500" />
            Quick Explore:
          </span>
          {POPULAR_LOCATIONS.map((loc) => {
            const isSelected =
              currentLocation.name.toLowerCase() === loc.name.toLowerCase();
            return (
              <button
                key={loc.name}
                onClick={() => onSelectLocation(loc)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 border border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <span>{loc.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {loc.country_code || loc.country?.slice(0, 2).toUpperCase() || ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
