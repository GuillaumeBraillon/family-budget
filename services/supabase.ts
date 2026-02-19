import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logger";

/**
 * Récupère la configuration Supabase.
 * Priorité 1 : Variables d'environnement .env (build time)
 * Note: Le support localStorage a été supprimé pour des raisons de sécurité et de cohérence.
 */
export const getSupabaseConfig = () => {
  // Variables d'environnement Vite (build time)
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim() || "";
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";

  // Construction standard de l'URL Supabase
  const url = projectId ? `https://${projectId}.supabase.co` : "";

  const isFromEnv = !!projectId && !!key;

  return { url, key, projectId, isFromEnv };
};

/**
 * Instance initiale du client Supabase.
 */
const config = getSupabaseConfig();
export const supabase: SupabaseClient = createClient(config.url || "https://placeholder.supabase.co", config.key || "placeholder");

/**
 * Nettoie uniquement le token d'authentification OAuth (session expirée).
 */
export const clearAuthSession = () => {
  const { projectId } = getSupabaseConfig();
  if (projectId) {
    const authTokenKey = `sb-${projectId}-auth-token`;
    localStorage.removeItem(authTokenKey);
    logger.log("[Supabase] Session auth cleared:", authTokenKey);
  }
};

/**
 * Vérifie si les variables d'environnement Supabase sont configurées dans .env
 */
export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return url.length > 10 && key.length > 10 && url.startsWith("http");
};
