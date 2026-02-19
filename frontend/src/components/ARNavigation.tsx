import { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  Navigation,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowUp,
} from "lucide-react";
import { NavigationRoute } from "./NavigationDirections";

interface ARNavigationProps {
  route: NavigationRoute | null;
  currentStepIndex: number;
  onClose: () => void;
}

const ARNavigation = ({
  route,
  currentStepIndex,
  onClose,
}: ARNavigationProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const currentStep = route?.steps[currentStepIndex];

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getManeuverIcon = (type: string, modifier: string) => {
    if (type.includes("turn")) {
      if (modifier.includes("left"))
        return <ArrowUpLeft className="w-20 h-20 text-primary animate-pulse" />;
      if (modifier.includes("right"))
        return (
          <ArrowUpRight className="w-20 h-20 text-primary animate-pulse" />
        );
    }
    return <ArrowUp className="w-20 h-20 text-primary animate-pulse" />;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover opacity-80"
      />

      {/* HUD Overlay */}
      <div className="absolute inset-x-0 top-0 p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-primary font-black text-2xl uppercase tracking-tighter">
              AR VISION
            </h2>
            <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Safety Feed
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 glass-panel rounded-full flex items-center justify-center bg-white/10 hover:bg-red-500 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Navigation Cue Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {currentStep && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
            <div className="p-8 glass-panel rounded-full bg-primary/20 border-primary/40 shadow-[0_0_50px_rgba(var(--primary),0.3)]">
              {getManeuverIcon(
                currentStep.maneuver.type,
                currentStep.maneuver.modifier,
              )}
            </div>
            <div className="text-center space-y-2 max-w-xs">
              <div className="text-4xl font-black text-white drop-shadow-2xl">
                {currentStep.instruction}
              </div>
              <div className="text-xl font-bold text-primary italic">
                in {(currentStep.distance / 1000).toFixed(1)} km
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry */}
      <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-between items-end">
          <div className="glass-panel p-4 rounded-2xl bg-white/5 border-white/10">
            <div className="text-[10px] font-black uppercase text-primary mb-1">
              Total Remaining
            </div>
            <div className="text-2xl font-black text-white">
              {(route ? route.distance / 1000 : 0).toFixed(1)}{" "}
              <span className="text-sm font-medium opacity-60">KM</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-[10px] font-black text-primary uppercase tracking-widest text-right">
              Alignment Status
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-1 rounded-full ${i < 4 ? "bg-primary" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Targeting Reticle */}
      <div className="absolute inset-0 border-[40px] border-white/5 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 right-1/4 h-px bg-primary/20" />
        <div className="absolute left-1/2 top-1/4 bottom-1/4 w-px bg-primary/20" />
      </div>
    </div>
  );
};

export default ARNavigation;
