import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import VintageLayout from "@/components/VintageLayout";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import BrandLogo from "@/components/BrandLogo";

const Login = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/trip");
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/trip",
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VintageLayout>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-sm glass-panel p-8 rounded-3xl shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center overflow-hidden p-4 shadow-inner">
                <BrandLogo />
              </div>
            </div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-[#1B2B38]">
              Welcome Back
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-[#C5A028] opacity-80">
              SafeTrip Pro Command Deck
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-background border-2 border-vintage-border-outer rounded-2xl font-bold text-foreground hover:bg-secondary/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className="w-5 h-5"
              />
              {loading ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-vintage-border-outer/50"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground font-medium tracking-widest">
                  Secure Access
                </span>
              </div>
            </div>

            <p className="text-[10px] text-center text-muted-foreground/60 leading-relaxed px-4">
              By continuing, you agree to SafeTrip Pro's <br />
              <b>Terms of Service</b> and <b>Privacy Policy</b>.
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-12 text-center text-xs text-primary/40 font-bold uppercase tracking-[0.3em]">
          ● Intelligence in Motion ●
        </div>
      </div>
    </VintageLayout>
  );
};

export default Login;
