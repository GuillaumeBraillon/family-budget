import React from "react";
import { Session } from "@supabase/supabase-js";
import { Settings, UserCircle, CreditCard, Tag, Sliders, List, CalendarRange, Bookmark, Shield } from "lucide-react";
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
  onResetConnection: () => void;
  onUpsertLabel: (l: SavedLabel) => void;
  onDeleteLabel: (id: string) => void;
  onAddConfig: (c: ExpenseConfig) => void;
  onUpdateConfig: (c: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddIncome: (i: IncomeConfig) => void;
  onUpdateIncome: (i: IncomeConfig) => void;
  onDeleteIncome: (id: string) => void;
  onImportLabels: () => Promise<{ count?: number; error?: Error }> | void;
  onImportVirLabels: () => Promise<{ count?: number; error?: Error }> | void;
  onUpsertTag?: (t: TagType) => void;
  onDeleteTag?: (id: string) => void;
  onToggleUserAuthorization?: (email: string, isAllowed: boolean) => Promise<{ data?: unknown; error?: Error }> | void;
  onUpdateUserNotes?: (email: string, notes: string) => Promise<{ data?: unknown; error?: Error }> | void;
  onDeleteUser?: (email: string) => Promise<{ data?: unknown; error?: Error }> | void;
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
  onResetConnection,
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
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="text-indigo-600" />
          Paramètres
        </h2>
      </div>

      <ConfigurationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="pt-2 space-y-6">
        {/* ========== 1. CONFIGURATION DE BASE ========== */}

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
            <AccountManager accounts={accounts} people={people} onUpsertAccount={onUpsertAccount} onDeleteAccount={onDeleteAccount} />
          </>
        )}

        {/* ========== 2. ORGANISATION & CLASSIFICATION ========== */}

        {activeTab === "categories" && (
          <>
            <InfoBox
              title="Catégories & Sous-Catégories"
              description="Organisez vos flux financiers en catégories et sous-catégories. Utilisé pour classer et analyser vos opérations."
              icon={<Tag size={18} />}
            />
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
          <>
            <InfoBox
              title="Opérations Récurrentes"
              description="Définissez vos revenus mensuels (salaires, aides) et dépenses fixes (loyer, abonnements). Génère automatiquement l'échéancier mensuel."
              icon={<CalendarRange size={18} />}
            />
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
          </>
        )}

        {activeTab === "labels" && (
          <>
            <InfoBox
              title="Libellés & Autocomplétion"
              description="Gérez vos libellés pré-enregistrés pour accélérer la saisie des opérations variables (courses, essence, restaurants, etc.)."
              icon={<List size={18} />}
            />
            <AccountLabelManager
              labels={savedLabels}
              categories={categories}
              onUpsertLabel={onUpsertLabel}
              onDeleteLabel={onDeleteLabel}
              onImportLabels={onImportLabels}
              onImportVirLabels={onImportVirLabels}
            />
          </>
        )}

        {/* ========== 4. PARAMÈTRES SYSTÈME ========== */}

        {activeTab === "general" && (
          <>
            <InfoBox
              title="Réglages Globaux"
              description="Budget mensuel, découpage des périodes (semaines/jours fixes/parts égales), stratégie de gestion des dépassements, et connexion base de données."
              icon={<Sliders size={18} />}
            />
            <GlobalSettings settings={settings} onUpdate={onUpdateSettings} onResetConnection={onResetConnection} session={session} />
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
      </div>
    </div>
  );
};
