import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns a guard for actions that need an account (posting, commenting, liking).
 * In demo mode every action is allowed; otherwise guests are sent to the login page.
 */
export function useRequireAuth() {
  const { enabled, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (!enabled || user) return true;

    toast("Masuk dulu ya, Pak", { description: "Biar bisa ikut ngobrol, kasih dukungan, dan posting." });
    navigate("/login", { state: { from: location.pathname } });
    return false;
  }, [enabled, user, navigate, location.pathname]);
}
