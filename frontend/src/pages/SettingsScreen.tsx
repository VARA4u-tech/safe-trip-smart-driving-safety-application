import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import VintageLayout from "@/components/VintageLayout";
import {
  ArrowLeft,
  Volume2,
  Bell,
  Info,
  LogOut,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import EmergencyContacts from "@/components/EmergencyContacts";
import DrowsinessDetection from "@/components/DrowsinessDetection";

const SettingsScreen = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    toast.info("Securely logging out of command deck...");
    await signOut();
    navigate("/");
  };

  return (
    <VintageLayout>
      <div className="w-full max-w-2xl mx-auto space-y-10">
        {/* Superior Header */}
        <header className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tighter">
              SETTINGS
            </h1>
            <p className="text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase">
              Control System Configuration
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Main Controls Section */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-primary tracking-[0.3em] px-2 italic uppercase">
              Mission Dynamics
            </h2>

            <div className="card-luxe flex items-center justify-between !bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground">
                    Voice Intelligence
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Audible safety reporting &amp; nav readouts
                  </div>
                </div>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
                aria-label="Toggle voice intelligence"
              />
            </div>

            <div className="card-luxe flex items-center justify-between !bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 glass-panel rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-foreground">
                    Critical Notifications
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tactile &amp; visual alert system
                  </div>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                aria-label="Toggle notifications"
              />
            </div>

            <DrowsinessDetection />
          </section>

          {/* Emergency Guardian Section */}
          <EmergencyContacts />

          {/* Aesthetic Section */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-primary tracking-[0.3em] px-2 italic uppercase">
              Visual Protocols
            </h2>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="card-luxe w-full flex items-center justify-between !bg-primary/5 border-primary/20 hover:scale-[1.02] transition-transform"
              aria-label="Toggle night vision mode"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 glass-panel !bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-black text-foreground uppercase tracking-tight">
                    Night Vision Mode
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Toggle low-light optimized display
                  </div>
                </div>
              </div>
              <div
                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-background/50 border border-primary/20"}`}
              >
                {theme === "dark" ? "Active" : "Standby"}
              </div>
            </button>
          </section>

          {/* Information Section */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-primary tracking-[0.3em] px-2 italic uppercase">
              Intelligence Registry
            </h2>

            <div className="card-luxe !bg-white/5 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-primary/5">
                <Shield className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-foreground text-sm uppercase">
                      SafeTrip Core
                    </span>
                    <span className="text-[10px] font-black text-primary/60">
                      V2.4.0-LUXE
                    </span>
                  </div>
                  <div className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                    This drive-safe algorithm uses real-time GPS synchronization
                    and Mapbox-engine v3 to provide predictive hazard
                    evaluation.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <div className="text-xs font-medium text-muted-foreground italic">
                  Advanced Smart Driving Safety Application Development
                </div>
              </div>
            </div>
          </section>

          {/* Secondary Actions */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl glass-panel border-destructive/20 text-destructive font-black tracking-widest uppercase hover:bg-destructive hover:text-white transition-all duration-500"
          >
            <LogOut className="w-5 h-5" />
            Decommission Link
          </button>
        </div>

        <footer className="py-6 text-center">
          <p className="text-[10px] font-black text-primary/40 tracking-[0.5em] uppercase">
            VARA4u Intelligence Systems
          </p>
        </footer>
      </div>
    </VintageLayout>
  );
};

export default SettingsScreen;
