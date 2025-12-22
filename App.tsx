
import React, { useState, useEffect } from 'react';
import { useBudget } from './hooks/useBudget';
import { WelcomeEmptyState } from './components/Dashboard/WelcomeEmptyState';
import { DashboardView } from './components/features/Dashboard/DashboardView';
import { OperationsView } from './components/features/Operations/OperationsView';
import { BalancesView } from './components/features/Balances/BalancesView';
import { ConfigurationView } from './components/features/Configuration/ConfigurationView';
import { SavingsView } from './components/features/Savings/SavingsView';
import { Header } from './components/Layout/Header';
import { ConfigTab } from './hooks/useConfigurationUI';
import { SupabaseSetup } from './components/Configuration/SupabaseSetup';
import { isSupabaseConfigured, resetSupabaseConfig } from './services/supabase';
import { Loader2, AlertTriangle } from 'lucide-react';

type ViewState = 'dashboard' | 'balances' | 'planner' | 'savings' | 'config';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('family');
  const [configured, setConfigured] = useState(isSupabaseConfigured());
  
  const { 
    accounts, configs, incomeConfigs, categories, people, paidItems, settings, savingsTransactions, variableTransactions, savedLabels,
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

  // --- LOGIQUE DE SUPPRESSION EN CASCADE ---

  // Suppression d'une opération (Variable) -> Vérifie si une ligne d'épargne associée existe
  const handleDeleteVariableWrapper = async (id: string) => {
    // 1. Supprimer l'opération visée
    await actions.deleteVariableTransaction(id);

    // 2. Vérifier si c'est un virement lié à l'épargne (Pattern: var_tr_XXX_TIMESTAMP)
    if (id.startsWith('var_tr_')) {
        // On remplace 'var_tr_' par 'sav_auto_' pour trouver l'équivalent côté épargne
        // Ex: var_tr_out_1715000 -> sav_auto_out_1715000
        const linkedSavingsId = id.replace('var_tr_', 'sav_auto_');
        
        // Si cette transaction existe dans l'épargne, on la supprime aussi
        if (savingsTransactions.some(t => t.id === linkedSavingsId)) {
            await actions.deleteSavingsTransaction(linkedSavingsId);
        }
    }
  };

  // Suppression d'une ligne d'épargne -> Vérifie si une opération associée existe
  const handleDeleteSavingsWrapper = async (id: string) => {
    // 1. Supprimer la ligne d'épargne
    await actions.deleteSavingsTransaction(id);

    // 2. Vérifier si c'est un virement généré automatiquement (Pattern: sav_auto_XXX_TIMESTAMP)
    if (id.startsWith('sav_auto_')) {
        // On remplace 'sav_auto_' par 'var_tr_' pour trouver l'équivalent côté opérations
        const linkedVariableId = id.replace('sav_auto_', 'var_tr_');

        // Si cette transaction existe dans les opérations, on la supprime aussi
        if (variableTransactions.some(t => t.id === linkedVariableId)) {
            await actions.deleteVariableTransaction(linkedVariableId);
        }
    }
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
            settings={settings} savingsTransactions={savingsTransactions} variableTransactions={variableTransactions}
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
            onTogglePaid={actions.setPaidStatus} 
            onUpsertVariable={actions.upsertVariableTransaction} 
            onDeleteVariable={handleDeleteVariableWrapper} 
            onUpsertSavings={actions.upsertSavingsTransaction} 
          />
        )}

        {currentView === 'savings' && (
          <SavingsView 
            accounts={accounts} 
            savingsTransactions={savingsTransactions} 
            settings={settings} 
            onUpsertTransaction={actions.upsertSavingsTransaction} 
            onDeleteTransaction={handleDeleteSavingsWrapper} 
            onNavigateToConfig={() => navigateToConfig('accounts')} 
          />
        )}

        {currentView === 'config' && (
          <ConfigurationView configs={configs} incomeConfigs={incomeConfigs} categories={categories} people={people} accounts={accounts} settings={settings} savedLabels={savedLabels} activeTab={activeConfigTab} setActiveTab={setActiveConfigTab} onUpdateCategories={actions.upsertCategory as any} onUpsertPerson={actions.upsertPerson} onDeletePerson={actions.deletePerson} onUpsertAccount={actions.upsertAccount} onDeleteAccount={actions.deleteAccount} onUpdateSettings={actions.updateSettings} onResetConnection={handleResetConnection} onUpsertLabel={actions.upsertLabel} onDeleteLabel={actions.deleteLabel} onAddConfig={actions.upsertConfig} onUpdateConfig={actions.upsertConfig} onDeleteConfig={actions.deleteConfig} onAddIncome={actions.upsertIncome} onUpdateIncome={actions.upsertIncome} onDeleteIncome={actions.deleteIncome} />
        )}
      </main>
    </div>
  );
};

export default App;
