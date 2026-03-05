import React, { createContext, useContext } from "react";
import { usePeriodNavigation, PeriodNavigationState } from "../hooks/usePeriodNavigation";

const PeriodNavigationContext = createContext<PeriodNavigationState | null>(null);

/**
 * Fournisseur de contexte pour la navigation de période partagée.
 *
 * @description
 * Instancie usePeriodNavigation UNE SEULE FOIS et partage l'état entre
 * toutes les vues (Dashboard, Balances, Operations). L'état persiste lors
 * des changements de vue : changer de mois dans Balances conserve le mois
 * affiché en revenant sur Dashboard.
 *
 * @example
 * // Dans App.tsx
 * <PeriodNavigationProvider>
 *   <AppContent />
 * </PeriodNavigationProvider>
 */
export const PeriodNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const nav = usePeriodNavigation();
  return <PeriodNavigationContext.Provider value={nav}>{children}</PeriodNavigationContext.Provider>;
};

/**
 * Hook consommateur du contexte de navigation de période.
 *
 * @example
 * const { currentDate, scope, activeWeek, handlePrevMonth, handleNextMonth, setScope, setActiveWeek } = usePeriodNav();
 */
export const usePeriodNav = (): PeriodNavigationState => {
  const ctx = useContext(PeriodNavigationContext);
  if (!ctx) throw new Error("usePeriodNav doit être utilisé à l'intérieur de PeriodNavigationProvider");
  return ctx;
};
