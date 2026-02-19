import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/constants";

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

export function useEnvironment(lat: number, lon: number) {
  const [data, setData] = useState<EnvironmentData>({
    weather: { temp: 25, condition: "Clear", riskLevel: "LOW" },
    traffic: { congestionLabel: "Moderate", avgSpeedKmh: 40 },
    loading: true,
  });

  useEffect(() => {
    if (!lat || !lon) return;

    const fetchData = async () => {
      try {
        const [weatherRes, trafficRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`),
          fetch(`${BACKEND_URL}/api/traffic?lat=${lat}&lon=${lon}`),
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
    const interval = setInterval(fetchData, 60000); // refresh every minute

    return () => clearInterval(interval);
  }, [lat, lon]);

  return data;
}
