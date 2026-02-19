import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/constants";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  CloudFog,
  CloudLightning,
} from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  message: string;
}

// BACKEND_URL is now imported from @/lib/constants

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll weather every 5 minutes
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Default to Hyderabad/Central location if no GPS yet, or use real coords if passed props
        // For now, we'll fetch generic location or user's last known
        const res = await fetch(
          `${BACKEND_URL}/api/weather?lat=17.385&lon=78.486`,
        );
        const json = await res.json();

        setData({
          temp: json.temp,
          condition: json.condition, // Clear, Rain, etc.
          location: json.city,
          riskLevel: json.drivingRisk?.level || "LOW",
          message: json.drivingRisk?.message || "",
        });
      } catch (err) {
        console.error("Weather fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;
  if (!data) return null;

  const getIcon = () => {
    const c = data.condition.toLowerCase();
    if (c.includes("rain")) return CloudRain;
    if (c.includes("cloud")) return Cloud;
    if (c.includes("fog") || c.includes("mist")) return CloudFog;
    if (c.includes("thunder")) return CloudLightning;
    return Sun;
  };

  const Icon = getIcon();

  return (
    <div className="glass-panel p-2 pr-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700 shadow-lg border border-white/20">
      <div
        className={`p-2 rounded-xl ${data.riskLevel === "HIGH" ? "bg-red-500/20 text-red-600" : "bg-blue-500/10 text-blue-600"}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            {Math.round(data.temp)}°
          </span>
          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            {data.condition}
          </span>
        </div>
        {data.riskLevel !== "LOW" && (
          <div className="text-[10px] font-bold text-orange-600 leading-none mt-0.5 animate-pulse">
            ⚠️ {data.message}
          </div>
        )}
      </div>
    </div>
  );
}
