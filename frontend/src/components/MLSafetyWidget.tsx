import { useEffect, useState } from "react";
import { Brain, ShieldCheck, ShieldAlert, BadgeAlert } from "lucide-react";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { BACKEND_URL } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

interface SafetyPrediction {
  probability: number;
  level: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  contributingFactors: string[];
}

interface Props {
  currentSpeedKmh: number;
  weatherCondition: string;
  trafficLevel: string;
}

export default function MLSafetyWidget({
  currentSpeedKmh,
  weatherCondition,
  trafficLevel,
}: Props) {
  const { session } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompact = isMobile || isTablet;
  const [prediction, setPrediction] = useState<SafetyPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  // Poll prediction every 5 seconds or when speed changes significantly
  useEffect(() => {
    // Debounce to avoid flooding backend
    const timeout = setTimeout(() => {
      fetchPrediction();
    }, 2000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpeedKmh, weatherCondition, trafficLevel, session]);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${BACKEND_URL}/api/predict-accident`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          speedKmh: currentSpeedKmh,
          weatherCondition: weatherCondition || "Clear",
          timeHour: new Date().getHours(),
          trafficLevel: trafficLevel || "moderate",
          incidentHistoryCount: 0, // In future, get from backend
        }),
      });
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      console.error("ML Prediction failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!prediction) return null;

  // Determine UI state
  const isSafe = prediction.level === "LOW";
  const isDanger = prediction.level === "HIGH";

  const Icon = isDanger ? BadgeAlert : isSafe ? ShieldCheck : ShieldAlert;
  const colorClass = isDanger
    ? "text-red-500"
    : isSafe
      ? "text-green-500"
      : "text-yellow-500";
  const bgClass = isDanger
    ? "bg-red-500/10 border-red-500/30"
    : isSafe
      ? "bg-green-500/10 border-green-500/30"
      : "bg-yellow-500/10 border-yellow-500/30";

  if (isCompact) {
    return (
      <div
        className={`glass-panel p-2 rounded-2xl flex items-center gap-2 shadow-lg border relative ${bgClass}`}
        title={`${100 - prediction.probability}% Safe`}
      >
        <div className="relative">
          <Icon
            className={`w-5 h-5 ${colorClass} ${isDanger ? "animate-pulse" : ""}`}
          />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-background flex items-center justify-center">
            <Brain className="w-1 h-1 text-white" />
          </div>
        </div>
        <span className={`text-[11px] font-black tabular-nums ${colorClass}`}>
          {100 - prediction.probability}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={`glass-panel p-3 pr-5 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700 shadow-lg border ${bgClass}`}
    >
      {/* Risk Icon with Pulse */}
      <div
        className={`relative p-2.5 rounded-xl ${isSafe ? "bg-green-500/20" : "bg-background/40"}`}
      >
        <Icon
          className={`w-6 h-6 ${colorClass} ${isDanger ? "animate-pulse" : ""}`}
        />
        {/* AI Dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
          <Brain className="w-1.5 h-1.5 text-white" />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">
            AI SAFETY SCORE
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-black tabular-nums tracking-tight ${colorClass}`}
          >
            {100 - prediction.probability}%
          </span>
          <span className="text-[10px] font-bold opacity-60">SAFE</span>
        </div>

        {/* Dynamic Factor Message */}
        {!isSafe && prediction.contributingFactors.length > 0 && (
          <div
            className={`text-[10px] font-bold leading-none mt-1 ${colorClass}`}
          >
            ⚠️ {prediction.contributingFactors[0]}
          </div>
        )}
        {isSafe && (
          <div className="text-[10px] font-bold leading-none mt-1 text-green-600/80">
            ✅ Optimal Conditions
          </div>
        )}
      </div>
    </div>
  );
}
