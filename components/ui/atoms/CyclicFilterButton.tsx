/**
 * @file Bouton cyclique de filtre générique (Atomic Design - Atom)
 * @description Composant atomique réutilisable pour les filtres qui cyclent entre
 * plusieurs états prédéfinis (ex: Tous → Dépenses → Revenus). Affiche un label,
 * une icône et applique des styles dynamiques selon l'état actif.
 *
 * @architecture
 * **Atom pur :** Aucune logique métier, uniquement présentation.
 * La logique de cycle et configuration est gérée par `useFilterBarLogic`.
 *
 * **Design visuel :**
 * - Badge coloré avec icône + label
 * - Styles dynamiques selon l'état (couleurs, bordures, hover)
 * - Transition fluide entre états
 * - Responsive (texte caché sur mobile si nécessaire)
 *
 * **États typiques :**
 * - Neutre : Blanc avec texte gris (état "ALL")
 * - Actif : Couleur thématique (indigo, emerald, amber, etc.)
 *
 * @example
 * ```tsx
 * <CyclicFilterButton
 *   label="Dépenses"
 *   icon={<TrendingDown size={14} />}
 *   color="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
 *   onClick={cycleFlux}
 * />
 * ```
 */
import React from "react";

interface CyclicFilterButtonProps {
  /** Label affiché dans le bouton */
  label: string;
  /** Icône Lucide React (14px recommandé) */
  icon: React.ReactNode;
  /** Classes Tailwind pour le style (bg, border, text, hover) */
  color: string;
  /** Handler du clic (cycle vers l'état suivant) */
  onClick: () => void;
  /** Classes additionnelles optionnelles */
  className?: string;
}

/**
 * Bouton cyclique de filtre avec icône et label.
 *
 * @description
 * Composant atomique réutilisable pour afficher un filtre qui cycle entre états.
 * Le style visuel (couleur, icône) est déterminé par le hook `useFilterBarLogic`
 * selon l'état actuel du filtre.
 *
 * **Accessibilité :**
 * - Bouton cliquable avec zone tactile généreuse (px-3 py-1.5)
 * - Transition visuelle au clic
 * - Icône + texte pour meilleure compréhension
 *
 * **Responsive :**
 * - Mobile : Affiche icône + label complet
 * - Tablette/Desktop : Idem (pas de différence)
 */
export const CyclicFilterButton: React.FC<CyclicFilterButtonProps> = ({ label, icon, color, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-[30px] rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${color} ${className}`}
    >
      {icon}
      {label}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-40 ml-0.5"
      >
        <polyline points="17 1 21 5 17 9"></polyline>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
        <polyline points="7 23 3 19 7 15"></polyline>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
      </svg>
    </button>
  );
};
