
import React, { useState, useEffect } from 'react';
import { useBudget } from './hooks/useBudget';
import { WelcomeEmptyState } from './components/features/Dashboard/components/WelcomeEmptyState';
import { DashboardView } from './components/features/Dashboard/DashboardView';
import { OperationsView } from './components/features/Operations/OperationsView';
import { TransfersView } from './components/features/Transfers/TransfersView';
import { BalancesView } from './components/features/Balances/BalancesView';
import { ConfigurationView } from './components/features/Configuration/ConfigurationView';
import { SavingsView } from './components/features/Savings/SavingsView';
import { Header } from './components/Layout/Header';
import { ConfigTab } from './hooks/useConfigurationUI';
import { SupabaseSetup } from './components/Configuration/SupabaseSetup';
import { isSupabaseConfigured, resetSupabaseConfig } from './services/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';

type ViewState = 'dashboard' | 'balances' | 'planner' | 'transfers' | 'savings' | 'config';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');
  const [configured, setConfigured] = useState(isSupabaseConfigured());
  
  const { 
    accounts, configs, incomeConfigs, categories, people, paidItems, settings, transfers, variableTransactions, savedLabels,
    loading, error, isDbEmpty, actions 
  } = useBudget();

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
    setCurrentView('dashboard');
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
            <button onClick={() => actions.loadData()} className="ml-auto text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
              RÉESSAYER
            </button>
          </div>
        )}

        {isDbEmpty && !loading && !error && (
          <WelcomeEmptyState onStartConfig={() => navigateToConfig('family')} />
        )}

        {currentView === 'dashboard' && (
          <DashboardView 
            accounts={accounts} people={people} configs={configs} incomeConfigs={incomeConfigs} paidItems={paidItems} 
            settings={settings} transfers={transfers} variableTransactions={variableTransactions}
            onNavigateToPlanner={() => setCurrentView('planner')} onNavigateToConfig={() => navigateToConfig('general')}
          />
        )}
        
        {currentView === 'balances' && (
          <BalancesView accounts={accounts} people={people} configs={configs} incomeConfigs={incomeConfigs} paidItems={paidItems} variableTransactions={variableTransactions} settings={settings} onUpdateAccount={actions.upsertAccount} />
        )}

        {currentView === 'planner' && (
          <OperationsView 
            configs={configs} 
            incomeConfigs={incomeConfigs} 
            variableTransactions={variableTransactions} 
            paidItems={paidItems} 
            settings={settings} 
            accounts={accounts} 
            people={people} 
            categories={categories} 
            savedLabels={savedLabels} 
            onTogglePaid={actions.setPaidStatus} 
            onUpsertVariable={actions.upsertVariableTransaction} 
            onDeleteVariable={actions.deleteVariableTransaction} 
          />
        )}

        {currentView === 'transfers' && (
          <TransfersView 
            transfers={transfers}
            accounts={accounts} 
            people={people} 
            settings={settings} 
            categories={categories} 
            savedLabels={savedLabels} 
            onUpsertTransfer={actions.upsertTransfer}
            onDeleteTransfer={actions.deleteTransfer}
          />
        )}

        {currentView === 'savings' && (
          <SavingsView 
            accounts={accounts} 
            transfers={transfers}
            settings={settings}
            savedLabels={savedLabels} 
            onUpsertTransfer={actions.upsertTransfer} 
            onDeleteTransfer={actions.deleteTransfer} 
            onNavigateToConfig={() => navigateToConfig('accounts')} 
          />
        )}

        {currentView === 'config' && (
          <ConfigurationView configs={configs} incomeConfigs={incomeConfigs} categories={categories} people={people} accounts={accounts} settings={settings} savedLabels={savedLabels} activeTab={activeConfigTab} setActiveTab={setActiveConfigTab} onUpdateCategories={actions.upsertCategory as any} onUpsertPerson={actions.upsertPerson} onDeletePerson={actions.deletePerson} onUpsertAccount={actions.upsertAccount} onDeleteAccount={actions.deleteAccount} onUpdateSettings={actions.updateSettings} onResetConnection={handleResetConnection} onUpsertLabel={actions.upsertLabel} onDeleteLabel={actions.deleteLabel} onAddConfig={actions.upsertConfig} onUpdateConfig={actions.upsertConfig} onDeleteConfig={actions.deleteConfig} onAddIncome={actions.upsertIncome} onUpdateIncome={actions.upsertIncome} onDeleteIncome={actions.deleteIncome} onImportLabels={actions.importLabels} onImportVirLabels={actions.importVirLabels} />
        )}
      </main>
    </div>
  );
};

export default App;
