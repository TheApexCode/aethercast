import React from 'react';
import {
  Sun,
  SunMedium,
  Moon,
  MoonStar,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudHail,
  Zap,
  Wind,
} from 'lucide-react';

interface WeatherIconProps {
  code: number;
  isDay?: number;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  code,
  isDay = 1,
  className = 'w-6 h-6',
  size,
}) => {
  const iconProps = { className, size };

  switch (code) {
    case 0:
      return isDay ? (
        <Sun {...iconProps} className={`${className} text-amber-400 animate-[spin_20s_linear_infinite]`} />
      ) : (
        <Moon {...iconProps} className={`${className} text-indigo-200`} />
      );
    case 1:
      return isDay ? (
        <SunMedium {...iconProps} className={`${className} text-amber-300`} />
      ) : (
        <MoonStar {...iconProps} className={`${className} text-indigo-300`} />
      );
    case 2:
      return <CloudSun {...iconProps} className={`${className} text-sky-300`} />;
    case 3:
      return <Cloud {...iconProps} className={`${className} text-slate-300`} />;
    case 45:
    case 48:
      return <CloudFog {...iconProps} className={`${className} text-teal-300`} />;
    case 51:
    case 53:
    case 55:
      return <CloudDrizzle {...iconProps} className={`${className} text-cyan-300`} />;
    case 56:
    case 57:
      return <CloudHail {...iconProps} className={`${className} text-cyan-200`} />;
    case 61:
    case 63:
      return <CloudRain {...iconProps} className={`${className} text-blue-400`} />;
    case 65:
      return <CloudLightning {...iconProps} className={`${className} text-indigo-400`} />;
    case 66:
    case 67:
      return <CloudHail {...iconProps} className={`${className} text-sky-200`} />;
    case 71:
    case 73:
    case 75:
    case 77:
      return <CloudSnow {...iconProps} className={`${className} text-slate-100`} />;
    case 80:
    case 81:
    case 82:
      return <CloudRain {...iconProps} className={`${className} text-cyan-400`} />;
    case 85:
    case 86:
      return <CloudSnow {...iconProps} className={`${className} text-cyan-100`} />;
    case 95:
      return <Zap {...iconProps} className={`${className} text-yellow-400 animate-pulse`} />;
    case 96:
    case 99:
      return <Zap {...iconProps} className={`${className} text-red-400 animate-pulse`} />;
    default:
      return <Cloud {...iconProps} className={`${className} text-slate-400`} />;
  }
};
