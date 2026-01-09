/**
 * @file Modale d'erreur globale
 * @description Affiche les erreurs capturées par les try/catch avec une UI élégante
 * identique à l'Error Boundary. Remplace les alert() et console.error dispersés.
 * Utilise le composant réutilisable ErrorDisplay.
 *
 * @design
 * - Header avec icône d'alerte
 * - Message d'erreur principal
 * - Contexte optionnel (où l'erreur s'est produite)
 * - Stack trace pliable
 * - Actions : Fermer, Rafraîchir, Retour accueil
 */
import React, { useState } from "react";
import { ErrorDisplay } from "./ErrorDisplay";

interface ErrorModalProps {
  isOpen: boolean;
  error: Error;
  context?: string;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, error, context, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <ErrorDisplay
      error={error}
      context={context}
      showDetails={showDetails}
      onToggleDetails={() => setShowDetails(!showDetails)}
      onRefresh={handleRefresh}
      onGoHome={handleGoHome}
      onClose={onClose}
      isModal={true}
    />
  );
};
