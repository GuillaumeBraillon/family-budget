/**
 * Utilitaire de logging conditionnel
 * Les logs de debug ne s'affichent qu'en développement
 * Les erreurs sont toujours loggées pour le monitoring
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Logs de debug (uniquement en dev)
   */
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
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
   * Groupe de logs (uniquement en dev)
   */
  group: (label: string, fn: () => void) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};
