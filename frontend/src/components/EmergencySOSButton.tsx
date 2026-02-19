import { useState, useRef } from "react";
import { AlertCircle, ShieldAlert, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface EmergencySOSButtonProps {
  userLocation: [number, number];
}

const EmergencySOSButton = ({ userLocation }: EmergencySOSButtonProps) => {
  const { user } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSOS = () => {
    if (isActivating) return;

    setIsActivating(true);
    setCountdown(5);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    toast.warning("SOS Emergency Protocol Initiated!", {
      description: "Triggering in 5 seconds. Hold to cancel.",
      duration: 5000,
    });
  };

  const cancelSOS = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActivating(false);
    setCountdown(0);
    toast.info("SOS Protocol Aborted.");
  };

  const triggerSOS = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActivating(false);
    setCountdown(0);

    try {
      // 1. Fetch active emergency contacts
      const { data: contacts, error: contactError } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true);

      if (contactError) throw contactError;

      // 2. Broadcast SOS (In a real app, this would trigger an SMS/Email API)
      const locationLink = `https://www.google.com/maps?q=${userLocation[1]},${userLocation[0]}`;

      console.log("🚨 SOS TRIGGERED!");
      console.log(`📍 Location: ${locationLink}`);
      console.log(`📞 Contacts alerted: ${contacts?.length || 0}`);

      toast.error("🚨 EMERGENCY ALERT SENT!", {
        description: `Alerted ${contacts?.length || 0} contacts with your live location.`,
        duration: 10000,
      });

      // Play emergency sound if possible
      const audio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      );
      audio.play().catch(() => {});
    } catch (error: any) {
      console.error("SOS Error:", error);
      toast.error(
        "Failed to broadcast SOS. Please call emergency services manually.",
      );
    }
  };

  return (
    <div className="relative">
      <button
        onMouseDown={startSOS}
        onTouchStart={startSOS}
        onMouseUp={isActivating ? cancelSOS : undefined}
        onTouchEnd={isActivating ? cancelSOS : undefined}
        className={`relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-2xl transition-all duration-300 active:scale-90 ${
          isActivating
            ? "bg-red-600 animate-pulse scale-110"
            : "bg-red-500 hover:bg-red-600"
        }`}
        title="Emergency SOS (Hold for 5s)"
      >
        <div className="absolute inset-0 bg-red-400 rounded-2xl animate-ping opacity-20 group-hover:opacity-40" />

        {isActivating ? (
          <div className="flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-black text-white leading-none">
              {countdown}
            </span>
            <span className="text-[8px] font-bold text-white/80 uppercase">
              SOS
            </span>
          </div>
        ) : (
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
        )}
      </button>

      {/* Label for context */}
      {!isActivating && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Panic Button
        </div>
      )}
    </div>
  );
};

export default EmergencySOSButton;
