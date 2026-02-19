import React from "react";
import { VersionInfoCard } from "../molecules/VersionInfoCard";
import { LocalStorageManager } from "../molecules/LocalStorageManager";
import { DatabaseConnectionCard } from "../molecules/DatabaseConnectionCard";

/**
 * Composant de gestion des paramètres système.
 *
 * @description
 * Regroupe les actions système et informations techniques :
 * - Version de l'application
 * - Gestion du localStorage
 * - Connexion à la base de données
 */
export const SystemSettings: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="space-y-4">
        <VersionInfoCard />
        <LocalStorageManager />
        <DatabaseConnectionCard />
      </div>
    </div>
  );
};
