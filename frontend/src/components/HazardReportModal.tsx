import {
  AlertTriangle,
  CarFront,
  CloudRain,
  Construction,
  MapPin,
} from "lucide-react";

interface HazardReportModalProps {
  onClose: () => void;
  onReport: (type: string) => void;
}

const hazardTypes = [
  {
    id: "accident",
    icon: CarFront,
    label: "Accident",
    color: "text-destructive",
  },
  {
    id: "traffic",
    icon: Construction,
    label: "Heavy Traffic",
    color: "text-amber-500",
  },
  {
    id: "weather",
    icon: CloudRain,
    label: "Seveve Weather",
    color: "text-blue-500",
  },
  {
    id: "hazard",
    icon: AlertTriangle,
    label: "Road Hazard",
    color: "text-orange-500",
  },
];

const HazardReportModal = ({ onClose, onReport }: HazardReportModalProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-panel rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight">
            REPORT HAZARD
          </h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
            Intelligence Contribution
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {hazardTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                onReport(type.label);
                onClose();
              }}
              className="card-luxe !p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform !bg-white/5 border-none group"
            >
              <div
                className={`w-10 h-10 glass-panel rounded-xl flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground`}
              >
                <type.icon
                  className={`w-5 h-5 ${type.color} group-hover:text-inherit`}
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {type.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 glass-panel rounded-xl font-bold text-sm hover:bg-muted transition-colors uppercase tracking-widest"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default HazardReportModal;
