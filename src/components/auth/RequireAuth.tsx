import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { needsJoke, useAuth } from "@/contexts/AuthContext";

/**
 * Wraps every content route: guests are sent to the login page and come back
 * to the page they opened after signing in. Demo mode (no Supabase) has no
 * accounts, so it stays open.
 */
export function RequireAuth() {
  const { enabled, loading, user } = useAuth();
  const location = useLocation();

  if (!enabled) return <Outlet />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="animate-spin" aria-label="Memuat" />
      </div>
    );
  }

  const from = `${location.pathname}${location.search}${location.hash}`;
  if (!user) return <Navigate to="/login" replace state={{ from }} />;
  if (needsJoke(user)) return <Navigate to="/signup" replace state={{ from }} />;

  return <Outlet />;
}
