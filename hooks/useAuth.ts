import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { Session } from "@supabase/supabase-js";
import { logger } from "../services/logger";

/**
 * Hook de gestion de l'authentification Supabase.
 *
 * @description
 * Gère la session utilisateur avec Google OAuth via Supabase Auth.
 * Écoute les changements de session (login/logout) et fournit des actions
 * pour se connecter et se déconnecter.
 *
 * @returns {Object} État et actions d'authentification
 * @returns {Session | null} session - Session Supabase actuelle
 * @returns {boolean} loading - Indicateur de chargement initial
 * @returns {string | null} error - Message d'erreur si échec
 * @returns {Function} signInWithGoogle - Déclenche l'authentification Google
 * @returns {Function} signOut - Déconnecte l'utilisateur
 *
 * @example
 * ```tsx
 * const { session, loading, signInWithGoogle, signOut } = useAuth();
 *
 * if (loading) return <Loader />;
 * if (!session) return <LoginButton onClick={signInWithGoogle} />;
 * return <Dashboard onLogout={signOut} />;
 * ```
 */
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
      } else {
        logger.debug("auth", "Session récupérée", { hasSession: !!session, email: session?.user?.email });
      }
      setSession(session);
      setLoading(false);
    });

    // 2. Écouter les changements d'état (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      logger.debug("auth", "AuthStateChange", { event: _event, hasSession: !!session });
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
