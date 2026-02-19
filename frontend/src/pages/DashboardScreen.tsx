import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import VintageLayout from "@/components/VintageLayout";
import {
  Compass,
  History,
  AlertTriangle,
  Settings,
  Shield,
  User as UserIcon,
  Trophy,
  Activity,
  Map as MapIcon,
  LogOut,
  Bell,
  Navigation,
  Clock,
  Home,
} from "lucide-react";
import { toast } from "sonner";

const DashboardScreen = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const fullName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Explorer";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const menuItems = [
    {
      icon: MapIcon,
      label: "Start Journey",
      path: "/trip",
      desc: "Begin your safe travel with real-time AI assistance",
      color: "blue",
    },
    {
      icon: History,
      label: "Trip History",
      path: "/history",
      desc: "Review your legendary paths and safety scores",
      color: "amber",
    },
    {
      icon: Trophy,
      label: "Global Elite",
      path: "/leaderboard",
      desc: "See how you rank among safe drivers worldwide",
      color: "emerald",
    },
    {
      icon: Settings,
      label: "Command Deck",
      path: "/settings",
      desc: "Configure your safety systems and UI preferences",
      color: "purple",
    },
  ];

  const stats = [
    { label: "Total Trips", value: "24", icon: Navigation, unit: "Trips" },
    { label: "Safety Score", value: "98", icon: Shield, unit: "/ 100" },
    { label: "Time Saved", value: "12.5", icon: Clock, unit: "Hours" },
  ];

  return (
    <VintageLayout>
      <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
        {/* Professional Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 glass-panel p-6 rounded-[2.5rem] border-primary/10 shadow-xl animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all rounded-full" />
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-primary/20 object-cover relative z-10 transition-transform hover:scale-105"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 text-primary rounded-2xl border-2 border-primary/20 flex items-center justify-center relative z-10">
                  <UserIcon className="w-8 h-8 md:w-10 md:h-10" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-background rounded-full z-20" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary/60 leading-none">
                Welcome Commander
              </h2>
              <h1 className="text-2xl md:text-3xl font-black text-foreground drop-shadow-sm">
                {fullName}
              </h1>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 capitalize">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> Platinum
                Driver Status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              title="Return to Home Screen"
              className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all group"
            >
              <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
            </button>
            <button className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center hover:bg-secondary/40 transition-all">
              <Bell className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={handleSignOut}
              className="px-6 py-3 glass-panel rounded-2xl font-bold flex items-center gap-2 hover:bg-destructive hover:text-white transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="card-luxe p-6 flex items-center gap-5 group hover:translate-y-[-4px] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-foreground">
                    {stat.value}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {stat.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Major Grid Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="group relative p-[1px] rounded-[2rem] overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02]"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br transition-opacity opacity-0 group-hover:opacity-100 ${
                  item.color === "blue"
                    ? "from-blue-500/20 to-cyan-500/20"
                    : item.color === "amber"
                      ? "from-amber-500/20 to-orange-500/20"
                      : item.color === "emerald"
                        ? "from-emerald-500/20 to-teal-500/20"
                        : "from-purple-500/20 to-indigo-500/20"
                }`}
              />

              <div className="relative glass-panel h-full p-8 rounded-[2rem] flex flex-col gap-6 text-left border-primary/5 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                    item.color === "blue"
                      ? "bg-blue-500 text-white shadow-blue-500/20"
                      : item.color === "amber"
                        ? "bg-amber-500 text-white shadow-amber-500/20"
                        : item.color === "emerald"
                          ? "bg-emerald-500 text-white shadow-emerald-500/20"
                          : "bg-purple-500 text-white shadow-purple-500/20"
                  }`}
                >
                  <item.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-2 flex items-center gap-3">
                    {item.label}
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-auto flex items-center text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Access Module →
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom Quick Info */}
        <footer className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-600">
          <div className="glass-panel p-6 rounded-3xl border-primary/10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
                Safety Analytics
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Driving patterns analyzed in real-time across 14 safety vectors.
              </p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">
              View Logic
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl border-primary/10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground">
                Recent Warnings
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Found 2 minor optimizations for your braking patterns.
              </p>
            </div>
            <button className="text-xs font-bold text-orange-500 hover:underline">
              Details
            </button>
          </div>
        </footer>
      </div>
    </VintageLayout>
  );
};

export default DashboardScreen;
