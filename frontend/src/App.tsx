import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import HomeScreen from "./pages/HomeScreen";
import LiveMapScreen from "./pages/LiveMapScreen";
import AlertDetailsScreen from "./pages/AlertDetailsScreen";
import TripHistoryScreen from "./pages/TripHistoryScreen";
import SettingsScreen from "./pages/SettingsScreen";
import Login from "./pages/Login";
import LeaderboardScreen from "./pages/LeaderboardScreen";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";

import DashboardScreen from "./pages/DashboardScreen";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trip"
                element={
                  <ProtectedRoute>
                    <LiveMapScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alert/:id"
                element={
                  <ProtectedRoute>
                    <AlertDetailsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <TripHistoryScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <LeaderboardScreen />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
