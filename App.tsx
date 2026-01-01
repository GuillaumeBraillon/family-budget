
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useBudget } from './hooks/useBudget';
import { useConfigurationUI, ConfigTab } from './hooks/useConfigurationUI';
import { Header } from './components/Layout/Header';
import { DashboardView } from './components/features/Dashboard/DashboardView';
import { BalancesView } from './components/features/Balances/BalancesView';
import { OperationsView } from './components/features/Operations/OperationsView';
import { TransfersView } from './components/features/Transfers/TransfersView';
import { SavingsView } from './components/features/Savings/SavingsView';
import { ConfigurationView } from './components/features/Configuration/ConfigurationView';
import { SupabaseSetup } from './components/Configuration/SupabaseSetup';
import { WelcomeEmptyState } from './components/features/Dashboard/components/WelcomeEmptyState';
import { isSupabaseConfigured, resetSupabaseConfig } from './services/supabase';
import { OperationFilters } from './types';

type ViewState = 'dashboard' | 'balances' | 'planner' | 'transfers' | 'savings' | 'config';

const App: React.FC = () => {
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  
  // État pour la navigation avec contexte (Dashboard -> Operations)
  const [plannerContext, setPlannerContext] = useState<{ date: Date; weekNumber?: number; filters?: Partial<OperationFilters> } | null>(null);
  
  const { 
    accounts, configs, incomeConfigs, categories, people, 
    paidItems, settings, transfers, variableTransactions, savedLabels, tags,
    loading, error, isDbEmpty, actions 
  } = useBudget();

  const { activeTab, setActiveTab } = useConfigurationUI();

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const navigateToConfig = (tab: ConfigTab) => {
    setActiveTab(tab);
    setCurrentView('config');
  };

  const navigateToPlannerWithContext = (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => {
    setPlannerContext({ date, filters, weekNumber });
    setCurrentView('planner');
  };

  const handleResetConnection = () => {
    resetSupabaseConfig();
    setIsConfigured(false);
  };

  if (!isConfigured) {
    return <SupabaseSetup onConfigured={() => { setIsConfigured(true); actions.loadData(); }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <p className="text-sm font-medium animate-pulse">Chargement de vos finances...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center border border-rose-100">
          <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Une erreur est survenue</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => actions.loadData()}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (isDbEmpty && currentView !== 'config') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Header currentView={currentView} onViewChange={setCurrentView} />
        <main className="max-w-7xl mx-auto px-4 py-8">
           <WelcomeEmptyState onStartConfig={() => navigateToConfig('family')} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'dashboard' && (
          <DashboardView 
            accounts={accounts}
            people={people}
            configs={configs}
            incomeConfigs={incomeConfigs}
            paidItems={paidItems}
            settings={settings}
            transfers={transfers}
            variableTransactions={variableTransactions}
            categories={categories}
            onNavigateToPlanner={navigateToPlannerWithContext}
            onNavigateToConfig={() => navigateToConfig('general')}
          />
        )}

        {currentView === 'balances' && (
          <BalancesView 
            accounts={accounts}
            people={people}
            configs={configs}
            incomeConfigs={incomeConfigs}
            paidItems={paidItems}
            variableTransactions={variableTransactions}
            settings={settings}
            categories={categories}
            onUpdateAccount={actions.upsertAccount}
          />
        )}

        {currentView === 'planner' && (
          <OperationsView 
            initialDate={plannerContext?.date}
            initialWeek={plannerContext?.weekNumber}
            initialFilters={plannerContext?.filters}
            configs={configs}
            incomeConfigs={incomeConfigs}
            variableTransactions={variableTransactions}
            accounts={accounts}
            people={people}
            paidItems={paidItems}
            settings={settings}
            categories={categories}
            savedLabels={savedLabels}
            tags={tags}
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
            variableTransactions={variableTransactions}
            settings={settings}
            savedLabels={savedLabels} 
            onUpsertTransfer={actions.upsertTransfer} 
            onUpsertTransaction={actions.upsertVariableTransaction}
            onDeleteTransfer={actions.deleteTransfer} 
            onNavigateToConfig={() => navigateToConfig('accounts')} 
          />
        )}

        {currentView === 'config' && (
          <ConfigurationView 
            configs={configs}
            incomeConfigs={incomeConfigs}
            categories={categories}
            people={people}
            accounts={accounts}
            settings={settings}
            savedLabels={savedLabels}
            tags={tags}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onUpdateCategories={actions.upsertCategory}
            onUpsertPerson={actions.upsertPerson}
            onDeletePerson={actions.deletePerson}
            onUpsertAccount={actions.upsertAccount}
            onDeleteAccount={actions.deleteAccount}
            onUpdateSettings={actions.updateSettings}
            onResetConnection={handleResetConnection}
            onUpsertLabel={actions.upsertLabel}
            onDeleteLabel={actions.deleteLabel}
            onAddConfig={actions.upsertConfig}
            onUpdateConfig={actions.upsertConfig}
            onDeleteConfig={actions.deleteConfig}
            onAddIncome={actions.upsertIncome}
            onUpdateIncome={actions.upsertIncome}
            onDeleteIncome={actions.deleteIncome}
            onImportLabels={actions.importLabels}
            onImportVirLabels={actions.importVirLabels}
            onUpsertTag={actions.upsertTag}
            onDeleteTag={actions.deleteTag}
          />
        )}
      </main>
    </div>
  );
};

export default App;
