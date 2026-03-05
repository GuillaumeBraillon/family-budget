import { useState } from "react";
import { BeneficiaryAmount, PlannedItem } from "../types";

/**
 * Hook de gestion de l'état UI de l'échéancier (Planner).
 *
 * @description
 * Centralise tous les états d'interface de l'échéancier :
 * - Navigation de date et période
 * - Recherche avec persistance localStorage
 * - Sélection d'items pour édition en masse
 * - État des formulaires (ajout/édition)
 *
 * @param {Date} [initialDate=new Date()] - Date initiale d'affichage
 * @param {number} [initialWeek] - Période initiale (1-4), auto-calculée sinon
 * @returns {Object} État et actions UI du Planner
 *
 * @example
 * ```tsx
 * const ui = usePlannerUI(new Date(), 2);
 *
 * return (
 *   <Planner
 *     currentDate={ui.currentDate}
 *     activeWeek={ui.activeWeek}
 *     searchQuery={ui.searchQuery}
 *     onDateChange={ui.setCurrentDate}
 *     onWeekChange={ui.setActiveWeek}
 *   />
 * );
 * ```
 */

/**
 * Calcule le numéro de semaine (1 à 4) utilisé par le Planner
 * en fonction du jour du mois.
 */
const getWeekFromDate = (date: Date): number => {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
};

export const usePlannerUI = (initialDate: Date = new Date(), initialWeek?: number) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Initialisation intelligente de la période active
  const [activeWeek, setActiveWeek] = useState(() => {
    // Si une période est explicitement fournie (navigation dashboard), l'utiliser
    if (initialWeek !== undefined) return initialWeek;

    const today = new Date();
    // Si on affiche le mois en cours, calculer la période actuelle basée sur AUJOURD'HUI
    if (today.getMonth() === initialDate.getMonth() && today.getFullYear() === initialDate.getFullYear()) {
      return getWeekFromDate(today);
    }

    // Sinon, première période du mois affiché
    return 1;
  });

  // Recherche AVEC PERSISTANCE
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem("plannerUI_searchQuery") || "";
  });

  // Sauvegarder la recherche
  const setSearchQueryPersist = (query: string) => {
    setSearchQuery(query);
    localStorage.setItem("plannerUI_searchQuery", query);
  };

  // États des modales
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
    amount: number;
    paymentDate: string;
    accountId: string;
    label: string;
    comments: string;
    beneficiaryAmounts: BeneficiaryAmount[];
  }>({
    isOpen: false,
    item: null,
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    accountId: "",
    label: "",
    comments: "",
    beneficiaryAmounts: [],
  });

  const [uncheckModal, setUncheckModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
  }>({
    isOpen: false,
    item: null,
  });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(1); // Éviter le bug du "31 février"
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(1); // Éviter le bug du "31 février"
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const openConfirmModal = (item: PlannedItem, defaultAccountId: string) => {
    const fallbackBeneficiaryAmounts =
      item.beneficiaryId && item.beneficiaryId.trim().length > 0 ? [{ beneficiaryId: item.beneficiaryId, amount: item.amount }] : [];

    setConfirmModal({
      isOpen: true,
      item,
      amount: item.amount,
      paymentDate: new Date().toISOString().split("T")[0],
      accountId: defaultAccountId,
      label: item.label,
      comments: item.comments || "",
      beneficiaryAmounts: item.beneficiaryAmounts && item.beneficiaryAmounts.length > 0 ? item.beneficiaryAmounts : fallbackBeneficiaryAmounts,
    });
  };

  const closeConfirmModal = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  const openUncheckModal = (item: PlannedItem) => setUncheckModal({ isOpen: true, item });
  const closeUncheckModal = () => setUncheckModal((prev) => ({ ...prev, isOpen: false }));

  return {
    currentDate,
    activeWeek,
    searchQuery,
    confirmModal,
    uncheckModal,
    setActiveWeek,
    setSearchQuery: setSearchQueryPersist,
    setConfirmModal,
    handlePrevMonth,
    handleNextMonth,
    openConfirmModal,
    closeConfirmModal,
    openUncheckModal,
    closeUncheckModal,
  };
};
