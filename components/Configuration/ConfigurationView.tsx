
import React from 'react';
import { Settings, UserCircle, CreditCard, Tag, Sliders, List, CalendarRange } from 'lucide-react';
import { ConfigTab } from '../../hooks/useConfigurationUI';
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account, AppSettings, SavedLabel } from '../../types';
import { InfoBox } from '../ui/InfoBox';

import { ConfigurationTabs } from './molecules/ConfigurationTabs';
import { CategoryManager } from './organisms/CategoryManager';
import { PeopleManager } from './organisms/PeopleManager';
import { AccountManager } from './organisms/AccountManager';
import { GlobalSettings } from './organisms/GlobalSettings';
import { AccountLabelManager } from './organisms/AccountLabelManager';
import { OperationsManager } from './organisms/OperationsManager';

interface ConfigurationViewProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[]; 
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  settings: AppSettings;
  savedLabels: SavedLabel[];
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
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  configs, incomeConfigs, categories, people, accounts, settings, savedLabels,
  activeTab, setActiveTab,
  onUpdateCategories,
  onUpsertPerson, onDeletePerson,
  onUpsertAccount, onDeleteAccount,
  onUpdateSettings,
  onResetConnection,
  onUpsertLabel, onDeleteLabel,
  onAddConfig, onUpdateConfig, onDeleteConfig,
  onAddIncome, onUpdateIncome, onDeleteIncome
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
        {activeTab === 'general' && (
            <>
              <InfoBox 
                title="Paramètres Globaux"
                description="Configurez ici les options de base de l'application, comme le montant du budget mensuel qui sera réparti entre vos périodes d'échéancier."
                icon={<Sliders size={18} />}
              />
              <GlobalSettings 
                settings={settings} 
                onUpdate={onUpdateSettings} 
                onResetConnection={onResetConnection}
              />
            </>
        )}
        {activeTab === 'operations' && (
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
        {activeTab === 'categories' && (
            <>
              <InfoBox 
                title="Classification des flux"
                description="Personnalisez vos catégories et sous-catégories pour organiser vos dépenses et revenus. Une bonne classification permet une analyse plus fine de vos habitudes de consommation."
                icon={<Tag size={18} />}
              />
              <CategoryManager 
                  categories={categories} 
                  onUpdateCategories={onUpdateCategories} 
              />
            </>
        )}
        {activeTab === 'labels' && (
            <>
              <InfoBox 
                title="Libellés de compte"
                description="Gérez les listes de libellés pré-définis pour vos opérations (virements d'épargne, dépenses courantes) afin d'accélérer la saisie lors de l'ajout de transactions."
                icon={<List size={18} />}
              />
              <AccountLabelManager 
                  labels={savedLabels} 
                  onUpsertLabel={onUpsertLabel}
                  onDeleteLabel={onDeleteLabel}
              />
            </>
        )}
        {activeTab === 'family' && (
            <>
              <InfoBox 
                title="Gestion des Bénéficiaires"
                description="Définissez les bénéficiaires de votre foyer. Marquer un membre comme 'Enfant' permet de le distinguer dans les KPIs d'équité (ils ne sont pas considérés comme contributeurs financiers)."
                icon={<UserCircle size={18} />}
              />
              <PeopleManager 
                  people={people} 
                  onUpsertPerson={onUpsertPerson}
                  onDeletePerson={onDeletePerson}
              />
            </>
        )}
        {activeTab === 'accounts' && (
            <>
              <InfoBox 
                title="Comptes Bancaires"
                description="Gérez la liste de vos comptes. Chaque opération de l'échéancier doit être reliée à un compte pour calculer précisément les soldes prévisionnels."
                icon={<CreditCard size={18} />}
              />
              <AccountManager 
                  accounts={accounts} 
                  people={people} 
                  onUpsertAccount={onUpsertAccount}
                  onDeleteAccount={onDeleteAccount}
              />
            </>
        )}
      </div>
    </div>
  );
};