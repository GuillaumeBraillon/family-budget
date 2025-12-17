import React from 'react';
import { WeeklyBudget } from '../../../types';

interface WeekSelectorProps {
  weeks: WeeklyBudget[];
  activeWeek: number;
  onSelect: (weekNumber: number) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({ weeks, activeWeek, onSelect }) => {
  return (
    <div className="grid grid-cols-4 gap-2 bg-slate-200/60 p-1 rounded-xl">
      {weeks.map((week) => (
        <button 
          key={week.weekNumber} 
          onClick={() => onSelect(week.weekNumber)} 
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            activeWeek === week.weekNumber 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {week.label}
        </button>
      ))}
    </div>
  );
};