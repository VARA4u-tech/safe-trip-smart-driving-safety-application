import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VintageLayout from "@/components/VintageLayout";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";
import {
  ShieldCheck,
  Map,
  Video,
  BarChart3,
  CloudLightning,
  ChevronRight,
  Navigation,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

const SplashScreen = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect them to dashboard immediately
  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate, user, loading]);

  // While checking auth, show nothing or a tiny loader to prevent flash
  if (loading) return null;

  return (
    <VintageLayout>
      <div className="w-full min-h-screen overflow-x-hidden font-sans text-[#1B2B38]">
        
        {/* ─── 1. HERO SECTION ─────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 pt-12 pb-24">
          <div className="text-center max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Logo with Glow Effect */}
            <div className="flex justify-center relative mb-12">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-[2] animate-pulse" />
              <div className="relative w-32 h-32 md:w-48 md:h-48 glass-panel rounded-full flex items-center justify-center animate-float overflow-hidden shadow-2xl">
                <BrandLogo size="70%" />
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-serif text-balance">
                The Future of <span className="text-primary italic">Road Safety</span>
              </h1>
              <div className="w-24 h-1 bg-[#C5A028] mx-auto rounded-full" />
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                Real-time AI monitoring, smart navigation, and predictive hazard warnings in one seamless app.
              </p>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-primary rounded-full overflow-hidden shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -translate-x-full skew-x-12" />
                <span className="relative flex items-center gap-2">
                  Start Your Safe Trip <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ─── 2. FEATURES SHOWCASE ───────────────────────────────────────── */}
        <section className="py-24 px-4 bg-white/50 backdrop-blur-xl border-y border-white/20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-serif font-bold">Intelligent Features</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Powered by machine learning and real-time data to keep you and your fleet safe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="glass-panel p-8 rounded-3xl space-y-4 hover:bg-white/80 transition-colors duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">AI Dashcam</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Real-time driver drowsiness and lane drift detection using your phone's camera.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-8 rounded-3xl space-y-4 hover:bg-white/80 transition-colors duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Map className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">Smart Navigation</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Turn-by-turn Mapbox routing with offline support for dead zones.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-8 rounded-3xl space-y-4 hover:bg-white/80 transition-colors duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CloudLightning className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">Weather Alerts</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Predictive hazard warnings based on live weather and traffic data.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-panel p-8 rounded-3xl space-y-4 hover:bg-white/80 transition-colors duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold">Fleet Analytics</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Comprehensive dashboard for logistics companies to monitor safety scores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. HOW IT WORKS ────────────────────────────────────────────── */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-serif font-bold">How It Works</h2>
              <p className="text-muted-foreground text-lg">Seamless integration into your daily driving.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner">
                  <Smartphone className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">1. Mount Phone</h3>
                <p className="text-muted-foreground">Secure your phone on the dashboard to allow clear visibility of the road and driver.</p>
              </div>

              <div className="space-y-6 flex flex-col items-center relative">
                {/* Arrow connector */}
                <div className="hidden md:block absolute top-10 -left-[20%] w-[40%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner">
                  <Navigation className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">2. Start Trip</h3>
                <p className="text-muted-foreground">Set your destination. The app begins analyzing surroundings and tracking safety.</p>
              </div>

              <div className="space-y-6 flex flex-col items-center relative">
                {/* Arrow connector */}
                <div className="hidden md:block absolute top-10 -left-[20%] w-[40%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold">3. Drive Safely</h3>
                <p className="text-muted-foreground">Receive real-time alerts for drowsiness, over-speeding, and road hazards ahead.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. IMPACT / TESTIMONIALS ───────────────────────────────────── */}
        <section className="py-24 px-4 bg-primary text-primary-foreground relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          
          <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white">Proven to Save Lives</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
              <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                <p className="text-lg italic text-white/90 mb-6">
                  "Since adopting SafeTrip Pro across our delivery fleet, accidents have dropped by 40%. The AI drowsiness alerts are a game-changer for night shifts."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">V</div>
                  <div>
                    <h4 className="font-bold text-white">VARA Logistics</h4>
                    <p className="text-sm text-white/70">Fleet Manager</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                <p className="text-lg italic text-white/90 mb-6">
                  "The predictive weather hazard warnings saved me from a major highway pileup during a flash flood. Absolutely essential app."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">D</div>
                  <div>
                    <h4 className="font-bold text-white">Daily Commuter</h4>
                    <p className="text-sm text-white/70">Pro User</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5. FOOTER CTA ──────────────────────────────────────────────── */}
        <footer className="py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <BrandLogo size="80px" className="mx-auto opacity-50 grayscale" />
            <h2 className="text-4xl font-serif font-bold">Ready to drive smarter?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Join thousands of drivers making the roads safer every day.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 px-8 py-4 font-bold text-primary-foreground bg-[#1B2B38] rounded-full hover:bg-black transition-colors shadow-xl"
            >
              <CheckCircle2 className="w-5 h-5" /> Get Started Free
            </button>
            <p className="text-sm text-muted-foreground pt-12">
              © {new Date().getFullYear()} SafeTrip Pro. Built with 🏎️💨 by VARA.
            </p>
          </div>
        </footer>

      </div>
    </VintageLayout>
  );
};

export default SplashScreen;
