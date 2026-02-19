import { useState, useRef, useEffect, useCallback } from "react";
import { Eye, EyeOff, AlertTriangle, Settings } from "lucide-react";
import { toast } from "sonner";

const DrowsinessDetection = () => {
  const [isActive, setIsActive] = useState(false);
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [permission, setPermission] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 160 },
          height: { ideal: 120 },
          facingMode: "user",
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setPermission("granted");
        setIsActive(true);
        toast.success("Drowsiness Detection Active", {
          description: "AI is monitoring your eye patterns for safety.",
        });
      }
    } catch (err) {
      setPermission("denied");
      toast.error("Camera access denied. Drowsiness detection disabled.");
    }
  };

  const stopDetection = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsActive(false);
    setIsDrowsy(false);
  };

  // Simulation of AI detection (In a production app, we would use tensorflow.js here)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isActive) {
      interval = setInterval(() => {
        // Randomly simulate drowsiness for demo purposes if eyes were "closed"
        // In real use, this would be computed from the video feed
        const chance = Math.random();
        if (chance > 0.98) {
          triggerAlarm();
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  const triggerAlarm = useCallback(() => {
    setIsDrowsy(true);
    if (!alarmRef.current) {
      alarmRef.current = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      );
      alarmRef.current.loop = true;
    }
    alarmRef.current.play().catch(() => {});

    toast.error("WAKE UP! ALERT DETECTED", {
      description: "You seem drowsy. Please pull over and rest.",
      duration: 10000,
      action: {
        label: "I'm Awake",
        onClick: stopAlarm,
      },
    });
  }, []);

  const stopAlarm = () => {
    setIsDrowsy(false);
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  };

  return (
    <div className="card-luxe !bg-white/5 flex items-center justify-between group overflow-hidden relative">
      <div className="flex items-center gap-4 z-10">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            isActive
              ? isDrowsy
                ? "bg-red-500 animate-pulse"
                : "bg-primary/20"
              : "bg-vintage-border-outer/20"
          }`}
        >
          {isDrowsy ? (
            <AlertTriangle className="w-6 h-6 text-white" />
          ) : isActive ? (
            <Eye className="w-6 h-6 text-primary" />
          ) : (
            <EyeOff className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <div className="font-black text-foreground text-sm uppercase tracking-tight">
            AI Drowsiness Monitor
          </div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {isDrowsy
              ? "⚠️ IMMEDIATE REST REQUIRED"
              : isActive
                ? "🟢 Monitoring active"
                : "⚪ System Standby"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 z-10">
        {isActive && (
          <div className="w-16 h-12 rounded-lg bg-black overflow-hidden border border-primary/20 shadow-inner group-hover:w-24 transition-all duration-300">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover grayscale opacity-60"
            />
          </div>
        )}

        <button
          onClick={isActive ? stopDetection : startDetection}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isActive
              ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {isActive ? "Turn Off" : "Enable AI"}
        </button>
      </div>

      {/* Decorative pulse when drowsy */}
      {isDrowsy && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

export default DrowsinessDetection;
