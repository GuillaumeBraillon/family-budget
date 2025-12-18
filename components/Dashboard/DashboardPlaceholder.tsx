
import React, { useMemo } from 'react';
import { LayoutDashboard, ArrowRight } from 'lucide-react';
import { usePlanner } from '../../hooks/usePlanner';
import { StatsSummary } from '../BudgetPlanner/organisms/StatsSummary';
import { DetailedAnalysis } from '../BudgetPlanner/organisms/DetailedAnalysis';
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings } from '../../types';

interface DashboardViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  onNavigateToPlanner: () => void;
  onNavigateToConfig: () => void;
}

/**
 * Tableau de bord principal.
 * Affiche une vue synthétique du MOIS EN COURS (sans découpage par période).
 */
export const DashboardPlaceholder: React.FC<DashboardViewProps> = ({ 
  accounts, people, configs, incomeConfigs, paidItems, settings,
  onNavigateToPlanner, 
  onNavigateToConfig 
}) => {
  const currentDate = new Date();
  
  // ASTUCE : On force une configuration "Période unique" pour le dashboard
  // afin que usePlanner calcule les stats sur l'intégralité du mois (Jours 1 à 31)
  // sans découpage hebdomadaire.
  const monthlySettings: AppSettings = useMemo(() => ({
    ...settings,
    period_type: 'FIXED_DAYS',
    period_value: 32 // Force une période plus longue que n'importe quel mois
  }), [settings]);

  const { getStats } = usePlanner(configs, incomeConfigs, paidItems, currentDate, '', monthlySettings);
  
  // On récupère les stats de la "Période 1" qui correspond ici à tout le mois
  const currentMonthStats = getStats(1);

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* En-tête du Dashboard */}
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
        <div className="flex gap-2">
            <button 
                onClick={onNavigateToPlanner}
                className="text-xs font-bold px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors"
            >
                Voir l'échéancier détaillé <ArrowRight size={14} />
            </button>
        </div>
      </div>

      {/* Cartes de Synthèse (Reste à payer, Budget Période/Mois) */}
      <StatsSummary stats={currentMonthStats} accounts={accounts} />

      {/* Analyse Détaillée (Flux période, Flux par compte) */}
      <DetailedAnalysis stats={currentMonthStats} people={people} accounts={accounts} />

    </div>
  );
};
