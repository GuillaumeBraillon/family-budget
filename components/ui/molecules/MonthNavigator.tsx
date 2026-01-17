import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthNavigatorProps {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({ date, onPrev, onNext }) => {
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);

  return (
    <div className="flex items-center gap-0 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
      <button onClick={onPrev} className="px-2 py-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" aria-label="Mois précédent">
        <ChevronLeft size={16} />
      </button>
      <div className="flex items-center gap-2 px-2 py-2 justify-center font-bold text-slate-800 capitalize text-xs whitespace-nowrap">
        <Calendar size={14} className="text-indigo-600" />
        {monthLabel}
      </div>
      <button onClick={onNext} className="px-2 py-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" aria-label="Mois suivant">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
