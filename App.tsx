
import React, { useState } from 'react';
import { useBudget } from './hooks/useBudget';
import { AccountsOverview } from './components/Dashboard/AccountsOverview';
import { BudgetEnvelopes } from './components/Dashboard/BudgetEnvelopes';
import { EquityKPI } from './components/Dashboard/EquityKPI';
import { BudgetPlanner } from './components/BudgetPlanner/BudgetPlanner';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { ConfigTab } from './hooks/useConfigurationUI';
import { InfoBox } from './components/ui/InfoBox';
import { LayoutDashboard, WalletCards, CalendarCheck, Settings, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

type ViewState = 'dashboard' | 'planner' | 'config';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');
  
  const { 
    accounts, configs, incomeConfigs, categories, people, paidItems, settings,
    loading, error, isDbEmpty, actions 
  } = useBudget();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
          <p>Chargement de vos finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="bg-indigo-600 p-2 rounded-lg"><WalletCards className="text-white h-5 w-5" /></div>
            <h1 className="text-lg font-bold">Budget <span className="text-indigo-600">Famille</span></h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-lg">
            <NavBtn active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={16}/>} label="Dashboard" />
            <NavBtn active={currentView === 'planner'} onClick={() => setCurrentView('planner')} icon={<CalendarCheck size={16}/>} label="Échéancier" />
            <NavBtn active={currentView === 'config'} onClick={() => setCurrentView('config')} icon={<Settings size={16}/>} label="Paramètres" />
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error !== null && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex gap-3 items-center shadow-sm">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase opacity-60">Erreur Technique</span>
                <span className="text-sm font-medium">{String(error)}</span>
            </div>
            <button onClick={() => actions.loadData()} className="ml-auto text-[10px] font-bold bg-white px-2 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors">RÉESSAYER</button>
          </div>
        )}

        {isDbEmpty && !loading && !error && (
            <div className="mb-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <h3 className="text-indigo-900 font-bold text-lg">Prêt à commencer ?</h3>
                    <p className="text-indigo-700 text-sm">Injectez les données de démonstration pour tester.</p>
                </div>
                <button onClick={actions.handleSeed} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700">Injecter démo</button>
            </div>
        )}

        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <InfoBox 
              title="Bienvenue sur votre tableau de bord"
              description="Cette vue synthétise votre santé financière globale. Vous y trouverez le total de vos comptes, le suivi de vos enveloppes variables et la répartition d'équité basée sur les revenus déclarés."
              icon={<Sparkles size={18} />}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6"><AccountsOverview accounts={accounts} people={people} /></div>
              <div className="space-y-6">
                <BudgetEnvelopes transactions={[]} people={people} weeklyLimit={settings.weekly_envelope} />
                <EquityKPI people={people} incomeConfigs={incomeConfigs} />
              </div>
            </div>
          </div>
        )}

        {currentView === 'planner' && (
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
        )}

        {currentView === 'config' && (
          <ConfigurationView 
            configs={configs} 
            incomeConfigs={incomeConfigs} 
            categories={categories} 
            people={people} 
            accounts={accounts} 
            settings={settings}
            activeTab={activeConfigTab}
            setActiveTab={setActiveConfigTab}
            onUpdateCategories={actions.upsertCategory as any} onUpdatePeople={actions.upsertPerson as any} onUpdateAccounts={actions.upsertAccount as any}
            onUpdateSettings={actions.updateSettings}
          />
        )}
      </main>
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
    {icon}<span className="hidden sm:inline">{label}</span>
  </button>
);

export default App;
