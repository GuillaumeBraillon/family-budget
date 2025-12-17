import React from 'react';
import { ConfigTab } from '../../../hooks/useConfigurationUI';

interface ConfigurationTabsProps {
  activeTab: ConfigTab;
  onTabChange: (tab: ConfigTab) => void;
}

export const ConfigurationTabs: React.FC<ConfigurationTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ConfigTab; label: string }[] = [
    { id: 'rules', label: 'Dépenses' },
    { id: 'incomes', label: 'Revenus' },
    { id: 'categories', label: 'Catégories' },
    { id: 'family', label: 'Famille' },
    { id: 'accounts', label: 'Comptes' },
  ];

  return (
    <div className="flex border-b border-slate-200 gap-6 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};