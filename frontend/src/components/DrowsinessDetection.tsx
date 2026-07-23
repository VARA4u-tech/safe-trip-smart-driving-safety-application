import { useState, useRef, useEffect, useCallback } from "react";
import { Eye, EyeOff, AlertTriangle, Settings } from "lucide-react";
import { toast } from "sonner";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

// Indices for computing EAR with MediaPipe Face Mesh
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
const LEFT_EYE = [362, 385, 387, 263, 373, 380];

const distance = (p1: any, p2: any) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const calculateEAR = (landmarks: any[], eyeIndices: number[]) => {
  const p1 = landmarks[eyeIndices[0]];
  const p2 = landmarks[eyeIndices[1]];
  const p3 = landmarks[eyeIndices[2]];
  const p4 = landmarks[eyeIndices[3]];
  const p5 = landmarks[eyeIndices[4]];
  const p6 = landmarks[eyeIndices[5]];

  const v1 = distance(p2, p6);
  const v2 = distance(p3, p5);
  const h = distance(p1, p4);

  return (v1 + v2) / (2.0 * h);
};

const DrowsinessDetection = () => {
  const [isActive, setIsActive] = useState(false);
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [permission, setPermission] = useState<"pending" | "granted" | "denied">("pending");
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  
  // Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Default threshold 0.20 as requested
  const [sensitivity, setSensitivity] = useState(0.20);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Track consecutive closed frames
  const closedFramesRef = useRef(0);

  // Initialize MediaPipe model
  useEffect(() => {
    const initModel = async () => {
      try {
        setIsLoadingModel(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        faceLandmarkerRef.current = landmarker;
        setIsLoadingModel(false);
      } catch (err) {
        console.error("Error loading MediaPipe model:", err);
        toast.error("Failed to load AI model. Please check your connection.");
        setIsLoadingModel(false);
      }
    };
    initModel();
  }, []);

  const triggerAlarm = useCallback(() => {
    setIsDrowsy((prev) => {
      if (prev) return prev; // Already drowsy
      
      if (!alarmRef.current) {
        alarmRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
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
      return true;
    });
  }, []);

  const stopAlarm = () => {
    setIsDrowsy(false);
    closedFramesRef.current = 0;
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  };

  const predictWebcam = useCallback(() => {
    if (!videoRef.current || !faceLandmarkerRef.current || !isActive) return;
    
    // Ensure video is playing and has data
    if (videoRef.current.currentTime > 0 && !videoRef.current.paused && !videoRef.current.ended && videoRef.current.readyState > 2) {
      let startTimeMs = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
        const leftEAR = calculateEAR(landmarks, LEFT_EYE);
        
        // Average EAR
        const avgEAR = (rightEAR + leftEAR) / 2.0;

        // Compare against sensitivity slider
        if (avgEAR < sensitivity) {
          closedFramesRef.current += 1;
          // Trigger if eyes closed for approx ~15 frames (half a second at 30fps)
          if (closedFramesRef.current > 15) {
            triggerAlarm();
          }
        } else {
          // If eyes open, reset the consecutive frames counter
          closedFramesRef.current = 0;
        }
      }
    }
    
    // Keep predicting when the browser is ready
    if (isActive) {
      animationRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isActive, sensitivity, triggerAlarm]);

  useEffect(() => {
    if (isActive && !isLoadingModel && faceLandmarkerRef.current) {
       animationRef.current = requestAnimationFrame(predictWebcam);
    }
    return () => {
       if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, isLoadingModel, predictWebcam]);

  const startDetection = async () => {
    if (!faceLandmarkerRef.current) {
      toast.error("Model is still loading, please wait.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.addEventListener("loadeddata", () => {
            setPermission("granted");
            setIsActive(true);
            toast.success("Drowsiness Detection Active", {
              description: "AI is monitoring your eye patterns for safety.",
            });
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
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsActive(false);
    setIsDrowsy(false);
    closedFramesRef.current = 0;
  };

  return (
    <div className="card-luxe !bg-white/5 flex flex-col group overflow-hidden relative p-4 rounded-2xl">
      <div className="flex items-center justify-between z-10 w-full">
          <div className="flex items-center gap-4">
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
              <div className="font-black text-foreground text-sm uppercase tracking-tight flex items-center gap-2">
                AI Drowsiness Monitor
                {isLoadingModel && <span className="text-[10px] text-muted-foreground animate-pulse">(Loading AI...)</span>}
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

          <div className="flex items-center gap-2">
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
              disabled={isLoadingModel}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isLoadingModel
                  ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                  : isActive
                  ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {isActive ? "Turn Off" : "Enable AI"}
            </button>
            <button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                className={`p-2 ml-1 rounded-lg hover:bg-white/10 transition-colors ${showAdvanced ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Advanced Settings"
            >
                <Settings className="w-4 h-4" />
            </button>
          </div>
      </div>
      
      {/* Advanced Settings Panel */}
      {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-white/10 z-10 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Eye Detection Sensitivity</span>
                 <span className="text-xs font-mono text-primary">{sensitivity.toFixed(2)}</span>
              </div>
              <input 
                 type="range" 
                 min="0.10" 
                 max="0.35" 
                 step="0.01" 
                 value={sensitivity} 
                 onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                 className="w-full accent-primary cursor-pointer"
              />
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>Less Sensitive (0.10)</span>
                  <span>More Sensitive (0.35)</span>
              </div>
          </div>
      )}

      {/* Decorative pulse when drowsy */}
      {isDrowsy && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none rounded-2xl" />
      )}
    </div>
  );
};

export default DrowsinessDetection;
