import { useEffect, useState, useRef } from "react";
import { BACKEND_URL } from "@/lib/constants";
import { useAuth } from "./useAuth";

export interface EnvironmentData {
  weather: {
    temp: number;
    condition: string;
    riskLevel: string;
  };
  traffic: {
    congestionLabel: string; // 'Free Flow', 'Moderate', 'Heavy'
    avgSpeedKmh: number | null;
  };
  loading: boolean;
}

// Helper to calculate distance
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function useEnvironment(lat: number, lon: number) {
  const { session } = useAuth();
  const [data, setData] = useState<EnvironmentData>({
    weather: { temp: 25, condition: "Clear", riskLevel: "LOW" },
    traffic: { congestionLabel: "Moderate", avgSpeedKmh: 40 },
    loading: true,
  });

  const lastFetchRef = useRef<{ lat: number; lon: number; time: number }>({
    lat: 0,
    lon: 0,
    time: 0,
  });

  useEffect(() => {
    if (!lat || !lon) return;

    const distMoved = getDistance(
      lastFetchRef.current.lat,
      lastFetchRef.current.lon,
      lat,
      lon,
    );
    const timeElapsed = Date.now() - lastFetchRef.current.time;

    // Only fetch if moved > 200m OR 5 minutes passed
    if (
      lastFetchRef.current.time !== 0 &&
      distMoved < 0.2 &&
      timeElapsed < 300000
    ) {
      return;
    }

    const fetchData = async () => {
      try {
        lastFetchRef.current = { lat, lon, time: Date.now() };

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const [weatherRes, trafficRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`, {
            headers,
          }),
          fetch(`${BACKEND_URL}/api/traffic?lat=${lat}&lon=${lon}`, {
            headers,
          }),
        ]);

        const weather = await weatherRes.json();
        const traffic = await trafficRes.json();

        setData({
          weather: {
            temp: weather.temp,
            condition: weather.condition,
            riskLevel: weather.drivingRisk?.level || "LOW",
          },
          traffic: {
            congestionLabel: traffic.congestionLabel,
            avgSpeedKmh: traffic.avgSpeedKmh || null,
          },
          loading: false,
        });
      } catch (err) {
        console.error("Environment fetch failed", err);
      }
    };

    fetchData();
    // We don't need a setInterval here because the parent passes new coords
    // and this useEffect handles the distance-based throttling.
  }, [lat, lon, session]);

  return data;
}
