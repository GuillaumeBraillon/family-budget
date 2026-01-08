import React from "react";
import { LayoutDashboard, ArrowRight } from "lucide-react";

interface DashboardHeaderProps {
  currentDate: Date;
  onNavigateToPlanner: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ currentDate, onNavigateToPlanner }) => {
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(currentDate);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 capitalize">
          <LayoutDashboard className="text-indigo-600" />
          Situation : {monthLabel}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Vue consolidée de l'ensemble du mois en cours.</p>
      </div>
      <div>
        <button
          onClick={onNavigateToPlanner}
          className="text-xs font-bold px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 transition-colors shadow-sm"
        >
          Gérer l'échéancier <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
