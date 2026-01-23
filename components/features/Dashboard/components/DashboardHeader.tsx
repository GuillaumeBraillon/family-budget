import React from "react";
import { LayoutDashboard, ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardHeaderProps {
  currentDate: Date;
  year: number;
  onYearChange: (year: number) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ currentDate, year, onYearChange }) => {
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(currentDate);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 capitalize">
          <LayoutDashboard className="text-indigo-600" />
          Situation : {monthLabel}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Analyses financières annuelles avec détails mensuels et périodiques.</p>
      </div>
      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
        <button onClick={() => onYearChange(year - 1)} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-bold text-slate-900 px-2 min-w-[40px] text-center">{year}</span>
        <button onClick={() => onYearChange(year + 1)} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
