import { Fuel, Hospital, Utensils, Wrench, Search } from "lucide-react";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";

interface QuickServicesProps {
  onSearch: (query: string) => void;
}

const QuickServices = ({ onSearch }: QuickServicesProps) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompact = isMobile || isTablet;
  const services = [
    {
      icon: Fuel,
      label: "Fuel",
      query: "gas station",
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      icon: Utensils,
      label: "Food",
      query: "restaurant",
      color: "text-yellow-500 bg-yellow-500/10",
    },
    {
      icon: Hospital,
      label: "Clinic",
      query: "hospital",
      color: "text-red-500 bg-red-500/10",
    },
    {
      icon: Wrench,
      label: "Repair",
      query: "car repair",
      color: "text-blue-500 bg-blue-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {!isCompact && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-3 bg-primary rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
            Nearby Assets
          </span>
        </div>
      )}
      <div className="flex gap-2">
        {services.map((service) => (
          <button
            key={service.label}
            onClick={() => onSearch(service.query)}
            className="flex flex-col items-center gap-1 group"
          >
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 glass-panel rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground ${service.color}`}
            >
              <service.icon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce" />
            </div>
            {!isCompact && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                {service.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickServices;
