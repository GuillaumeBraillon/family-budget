
import React, { useState } from 'react';
import { useBudget } from './hooks/useBudget';
import { WelcomeEmptyState } from './components/Dashboard/WelcomeEmptyState';
import { DashboardPlaceholder } from './components/Dashboard/DashboardPlaceholder';
import { BudgetPlanner } from './components/BudgetPlanner/BudgetPlanner';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { Header } from './components/Layout/Header';
import { ConfigTab } from './hooks/useConfigurationUI';
import { Loader2, AlertTriangle } from 'lucide-react';

/** 
 * Les vues possibles de l'application 
 */
type ViewState = 'dashboard' | 'planner' | 'config';

/**
 * Composant Racine de l'Application "Budget Familial".
 * 
 * Orchestre l'état global et la navigation. Le Dashboard est actuellement en 
 * mode "Placeholder" en attendant l'implémentation des calculs réels.
 * 
 * @returns {React.ReactElement}
 */
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');
  
  const { 
    accounts, configs, incomeConfigs, categories, people, paidItems, settings,
    loading, error, isDbEmpty, actions 
  } = useBudget();

  /**
   * Navigation assistée vers la configuration
   */
  const navigateToConfig = (tab: ConfigTab) => {
    setCurrentView('config');
    setActiveConfigTab(tab);
  };

  /**
   * Rendu de l'état de chargement initial
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
          <p className="font-medium">Synchronisation des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Barre de notification d'erreur */}
        {error !== null && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-3 items-center shadow-sm">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase opacity-60">Erreur de synchronisation</span>
              <span className="text-sm font-medium">{String(error)}</span>
            </div>
            <button 
              onClick={() => actions.loadData()} 
              className="ml-auto text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
            >
              RÉESSAYER
            </button>
          </div>
        )}

        {/* État initial : L'utilisateur n'a rien configuré */}
        {isDbEmpty && !loading && !error && (
          <WelcomeEmptyState onStartConfig={() => navigateToConfig('family')} />
        )}

        {/* --- ROUTAGE DES VUES --- */}

        {currentView === 'dashboard' && (
          <DashboardPlaceholder 
            onNavigateToPlanner={() => setCurrentView('planner')}
            onNavigateToConfig={() => navigateToConfig('general')}
          />
        )}

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
              onAddConfig={actions.upsertConfig} 
              onUpdateConfig={actions.upsertConfig} 
              onDeleteConfig={actions.deleteConfig}
              onAddIncome={actions.upsertIncome} 
              onUpdateIncome={actions.upsertIncome} 
              onDeleteIncome={actions.deleteIncome}
            />
          </div>
        )}

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
              // Correcting the setter name from setActiveTab to setActiveConfigTab to fix the "Cannot find name 'setActiveTab'" error
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
