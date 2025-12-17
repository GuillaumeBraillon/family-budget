import { useState } from 'react';

export type ConfigTab = 'rules' | 'incomes' | 'categories' | 'family' | 'accounts';

export const useConfigurationUI = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('rules');

  return {
    activeTab,
    setActiveTab
  };
};