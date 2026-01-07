/**
 * @file Header de la barre de filtres (Atomic Design - Molecule)
 * @description Composant moléculaire simple pour le label "FILTRES" avec badge
 * de comptage des filtres actifs.
 *
 * @architecture
 * **Molecule simplifiée :** Affiche uniquement le label et le badge.
 * Les boutons d'action (toggle, reset) sont gérés directement dans FilterBar
 * pour un meilleur contrôle du layout.
 *
 * **Comportement visuel :**
 * - Badge "!" animé si filtres actifs (zoom-in animation)
 * - Label "Filtres" caché sur mobile (sm:inline)
 *
 * @example
 * ```tsx
 * <FilterBarHeader activeFiltersCount={3} />
 * ```
 */
import React from "react";
import { Filter } from "lucide-react";

interface FilterBarHeaderProps {
  /** Nombre total de filtres actifs (pour le badge) */
  activeFiltersCount: number;
}

/**
 * Header simplifié de la barre de filtres.
 *
 * @description
 * Affiche uniquement le label "FILTRES" avec un badge de comptage animé
 * si des filtres sont actifs. Conçu pour être composé avec d'autres boutons
 * dans le layout principal de FilterBar.
 */
export const FilterBarHeader: React.FC<FilterBarHeaderProps> = ({ activeFiltersCount }) => {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 flex-shrink-0 h-8">
      <Filter size={14} />
      <span className="hidden sm:inline">Filtres</span>
      {activeFiltersCount > 0 && (
        <span className="bg-indigo-600 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">!</span>
      )}
    </div>
  );
};
