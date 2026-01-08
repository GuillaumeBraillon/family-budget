/**
 * Utilitaire de logging conditionnel avec système de debug activable
 *
 * Niveaux de logs :
 * - log/warn : Uniquement en développement (DEV)
 * - debug : Activable en production via VITE_ENABLE_DEBUG_LOGS=true
 * - error : Toujours actif (monitoring)
 *
 * Pour activer les logs de debug en production :
 * 1. Localement : Ajouter VITE_ENABLE_DEBUG_LOGS=true dans .env
 * 2. Vercel : Ajouter la variable d'environnement dans les settings du projet
 */

const isDev = import.meta.env.DEV;
const isDebugEnabled = import.meta.env.VITE_ENABLE_DEBUG_LOGS === "true";

export const logger = {
  /**
   * Logs standards (uniquement en dev)
   */
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },

  /**
   * Logs de debug détaillés (activables en prod via VITE_ENABLE_DEBUG_LOGS)
   * Utile pour diagnostiquer des problèmes en production sans polluer les logs
   */
  debug: (namespace: string, ...args: any[]) => {
    if (isDev || isDebugEnabled) {
      console.log(`[DEBUG ${namespace}]`, ...args);
    }
  },

  /**
   * Warnings (uniquement en dev)
   */
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },

  /**
   * Erreurs (toujours affichées pour monitoring)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Groupe de logs (uniquement en dev ou si debug activé)
   */
  group: (label: string, fn: () => void) => {
    if (isDev || isDebugEnabled) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },

  /**
   * Vérifie si les logs de debug sont activés
   */
  isDebugEnabled: () => isDev || isDebugEnabled,
};
