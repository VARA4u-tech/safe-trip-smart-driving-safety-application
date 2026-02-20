const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
// Prevent double /api if someone puts it in the env var
export const BACKEND_URL = rawUrl.endsWith("/api")
  ? rawUrl.slice(0, -4)
  : rawUrl;
