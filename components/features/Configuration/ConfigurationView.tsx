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
  onImportLabels: () => Promise<any> | void;
  onImportVirLabels: () => Promise<any> | void;
  onUpsertTag?: (t: TagType) => void;
  onDeleteTag?: (id: string) => void;
  onToggleUserAuthorization?: (email: string, isAllowed: boolean) => Promise<any> | void;
  onUpdateUserNotes?: (email: string, notes: string) => Promise<any> | void;
  onDeleteUser?: (email: string) => Promise<any> | void;
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
        {activeTab === "general" && (
          <>
            <InfoBox
              title="Paramètres Globaux"
              description="Configurez ici les options de base de l'application, comme le montant du budget mensuel qui sera réparti entre vos périodes d'échéancier."
              icon={<Sliders size={18} />}
            />
            <GlobalSettings settings={settings} onUpdate={onUpdateSettings} onResetConnection={onResetConnection} session={session} />
          </>
        )}
        {activeTab === "operations" && (
          <>
            <InfoBox
              title="Modèles d'opérations"
              description="Définissez ici vos revenus (salaires, aides) et dépenses fixes (loyer, abonnements) qui reviennent chaque mois. Ces règles génèrent automatiquement votre échéancier."
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
        {activeTab === "categories" && (
          <>
            <InfoBox
              title="Classification des flux"
              description="Personnalisez vos catégories et sous-catégories pour organiser vos dépenses et revenus. Une bonne classification permet une analyse plus fine de vos habitudes de consommation."
              icon={<Tag size={18} />}
            />
            <CategoryManager categories={categories} onUpdateCategories={onUpdateCategories} />
          </>
        )}
        {activeTab === "labels" && (
          <>
            <InfoBox
              title="Libellés & Autocomplétion"
              description="Gérez les listes de libellés pré-définis pour vos opérations. Ces libellés servent à accélérer la saisie lors de l'ajout de transactions manuelles."
              icon={<List size={18} />}
            />
            <AccountLabelManager
              labels={savedLabels}
              onUpsertLabel={onUpsertLabel}
              onDeleteLabel={onDeleteLabel}
              onImportLabels={onImportLabels}
              onImportVirLabels={onImportVirLabels}
            />
          </>
        )}
        {activeTab === "tags" && onUpsertTag && onDeleteTag && (
          <>
            <InfoBox
              title="Tags & Étiquettes"
              description="Créez des tags colorés pour regrouper vos opérations par thèmes transverses (ex: #Vacances, #Noël, #Travaux) indépendamment des catégories."
              icon={<Bookmark size={18} />}
            />
            <TagManager tags={tags} onUpsertTag={onUpsertTag} onDeleteTag={onDeleteTag} />
          </>
        )}
        {activeTab === "family" && (
          <>
            <InfoBox
              title="Gestion des Bénéficiaires"
              description="Définissez les bénéficiaires de votre foyer. Marquer un membre comme 'Enfant' permet de le distinguer dans les KPIs d'équité (ils ne sont pas considérés comme contributeurs financiers)."
              icon={<UserCircle size={18} />}
            />
            <PeopleManager people={people} onUpsertPerson={onUpsertPerson} onDeletePerson={onDeletePerson} />
          </>
        )}
        {activeTab === "accounts" && (
          <>
            <InfoBox
              title="Comptes Bancaires"
              description="Gérez la liste de vos comptes. Chaque opération de l'échéancier doit être reliée à un compte pour calculer précisément les soldes prévisionnels."
              icon={<CreditCard size={18} />}
            />
            <AccountManager accounts={accounts} people={people} onUpsertAccount={onUpsertAccount} onDeleteAccount={onDeleteAccount} />
          </>
        )}
        {activeTab === "users" && onToggleUserAuthorization && onUpdateUserNotes && onDeleteUser && (
          <>
            <InfoBox
              title="Autorisations d'accès"
              description="Contrôlez qui peut accéder à l'application. Les utilisateurs non autorisés qui tentent de se connecter apparaissent ici en attente. Autorisez-les pour leur donner accès ou supprimez-les pour refuser définitivement."
              icon={<Shield size={18} />}
            />
            <UsersManager users={authorizedUsers} onToggleAuthorization={onToggleUserAuthorization} onUpdateNotes={onUpdateUserNotes} onDeleteUser={onDeleteUser} />
          </>
        )}
      </div>
    </div>
  );
};
