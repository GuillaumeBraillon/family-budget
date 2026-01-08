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
  className?: string;
}

export const ListSorter: React.FC<ListSorterProps> = ({ options, currentSort, currentOrder, onSortChange, className = "" }) => {
  const handleClick = (key: string) => {
    if (currentSort === key) {
      onSortChange(key, currentOrder === "asc" ? "desc" : "asc");
    } else {
      // Par défaut descendant pour les dates et montants souvent préférés, ascendant pour le texte
      // Ici on simplifie : on bascule ou on initie en ASC par défaut
      onSortChange(key, "asc");
    }
  };

  return (
    <div className={`flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar ${className}`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline mr-1">Trier</span>
      {options.map((opt) => {
        const isActive = currentSort === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => handleClick(opt.key)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
              isActive
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-700 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt.label}
            {isActive ? (
              currentOrder === "asc" ? (
                <ArrowUp size={10} strokeWidth={3} />
              ) : (
                <ArrowDown size={10} strokeWidth={3} />
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
