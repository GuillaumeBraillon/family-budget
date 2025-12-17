
import React from 'react';
import { Settings } from 'lucide-react';
import { ConfigTab } from '../../hooks/useConfigurationUI';
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account, AppSettings } from '../../types';

import { ConfigurationTabs } from './molecules/ConfigurationTabs';
import { OperationsManager } from './organisms/OperationsManager';
import { CategoryManager } from './organisms/CategoryManager';
import { PeopleManager } from './organisms/PeopleManager';
import { AccountManager } from './organisms/AccountManager';
import { GlobalSettings } from './organisms/GlobalSettings';

interface ConfigurationViewProps {
  configs: ExpenseConfig[];
  incomeConfigs?: IncomeConfig[]; 
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  settings: AppSettings;
  activeTab: ConfigTab;
  setActiveTab: (tab: ConfigTab) => void;
  onAddConfig: (config: ExpenseConfig) => void;
  onUpdateConfig: (config: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddIncome?: (config: IncomeConfig) => void;
  onUpdateIncome?: (config: IncomeConfig) => void;
  onDeleteIncome?: (id: string) => void;
  onUpdateCategories: (newCategories: CategoryDef[]) => void;
  onUpdatePeople: (newPeople: Person[]) => void;
  onUpdateAccounts: (newAccounts: Account[]) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  configs, incomeConfigs = [], categories, people, accounts, settings,
  activeTab, setActiveTab,
  onAddConfig, onUpdateConfig, onDeleteConfig, 
  onAddIncome, onUpdateIncome, onDeleteIncome,
  onUpdateCategories,
  onUpdatePeople, onUpdateAccounts, onUpdateSettings
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

      <div className="pt-2">
        {activeTab === 'general' && (
            <GlobalSettings settings={settings} onUpdate={onUpdateSettings} />
        )}
        {activeTab === 'operations' && (
            <OperationsManager 
                configs={configs} 
                incomeConfigs={incomeConfigs}
                categories={categories}
                people={people}
                accounts={accounts}
                onAddConfig={onAddConfig}
                onUpdateConfig={onUpdateConfig}
                onDeleteConfig={onDeleteConfig}
                onAddIncome={onAddIncome!}
                onUpdateIncome={onUpdateIncome!}
                onDeleteIncome={onDeleteIncome!}
            />
        )}
        {activeTab === 'categories' && (
            <CategoryManager 
                categories={categories} 
                onUpdateCategories={onUpdateCategories} 
            />
        )}
        {activeTab === 'family' && (
            <PeopleManager 
                people={people} 
                onUpdatePeople={onUpdatePeople} 
            />
        )}
        {activeTab === 'accounts' && (
            <AccountManager 
                accounts={accounts} 
                people={people} 
                onUpdateAccounts={onUpdateAccounts} 
            />
        )}
      </div>
    </div>
  );
};
