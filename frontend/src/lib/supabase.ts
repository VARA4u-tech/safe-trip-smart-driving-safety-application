import { createClient } from "@supabase/supabase-js";

// These should ideally be in a .env file on the frontend
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://gukeqawvhxelzwesdusv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error(
    "❌ VITE_SUPABASE_ANON_KEY is missing! \n" +
      "Please add it to your Environment Variables in Vercel settings.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || "placeholder-key-to-prevent-crash",
);
