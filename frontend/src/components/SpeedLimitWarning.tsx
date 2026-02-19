import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface SpeedLimitWarningProps {
  currentSpeedKmh: number;
  limitKmh: number;
  visible: boolean;
}

const SpeedLimitWarning = ({ currentSpeedKmh, limitKmh, visible }: SpeedLimitWarningProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div
      className={`absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
      style={{
        background: "hsl(0, 50%, 95%, 0.95)",
        borderColor: "hsl(0, 50%, 40%)",
        boxShadow: "0 2px 12px rgba(180,50,50,0.2), inset 0 1px 2px rgba(180,50,50,0.1)",
      }}
    >
      <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "hsl(0, 50%, 40%)" }} />
      <span className="font-heading text-sm font-bold" style={{ color: "hsl(0, 50%, 30%)" }}>
        {currentSpeedKmh} km/h — Limit {limitKmh} km/h
      </span>
    </div>
  );
};

export default SpeedLimitWarning;
