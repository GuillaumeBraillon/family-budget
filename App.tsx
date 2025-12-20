
import React, { useState, useEffect } from 'react';
import { useBudget } from './hooks/useBudget';
import { WelcomeEmptyState } from './components/Dashboard/WelcomeEmptyState';
import { DashboardPlaceholder } from './components/Dashboard/DashboardPlaceholder';
import { BudgetPlanner } from './components/BudgetPlanner/BudgetPlanner';
import { BalancesView } from './components/Balances/BalancesView';
import { VariableExpensesView } from './components/VariableExpenses/VariableExpensesView';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { Header } from './components/Layout/Header';
import { ConfigTab } from './hooks/useConfigurationUI';
import { SupabaseSetup } from './components/Configuration/SupabaseSetup';
import { isSupabaseConfigured, resetSupabaseConfig } from './services/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';
import { SavingsDashboard } from './components/Savings/SavingsDashboard';

type ViewState = 'dashboard' | 'balances' | 'planner' | 'savings' | 'config' | 'variables';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');
  const [configured, setConfigured] = useState(isSupabaseConfigured());
  
  const { 
    accounts, configs, incomeConfigs, categories, people, paidItems, settings, savingsTransactions, variableTransactions,
    loading, error, isDbEmpty, actions 
  } = useBudget();

  // Déclenche le chargement initial si on vient d'être configuré
  useEffect(() => {
    if (configured) {
      actions.loadData();
    }
  }, [configured, actions.loadData]);

  const handleConfigured = () => {
    setConfigured(true);
    setCurrentView('dashboard');
  };

  const handleResetConnection = () => {
    resetSupabaseConfig();
    setConfigured(false);
    setCurrentView('dashboard'); // Reset de la vue par défaut
  };

  const navigateToConfig = (tab: ConfigTab) => {
    setCurrentView('config');
    setActiveConfigTab(tab);
  };

  if (!configured) {
    return <SupabaseSetup onConfigured={handleConfigured} />;
  }

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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error !== null && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-3 items-center shadow-sm animate-in slide-in-from-top-2">
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

        {isDbEmpty && !loading && !error && (
          <WelcomeEmptyState onStartConfig={() => navigateToConfig('family')} />
        )}

        {currentView === 'dashboard' && (
          <DashboardPlaceholder 
            accounts={accounts}
            people={people}
            configs={configs}
            incomeConfigs={incomeConfigs}
            paidItems={paidItems}
            settings={settings}
            savingsTransactions={savingsTransactions}
            variableTransactions={variableTransactions}
            onNavigateToPlanner={() => setCurrentView('planner')}
            onNavigateToConfig={() => navigateToConfig('general')}
          />
        )}
        
        {currentView === 'variables' && (
          <VariableExpensesView 
             variableTransactions={variableTransactions}
             accounts={accounts}
             settings={settings}
             incomeConfigs={incomeConfigs}
             people={people}
             categories={categories}
             onAddTransaction={actions.upsertVariableTransaction}
             onDeleteTransaction={actions.deleteVariableTransaction}
          />
        )}

        {currentView === 'balances' && (
          <BalancesView 
            accounts={accounts}
            people={people}
            configs={configs}
            incomeConfigs={incomeConfigs}
            paidItems={paidItems}
            settings={settings}
            onUpdateAccount={actions.upsertAccount}
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

        {currentView === 'savings' && (
          <div className="animate-in fade-in duration-500">
            <SavingsDashboard 
              accounts={accounts}
              savingsTransactions={savingsTransactions}
              settings={settings}
              onUpsertTransaction={actions.upsertSavingsTransaction}
              onDeleteTransaction={actions.deleteSavingsTransaction}
              onNavigateToConfig={() => navigateToConfig('accounts')}
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
              setActiveTab={setActiveConfigTab}
              onUpdateCategories={actions.upsertCategory as any} // Reste temporaire, à refactoriser si besoin
              onUpsertPerson={actions.upsertPerson} 
              onDeletePerson={actions.deletePerson}
              onUpsertAccount={actions.upsertAccount}
              onDeleteAccount={actions.deleteAccount}
              onUpdateSettings={actions.updateSettings}
              onResetConnection={handleResetConnection}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
