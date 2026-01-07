import { useState } from "react";

export type ConfigTab = "general" | "family" | "accounts" | "operations" | "categories" | "labels" | "tags" | "users";

/**
 * Hook de gestion de l'état UI de la vue Configuration.
 *
 * @description
 * Gère l'onglet actif dans la navigation de la page de configuration.
 * Simple gestionnaire d'état pour synchroniser la navigation avec le contenu affiché.
 *
 * @returns {Object} État et actions de navigation
 * @returns {ConfigTab} activeTab - Onglet actuellement actif
 * @returns {Function} setActiveTab - Change l'onglet actif
 *
 * @example
 * ```tsx
 * const { activeTab, setActiveTab } = useConfigurationUI();
 *
 * return (
 *   <Tabs activeTab={activeTab} onChange={setActiveTab}>
 *     <Tab name="general">Paramètres généraux</Tab>
 *     <Tab name="family">Famille</Tab>
 *   </Tabs>
 * );
 * ```
 */
export const useConfigurationUI = () => {
  const [activeTab, setActiveTab] = useState<ConfigTab>("general");

  return {
    activeTab,
    setActiveTab,
  };
};
