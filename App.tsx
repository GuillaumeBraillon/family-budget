
import React, { useState } from 'react';
import { useBudget } from './hooks/useBudget';
import { AccountsOverview } from './components/Dashboard/AccountsOverview';
import { BudgetEnvelopes } from './components/Dashboard/BudgetEnvelopes';
import { EquityKPI } from './components/Dashboard/EquityKPI';
import { WelcomeEmptyState } from './components/Dashboard/WelcomeEmptyState';
import { BudgetPlanner } from './components/BudgetPlanner/BudgetPlanner';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { Header } from './components/Layout/Header';
import { ConfigTab } from './hooks/useConfigurationUI';
import { InfoBox } from './components/ui/InfoBox';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';

type ViewState = 'dashboard' | 'planner' | 'config';

/**
 * Point d'entrée principal de l'application Budget Familial.
 * Gère le routage interne (vues), l'état global et les retours utilisateurs (chargement/erreurs).
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');
  
  const { 
    accounts, configs, incomeConfigs, categories, people, paidItems, settings,
    loading, error, isDbEmpty, actions 
  } = useBudget();

  /**
   * Redirige l'utilisateur vers un onglet spécifique de la configuration.
   */
  const navigateToConfig = (tab: ConfigTab) => {
    setCurrentView('config');
    setActiveConfigTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
          <p className="font-medium">Chargement de vos finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Affichage des erreurs critiques */}
        {error !== null && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-3 items-center shadow-sm">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase opacity-60">Erreur Technique</span>
              <span className="text-sm font-medium">{String(error)}</span>
            </div>
            <button 
              onClick={() => actions.loadData()} 
              className="ml-auto text-[10px] font-bold bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
            >
              RÉESSAYER
            </button>
          </div>
        )}

        {/* État vide / Premier démarrage */}
        {isDbEmpty && !loading && !error && (
          <WelcomeEmptyState onStartConfig={() => navigateToConfig('family')} />
        )}

        {/* Vue : TABLEAU DE BORD */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {!isDbEmpty && (
              <InfoBox 
                title="Bienvenue sur votre tableau de bord"
                description="Cette vue synthétise votre santé financière globale. Vous y trouverez le total de vos comptes, le suivi de vos enveloppes variables et la répartition d'équité basée sur les revenus déclarés."
                icon={<Sparkles size={18} />}
              />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AccountsOverview accounts={accounts} people={people} />
              </div>
              <div className="space-y-6">
                <BudgetEnvelopes transactions={[]} people={people} weeklyLimit={settings.weekly_envelope} />
                <EquityKPI people={people} incomeConfigs={incomeConfigs} />
              </div>
            </div>
          </div>
        )}

        {/* Vue : ÉCHÉANCIER / PLANNER */}
        {currentView === 'planner' && (
          <div className="animate-in fade-in duration-500">
            <BudgetPlanner 
              configs={configs} 
              incomeConfigs={incomeConfigs} 
              categories={categories}
              accounts={accounts} 
              people={people} 
              paidItems={paidItems} 
              settings={settings}
              onTogglePaid={actions.setPaidStatus}
              onAddConfig={actions.upsertConfig} onUpdateConfig={actions.upsertConfig} onDeleteConfig={actions.deleteConfig}
              onAddIncome={actions.upsertIncome} onUpdateIncome={actions.upsertIncome} onDeleteIncome={actions.deleteIncome}
            />
          </div>
        )}

        {/* Vue : CONFIGURATION ET PARAMÈTRES */}
        {currentView === 'config' && (
          <div className="animate-in fade-in duration-500">
            <ConfigurationView 
              configs={configs} 
              incomeConfigs={incomeConfigs} 
              categories={categories} 
              people={people} 
              accounts={accounts} 
              settings={settings}
              activeTab={activeConfigTab}
              setActiveTab={setActiveConfigTab}
              onUpdateCategories={actions.upsertCategory as any} 
              onUpdatePeople={actions.upsertPerson as any} 
              onUpdateAccounts={actions.upsertAccount as any}
              onUpdateSettings={actions.updateSettings}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
