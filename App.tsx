import React, { useState, useEffect } from 'react';
import { MOCK_TRANSACTIONS } from './services/mockData'; // On garde les transactions mock pour l'instant
import { fetchInitialData, apiUpsertConfig, apiDeleteConfig, apiUpsertCategory, apiDeleteCategory, apiUpsertPerson, apiDeletePerson, apiUpsertAccount, apiDeleteAccount, apiSetPaidStatus } from './services/api';
import { Account, Transaction, ExpenseConfig, CategoryDef, Person } from './types';
import { AccountsOverview } from './components/Dashboard/AccountsOverview';
import { BudgetEnvelopes } from './components/Dashboard/BudgetEnvelopes';
import { EquityKPI } from './components/Dashboard/EquityKPI';
import { BudgetPlanner } from './components/BudgetPlanner/BudgetPlanner';
import { ConfigurationView } from './components/Configuration/ConfigurationView';
import { LayoutDashboard, WalletCards, CalendarCheck, Settings, Loader2, Database, AlertTriangle } from 'lucide-react';

type ViewState = 'dashboard' | 'planner' | 'config';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [configs, setConfigs] = useState<ExpenseConfig[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [paidItems, setPaidItems] = useState<Record<string, boolean>>({});
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  // Chargement initial depuis Supabase
  useEffect(() => {
    const load = async () => {
      try {
        setDbError(null);
        const data = await fetchInitialData();
        
        // Vérification si la base semble vide (probablement RLS bloquant ou SQL non lancé)
        if (data.people.length === 0 && data.accounts.length === 0) {
            setDbError("La base de données semble vide ou inaccessible.");
        }

        setPeople(data.people);
        setAccounts(data.accounts);
        setCategories(data.categories);
        setConfigs(data.configs);
        setPaidItems(data.paidItems);
        
        // Pour les transactions, on garde le mock pour l'instant car la table n'est pas créée dans l'UI
        setTransactions(MOCK_TRANSACTIONS); 
      } catch (error: any) {
        console.error("Erreur chargement Supabase:", error);
        setDbError(error.message || "Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // --- HANDLERS AVEC PERSISTENCE DB ---

  const handleTogglePaid = async (instanceId: string, isPaid: boolean) => {
    // Optimistic Update
    setPaidItems(prev => ({ ...prev, [instanceId]: isPaid }));
    await apiSetPaidStatus(instanceId, isPaid);
  };

  // CONFIGS
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

  // CATEGORIES
  const handleUpdateCategories = async (newCategories: CategoryDef[]) => {
    setCategories(newCategories);
    for (const cat of newCategories) {
       await apiUpsertCategory(cat);
    }
  };

  // PEOPLE
  const handleUpdatePeople = async (newPeople: Person[]) => {
    setPeople(newPeople);
    for(const p of newPeople) await apiUpsertPerson(p);
  };

  // ACCOUNTS
  const handleUpdateAccounts = async (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    for(const a of newAccounts) await apiUpsertAccount(a);
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      {/* Header Mobile / Desktop */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <div className="bg-indigo-600 p-2 rounded-lg">
                <WalletCards className="text-white h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">Budget<span className="text-indigo-600">Famille</span></h1>
            </div>
            
            {/* Navigation Tabs */}
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
      
      {/* Alertes DB */}
      {dbError && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-amber-800 font-semibold text-sm">Base de données vide ou inaccessible</h3>
                    <p className="text-amber-700 text-sm mt-1">
                        L'application est connectée à Supabase mais ne récupère aucune donnée.
                        <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Avez-vous exécuté le script SQL de création des tables ?</li>
                            <li>Avez-vous désactivé le RLS (Row Level Security) ? <span className="font-mono text-xs bg-amber-100 px-1 rounded">alter table people disable row level security;</span></li>
                        </ul>
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
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
                      <EquityKPI people={people} />
                  </div>
                </div>
            </>
        )}

        {currentView === 'planner' && (
            <BudgetPlanner 
              configs={configs} 
              accounts={accounts} 
              people={people}
              paidItems={paidItems} 
              onTogglePaid={handleTogglePaid} 
            />
        )}

        {currentView === 'config' && (
            <ConfigurationView 
              configs={configs} 
              categories={categories}
              people={people}
              accounts={accounts}
              onAddConfig={handleAddConfig}
              onUpdateConfig={handleUpdateConfig}
              onDeleteConfig={handleDeleteConfig}
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