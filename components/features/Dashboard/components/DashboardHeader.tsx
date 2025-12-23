
import React from 'react';
import { LayoutDashboard, ArrowRight, Calendar, CalendarRange } from 'lucide-react';

interface DashboardHeaderProps {
  currentDate: Date;
  onNavigateToPlanner: () => void;
  scope: 'MONTH' | 'PERIOD';
  setScope: (s: 'MONTH' | 'PERIOD') => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ currentDate, onNavigateToPlanner, scope, setScope }) => {
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
         <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 capitalize">
           <LayoutDashboard className="text-indigo-600" />
           Situation : {monthLabel}
         </h2>
         <p className="text-sm text-slate-500 mt-1">
           Vue consolidée de l'ensemble du mois en cours.
         </p>
      </div>
      <div className="flex gap-3 items-center">
          <div className="bg-white border border-slate-200 p-1 rounded-lg flex items-center">
              <button 
                onClick={() => setScope('MONTH')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${scope === 'MONTH' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <Calendar size={14} /> Mois
              </button>
              <button 
                onClick={() => setScope('PERIOD')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${scope === 'PERIOD' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <CalendarRange size={14} /> Période
              </button>
          </div>

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
