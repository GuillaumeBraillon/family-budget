import React from "react";
import { Session } from "@supabase/supabase-js";
import { Settings, UserCircle, CreditCard, Sliders, Bookmark, Shield } from "lucide-react";
import { ConfigTab } from "../../../hooks/useConfigurationUI";
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account, AppSettings, SavedLabel, Tag as TagType, AuthorizedUser } from "../../../types";
import { InfoBox } from "../../ui/InfoBox";
import { ConfigurationTabs } from "./components/molecules/ConfigurationTabs";
import { CategoryManager } from "./components/organisms/CategoryManager";
import { PeopleManager } from "./components/organisms/PeopleManager";
import { AccountManager } from "./components/organisms/AccountManager";
import { GlobalSettings } from "./components/organisms/GlobalSettings";
import { AccountLabelManager } from "./components/organisms/AccountLabelManager";
import { OperationsManager } from "./components/organisms/OperationsManager";
import { TagManager } from "./components/organisms/TagManager";
import { UsersManager } from "./components/organisms/UsersManager";
import { SystemSettings } from "./components/organisms/SystemSettings";

interface ConfigurationViewProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  settings: AppSettings;
  savedLabels: SavedLabel[];
  tags?: TagType[];
  authorizedUsers?: AuthorizedUser[];
  session?: Session | null;
  activeTab: ConfigTab;
  setActiveTab: (tab: ConfigTab) => void;
  onUpdateCategories: (newCategories: CategoryDef[]) => void;
  onUpsertPerson: (p: Person) => void;
  onDeletePerson: (id: string) => void;
  onUpsertAccount: (a: Account) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateAccountsSorting: (newSorting: string[]) => void;
  onUpsertLabel: (l: SavedLabel) => void;
  onDeleteLabel: (id: string) => void;
  onAddConfig: (c: ExpenseConfig) => void;
  onUpdateConfig: (c: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddIncome: (i: IncomeConfig) => void;
  onUpdateIncome: (i: IncomeConfig) => void;
  onDeleteIncome: (id: string) => void;
  onImportLabels: () => Promise<{ count?: number; error?: unknown }> | void;
  onImportVirLabels: () => Promise<{ count?: number; error?: unknown }> | void;
  onUpsertTag?: (t: TagType) => void;
  onDeleteTag?: (id: string) => void;
  onToggleUserAuthorization?: (email: string, isAllowed: boolean) => Promise<{ data?: unknown; error?: unknown }> | void;
  onUpdateUserNotes?: (email: string, notes: string) => Promise<{ data?: unknown; error?: unknown }> | void;
  onDeleteUser?: (email: string) => Promise<{ data?: unknown; error?: unknown }> | void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({
  configs,
  incomeConfigs,
  categories,
  people,
  accounts,
  settings,
  savedLabels,
  tags = [],
  authorizedUsers = [],
  session,
  activeTab,
  setActiveTab,
  onUpdateCategories,
  onUpsertPerson,
  onDeletePerson,
  onUpsertAccount,
  onDeleteAccount,
  onUpdateSettings,
  onUpsertLabel,
  onDeleteLabel,
  onAddConfig,
  onUpdateConfig,
  onDeleteConfig,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onImportLabels,
  onImportVirLabels,
  onUpsertTag,
  onDeleteTag,
  onToggleUserAuthorization,
  onUpdateUserNotes,
  onDeleteUser,
  onUpdateAccountsSorting,
}) => {
  return (
    <div className="flex flex-col gap-1.5 md:gap-2 m-2">
      <ConfigurationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "family" && (
        <>
          <InfoBox
            title="Gestion des Bénéficiaires"
            description="Gérez les membres du foyer. Les enfants sont exclus automatiquement des calculs de contribution et d'équité financière."
            icon={<UserCircle size={18} />}
          />
          <PeopleManager people={people} onUpsertPerson={onUpsertPerson} onDeletePerson={onDeletePerson} />
        </>
      )}

      {activeTab === "accounts" && (
        <>
          <InfoBox
            title="Comptes Bancaires"
            description="Gérez vos comptes courants et d'épargne. Assignez un propriétaire pour le suivi des soldes et des ratios de répartition."
            icon={<CreditCard size={18} />}
          />
          <AccountManager
            accounts={accounts}
            people={people}
            onUpsertAccount={onUpsertAccount}
            onDeleteAccount={onDeleteAccount}
            settings={settings}
            onUpdateAccountsSorting={onUpdateAccountsSorting}
          />
        </>
      )}

      {/* ========== 2. ORGANISATION & CLASSIFICATION ========== */}

      {activeTab === "categories" && (
        <>
          <CategoryManager categories={categories} onUpdateCategories={onUpdateCategories} />
        </>
      )}

      {activeTab === "tags" && onUpsertTag && onDeleteTag && (
        <>
          <InfoBox
            title="Tags Thématiques"
            description="Étiquettes colorées pour regrouper vos opérations par projets ou événements transversaux (#Vacances, #Noël, #Travaux)."
            icon={<Bookmark size={18} />}
          />
          <TagManager tags={tags} onUpsertTag={onUpsertTag} onDeleteTag={onDeleteTag} />
        </>
      )}

      {/* ========== 3. OPÉRATIONS RÉCURRENTES ========== */}

      {activeTab === "operations" && (
        <OperationsManager
          configs={configs}
          incomeConfigs={incomeConfigs}
          categories={categories}
          people={people}
          accounts={accounts}
          onAddConfig={onAddConfig}
          onUpdateConfig={onUpdateConfig}
          onDeleteConfig={onDeleteConfig}
          onAddIncome={onAddIncome}
          onUpdateIncome={onUpdateIncome}
          onDeleteIncome={onDeleteIncome}
        />
      )}

      {activeTab === "labels" && (
        <AccountLabelManager
          labels={savedLabels}
          categories={categories}
          accounts={accounts}
          people={people}
          onUpsertLabel={onUpsertLabel}
          onDeleteLabel={onDeleteLabel}
          onImportLabels={onImportLabels}
          onImportVirLabels={onImportVirLabels}
        />
      )}

      {/* ========== 4. PARAMÈTRES SYSTÈME ========== */}

      {activeTab === "budget" && (
        <>
          <InfoBox
            title="Budget & Périodes"
            description="Configurez votre enveloppe mensuelle, le découpage des périodes (semaines/jours fixes/parts égales), et la stratégie de gestion des dépassements budgétaires."
            icon={<Sliders size={18} />}
          />
          <GlobalSettings settings={settings} onUpdate={onUpdateSettings} session={session} />
        </>
      )}

      {activeTab === "users" && onToggleUserAuthorization && onUpdateUserNotes && onDeleteUser && (
        <>
          <InfoBox
            title="Utilisateurs Autorisés"
            description="Contrôlez les accès à l'application. Whitelist des utilisateurs autorisés à se connecter via Google OAuth."
            icon={<Shield size={18} />}
          />
          <UsersManager
            users={authorizedUsers}
            onToggleAuthorization={onToggleUserAuthorization}
            onUpdateNotes={onUpdateUserNotes}
            onDeleteUser={onDeleteUser}
          />
        </>
      )}

      {activeTab === "system" && (
        <>
          <InfoBox
            title="Paramètres Système"
            description="Actions système et informations techniques : version de l'application, gestion du localStorage, connexion à la base de données."
            icon={<Settings size={18} />}
          />
          <SystemSettings />
        </>
      )}
    </div>
  );
};
