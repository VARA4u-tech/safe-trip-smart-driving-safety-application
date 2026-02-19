import { useState } from "react";
import { useNavigate } from "react-router-dom";
import VintageLayout from "@/components/VintageLayout";
import { useTripStore, type SavedTrip } from "@/hooks/useTripStore";
import {
  ArrowLeft,
  Calendar,
  Route,
  Clock,
  AlertTriangle,
  MapPin,
  Gauge,
  Shield,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

const ScoreBadge = ({ score }: { score: number }) => {
  const color =
    score >= 90
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : score >= 70
        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
        : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${color}`}
    >
      <Shield className="w-3 h-3" />
      {score}
    </span>
  );
};

const formatDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

const TripCard = ({
  trip,
  onDelete,
}: {
  trip: SavedTrip;
  onDelete: (id: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="card-luxe !p-0 overflow-hidden group">
      {/* Main Row */}
      <button
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-primary/5 transition-colors"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={`Trip on ${trip.date}`}
      >
        {/* Score Ring */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-primary/10"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 - (trip.safetyScore / 100) * 125.6}
              className={
                trip.safetyScore >= 90
                  ? "text-emerald-500"
                  : trip.safetyScore >= 70
                    ? "text-amber-500"
                    : "text-destructive"
              }
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-foreground">
            {trip.safetyScore}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground text-sm">
              {trip.date}
            </span>
            <span className="text-muted-foreground text-xs">
              {trip.startTime}
            </span>
          </div>
          {(trip.startLocation || trip.endLocation) && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {trip.startLocation ?? "—"} → {trip.endLocation ?? "—"}
            </div>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Route className="w-3 h-3" />
              {trip.distanceKm.toFixed(1)} km
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDuration(trip.durationSec)}
            </span>
            {trip.alertCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-500">
                <AlertTriangle className="w-3 h-3" />
                {trip.alertCount} alert{trip.alertCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Expand toggle */}
        <div className="ml-auto flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-primary/5 bg-primary/3 px-4 sm:px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              {
                icon: Gauge,
                label: "Top Speed",
                value: `${trip.maxSpeedKmh.toFixed(0)} km/h`,
              },
              {
                icon: Zap,
                label: "Avg Speed",
                value: `${trip.avgSpeedKmh.toFixed(0)} km/h`,
              },
              {
                icon: Shield,
                label: "Safety Score",
                value: String(trip.safetyScore),
              },
              {
                icon: AlertTriangle,
                label: "Alerts Logged",
                value: String(trip.alertCount),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="glass-panel rounded-xl p-3 flex flex-col items-center text-center bg-background/30"
              >
                <s.icon className="w-4 h-4 text-primary mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <span className="text-sm font-black text-foreground">
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onDelete(trip.id)}
              className="flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive font-bold transition-colors hover:underline"
              aria-label="Delete this trip"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Trip
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

const TripHistoryScreen = () => {
  const navigate = useNavigate();
  const { trips, deleteTrip, clearAllTrips } = useTripStore();
  const [confirmClear, setConfirmClear] = useState(false);

  // Aggregate stats
  const totalDistance = trips.reduce((s, t) => s + t.distanceKm, 0);
  const totalDuration = trips.reduce((s, t) => s + t.durationSec, 0);
  const avgScore =
    trips.length > 0
      ? Math.round(trips.reduce((s, t) => s + t.safetyScore, 0) / trips.length)
      : 0;

  return (
    <VintageLayout>
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center gap-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter">
              TRIP HISTORY
            </h1>
            <p className="text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase">
              {trips.length} mission{trips.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </header>

        {/* Summary Stats (only when there are trips) */}
        {trips.length > 0 && (
          <section
            className="grid grid-cols-3 gap-3"
            aria-label="Trip statistics"
          >
            {[
              {
                icon: Route,
                label: "Total Distance",
                value: `${totalDistance.toFixed(1)} km`,
              },
              {
                icon: Clock,
                label: "Total Time",
                value: formatDuration(totalDuration),
              },
              {
                icon: Shield,
                label: "Avg Safety",
                value: String(avgScore),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="card-luxe !p-4 flex flex-col items-center text-center !bg-primary/5 border-none"
              >
                <s.icon className="w-5 h-5 text-primary mb-1.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <span className="text-lg font-black text-foreground">
                  {s.value}
                </span>
              </div>
            ))}
          </section>
        )}

        {/* Trip List */}
        {trips.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8 text-primary/50" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight">
              No Trips Yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Launch a mission from the map screen to begin recording your
              journeys.
            </p>
            <button
              onClick={() => navigate("/trip")}
              className="btn-premium mt-2 !py-3 !px-8"
            >
              Launch First Mission
            </button>
          </div>
        ) : (
          <section className="space-y-3" aria-label="Trip list">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
            ))}
          </section>
        )}

        {/* Clear All */}
        {trips.length > 0 && (
          <div className="flex justify-center pb-6">
            {confirmClear ? (
              <div className="glass-panel rounded-2xl p-5 text-center space-y-3 w-full max-w-sm">
                <p className="text-sm font-bold text-foreground">
                  Clear all{" "}
                  <span className="text-destructive">{trips.length}</span> trip
                  records?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      clearAllTrips();
                      setConfirmClear(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-destructive text-white font-black text-sm uppercase tracking-wider hover:bg-destructive/90 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="flex-1 py-3 rounded-xl glass-panel font-bold text-sm uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All History
              </button>
            )}
          </div>
        )}
      </div>
    </VintageLayout>
  );
};

export default TripHistoryScreen;
