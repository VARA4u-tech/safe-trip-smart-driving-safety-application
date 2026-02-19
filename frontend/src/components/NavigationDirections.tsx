import { useState, useEffect, useRef } from "react";
import {
  Navigation,
  X,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCw,
  MapPin,
  Clock,
  Route,
  Volume2,
  VolumeX,
  Camera,
} from "lucide-react";

export interface DirectionStep {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  maneuver: {
    type: string;
    modifier?: string;
  };
}

export interface NavigationRoute {
  distance: number; // meters
  duration: number; // seconds
  steps: DirectionStep[];
  geometry: GeoJSON.LineString;
}

interface NavigationDirectionsProps {
  route: NavigationRoute | null;
  destinationName: string;
  onClose: () => void;
  currentStepIndex: number;
  onToggleAR?: () => void;
}

const getManeuverIcon = (type: string, modifier?: string) => {
  if (type === "arrive") return MapPin;
  if (type === "depart") return Navigation;
  if (type === "roundabout" || type === "rotary") return RotateCw;
  if (
    type === "turn" ||
    type === "end of road" ||
    type === "fork" ||
    type === "merge"
  ) {
    if (modifier?.includes("slight left")) return ArrowUpLeft;
    if (modifier?.includes("slight right")) return ArrowUpRight;
    if (modifier?.includes("sharp left")) return ArrowLeft;
    if (modifier?.includes("sharp right")) return ArrowRight;
    if (modifier?.includes("left")) return CornerUpLeft;
    if (modifier?.includes("right")) return CornerUpRight;
  }
  return ArrowUp;
};

const formatDistance = (m: number): string => {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
};

const formatDuration = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
};

const hudPillStyle = {
  background: "hsl(38, 30%, 93%, 0.95)",
  boxShadow:
    "inset 0 1px 2px rgba(139,115,85,0.15), 0 2px 8px rgba(0,0,0,0.12)",
};

/** Speak a direction aloud via Web Speech Synthesis */
const speak = (text: string) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // interrupt previous
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.pitch = 1;
  utt.volume = 1;
  // prefer a natural-sounding voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("google") ||
        v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("female")),
  );
  if (preferred) utt.voice = preferred;
  window.speechSynthesis.speak(utt);
};

const NavigationDirections = ({
  route,
  destinationName,
  onClose,
  currentStepIndex,
  onToggleAR,
}: NavigationDirectionsProps) => {
  const [expanded, setExpanded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const lastSpokenIndexRef = useRef<number>(-1);

  // Announce each new step via speech synthesis
  useEffect(() => {
    if (!route || !voiceEnabled) return;
    if (currentStepIndex === lastSpokenIndexRef.current) return;

    const step = route.steps[currentStepIndex];
    if (step?.instruction) {
      const distText =
        step.distance > 0
          ? ` in ${formatDistance(step.distance).replace("km", "kilometres")}`
          : "";
      speak(`${step.instruction}${distText}`);
      lastSpokenIndexRef.current = currentStepIndex;
    }
  }, [currentStepIndex, route, voiceEnabled]);

  // Stop speech when route is cleared
  useEffect(() => {
    if (!route && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [route]);

  if (!route) return null;

  const currentStep = route.steps[currentStepIndex];
  const CurrentIcon = currentStep
    ? getManeuverIcon(currentStep.maneuver.type, currentStep.maneuver.modifier)
    : ArrowUp;

  return (
    <div
      className="absolute top-20 lg:top-28 left-3 right-3 sm:left-4 sm:right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-30 flex flex-col gap-2"
      role="navigation"
      aria-label="Turn-by-turn directions"
    >
      {/* Current step banner */}
      <div
        className="rounded-xl border-2 border-vintage-border-outer p-3"
        style={hudPillStyle}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-vintage-border-outer"
            style={{ background: "hsl(32, 50%, 40%)" }}
          >
            <CurrentIcon className="w-5 h-5 text-vintage-parchment" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-sm font-bold text-foreground leading-snug">
              {currentStep?.instruction || "Starting navigation…"}
            </p>
            {currentStep && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistance(currentStep.distance)} ·{" "}
                {formatDuration(currentStep.duration)}
              </p>
            )}
          </div>

          {/* Voice toggle */}
          <button
            onClick={() => {
              setVoiceEnabled((v) => {
                if (v) window.speechSynthesis?.cancel();
                return !v;
              });
            }}
            className="w-8 h-8 rounded-full border border-vintage-border-outer flex items-center justify-center shrink-0 hover:bg-secondary/40 transition-colors"
            aria-label={
              voiceEnabled ? "Mute voice navigation" : "Enable voice navigation"
            }
            title={voiceEnabled ? "Mute voice" : "Enable voice"}
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* AR Toggle */}
          {onToggleAR && (
            <button
              onClick={onToggleAR}
              className="w-8 h-8 rounded-full border border-vintage-border-outer flex items-center justify-center shrink-0 bg-primary/10 hover:bg-primary hover:text-white transition-all shadow-sm"
              aria-label="Toggle AR Mode"
              title="Enter AR Vision"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-vintage-border-outer flex items-center justify-center shrink-0 hover:bg-secondary/40 transition-colors"
            aria-label="Stop navigation"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Route summary bar */}
        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-vintage-border-outer/40 flex-wrap">
          <div className="flex items-center gap-1">
            <Route className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {formatDistance(route.distance)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {formatDuration(route.duration)}
            </span>
          </div>
          {destinationName && (
            <div className="flex items-center gap-1 truncate min-w-0">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {destinationName}
              </span>
            </div>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary font-semibold shrink-0"
            aria-expanded={expanded}
          >
            {expanded ? "Hide" : "Steps"}
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded step list */}
      {expanded && (
        <div
          className="rounded-xl border-2 border-vintage-border-outer overflow-hidden max-h-52 overflow-y-auto animate-in slide-in-from-top-2 duration-300"
          style={hudPillStyle}
          role="list"
        >
          {route.steps.map((step, i) => {
            const Icon = getManeuverIcon(
              step.maneuver.type,
              step.maneuver.modifier,
            );
            const isCurrent = i === currentStepIndex;
            const isPast = i < currentStepIndex;
            return (
              <div
                key={i}
                role="listitem"
                className={`flex items-center gap-3 px-3 py-2.5 border-b border-vintage-border-outer/30 last:border-b-0 transition-colors ${
                  isCurrent ? "bg-primary/10" : isPast ? "opacity-40" : ""
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs leading-snug truncate ${
                      isCurrent
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.instruction}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistance(step.distance)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NavigationDirections;
