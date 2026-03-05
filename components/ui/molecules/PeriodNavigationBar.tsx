import React from "react";
import { MonthNavigator } from "./MonthNavigator";
import { ScopeSelector } from "./ScopeSelector";
import { WeekSelector } from "./WeekSelector";
import { usePeriodNav } from "../../../contexts/PeriodNavigationContext";
import { WeeklyBudget } from "../../../types";

interface PeriodNavigationBarProps {
  /** Périodes calculées par la vue courante (pour le WeekSelector). */
  filteredPeriodBudgets: WeeklyBudget[];
  /** Affiche le ScopeSelector et WeekSelector (défaut: true). Mettre false pour une vue sans notion de période. */
  showScope?: boolean;
  /** Slot droite de la barre (ex: SearchBar). */
  children?: React.ReactNode;
}

/**
 * Barre de navigation de période partagée entre les vues.
 *
 * @description
 * Lit et écrit dans le PeriodNavigationContext pour que l'état (mois, scope, semaine)
 * persiste lors des changements de vue. Chaque vue passe ses propres `filteredPeriodBudgets`
 * (calculés localement) pour alimenter le WeekSelector.
 *
 * @example
 * // Dans une vue :
 * const { filteredPeriodBudgets } = useBalancesData(...);
 * return <PeriodNavigationBar filteredPeriodBudgets={filteredPeriodBudgets} />;
 */
export const PeriodNavigationBar: React.FC<PeriodNavigationBarProps> = ({ filteredPeriodBudgets, showScope = true, children }) => {
  const { currentDate, scope, activeWeek, setScope, setActiveWeek, handlePrevMonth, handleNextMonth } = usePeriodNav();

  return (
    <div className="flex flex-row gap-1.5 md:gap-2 items-center flex-wrap">
      <MonthNavigator date={currentDate} onPrev={handlePrevMonth} onNext={handleNextMonth} />
      {showScope && <ScopeSelector scope={scope} onScopeChange={setScope} />}
      {showScope && scope === "PERIOD" && filteredPeriodBudgets.length > 0 && (
        <WeekSelector weeks={filteredPeriodBudgets} activeWeek={activeWeek} onSelect={setActiveWeek} searchQuery="" showBadge={false} />
      )}
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
};
