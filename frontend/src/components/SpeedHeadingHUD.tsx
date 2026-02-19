import { Compass, Gauge, Clock, Route } from "lucide-react";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";

interface SpeedHeadingHUDProps {
  speed: number | null;
  heading: number | null;
  gpsActive: boolean;
  tripActive: boolean;
  tripDistanceKm: number;
  tripDurationSec: number;
  isCompact?: boolean;
}

const getCardinalDirection = (deg: number): string => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
};

const formatDuration = (totalSec: number): string => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const hudPillStyle = {
  background: "hsl(38, 30%, 93%, 0.92)",
  boxShadow: "inset 0 1px 2px rgba(139,115,85,0.15), 0 1px 3px rgba(0,0,0,0.1)",
};

const SpeedHeadingHUD = ({
  speed,
  heading,
  gpsActive,
  tripActive,
  tripDistanceKm,
  tripDurationSec,
  isCompact: isCompactProp,
}: SpeedHeadingHUDProps) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompact = isCompactProp ?? (isMobile || isTablet);
  const speedKmh = speed !== null ? Math.round(speed * 3.6) : 0;
  const headingDeg = heading !== null ? Math.round(heading) : null;

  return (
    <div
      className={`absolute left-3 z-20 flex flex-col gap-2 group ${isCompact ? "bottom-44" : "bottom-40 sm:left-4 gap-3"}`}
    >
      {/* Prime Instrument: Speed */}
      <div
        className={`glass-panel rounded-2xl flex flex-col items-center shadow-2xl transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 ${isCompact ? "p-2.5 min-w-[70px]" : "p-4 min-w-[100px] group-hover:scale-110"}`}
      >
        <Gauge
          className={`${isCompact ? "w-4 h-4" : "w-5 h-5 mb-1"} opacity-60`}
        />
        <div className="flex items-baseline gap-1">
          <span
            className={`${isCompact ? "text-2xl" : "text-4xl"} font-black tracking-tighter`}
          >
            {gpsActive ? speedKmh : "0"}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
            km/h
          </span>
        </div>
      </div>

      {/* Secondary Instruments Stack */}
      <div className="flex flex-col gap-2">
        <div
          className={`glass-panel border-primary/10 rounded-xl flex items-center gap-2 shadow-lg transition-transform ${isCompact ? "px-2 py-1.5" : "px-4 py-3 sm:rounded-2xl gap-3 hover:translate-x-2"}`}
        >
          <Compass
            className={`${isCompact ? "w-4 h-4" : "w-5 h-5"} text-primary transition-transform duration-700`}
            style={{
              transform:
                headingDeg !== null ? `rotate(${headingDeg}deg)` : "none",
            }}
          />
          <span
            className={`${isCompact ? "text-[10px]" : "text-sm"} font-bold tracking-tight`}
          >
            {gpsActive && headingDeg !== null
              ? isCompact
                ? `${headingDeg}°`
                : `${headingDeg}° ${getCardinalDirection(headingDeg)}`
              : "CALIBRATING..."}
          </span>
        </div>

        {tripActive && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
              <Route className="w-4 h-4 opacity-70" />
              <span className="font-bold text-sm">
                {tripDistanceKm.toFixed(1)} km
              </span>
            </div>
            <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
              <Clock className="w-4 h-4 opacity-70" />
              <span className="font-bold text-sm">
                {formatDuration(tripDurationSec)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeedHeadingHUD;
