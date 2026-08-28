import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import type { Session } from "@supabase/supabase-js";
import type { AppRole } from "@titan-kinetic/core";
import { supabase } from "../lib/supabase";

interface SessionState {
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
}

const INITIAL_STATE: SessionState = { session: null, roles: [], loading: true };

const SessionContext = createContext<SessionState | null>(null);

// Une seule souscription auth pour toute l'app (montée dans app/_layout.tsx),
// exposée par contexte — évite que chaque écran ouvre sa propre souscription
// Supabase. Refresh piloté par AppState : startAutoRefresh()/stopAutoRefresh()
// est le motif documenté officiel Supabase pour Expo/RN (évite de consommer
// des refresh en arrière-plan).
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(INITIAL_STATE);

  useEffect(() => {
    let mounted = true;

    async function applySession(session: Session | null) {
      if (!session) {
        if (mounted) setState({ session: null, roles: [], loading: false });
        return;
      }
      const { data } = await supabase.from("user_roles").select("role");
      if (mounted) {
        setState({
          session,
          roles: (data ?? []).map((row) => row.role as AppRole),
          loading: false,
        });
      }
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    function onAppStateChange(next: AppStateStatus) {
      if (next === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    }
    const appStateSub = AppState.addEventListener("change", onAppStateChange);

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession doit être utilisé sous SessionProvider.");
  }
  return ctx;
}
