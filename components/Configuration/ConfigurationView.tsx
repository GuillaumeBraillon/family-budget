
import React from 'react';
import { Settings, UserCircle, CreditCard, Tag, Sliders } from 'lucide-react';
import { ConfigTab } from '../../hooks/useConfigurationUI';
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account, AppSettings } from '../../types';
import { InfoBox } from '../ui/InfoBox';

import { ConfigurationTabs } from './molecules/ConfigurationTabs';
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
  onUpdateCategories: (newCategories: CategoryDef[]) => void;
  onUpdatePeople: (newPeople: Person[]) => void;
  onUpdateAccounts: (newAccounts: Account[]) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetConnection: () => void;
}

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  categories, people, accounts, settings,
  activeTab, setActiveTab,
  onUpdateCategories,
  onUpdatePeople, onUpdateAccounts, onUpdateSettings,
  onResetConnection
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
                description="Configurez ici les options de base de l'application, comme le montant de l'enveloppe hebdomadaire qui définit votre budget variable par défaut."
                icon={<Sliders size={18} />}
              />
              <GlobalSettings 
                settings={settings} 
                onUpdate={onUpdateSettings} 
                onResetConnection={onResetConnection}
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
        {activeTab === 'family' && (
            <>
              <InfoBox 
                title="Gestion du Foyer"
                description="Définissez les membres de votre famille. Marquer un membre comme 'Enfant' permet de le distinguer dans les KPIs d'équité (ils ne sont pas considérés comme contributeurs financiers)."
                icon={<UserCircle size={18} />}
              />
              <PeopleManager 
                  people={people} 
                  onUpdatePeople={onUpdatePeople} 
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
                  onUpdateAccounts={onUpdateAccounts} 
              />
            </>
        )}
      </div>
    </div>
  );
};
