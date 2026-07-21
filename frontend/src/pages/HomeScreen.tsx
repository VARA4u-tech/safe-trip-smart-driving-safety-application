import { useNavigate } from "react-router-dom";
import AppFooter from "@/components/AppFooter";
import {
  History,
  AlertTriangle,
  Settings as SettingsIcon,
  Shield,
  LayoutDashboard,
  Trophy,
  ChevronRight,
  Activity,
  MapPin,
  Zap,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Enforce dark mode for this page for maximum premium aesthetic
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // Optional: If you want to keep dark mode everywhere, remove this cleanup.
      // document.documentElement.classList.remove("dark"); 
    };
  }, []);

  const handleInitiateTrip = () => {
    if (user) {
      navigate("/trip");
    } else {
      toast.info("Authentication Required", {
        description: "Please sign in to access live AI tracking.",
      });
      navigate("/login");
    }
  };

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Control Center",
      path: "/dashboard",
      desc: "Live analytics & metrics",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: AlertTriangle,
      label: "AI Safety Shield",
      path: "/trip",
      desc: "Real-time hazard detection",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: Trophy,
      label: "Global Leaderboard",
      path: "/leaderboard",
      desc: "Compete with elite drivers",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: History,
      label: "Journey Logs",
      path: "/history",
      desc: "Review your past routes",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#05050A] text-white relative overflow-hidden font-sans selection:bg-primary selection:text-white">
      {/* Animated Glowing Orbs Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-amber-500/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[25rem] h-[25rem] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 lg:py-8 flex flex-col min-h-screen">
        
        {/* Superior Header */}
        <header className="flex items-center justify-between mb-16 lg:mb-24">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center group-hover:scale-105 group-hover:border-primary/50 transition-all duration-500">
              <BrandLogo className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white leading-none flex items-center gap-2">
                SafeTrip <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">Pro</span>
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => user ? navigate("/settings") : navigate("/login")}
              title="Global Settings"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300 text-gray-400 hover:text-white"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            {user ? (
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-5 py-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 backdrop-blur-md text-sm font-semibold transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main Content Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center pb-20">
          
          {/* Left Column: Hero Text & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-2">
              <Zap className="w-4 h-4" />
              <span>SafeTrip Core v3.0 is live</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 leading-[1.1]">
              Intelligence Meets <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">The Open Road.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-xl leading-relaxed">
              Experience the next generation of smart driving. AI-powered hazard detection, real-time advanced routing, and elite driver analytics—all seamlessly integrated into one dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={handleInitiateTrip}
                className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white font-semibold rounded-2xl overflow-hidden hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <Shield className="w-6 h-6 relative z-10" />
                <span className="relative z-10 text-lg">Start AI Journey</span>
                <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Floating Bento Grid / Visuals */}
          <div className="lg:col-span-5 relative z-10 perspective-1000">
            <div className="grid grid-cols-2 gap-4 transform-gpu lg:rotate-y-[-15deg] lg:rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-all duration-700 ease-out">
              
              {/* Bento Box 1: Map Snippet */}
              <div className="col-span-2 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full filter blur-[50px] group-hover:bg-primary/40 transition-colors duration-500"></div>
                <MapPin className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Smart Routing</h3>
                <p className="text-sm text-gray-400">Dynamic rerouting avoiding traffic, weather anomalies, and high-risk zones.</p>
              </div>

              {/* Bento Box 2: Telematics */}
              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 group hover:border-emerald-500/50 transition-colors">
                <Activity className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">Telematics</h3>
                <p className="text-xs text-gray-400">Live speed & heading precision</p>
              </div>

              {/* Bento Box 3: Live Dashcam */}
              <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 group hover:border-amber-500/50 transition-colors relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <AlertTriangle className="w-8 h-8 text-amber-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">AI Vision</h3>
                <p className="text-xs text-gray-400">Camera-based object detection</p>
              </div>

            </div>
          </div>
          
        </div>

        {/* Quick Access Menu / Footer Actions */}
        <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => user ? navigate(item.path) : navigate("/login")}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300 group text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">
                  {item.label}
                </h3>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} SafeTrip Smart Driving Safety. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
