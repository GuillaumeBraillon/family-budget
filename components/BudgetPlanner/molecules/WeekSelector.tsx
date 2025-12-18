
import React from 'react';
import { WeeklyBudget } from '../../../types';

interface WeekSelectorProps {
  weeks: WeeklyBudget[];
  activeWeek: number;
  onSelect: (weekNumber: number) => void;
}

/**
 * Sélecteur d'onglets pour naviguer entre les périodes de l'échéancier.
 * Affiche un badge d'alerte représentant le nombre d'opérations (Dépenses ET Revenus)
 * qui n'ont pas encore été pointées (validées) pour la période.
 */
export const WeekSelector: React.FC<WeekSelectorProps> = ({ weeks, activeWeek, onSelect }) => {
  return (
    <div className="grid grid-cols-4 gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
      {weeks.map((week) => {
        // On compte tous les éléments (Dépenses ou Revenus) qui ne sont pas encore pointés
        const pendingCount = week.items.filter(i => !i.isPaid).length;
        const isActive = activeWeek === week.weekNumber;

        return (
          <button 
            key={week.weekNumber} 
            onClick={() => onSelect(week.weekNumber)} 
            className={`relative py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
              isActive 
                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <span className="truncate max-w-full px-1">{week.startDate} au {week.endDate}</span>
            
            {/* Badge des opérations en attente (Impayés ou Non reçus) */}
            {pendingCount > 0 && (
              <div className={`absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm animate-in zoom-in duration-300 ${
                isActive ? 'bg-rose-500 text-white' : 'bg-rose-400 text-white'
              }`}>
                {pendingCount}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
