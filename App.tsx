import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useBudget } from "./hooks/useBudget";
import { useAuth } from "./hooks/useAuth";
import { useAuthorization } from "./hooks/useAuthorization";
import { useConfigurationUI, ConfigTab } from "./hooks/useConfigurationUI";
import { Header } from "./components/Layout/Header";
import { DashboardView } from "./components/features/Dashboard/DashboardView";
import { BalancesView } from "./components/features/Balances/BalancesView";
import { OperationsView } from "./components/features/Operations/OperationsView";
import { TransfersView } from "./components/features/Transfers/TransfersView";
import { ConfigurationView } from "./components/features/Configuration/ConfigurationView";
import { SupabaseSetup } from "./components/Configuration/SupabaseSetup";
import { LoginView } from "./components/features/Auth/LoginView";
import { UnauthorizedView } from "./components/features/Auth/UnauthorizedView";
import { WelcomeEmptyState } from "./components/features/Dashboard/components/WelcomeEmptyState";
import { isSupabaseConfigured } from "./services/supabase";
import { OperationFilters } from "./types";

type ViewState = "dashboard" | "balances" | "planner" | "transfers" | "config";

const VIEWS: ViewState[] = ["dashboard", "balances", "planner", "transfers", "config"];

const App: React.FC = () => {
  // 1. Authentification & Configuration
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());
  const { session, loading: authLoading, signInWithGoogle, signOut, error: authError } = useAuth();

  // 2. Autorisation (whitelist)
  const { isAuthorized, loading: authzLoading, error: authzError } = useAuthorization(session);

  // 3. État UI
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [plannerContext, setPlannerContext] = useState<{ date: Date; weekNumber?: number; filters?: Partial<OperationFilters> } | null>(null);

  // 4. Données Budget (ne chargent que si authentifié ET autorisé)
  const {
    accounts,
    configs,
    incomeConfigs,
    categories,
    people,
    paidItems,
    settings,
    transfers,
    variableTransactions,
    savedLabels,
    tags,
    authorizedUsers,
    loading: budgetLoading,
    error: budgetError,
    isDbEmpty,
    actions,
  } = useBudget();

  const { activeTab, setActiveTab } = useConfigurationUI();

  // --- LOGIQUE SWIPE ---
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    let target = e.target as HTMLElement;
    let isScrollable = false;
    let el = target;
    while (el && el !== e.currentTarget && el !== document.body) {
      if (el.scrollWidth > el.clientWidth) {
        const style = window.getComputedStyle(el);
        if (["auto", "scroll"].includes(style.overflowX) || ["auto", "scroll"].includes(style.overflow)) {
          isScrollable = true;
          break;
        }
      }
      el = el.parentElement as HTMLElement;
    }
    if (!isScrollable) {
      setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    } else {
      setTouchStart(null);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const xDist = touchStart.x - touchEnd.x;
    const yDist = touchStart.y - touchEnd.y;
    if (Math.abs(yDist) > Math.abs(xDist)) return;
    const minSwipeDistance = 50;
    const isLeftSwipe = xDist > minSwipeDistance;
    const isRightSwipe = xDist < -minSwipeDistance;
    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = VIEWS.indexOf(currentView);
      if (isLeftSwipe && currentIndex < VIEWS.length - 1) {
        setCurrentView(VIEWS[currentIndex + 1]);
      }
      if (isRightSwipe && currentIndex > 0) {
        setCurrentView(VIEWS[currentIndex - 1]);
      }
    }
  };
  // -------------------

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  // SUPPRIMÉ : Ne plus recharger automatiquement les données
  // Les données sont chargées UNE FOIS dans useBudget au montage initial

  const navigateToConfig = (tab: ConfigTab) => {
    setActiveTab(tab);
    setCurrentView("config");
  };

  const navigateToPlannerWithContext = (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => {
    setPlannerContext({ date, filters, weekNumber });
    setCurrentView("planner");
  };

  const handleResetConnection = () => {
    localStorage.removeItem("SUPABASE_PROJECT_ID");
    localStorage.removeItem("SUPABASE_ANON_KEY");
    setIsConfigured(false);
  };

  // --- RENDU CONDITIONNEL ---

  // 1. Setup Supabase manquant
  if (!isConfigured) {
    return (
      <SupabaseSetup
        onConfigured={() => {
          setIsConfigured(true);
        }}
      />
    );
  }

  // 2. Chargement de l'Auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <p className="text-sm font-medium animate-pulse">Vérification de l'identité...</p>
      </div>
    );
  }

  // 3. Non connecté -> Login Screen
  if (!session) {
    return <LoginView onLogin={signInWithGoogle} loading={authLoading} error={authError} />;
  }

  // 4. Vérification autorisation (whitelist)
  if (authzLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <p className="text-sm font-medium animate-pulse">Vérification des autorisations...</p>
      </div>
    );
  }

  // 5. Non autorisé -> Accès refusé
  if (isAuthorized === false) {
    return <UnauthorizedView userEmail={session.user.email} onLogout={signOut} />;
  }

  // 6. Chargement des données métier (après auth + autorisation)
  if (budgetLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-4">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
        <p className="text-sm font-medium animate-pulse">Chargement de vos finances...</p>
      </div>
    );
  }

  // 7. Erreur Globale Données
  if (budgetError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center border border-rose-100">
          <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Une erreur est survenue</h2>
          <p className="text-slate-500 mb-6">{budgetError}</p>
          <button onClick={() => actions.loadData()} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // 6. Application Principale
  if (isDbEmpty && currentView !== "config") {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Header currentView={currentView} onViewChange={setCurrentView} onLogout={signOut} userEmail={session.user.email} session={session} />
        <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
          <WelcomeEmptyState onStartConfig={() => navigateToConfig("family")} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <Header currentView={currentView} onViewChange={setCurrentView} onLogout={signOut} userEmail={session.user.email} session={session} />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {currentView === "dashboard" && (
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
            onNavigateToConfig={() => navigateToConfig("general")}
          />
        )}

        {currentView === "balances" && (
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

        {currentView === "planner" && (
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
            onMoveItem={actions.moveItem}
          />
        )}

        {currentView === "transfers" && (
          <TransfersView
            transfers={transfers}
            variableTransactions={variableTransactions}
            accounts={accounts}
            people={people}
            settings={settings}
            categories={categories}
            savedLabels={savedLabels}
            onUpsertTransfer={actions.upsertTransfer}
            onUpsertTransaction={actions.upsertVariableTransaction}
            onDeleteTransfer={actions.deleteTransfer}
            onMoveTransfer={actions.moveTransfer}
          />
        )}

        {currentView === "config" && (
          <ConfigurationView
            configs={configs}
            incomeConfigs={incomeConfigs}
            categories={categories}
            people={people}
            accounts={accounts}
            settings={settings}
            savedLabels={savedLabels}
            tags={tags}
            authorizedUsers={authorizedUsers}
            session={session}
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
            onToggleUserAuthorization={actions.toggleUserAuthorization}
            onUpdateUserNotes={actions.updateUserNotes}
            onDeleteUser={actions.deleteAuthorizedUser}
          />
        )}
      </main>
    </div>
  );
};

export default App;
