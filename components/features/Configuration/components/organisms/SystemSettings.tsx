import React from "react";
import { VersionInfoCard } from "../molecules/VersionInfoCard";
import { LocalStorageManager } from "../molecules/LocalStorageManager";
import { DatabaseConnectionCard } from "../molecules/DatabaseConnectionCard";

interface SystemSettingsProps {
  onResetConnection: () => void;
}

/**
 * Composant de gestion des paramètres système.
 *
 * @description
 * Regroupe les actions système et informations techniques :
 * - Version de l'application
 * - Gestion du localStorage
 * - Connexion à la base de données
 *
 * @param {Object} props - Props du composant
 * @param {Function} props.onResetConnection - Callback pour réinitialiser la connexion DB
 */
export const SystemSettings: React.FC<SystemSettingsProps> = ({ onResetConnection }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="space-y-4">
        <VersionInfoCard />
        <LocalStorageManager />
        <DatabaseConnectionCard onReset={onResetConnection} />
      </div>
    </div>
  );
};
