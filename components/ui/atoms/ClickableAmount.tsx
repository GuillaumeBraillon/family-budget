/**
 * @file Composant de montant cliquable avec filtres
 * @description Composant réutilisable pour créer des liens vers Operations avec filtres.
 * Utilisé dans BalancesHeader, BalancesTable, AnnualIncomeAnalysis, etc.
 *
 * @example
 * ```tsx
 * <ClickableAmount
 *   date={currentDate}
 *   filters={{ status: "WAITING", accountIds: ["acc_1"] }}
 *   onNavigate={onNavigateToPlanner}
 *   className="text-amber-600 font-bold"
 * >
 *   304.57 €
 * </ClickableAmount>
 * ```
 */
import React from "react";
import { OperationFilters } from "../../../types";

interface ClickableAmountProps {
  /** Contenu à afficher (montant, texte, badge, etc.) */
  children: React.ReactNode;
  /** Date du mois à afficher dans Operations */
  date: Date;
  /** Filtres à appliquer dans Operations */
  filters: Partial<OperationFilters>;
  /** Numéro de semaine/période (optionnel) */
  weekNumber?: number;
  /** Callback de navigation */
  onNavigate: (date: Date, filters: Partial<OperationFilters>, weekNumber?: number) => void;
  /** Classes CSS additionnelles */
  className?: string;
  /** Titre au survol (tooltip natif) */
  title?: string;
  /** Type d'élément HTML (button ou div) */
  as?: "button" | "div";
}

/**
 * Composant de montant/valeur cliquable avec navigation vers Operations filtrée.
 *
 * @description
 * Crée un élément cliquable qui navigue vers la vue Operations avec des filtres
 * prédéfinis. Gère automatiquement le stopPropagation, le style hover et
 * l'accessibilité (cursor-pointer).
 *
 * **Caractéristiques :**
 * - Empêche la propagation des clics (evite conflits avec containers)
 * - Style hover avec transition douce
 * - Support button ou div selon le contexte sémantique
 * - Classes CSS personnalisables
 * - Tooltip natif optionnel
 *
 * **Cas d'usage :**
 * 1. Indicateurs dans BalancesHeader (En attente, Récurrents, etc.)
 * 2. Montants dans BalancesTable (Standard, Extra)
 * 3. Cellules dans AnnualIncomeAnalysis
 * 4. Badges cliquables avec filtres
 *
 * @param {ClickableAmountProps} props - Props du composant
 * @returns {JSX.Element} Élément cliquable stylisé
 */
export const ClickableAmount: React.FC<ClickableAmountProps> = ({ children, date, filters, weekNumber, onNavigate, className = "", title, as = "div" }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(date, filters, weekNumber);
  };

  const baseClasses = "cursor-pointer transition-colors";
  const combinedClasses = `${baseClasses} ${className}`;

  const Element = as;

  return (
    <Element onClick={handleClick} className={combinedClasses} title={title} type={as === "button" ? "button" : undefined}>
      {children}
    </Element>
  );
};
