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
-- 1. Table des revenus récurrents
CREATE TABLE IF NOT EXISTS income_configs (
  id text PRIMARY KEY,
  label text,
  amount numeric,
  owner_id text,
  day_of_month integer,
  category text
);
ALTER TABLE income_configs DISABLE ROW LEVEL SECURITY;

-- 2. Table des dépenses récurrents
CREATE TABLE IF NOT EXISTS expense_configs (
  id text PRIMARY KEY,
  label text,
  amount numeric,
  category text,
  sub_category text,
  beneficiary_id text,
  owner_id text,
  day_of_month integer,
  start_month text,
  end_month text,
  is_extra boolean
);
ALTER TABLE expense_configs DISABLE ROW LEVEL SECURITY;

-- 3. Table des paiements effectués
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

-- 4. Mise à jour Categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type text DEFAULT 'EXPENSE';
`;

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState(false);
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
        const data = await fetchInitialData();
        
        // Si la base est vide, on garde l'erreur pour afficher le bouton de Seed
        if (data.people.length === 0 && data.accounts.length === 0) {
            setDbError("La base de données est vide.");
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
      } finally {
          setLoading(false);
      }
  };

  const copySQL = () => {
      navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  // --- HANDLERS ---

  const handleTogglePaid = async (details: PaidItemDetails | null, instanceId: string) => {
    setPaidItems(prev => {
        if (!details) {
            const newState = { ...prev };
            delete newState[instanceId];
            return newState;
        }
        return { ...prev, [instanceId]: details };
    });
    await apiSetPaidStatus(details, instanceId);
  };

  const handleAddConfig = async (newConfig: ExpenseConfig) => {
    setConfigs([...configs, newConfig]);
    await apiUpsertConfig(newConfig);
  };
  const handleUpdateConfig = async (updatedConfig: ExpenseConfig) => {
    setConfigs(configs.map(c => c.id === updatedConfig.id ? updatedConfig : c));
    await apiUpsertConfig(updatedConfig);
  };
  const handleDeleteConfig = async (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
    await apiDeleteConfig(id);
  };

  const handleAddIncome = async (newIncome: IncomeConfig) => {
    setIncomeConfigs([...incomeConfigs, newIncome]);
    await apiUpsertIncome(newIncome);
  };
  const handleUpdateIncome = async (updatedIncome: IncomeConfig) => {
    setIncomeConfigs(incomeConfigs.map(c => c.id === updatedIncome.id ? updatedIncome : c));
    await apiUpsertIncome(updatedIncome);
  };
  const handleDeleteIncome = async (id: string) => {
    setIncomeConfigs(incomeConfigs.filter(c => c.id !== id));
    await apiDeleteIncome(id);
  };

  const handleUpdateCategories = async (newCategories: CategoryDef[]) => {
    // Calcul basique des suppressions
    const oldIds = categories.map(c => c.id);
    const newIds = newCategories.map(c => c.id);
    const toDelete = oldIds.filter(id => !newIds.includes(id));

    setCategories(newCategories);

    for (const cat of newCategories) {
       await apiUpsertCategory(cat);
    }
    for (const id of toDelete) {
        await apiDeleteCategory(id);
    }
  };

  const handleUpdatePeople = async (newPeople: Person[]) => {
    const oldIds = people.map(p => p.id);
    const newIds = newPeople.map(p => p.id);
    const toDelete = oldIds.filter(id => !newIds.includes(id));

    setPeople(newPeople);
    for(const p of newPeople) await apiUpsertPerson(p);
    for(const id of toDelete) await apiDeletePerson(id);
  };

  const handleUpdateAccounts = async (newAccounts: Account[]) => {
    const oldIds = accounts.map(a => a.id);
    const newIds = newAccounts.map(a => a.id);
    const toDelete = oldIds.filter(id => !newIds.includes(id));

    setAccounts(newAccounts);
    for(const a of newAccounts) await apiUpsertAccount(a);
    for(const id of toDelete) await apiDeleteAccount(id);
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
                    Certaines tables (comme <code>income_configs</code>) n'existent pas encore dans votre projet Supabase. 
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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">Budget<span className="text-indigo-600">Famille</span></h1>
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
      
      {dbError && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-amber-800 font-semibold text-sm">{dbError}</h3>
                        <p className="text-amber-700 text-sm mt-1">
                            L'application est connectée mais aucune donnée n'a été trouvée.
                        </p>
                    </div>
                </div>
                {/* Seed Button */}
                {dbError === "La base de données est vide." && (
                    <button 
                        onClick={handleSeedDatabase}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        <UploadCloud size={16} />
                        Injecter les données de démo
                    </button>
                )}
            </div>
        </div>
      )}

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
                    {!dbError && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                            <Database size={10} /> Supabase Connecté
                        </span>
                    )}
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
              
              // On passe la liste globale et les listes filtrées si besoin, 
              // mais ConfigurationView a été conçu pour gérer "allCategories" 
              // ou des listes séparées. On va passer la liste globale et laisser le composant filtrer ou passer les filtrées.
              // Le composant précédent attendait "categories" et "incomeCategories".
              categories={categories} // On passe TOUT ici, le composant fera le tri ou on adaptera
              
              people={people}
              accounts={accounts}
              onAddConfig={handleAddConfig}
              onUpdateConfig={handleUpdateConfig}
              onDeleteConfig={handleDeleteConfig}
              onAddIncome={handleAddIncome}
              onUpdateIncome={handleUpdateIncome}
              onDeleteIncome={handleDeleteIncome}
              
              // Une seule fonction d'update pour les catégories
              onUpdateCategories={handleUpdateCategories}
              
              onUpdatePeople={handleUpdatePeople}
              onUpdateAccounts={handleUpdateAccounts}
            />
        )}

      </main>
    </div>
  );
};

export default App;