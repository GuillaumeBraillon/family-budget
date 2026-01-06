import { useState } from "react";

export type ConfigTab = "general" | "family" | "accounts" | "operations" | "categories" | "labels" | "tags" | "users";

export const useConfigurationUI = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>("general");

  return {
    activeTab,
    setActiveTab,
  };
};
