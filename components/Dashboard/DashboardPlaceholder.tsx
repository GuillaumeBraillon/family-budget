
import React from 'react';
import { Construction } from 'lucide-react';

interface DashboardPlaceholderProps {
  onNavigateToPlanner: () => void;
  onNavigateToConfig: () => void;
}

/**
 * Composant affiché lorsque le tableau de bord est en maintenance ou en cours de développement.
 * Fournit des points d'entrée rapides vers les fonctionnalités actives.
 */
export const DashboardPlaceholder: React.FC<DashboardPlaceholderProps> = ({ 
  onNavigateToPlanner, 
  onNavigateToConfig 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center max-w-lg">
        <div className="bg-indigo-50 p-5 rounded-full text-indigo-600 mb-6">
          <Construction size={48} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Tableau de Bord</h3>
        <p className="text-slate-500 mt-4 leading-relaxed">
          Cette section est actuellement en cours de refonte pour vous offrir des indicateurs de synthèse plus précis basés sur vos données réelles.
          <br />
          <span className="font-bold text-indigo-600">Le calcul des soldes et de l'équité sera bientôt disponible.</span>
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
          <button 
            onClick={onNavigateToPlanner}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            Échéancier
          </button>
          <button 
            onClick={onNavigateToConfig}
            className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            Paramètres
          </button>
        </div>
      </div>
    </div>
  );
};
