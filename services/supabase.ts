import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Récupère la configuration Supabase.
 * Priorité 1 : LocalStorage (ce qui fonctionnait avant)
 * Priorité 2 : Variables d'environnement .env (build time)
 */
export const getSupabaseConfig = () => {
  // Priorité au localStorage (système qui fonctionnait)
  let projectId = localStorage.getItem("supabase_project_id") || "";
  let key = localStorage.getItem("supabase_key") || "";

  // Fallback sur les variables d'environnement
  type ProcessEnv = { env?: Record<string, string | undefined> };
  if (!projectId) projectId = (process as ProcessEnv).env?.SUPABASE_PROJECT_ID || "";
  if (!key) key = (process as ProcessEnv).env?.SUPABASE_ANON_KEY || "";

  const url = projectId ? `https://${projectId.trim()}.supabase.co` : "";

  return { url, key, projectId };
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
