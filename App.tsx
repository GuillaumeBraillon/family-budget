import React, { useState, useEffect } from 'react';
import { MOCK_TRANSACTIONS } from './services/mockData'; 
import { fetchInitialData, apiUpsertConfig, apiDeleteConfig, apiUpsertCategory, apiDeleteCategory, apiUpsertPerson, apiDeletePerson, apiUpsertAccount, apiDeleteAccount, apiSetPaidStatus, apiUpsertIncome, apiDeleteIncome, seedDatabase } from './services/api';
import { Account, Transaction, ExpenseConfig, IncomeConfig, CategoryDef, Person, PaidItemDetails } from './types';
import { AccountsOverview } from './components/Dashboard/AccountsOverview';
import { BudgetEnvelopes } from './components/Dashboard/BudgetEnvelopes';
import { EquityKPI } from './components/Dashboard/EquityKPI';
import { BudgetPlanner } from './components/BudgetPlanner/BudgetPlanner';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { LayoutDashboard, WalletCards, CalendarCheck, Settings, Loader2, Database, AlertTriangle, UploadCloud, Copy, CheckCircle2 } from 'lucide-react';

type ViewState = 'dashboard' | 'planner' | 'config';

const SQL_SETUP_SCRIPT = `
-- ============================================================
-- SCRIPT D'INITIALISATION PROPRE (BUDGET FAMILIAL)
-- ============================================================

-- 1. Tables Référentielles
CREATE TABLE IF NOT EXISTS people (
    id text PRIMARY KEY,
    name text,
    is_child boolean DEFAULT false
);
ALTER TABLE people DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS accounts (
    id text PRIMARY KEY,
    name text,
    type text,
    owner_id text,
    current_balance numeric,
    bank_name text
);
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS categories (
    id text PRIMARY KEY,
    name text,
    type text DEFAULT 'EXPENSE',
    sub_categories text[]
);
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 2. Table des revenus récurrents
CREATE TABLE IF NOT EXISTS income_configs (
  id text PRIMARY KEY,
  label text,
  amount numeric,
  account_id text REFERENCES accounts(id) ON DELETE SET NULL, -- Lien direct vers le compte
  beneficiary_id text,
  day_of_month integer,
  category text
);
ALTER TABLE income_configs DISABLE ROW LEVEL SECURITY;

-- 3. Table des dépenses récurrentes
CREATE TABLE IF NOT EXISTS expense_configs (
  id text PRIMARY KEY,
  label text,
  amount numeric,
  category text,
  sub_category text,
  beneficiary_id text,
  account_id text REFERENCES accounts(id) ON DELETE SET NULL, -- Lien direct vers le compte
  day_of_month integer,
  start_month text,
  end_month text,
  is_extra boolean
);
ALTER TABLE expense_configs DISABLE ROW LEVEL SECURITY;

-- 4. Table des paiements effectués
CREATE TABLE IF NOT EXISTS paid_items (
  instance_id text PRIMARY KEY,
  is_paid boolean DEFAULT true,
  amount numeric,
  payment_date date,
  account_id text,
  beneficiary_id text,
  label text,
  category text,
  sub_category text
);
ALTER TABLE paid_items DISABLE ROW LEVEL SECURITY;
`;

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState(false);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [copied, setCopied] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [configs, setConfigs] = useState<ExpenseConfig[]>([]);
  const [incomeConfigs, setIncomeConfigs] = useState<IncomeConfig[]>([]);
  
  // Une seule liste pour toutes les catégories (Expenses + Incomes)
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  
  const [people, setPeople] = useState<Person[]>([]);
  const [paidItems, setPaidItems] = useState<Record<string, PaidItemDetails>>({});
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const loadData = async () => {
    try {
        setLoading(true);
        setDbError(null);
        setMissingTables(false);
        setIsDbEmpty(false);
        const data = await fetchInitialData();
        
        // Si la base est vide (mais tables existantes)
        if (data.people.length === 0 && data.accounts.length === 0) {
            setIsDbEmpty(true);
        }

        setPeople(data.people);
        setAccounts(data.accounts);
        setCategories(data.categories);
        setConfigs(data.configs);
        setIncomeConfigs(data.incomeConfigs);
        setPaidItems(data.paidItems);
        
        setTransactions(MOCK_TRANSACTIONS); 
      } catch (error: any) {
        console.error("Erreur chargement Supabase:", error);
        if (error.message === 'TABLE_MISSING') {
            setMissingTables(true);
            setDbError("Tables manquantes dans Supabase");
        } else {
            setDbError(error.message || "Erreur de connexion");
        }
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedDatabase = async () => {
      setLoading(true);
      try {
          await seedDatabase();
          // Recharger après injection
          await loadData();
          setDbError(null); // Clear error if successful
      } catch (e: any) {
          alert("Erreur lors de l'injection : " + e.message);
          setLoading(false);
      }
  };

  const copySQL = () => {
      navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- HANDLERS AVEC GESTION D'ERREUR ---

  const handleTogglePaid = async (details: PaidItemDetails | null, instanceId: string) => {
    // Optimistic UI update
    setPaidItems(prev => {
        if (!details) {
            const newState = { ...prev };
            delete newState[instanceId];
            return newState;
        }
        return { ...prev, [instanceId]: details };
    });
    
    try {
        const { error } = await apiSetPaidStatus(details, instanceId);
        if (error) throw error;
    } catch (e: any) {
        console.error("DB Error", e);
        alert("Erreur sauvegarde statut payé: " + e.message);
        loadData(); // Reload to sync
    }
  };

  const handleAddConfig = async (newConfig: ExpenseConfig) => {
    const prev = [...configs];
    setConfigs([...configs, newConfig]);
    try {
        const { error } = await apiUpsertConfig(newConfig);
        if (error) throw error;
    } catch (e: any) {
        console.error(e);
        alert("Erreur création dépense: " + e.message);
        setConfigs(prev);
    }
  };

  const handleUpdateConfig = async (updatedConfig: ExpenseConfig) => {
    const prev = [...configs];
    setConfigs(configs.map(c => c.id === updatedConfig.id ? updatedConfig : c));
    try {
        const { error } = await apiUpsertConfig(updatedConfig);
        if (error) throw error;
    } catch (e: any) {
        console.error(e);
        alert("Erreur mise à jour dépense: " + e.message);
        setConfigs(prev); // Rollback
    }
  };

  const handleDeleteConfig = async (id: string) => {
    const prev = [...configs];
    setConfigs(configs.filter(c => c.id !== id));
    try {
        const { error } = await apiDeleteConfig(id);
        if (error) throw error;
    } catch (e: any) {
        console.error(e);
        alert("Erreur suppression: " + e.message);
        setConfigs(prev);
    }
  };

  const handleAddIncome = async (newIncome: IncomeConfig) => {
    const prev = [...incomeConfigs];
    setIncomeConfigs([...incomeConfigs, newIncome]);
    try {
        const { error } = await apiUpsertIncome(newIncome);
        if (error) throw error;
    } catch (e: any) {
        console.error(e);
        alert("Erreur création revenu: " + e.message);
        setIncomeConfigs(prev);
    }
  };

  const handleUpdateIncome = async (updatedIncome: IncomeConfig) => {
    const prev = [...incomeConfigs];
    setIncomeConfigs(incomeConfigs.map(c => c.id === updatedIncome.id ? updatedIncome : c));
    try {
        const { error } = await apiUpsertIncome(updatedIncome);
        if (error) throw error;
    } catch (e: any) {
        console.error(e);
        alert("Erreur mise à jour revenu: " + e.message);
        setIncomeConfigs(prev);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    const prev = [...incomeConfigs];
    setIncomeConfigs(incomeConfigs.filter(c => c.id !== id));
    try {
        const { error } = await apiDeleteIncome(id);
        if (error) throw error;
    } catch (e: any) {
        console.error(e);
        alert("Erreur suppression revenu: " + e.message);
        setIncomeConfigs(prev);
    }
  };

  const handleUpdateCategories = async (newCategories: CategoryDef[]) => {
    const prev = [...categories];
    const oldIds = categories.map(c => c.id);
    const newIds = newCategories.map(c => c.id);
    const toDelete = oldIds.filter(id => !newIds.includes(id));

    setCategories(newCategories);

    try {
        for (const cat of newCategories) {
           const { error } = await apiUpsertCategory(cat);
           if (error) throw error;
        }
        for (const id of toDelete) {
            const { error } = await apiDeleteCategory(id);
            if (error) throw error;
        }
    } catch (e: any) {
        console.error(e);
        alert("Erreur sauvegarde catégories: " + e.message);
        setCategories(prev);
    }
  };

  const handleUpdatePeople = async (newPeople: Person[]) => {
    const prev = [...people];
    const oldIds = people.map(p => p.id);
    const newIds = newPeople.map(p => p.id);
    const toDelete = oldIds.filter(id => !newIds.includes(id));

    setPeople(newPeople);
    try {
        for(const p of newPeople) {
            const { error } = await apiUpsertPerson(p);
            if(error) throw error;
        }
        for(const id of toDelete) {
            const { error } = await apiDeletePerson(id);
            if(error) throw error;
        }
    } catch (e: any) {
        console.error(e);
        alert("Erreur sauvegarde personnes: " + e.message);
        setPeople(prev);
    }
  };

  const handleUpdateAccounts = async (newAccounts: Account[]) => {
    const prev = [...accounts];
    const oldIds = accounts.map(a => a.id);
    const newIds = newAccounts.map(a => a.id);
    const toDelete = oldIds.filter(id => !newIds.includes(id));

    setAccounts(newAccounts);
    try {
        for(const a of newAccounts) {
            const { error } = await apiUpsertAccount(a);
            if (error) throw error;
        }
        for(const id of toDelete) {
            const { error } = await apiDeleteAccount(id);
            if (error) throw error;
        }
    } catch (e: any) {
        console.error(e);
        alert("Erreur sauvegarde comptes: " + e.message);
        setAccounts(prev);
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-4 text-slate-500">
                  <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                  <p>Chargement de vos finances...</p>
                  <p className="text-xs text-slate-400">Connexion à Supabase en cours</p>
              </div>
          </div>
      );
  }

  // --- MISSING TABLES UI ---
  if (missingTables) {
      return (
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
             <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6 text-red-600">
                    <Database size={32} />
                    <h1 className="text-2xl font-bold">Base de données incomplète</h1>
                </div>
                
                <p className="text-slate-600 mb-6">
                    Certaines tables n'existent pas encore ou sont incomplètes dans votre projet Supabase. 
                    Veuillez exécuter le script suivant dans l'éditeur SQL de Supabase.
                </p>

                <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 mb-6 relative group">
                    <div className="absolute top-3 right-3">
                        <button 
                            onClick={copySQL}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 transition-colors border border-slate-700"
                        >
                            {copied ? <CheckCircle2 size={14} className="text-green-400"/> : <Copy size={14} />}
                            {copied ? 'Copié !' : 'Copier'}
                        </button>
                    </div>
                    <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto">
                        {SQL_SETUP_SCRIPT}
                    </pre>
                </div>

                <div className="flex justify-end gap-4">
                     <a 
                        href="https://supabase.com/dashboard/project/_/sql/new" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                     >
                        Ouvrir Supabase SQL Editor
                     </a>
                     <button 
                        onClick={loadData}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                     >
                        <Loader2 size={16} className={loading ? "animate-spin" : "hidden"} />
                        Réessayer
                     </button>
                </div>
             </div>
        </div>
      );
  }

  // Derived filtered lists for easy passing
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <div className="bg-indigo-600 p-2 rounded-lg">
                <WalletCards className="text-white h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">Budget <span className="text-indigo-600">Famille</span></h1>
            </div>
            
            <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${currentView === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <LayoutDashboard size={16} />
                    <span className="hidden sm:inline">Vue d'ensemble</span>
                </button>
                <button 
                    onClick={() => setCurrentView('planner')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${currentView === 'planner' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <CalendarCheck size={16} />
                    <span className="hidden sm:inline">Planner</span>
                    <span className="sm:hidden">Plan</span>
                </button>
                <button 
                    onClick={() => setCurrentView('config')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${currentView === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                    <Settings size={16} />
                    <span className="hidden sm:inline">Params</span>
                </button>
            </nav>

            <div className="flex items-center gap-4">
               {people.length > 0 ? (
                 <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm">
                   {people.slice(0,2).map(p => p.name[0]).join('&')}
                 </div>
               ) : (
                 <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse"></div>
               )}
            </div>
          </div>
        </div>
      </header>
      
      {/* ERROR DISPLAY */}
      {dbError && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-amber-800 font-semibold text-sm">{dbError}</h3>
                        <p className="text-amber-700 text-sm mt-1">
                            Une erreur est survenue lors de la connexion à la base de données.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* EMPTY STATE / WELCOME SCREEN */}
      {isDbEmpty && !dbError && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="bg-white border border-indigo-100 rounded-xl p-8 text-center shadow-sm">
                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="text-indigo-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Bienvenue sur Budget Familial</h2>
                <p className="text-slate-600 max-w-lg mx-auto mb-8">
                    Votre base de données est actuellement vide. Pour commencer, nous pouvons injecter un jeu de données de démonstration (Comptes, Catégories, Règles).
                </p>
                <button 
                    onClick={handleSeedDatabase}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors mx-auto shadow-indigo-200 shadow-lg"
                >
                    <UploadCloud size={20} />
                    Initialiser les données de démo
                </button>
            </div>
        </div>
      )}

      {!isDbEmpty && !dbError && (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentView === 'dashboard' && (
            <>
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <LayoutDashboard className="text-indigo-500" />
                            Tableau de bord
                        </h2>
                        <p className="text-slate-500 mt-1">Suivi en temps réel des comptes et des enveloppes.</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <Database size={10} /> Supabase Connecté
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                      <AccountsOverview accounts={accounts} people={people} />
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                              <h3 className="font-semibold text-slate-900">Dernières opérations</h3>
                              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Voir tout</button>
                          </div>
                          <div className="divide-y divide-slate-100">
                              {transactions.slice(0, 5).map(t => (
                                  <div key={t.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
                                      <div>
                                          <p className="text-sm font-medium text-slate-900">{t.description}</p>
                                          <p className="text-xs text-slate-500">{t.date} • {t.category}</p>
                                      </div>
                                      <span className={`text-sm font-mono font-medium ${t.type === 'DEBIT' ? 'text-slate-900' : 'text-emerald-600'}`}>
                                          {t.type === 'DEBIT' ? '-' : '+'}{t.amount.toFixed(2)} €
                                      </span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <BudgetEnvelopes transactions={transactions} people={people} />
                      <EquityKPI people={people} incomeConfigs={incomeConfigs} />
                  </div>
                </div>
            </>
        )}

        {currentView === 'planner' && (
            <BudgetPlanner 
              configs={configs} 
              incomeConfigs={incomeConfigs}
              accounts={accounts} 
              people={people}
              paidItems={paidItems} 
              onTogglePaid={handleTogglePaid} 
            />
        )}

        {currentView === 'config' && (
            <ConfigurationView 
              configs={configs} 
              incomeConfigs={incomeConfigs}
              categories={categories}
              people={people}
              accounts={accounts}
              onAddConfig={handleAddConfig}
              onUpdateConfig={handleUpdateConfig}
              onDeleteConfig={handleDeleteConfig}
              onAddIncome={handleAddIncome}
              onUpdateIncome={handleUpdateIncome}
              onDeleteIncome={handleDeleteIncome}
              onUpdateCategories={handleUpdateCategories}
              onUpdatePeople={handleUpdatePeople}
              onUpdateAccounts={handleUpdateAccounts}
            />
        )}

      </main>
      )}
    </div>
  );
};

export default App;