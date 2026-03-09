import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  year: number;
  onYearChange: (year: number) => void;
}

const MonthSelectorComponent: React.FC<MonthSelectorProps> = ({ year, onYearChange }) => {
  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          aria-label="Année précédente"
          className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600"
        >
          <ChevronLeft size={16} />
        </button>

        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="text-xs font-bold text-slate-900 px-2 bg-transparent outline-none cursor-pointer"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          aria-label="Année suivante"
          className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export const MonthSelector = React.memo(MonthSelectorComponent);
