import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Session } from "@supabase/supabase-js";
import { logger } from "../services/logger";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Récupérer la session actuelle au chargement
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error("Error getting session:", error);
        setError(error.message);
      }
      setSession(session);
      setLoading(false);
    });

    // 2. Écouter les changements d'état (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  };

  return {
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    user: session?.user,
  };
};
