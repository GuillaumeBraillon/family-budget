
import { useState } from 'react';

export type ConfigTab = 'general' | 'family' | 'accounts' | 'operations' | 'categories' | 'labels';

export const useConfigurationUI = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('family');

  return {
    activeTab,
    setActiveTab
  };
}