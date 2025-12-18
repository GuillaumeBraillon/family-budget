
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Récupère la configuration Supabase.
 * Priorité 1 : Variables d'environnement (Injection au build)
 * Priorité 2 : LocalStorage (Configuration manuelle via UI)
 */
export const getSupabaseConfig = () => {
  // Tentative de récupération via process.env (Standard pour .env)
  // Note : Dans certains environnements web, on utilise import.meta.env
  const envProjectId = (window as any).process?.env?.SUPABASE_PROJECT_ID || '';
  const envKey = (window as any).process?.env?.SUPABASE_ANON_KEY || '';

  let projectId = envProjectId || localStorage.getItem('supabase_project_id') || '';
  let key = envKey || localStorage.getItem('supabase_key') || '';
  let url = '';

  if (projectId) {
    url = `https://${projectId.trim()}.supabase.co`;
  }

  return { url, key, projectId, isFromEnv: !!envProjectId };
};

/**
 * Instance initiale du client Supabase.
 */
const config = getSupabaseConfig();
export let supabase: SupabaseClient = createClient(
  config.url || 'https://placeholder.supabase.co',
  config.key || 'placeholder'
);

/**
 * Initialise les paramètres Supabase et met à jour l'instance du client.
 */
export const initSupabase = (projectId: string, key: string) => {
  const generatedUrl = `https://${projectId.trim()}.supabase.co`;
  localStorage.setItem('supabase_project_id', projectId.trim());
  localStorage.setItem('supabase_url', generatedUrl);
  localStorage.setItem('supabase_key', key.trim());
  
  // Mise à jour de l'instance existante
  supabase = createClient(generatedUrl, key.trim());
};

/**
 * Supprime la configuration (Déconnexion).
 */
export const resetSupabaseConfig = () => {
  localStorage.removeItem('supabase_project_id');
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_key');
  
  supabase = createClient('https://placeholder.supabase.co', 'placeholder');
};

/**
 * Vérifie si la configuration minimale est présente.
 */
export const isSupabaseConfigured = () => {
  const { url, key } = getSupabaseConfig();
  return url.length > 10 && key.length > 10 && url.startsWith('http');
};
