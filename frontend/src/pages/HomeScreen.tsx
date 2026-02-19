import { useNavigate } from "react-router-dom";
import VintageLayout from "@/components/VintageLayout";
import VintageFrame from "@/components/VintageFrame";
import {
  History,
  AlertTriangle,
  Settings as SettingsIcon,
  Shield,
  User,
  LayoutDashboard,
  Trophy,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleInitiateTrip = () => {
    if (user) {
      navigate("/trip");
    } else {
      toast.info("Please sign in to initiate your journey", {
        description: "Secure authentication is required for tracking.",
      });
      navigate("/login");
    }
  };

  const menuItems = [
    {
      icon: History,
      label: "Trip History",
      path: "/history",
      desc: "Review your legendary paths",
    },
    {
      icon: AlertTriangle,
      label: "Safety Alerts",
      path: "/trip",
      desc: "Real-time road intelligence",
    },
    {
      icon: Trophy,
      label: "Global Elite",
      path: "/leaderboard",
      desc: "See how you rank against the best",
    },
    {
      icon: SettingsIcon,
      label: "Command Deck",
      path: "/settings",
      desc: "Configure your experience",
    },
  ];

  return (
    <VintageLayout>
      <div className="w-full max-w-2xl mx-auto space-y-10">
        {/* Superior Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="p-2 bg-white/50 backdrop-blur-sm border border-[#C5A028]/20 rounded-2xl shadow-xl group-hover:rotate-6 transition-transform duration-500 w-16 h-16 flex items-center justify-center overflow-hidden">
              <BrandLogo className="w-full h-full" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#1B2B38] leading-none">
                SafeTrip Pro
              </h2>
              <p className="text-[10px] text-[#C5A028] font-bold uppercase tracking-[0.3em] mt-1.5 opacity-80">
                Premium Safety v2.4
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                user ? navigate("/settings") : navigate("/login")
              }
              title="Global Settings"
              className="w-12 h-12 glass-panel flex items-center justify-center rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() =>
                user ? navigate("/dashboard") : navigate("/login")
              }
              title="User Dashboard"
              className="w-12 h-12 glass-panel flex items-center justify-center rounded-2xl border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-2xl group-hover:bg-transparent transition-colors" />
              <LayoutDashboard className="w-6 h-6 relative z-10" />
            </button>
          </div>
        </header>

        {/* Hero Welcome */}
        <section className="text-center space-y-4 py-6">
          <h1 className="text-5xl md:text-6xl font-black text-foreground">
            Explore with <span className="text-accent italic">Confidence</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto italic">
            "The journey of a thousand miles begins with a single safe turn."
          </p>
        </section>

        {/* Major Action */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleInitiateTrip}
            className="btn-premium flex items-center gap-4 text-xl py-5 px-12 group"
          >
            <Shield className="w-6 h-6 group-hover:animate-pulse" />
            Initiate Trip
          </button>
        </div>

        {/* Command Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => (user ? navigate(item.path) : navigate("/login"))}
              className="card-luxe flex flex-col gap-4 text-left group"
            >
              <div className="w-12 h-12 rounded-xl glass-panel border-primary/20 flex items-center justify-center bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                  {item.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Ethical Footer Banner */}
        <footer className="glass-panel p-6 text-center border-primary/10 rounded-3xl mt-12 bg-primary/5">
          <p className="text-sm font-medium italic text-primary/80">
            Smart Driving Safety — Empowering every journey with real-time
            intelligence.
          </p>
        </footer>
      </div>
    </VintageLayout>
  );
};

export default HomeScreen;
