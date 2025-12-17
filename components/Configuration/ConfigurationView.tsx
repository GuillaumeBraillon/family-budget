import React from 'react';
import { Settings } from 'lucide-react';
import { useConfigurationUI } from '../../hooks/useConfigurationUI';
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account } from '../../types';

// Import des molécules et organismes
import { ConfigurationTabs } from './molecules/ConfigurationTabs';
import { ExpenseRulesEditor } from './organisms/ExpenseRulesEditor';
import { IncomeEditor } from './organisms/IncomeEditor';
import { CategoryManager } from './organisms/CategoryManager';
import { PeopleManager } from './organisms/PeopleManager';
import { AccountManager } from './organisms/AccountManager';

interface ConfigurationViewProps {
  configs: ExpenseConfig[];
  incomeConfigs?: IncomeConfig[]; 
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  onAddConfig: (config: ExpenseConfig) => void;
  onUpdateConfig: (config: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddIncome?: (config: IncomeConfig) => void;
  onUpdateIncome?: (config: IncomeConfig) => void;
  onDeleteIncome?: (id: string) => void;
  onUpdateCategories: (newCategories: CategoryDef[]) => void;
  onUpdatePeople: (newPeople: Person[]) => void;
  onUpdateAccounts: (newAccounts: Account[]) => void;
}

/**
 * Vue principale des paramètres de l'application.
 * Orchestre les différents gestionnaires de données via une navigation par onglets.
 */
export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  configs, incomeConfigs = [], categories, people, accounts,
  onAddConfig, onUpdateConfig, onDeleteConfig, 
  onAddIncome, onUpdateIncome, onDeleteIncome,
  onUpdateCategories,
  onUpdatePeople, onUpdateAccounts 
}) => {
  const { activeTab, setActiveTab } = useConfigurationUI();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-indigo-600" />
            Paramètres
        </h2>
      </div>

      {/* NAVIGATION PAR ONGLETS */}
      <ConfigurationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="pt-2">
        {activeTab === 'rules' && (
            <ExpenseRulesEditor 
                configs={configs} 
                categories={categories} 
                people={people} 
                accounts={accounts}
                onAddConfig={onAddConfig} 
                onUpdateConfig={onUpdateConfig} 
                onDeleteConfig={onDeleteConfig} 
            />
        )}
        {activeTab === 'incomes' && (
            <IncomeEditor 
                incomeConfigs={incomeConfigs} 
                people={people} 
                categories={categories} 
                accounts={accounts}
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