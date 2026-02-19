import { useState, useCallback } from "react";

export interface SavedTrip {
  id: string;
  date: string;
  startTime: string;
  distanceKm: number;
  durationSec: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  alertCount: number;
  safetyScore: number;
  speedSamples: number[];
  startLocation?: string;
  endLocation?: string;
}

const STORAGE_KEY = "safetrip_trip_history";

const calculateSafetyScore = (maxSpeed: number, alertCount: number): number => {
  let score = 100;
  if (maxSpeed > 80) score -= (maxSpeed - 80) * 1.5;
  score -= alertCount * 5;
  return Math.max(10, Math.min(100, Math.round(score)));
};

const formatDuration = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

export const useTripStore = () => {
  const [trips, setTrips] = useState<SavedTrip[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedTrip[]) : [];
    } catch {
      return [];
    }
  });

  const saveTrip = useCallback(
    (data: {
      distanceKm: number;
      durationSec: number;
      maxSpeedKmh: number;
      avgSpeedKmh: number;
      alertCount: number;
      startTime: Date;
      speedSamples: number[];
      startLocation?: string;
      endLocation?: string;
    }) => {
      const newTrip: SavedTrip = {
        id: `trip_${Date.now()}`,
        date: data.startTime.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        startTime: data.startTime.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        distanceKm: data.distanceKm,
        durationSec: data.durationSec,
        maxSpeedKmh: data.maxSpeedKmh,
        avgSpeedKmh: data.avgSpeedKmh,
        alertCount: data.alertCount,
        safetyScore: calculateSafetyScore(data.maxSpeedKmh, data.alertCount),
        speedSamples: data.speedSamples,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
      };

      setTrips((prev) => {
        const updated = [newTrip, ...prev].slice(0, 50); // keep last 50 trips
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // storage quota exceeded — silently fail
        }
        return updated;
      });

      return newTrip;
    },
    [],
  );

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearAllTrips = useCallback(() => {
    setTrips([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const formatDurationExport = formatDuration;

  return {
    trips,
    saveTrip,
    deleteTrip,
    clearAllTrips,
    formatDuration: formatDurationExport,
  };
};
