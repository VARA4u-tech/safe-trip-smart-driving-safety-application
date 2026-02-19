import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VintageLayout from "@/components/VintageLayout";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  Medal,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Award,
  Crown,
} from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  avg_score: number;
  total_trips: number;
  name?: string;
}

const LeaderboardScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Calculate average scores from trips table
      const { data, error } = await supabase
        .from("trips")
        .select("user_id, safety_score")
        .not("safety_score", "is", null);

      if (error) throw error;

      // Manual aggregation as Supabase RPC might not be set up
      const userMap: Record<string, { total: number; count: number }> = {};
      data.forEach((trip) => {
        if (!userMap[trip.user_id]) {
          userMap[trip.user_id] = { total: 0, count: 0 };
        }
        userMap[trip.user_id].total += trip.safety_score;
        userMap[trip.user_id].count += 1;
      });

      const sortedEntries: LeaderboardEntry[] = Object.entries(userMap)
        .map(([id, stats]) => ({
          user_id: id,
          avg_score: Math.round(stats.total / stats.count),
          total_trips: stats.count,
          name: id.split("-")[0].toUpperCase(), // Placeholder for name
        }))
        .sort((a, b) => b.avg_score - a.avg_score)
        .slice(0, 10);

      setEntries(sortedEntries);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case 1:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
      case 2:
        return "text-amber-600 bg-amber-600/10 border-amber-600/20";
      default:
        return "text-primary/60 bg-primary/5 border-primary/10";
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5" />;
      case 1:
        return <Medal className="w-5 h-5" />;
      case 2:
        return <Award className="w-5 h-5" />;
      default:
        return <ShieldCheck className="w-5 h-5" />;
    }
  };

  return (
    <VintageLayout>
      <div className="w-full max-w-2xl mx-auto space-y-10 pb-20">
        <header className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-foreground tracking-tighter">
              DRIVING ELITE
            </h1>
            <p className="text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase">
              Global Safety Rankings
            </p>
          </div>
          <div className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center bg-primary/10">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">
              Gathering Intelligence...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Podium (Top 3) */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 items-end pt-8 pb-4">
                {/* 2nd place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 glass-panel rounded-2xl flex items-center justify-center relative border-gray-400/30">
                    <span className="font-black text-xl text-gray-400">2</span>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase truncate w-20">
                      {entries[1].name}
                    </div>
                    <div className="text-xs font-bold text-primary">
                      {entries[1].avg_score}%
                    </div>
                  </div>
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center gap-2 -translate-y-4">
                  <Crown className="w-8 h-8 text-yellow-500 drop-shadow-lg animate-bounce" />
                  <div className="w-24 h-24 glass-panel rounded-3xl flex items-center justify-center relative border-yellow-500/40 shadow-xl shadow-yellow-500/10">
                    <span className="font-black text-3xl text-yellow-500">
                      1
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black uppercase truncate w-24">
                      {entries[0].name}
                    </div>
                    <div className="text-base font-black text-primary">
                      {entries[0].avg_score}%
                    </div>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 glass-panel rounded-2xl flex items-center justify-center relative border-amber-600/30">
                    <span className="font-black text-xl text-amber-600">3</span>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase truncate w-20">
                      {entries[2].name}
                    </div>
                    <div className="text-xs font-bold text-primary">
                      {entries[2].avg_score}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of the list */}
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className="card-luxe flex items-center justify-between !bg-white/5 hover:!bg-white/10 transition-all group border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black ${getRankColor(index)}`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2 uppercase tracking-tight">
                        {entry.name}
                        {index === 0 && (
                          <span className="text-[8px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">
                            GOLD
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {entry.total_trips} Successful Missions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-primary leading-none">
                      {entry.avg_score}%
                    </div>
                    <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                      Safety Index
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-luxe !bg-primary/5 border-dashed border-primary/20 flex items-center gap-4 py-6">
              <TrendingUp className="w-6 h-6 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground italic font-medium">
                Keep your score above 90% and no more than 2 alerts per 10km to
                qualify for the Global Elite registry.
              </p>
            </div>
          </div>
        )}
      </div>
    </VintageLayout>
  );
};

export default LeaderboardScreen;
