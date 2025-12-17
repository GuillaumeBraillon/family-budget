
import { useState } from 'react';

export type ConfigTab = 'general' | 'family' | 'accounts' | 'categories';

export const useConfigurationUI = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('general');

  return {
    activeTab,
    setActiveTab
  };
};
