import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VintageLayout from "@/components/VintageLayout";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";

const SplashScreen = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);

  return (
    <VintageLayout>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md mx-auto space-y-10">
          {/* Logo with Glow Effect */}
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 glass-panel rounded-full flex items-center justify-center animate-float overflow-hidden">
              <BrandLogo size="70%" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-[#1B2B38] font-serif">
              SafeTrip Pro
            </h1>
            <div className="w-24 h-0.5 bg-[#C5A028] mx-auto opacity-50" />
            <p className="text-xl text-muted-foreground font-medium italic tracking-widest uppercase">
              Intelligence in Motion
            </p>
          </div>

          {/* Luxury Loading Indicator */}
          <div className="flex flex-col items-center gap-4 pt-12">
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary/40"
                  style={{
                    animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary/60">
              Syncing Navigation...
            </span>
          </div>
        </div>
      </div>
    </VintageLayout>
  );
};

export default SplashScreen;
