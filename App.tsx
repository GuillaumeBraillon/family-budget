
import React, { useState } from 'react';
import { useBudget } from './hooks/useBudget';
import { AccountsOverview } from './components/Dashboard/AccountsOverview';
import { BudgetEnvelopes } from './components/Dashboard/BudgetEnvelopes';
import { EquityKPI } from './components/Dashboard/EquityKPI';
import { BudgetPlanner } from './components/BudgetPlanner/BudgetPlanner';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { ConfigTab } from './hooks/useConfigurationUI';
import { InfoBox } from './components/ui/InfoBox';
import { LayoutDashboard, WalletCards, CalendarCheck, Settings, Loader2, AlertTriangle, Database, Sparkles } from 'lucide-react';

const SQL_SETUP_SCRIPT = `
-- Script de création des tables
CREATE TABLE IF NOT EXISTS people (id text PRIMARY KEY, name text, is_child boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS accounts (id text PRIMARY KEY, name text, type text, owner_id text, current_balance numeric, bank_name text);
CREATE TABLE IF NOT EXISTS categories (id text PRIMARY KEY, name text, type text DEFAULT 'EXPENSE', sub_categories text[]);
CREATE TABLE IF NOT EXISTS app_settings (id text PRIMARY KEY, weekly_envelope numeric DEFAULT 500);
CREATE TABLE IF NOT EXISTS income_configs (id text PRIMARY KEY, label text, amount numeric, account_id text REFERENCES accounts(id) ON DELETE SET NULL, beneficiary_id text, day_of_month integer, category text, sub_category text);
CREATE TABLE IF NOT EXISTS expense_configs (id text PRIMARY KEY, label text, amount numeric, category text, sub_category text, beneficiary_id text, account_id text REFERENCES accounts(id) ON DELETE SET NULL, day_of_month integer, start_month text, end_month text, is_extra boolean);
CREATE TABLE IF NOT EXISTS paid_items (instance_id text PRIMARY KEY, is_paid boolean DEFAULT true, amount numeric, payment_date date, account_id text, beneficiary_id text, label text, category text, sub_category text);
INSERT INTO app_settings (id, weekly_envelope) VALUES ('global', 500) ON CONFLICT (id) DO NOTHING;
`;

type ViewState = 'dashboard' | 'planner' | 'config';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('general');
  
  const { 
    accounts, configs, incomeConfigs, categories, people, paidItems, settings,
    loading, error, missingTables, isDbEmpty, actions 
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

  if (missingTables) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2"><Database /> Base de données à mettre à jour</h2>
            <p className="text-indigo-100 text-sm mt-1">Configuration SQL requise.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto h-48">
              <pre>{SQL_SETUP_SCRIPT}</pre>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
                alert("Script copié !");
              }}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Copier le script SQL
            </button>
            <button 
              onClick={() => actions.loadData()}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              Actualiser après exécution
            </button>
          </div>
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
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex gap-2"><AlertTriangle size={20}/>{error}</div>}

        {isDbEmpty && !loading && (
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
