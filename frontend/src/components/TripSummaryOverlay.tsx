import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Clock,
  Route,
  Gauge,
  AlertTriangle,
  ArrowLeft,
  Share2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export interface TripSummaryData {
  distanceKm: number;
  durationSec: number;
  maxSpeedKmh: number;
  avgSpeedKmh: number;
  alertCount: number;
  trailCoords: [number, number][];
  startTime: Date;
  speedSamples: number[];
}

const formatDuration = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

const calculateSafetyScore = (maxSpeed: number, alertCount: number): number => {
  let score = 100;
  if (maxSpeed > 80) score -= (maxSpeed - 80) * 1.5;
  score -= alertCount * 5;
  return Math.max(10, Math.min(100, Math.round(score)));
};

const TripSummaryOverlay = ({
  data,
  onClose,
}: {
  data: TripSummaryData;
  onClose: () => void;
}) => {
  const safetyScore = calculateSafetyScore(data.maxSpeedKmh, data.alertCount);

  const chartData = data.speedSamples.map((speed, i) => ({
    time: i,
    speed: Math.round(speed),
  }));

  const avgSpeed =
    data.speedSamples.length > 0
      ? data.speedSamples.reduce((a, b) => a + b, 0) / data.speedSamples.length
      : 0;

  const stats = [
    {
      icon: Route,
      label: "Distance",
      value: `${data.distanceKm.toFixed(1)} km`,
    },
    { icon: Clock, label: "Duration", value: formatDuration(data.durationSec) },
    {
      icon: Gauge,
      label: "Top Speed",
      value: `${data.maxSpeedKmh.toFixed(0)} km/h`,
    },
    {
      icon: AlertTriangle,
      label: "Safety Alerts",
      value: String(data.alertCount),
    },
  ];

  const handleShare = async () => {
    const text =
      `🛡️ SafeTrip Pro — Mission Complete!\n` +
      `📅 ${data.startTime.toLocaleDateString()} ${data.startTime.toLocaleTimeString()}\n` +
      `📍 Distance: ${data.distanceKm.toFixed(1)} km\n` +
      `⏱ Duration: ${formatDuration(data.durationSec)}\n` +
      `🚀 Top Speed: ${data.maxSpeedKmh.toFixed(0)} km/h\n` +
      `⚡ Avg Speed: ${avgSpeed.toFixed(0)} km/h\n` +
      `🛡 Safety Score: ${safetyScore}/100`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "SafeTrip Pro — Trip Report", text });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Report copied to clipboard!", {
        description: "Paste it anywhere to share your journey.",
      });
    } catch {
      toast.error("Could not share report.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-panel rounded-[2.5rem] shadow-2xl p-5 sm:p-8 md:p-10 animate-in fade-in zoom-in-95 duration-500 my-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter">
              MISSION COMPLETE
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1">
              {data.startTime.toLocaleDateString()} ●{" "}
              {data.startTime.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-12 sm:h-12 glass-panel rounded-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
            aria-label="Close trip summary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Safety Gauge */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-primary/10"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={427}
                  strokeDashoffset={427 - (safetyScore / 100) * 427}
                  className={
                    safetyScore >= 90
                      ? "text-emerald-500 transition-all duration-1000 ease-out"
                      : safetyScore >= 70
                        ? "text-amber-500 transition-all duration-1000 ease-out"
                        : "text-destructive transition-all duration-1000 ease-out"
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-foreground">
                  {safetyScore}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
                  SAFETY SCORE
                </span>
              </div>
            </div>
            <p className="text-sm font-medium italic text-center text-muted-foreground px-4">
              {safetyScore > 90
                ? "Excellent. You are a master of the road."
                : safetyScore > 70
                  ? "Good journey, but maintain consistent speeds."
                  : "Alert. Your safety profile requires attention."}
            </p>
          </div>

          {/* Core Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="card-luxe !p-4 flex flex-col items-center text-center !bg-primary/5 border-none"
              >
                <s.icon className="w-5 h-5 text-primary mb-2" />
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </div>
                <div className="text-base sm:text-lg font-black text-foreground">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Profile Chart */}
        <div className="mt-8 sm:mt-10 space-y-4">
          <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em]">
            Speed Trajectory
          </h3>
          {chartData.length > 1 ? (
            <div className="h-40 sm:h-48 w-full glass-panel !p-4 rounded-3xl !bg-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="speedGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(0,0,0,0.05)"
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, "dataMax + 10"]} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                    }}
                    formatter={(val: number) => [`${val} km/h`, "Speed"]}
                    labelStyle={{ display: "none" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="speed"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#speedGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-24 glass-panel !bg-white/5 rounded-3xl flex items-center justify-center text-muted-foreground text-sm italic">
              Not enough speed data to display chart.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleShare}
            className="btn-premium flex-1 !p-4 !rounded-2xl flex items-center justify-center gap-2 group"
          >
            <Share2 className="w-5 h-5 group-hover:scale-125 transition-transform" />
            Share Report
          </button>
          <button
            onClick={onClose}
            className="glass-panel sm:px-10 py-4 rounded-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripSummaryOverlay;
