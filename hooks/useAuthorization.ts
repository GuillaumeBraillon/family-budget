import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { logger } from "../services/logger";

/**
 * Hook vérifiant si l'utilisateur connecté est autorisé via la whitelist.
 */
export const useAuthorization = (session: Session | null) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!session?.user?.email) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userEmail = session.user.email;
        const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name;
        const avatarUrl = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

        // Vérifier si l'utilisateur existe déjà
        const { data, error: dbError } = await supabase.from("authorized_users").select("email, is_allowed").eq("email", userEmail).single();

        if (dbError && dbError.code !== "PGRST116") {
          // PGRST116 = Aucun résultat (email non trouvé)
          throw dbError;
        }

        // Si l'utilisateur n'existe pas, le créer avec is_allowed = false
        if (!data) {
          await supabase.from("authorized_users").insert({
            email: userEmail,
            name: userName,
            avatar_url: avatarUrl,
            is_allowed: false,
            added_at: new Date().toISOString(),
          });

          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // Vérifier si l'utilisateur est autorisé
        const authorized = data.is_allowed === true;
        setIsAuthorized(authorized);

        // Mettre à jour last_login_at et les infos si autorisé
        if (authorized) {
          await supabase
            .from("authorized_users")
            .update({
              last_login_at: new Date().toISOString(),
              name: userName,
              avatar_url: avatarUrl,
            })
            .eq("email", userEmail);
        }

        setLoading(false);
      } catch (err: any) {
        logger.error("Authorization check error:", err);
        setError(err.message || "Erreur lors de la vérification");
        setIsAuthorized(false);
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [session]);

  return { isAuthorized, loading, error };
};
