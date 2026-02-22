import { useNavigate, useLocation } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import {
  Shield,
  MapPin,
  History,
  Settings,
  Trophy,
  Github,
  Heart,
  ExternalLink,
  Navigation,
  Zap,
} from "lucide-react";

const AppFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { icon: MapPin, label: "Start Trip", path: "/trip" },
    { icon: History, label: "History", path: "/history" },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <footer className="mt-16 relative">
      {/* Decorative Top Border */}
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/20 to-transparent blur-sm" />
      </div>

      <div className="glass-panel rounded-[2rem] p-8 md:p-10 border-primary/10 relative overflow-hidden">
        {/* Subtle Background Orb */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        {/* Main Footer Content */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-6">
          {/* Brand Section */}
          <div className="md:col-span-5 space-y-4">
            <div
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-12 h-12 bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-primary/20 rounded-xl shadow-lg group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center overflow-hidden p-1.5">
                <BrandLogo className="w-full h-full" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold tracking-tight text-foreground leading-none">
                  SafeTrip Pro
                </h3>
                <p className="text-[9px] text-accent font-bold uppercase tracking-[0.3em] mt-0.5 opacity-70">
                  Smart Driving Safety
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm font-medium">
              Empowering every journey with real-time intelligence, AI-powered
              hazard detection, and community-driven safety insights.
            </p>
            {/* Status Indicator */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <div className="absolute w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
              Quick Access
            </h4>
            <nav className="flex flex-wrap md:flex-col gap-2">
              {quickLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/5"
                    }`}
                  >
                    <link.icon
                      className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`}
                    />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Info & Links */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">
              About & Resources
            </h4>
            <div className="space-y-3">
              {/* Tech Stack Badge */}
              <div className="flex flex-wrap gap-2">
                {["React", "TypeScript", "Mapbox", "Supabase"].map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary/70 border border-primary/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* GitHub Link */}
              <a
                href="https://github.com/VARA4u-tech/safe-trip-smart-driving-safety-application"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/5 transition-all duration-300 group"
              >
                <Github className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              {/* Features highlight */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span className="font-medium">
                  AI-Powered • Real-Time • Community-Driven
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 mt-8 pt-6 border-t border-primary/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-[11px] text-muted-foreground font-medium">
                © {currentYear}{" "}
                <span className="font-bold text-foreground/80">
                  SafeTrip Pro
                </span>
                . All rights reserved.
              </p>
              <span className="hidden sm:inline text-primary/20">|</span>
              <span className="hidden sm:inline text-[10px] font-black text-primary/40 tracking-[0.2em] uppercase">
                v2.4.0
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <span>Built with</span>
              <Heart className="w-3 h-3 text-[#6B3E26] fill-[#6B3E26] animate-pulse" />
              <span>by</span>
              <a
                href="https://github.com/VARA4u-tech"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary hover:text-accent transition-colors"
              >
                VARA
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
