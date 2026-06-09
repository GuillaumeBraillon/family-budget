import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export type SortOrder = "asc" | "desc";

export interface SortOption {
  key: string;
  label: string;
}

interface ListSorterProps {
  options: SortOption[];
  currentSort: string;
  currentOrder: SortOrder;
  onSortChange: (key: string, order: SortOrder) => void;
  canToggleOrder?: boolean; // Si false, empêche le changement d'ordre (ex: tri manuel)
  className?: string;
}

export const ListSorter: React.FC<ListSorterProps> = ({ options, currentSort, currentOrder, onSortChange, canToggleOrder = true, className = "" }) => {
  const handleClick = (key: string) => {
    if (currentSort === key) {
      // Si on ne peut pas toggler l'ordre (ex: tri manuel), ne rien faire
      if (!canToggleOrder) return;
      onSortChange(key, currentOrder === "asc" ? "desc" : "asc");
    } else {
      // Par défaut descendant pour les dates et montants souvent préférés, ascendant pour le texte
      // Ici on simplifie : on bascule ou on initie en ASC par défaut
      onSortChange(key, "asc");
    }
  };

  return (
    <div className={`flex flex-row flex-wrap items-center gap-1 sm:gap-2 ${className}`}>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline mr-1">Trier</span>
      {options.map((opt) => {
        const isActive = currentSort === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => handleClick(opt.key)}
            className={`h-7 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all whitespace-nowrap border sm:h-auto sm:px-2.5 sm:py-1.5 sm:text-xs sm:gap-1.5 ${
              isActive
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-700 border-slate-200 hover:border-slate-300"
            } ${isActive && !canToggleOrder ? "cursor-default" : "cursor-pointer"}`}
            title={isActive && !canToggleOrder ? "Ordre fixe en mode manuel" : ""}
          >
            {opt.label}
            {isActive ? (
              canToggleOrder ? (
                currentOrder === "asc" ? (
                  <ArrowUp size={10} strokeWidth={3} />
                ) : (
                  <ArrowDown size={10} strokeWidth={3} />
                )
              ) : (
                // En mode manuel, afficher une icône fixe pour indiquer que l'ordre ne peut pas changer
                <ArrowDown size={10} strokeWidth={3} className="opacity-50" />
              )
            ) : (
              <ArrowUpDown size={10} className="opacity-30" />
            )}
          </button>
        );
      })}
    </div>
  );
};
