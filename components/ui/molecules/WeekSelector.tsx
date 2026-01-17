import React from "react";
import { WeeklyBudget } from "../../../types";
import { Search } from "lucide-react";

interface WeekSelectorProps {
  weeks: WeeklyBudget[];
  activeWeek: number;
  onSelect: (weekNumber: number) => void;
  searchQuery?: string;
  showBadge?: boolean;
}

/**
 * Sélecteur d'onglets pour naviguer entre les périodes de l'échéancier.
 * Affiche un badge contextuel :
 * - Rouge : Nombre d'opérations en attente (comportement par défaut)
 * - Bleu : Nombre de résultats trouvés (si recherche active)
 */
export const WeekSelector: React.FC<WeekSelectorProps> = ({ weeks, activeWeek, onSelect, searchQuery, showBadge = true }) => {
  const isSearching = !!searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="grid bg-white border border-slate-200 p-1 rounded-xl shadow-sm" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
      {weeks.map((week) => {
        // En mode recherche, on compte les éléments trouvés (déjà filtrés dans 'weeks')
        // En mode normal, on compte les éléments non payés
        const count = isSearching ? week.items.length : week.items.filter((i) => !i.isPaid).length;
        const isActive = activeWeek === week.weekNumber;

        return (
          <button
            key={week.weekNumber}
            onClick={() => onSelect(week.weekNumber)}
            className={`relative py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
              isActive ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <span className="truncate max-w-full whitespace-nowrap">
              {week.startDate}-{week.endDate}
            </span>

            {/* Badge Contextuel */}
            {showBadge && count > 0 && (
              <div
                className={`absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-black shadow-sm animate-in zoom-in duration-300 gap-0.5 ${
                  isSearching ? "bg-indigo-500 text-white" : isActive ? "bg-rose-500 text-white" : "bg-rose-400 text-white"
                }`}
              >
                {isSearching && <Search size={7} strokeWidth={3} />}
                {count}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
