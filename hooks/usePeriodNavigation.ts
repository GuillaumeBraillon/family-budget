import { useState } from "react";

export interface PeriodNavigationState {
  currentDate: Date;
  scope: "MONTH" | "PERIOD";
  activeWeek: number;
  setCurrentDate: (date: Date) => void;
  setScope: (scope: "MONTH" | "PERIOD") => void;
  setActiveWeek: (week: number) => void;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
}

/**
 * Hook de gestion de la navigation de période (mois + scope + semaine active).
 *
 * @description
 * Centralise l'état de navigation partagé entre les vues Dashboard, Balances et Operations.
 * Doit être instancié une seule fois (via PeriodNavigationContext) pour que l'état persiste
 * lors des changements de vue.
 *
 * @returns {PeriodNavigationState} État et handlers de navigation
 */
export const usePeriodNavigation = (): PeriodNavigationState => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scope, setScope] = useState<"MONTH" | "PERIOD">("PERIOD");
  const [activeWeek, setActiveWeek] = useState(() => {
    const day = new Date().getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  });

  const handlePrevMonth = () => {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setDate(1);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
    setActiveWeek(1);
  };

  const handleNextMonth = () => {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
    setActiveWeek(1);
  };

  return { currentDate, setCurrentDate, scope, setScope, activeWeek, setActiveWeek, handlePrevMonth, handleNextMonth };
};
