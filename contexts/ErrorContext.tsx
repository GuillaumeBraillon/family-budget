/**
 * @file Contexte global de gestion des erreurs
 * @description Fournit un système centralisé pour afficher les erreurs dans une modale élégante
 * au lieu d'utiliser console.error/alert dispersés. Compatible avec Error Boundary et try/catch.
 *
 * @architecture
 * **Fonctionnalités :**
 * - Capture des erreurs handlers (try/catch)
 * - Affichage modale unifiée (même design que Error Boundary)
 * - Stack trace pliable pour debug
 * - Actions : Fermer, Rafraîchir, Retour accueil
 *
 * **Usage :**
 * ```tsx
 * const { showError } = useError();
 *
 * try {
 *   await doSomething();
 * } catch (error) {
 *   showError(error as Error);
 * }
 * ```
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ErrorContextValue {
  showError: (error: Error, context?: string) => void;
  clearError: () => void;
  currentError: ErrorInfo | null;
}

interface ErrorInfo {
  error: Error;
  context?: string;
  timestamp: Date;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

// Pattern standard pour les Contexts React : hook + provider dans le même fichier
// pour garder la logique liée ensemble. Fast Refresh fonctionne correctement.
// eslint-disable-next-line react-refresh/only-export-components
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError doit être utilisé dans un ErrorProvider");
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);

  const showError = useCallback((error: Error, context?: string) => {
    console.error("❌ Erreur capturée:", { error, context });
    setCurrentError({
      error,
      context,
      timestamp: new Date(),
    });
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  return <ErrorContext.Provider value={{ showError, clearError, currentError }}>{children}</ErrorContext.Provider>;
};
