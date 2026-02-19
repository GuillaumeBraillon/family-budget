/**
 * @file Hook de gestion des filtres de la vue Transferts avec persistance localStorage
 * @description Centralise toute la logique de filtrage (type de compte, compte spécifique,
 * inclusion des opérations directes, motifs) avec sauvegarde automatique des préférences
 * utilisateur dans localStorage pour une meilleure UX.
 *
 * @architecture
 * **Principes appliqués :**
 * - **State Management** : useState avec initialisation depuis localStorage
 * - **Side Effects** : useEffect pour synchronisation automatique
 * - **Persistence** : Toutes les préférences sauvegardées localement
 * - **SRP** : Ne gère QUE les filtres, rien d'autre
 *
 * **Filtres disponibles :**
 * - Type de compte : ALL | CHECKING | SAVINGS
 * - Compte spécifique : ID d'un compte particulier
 * - Opérations directes : Inclure les opérations hors virements (intérêts, frais)
 * - Motif sélectionné : Filtrage par libellé exact
 *
 * @dependencies
 * - React : useState, useEffect
 * - localStorage : Persistance navigateur
 */
import { useState, useEffect } from "react";

// Clés localStorage pour la persistance
const STORAGE_KEYS = {
  ACCOUNT_TYPE: "transfersView_accountType",
  SPECIFIC_ACCOUNT: "transfersView_specificAccount",
  INTEREST_FILTER: "transfersView_interestFilter",
} as const;

/**
 * Hook de gestion des filtres de transferts avec persistance.
 *
 * @description
 * Fournit l'état et les setters pour tous les filtres de la vue Transferts.
 * Chaque changement est automatiquement sauvegardé dans localStorage via useEffect.
 *
 * **Workflow :**
 * 1. Initialisation : Lecture localStorage → useState initial value
 * 2. Changement : setState → Trigger useEffect → Sauvegarde localStorage
 * 3. Rechargement page : useState lit localStorage → État restauré
 *
 * **Valeurs par défaut :**
 * - accountTypeFilter : "ALL"
 * - specificAccountId : null
 * - includeDirectOps : true
 * - selectedMotif : null (pas de persistance)
 *
 * @returns {Object} État et setters des filtres
 * @returns {string} accountTypeFilter - Type de compte filtré ("ALL" | "CHECKING" | "SAVINGS")
 * @returns {Function} setAccountTypeFilter - Modifier le filtre de type
 * @returns {string | null} specificAccountId - ID du compte spécifique filtré
 * @returns {Function} setSpecificAccountId - Modifier le compte spécifique
 * @returns {boolean} includeDirectOps - Inclure les opérations directes (intérêts, frais)
 * @returns {Function} setIncludeDirectOps - Modifier l'inclusion des opérations directes
 * @returns {string | null} selectedMotif - Motif/libellé sélectionné pour filtrage
 * @returns {Function} setSelectedMotif - Modifier le motif sélectionné
 *
 * @example
 * ```tsx
 * const {
 *   accountTypeFilter,
 *   setAccountTypeFilter,
 *   specificAccountId,
 *   includeDirectOps,
 *   selectedMotif
 * } = useTransfersFilters();
 *
 * // Filtrer uniquement les comptes épargne
 * setAccountTypeFilter('SAVINGS');
 *
 * // Afficher un compte spécifique
 * setSpecificAccountId('acc_123');
 *
 * ```
 */
export const useTransfersFilters = () => {
  // --- FILTRES AVEC PERSISTANCE LOCALSTORAGE ---

  /**
   * Filtre par type de compte (Courant / Épargne / Tous).
   * Valeur par défaut : "ALL"
   */
  const [accountTypeFilter, setAccountTypeFilter] = useState<"ALL" | "CHECKING" | "SAVINGS">(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNT_TYPE);
    return (saved as "ALL" | "CHECKING" | "SAVINGS") || "ALL";
  });

  /**
   * Filtre par compte spécifique (affiche uniquement les opérations de ce compte).
   * Valeur par défaut : null (tous les comptes)
   */
  const [specificAccountId, setSpecificAccountId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.SPECIFIC_ACCOUNT) || null;
  });

  /**
   * Filtre des opérations directes sur épargne (intérêts, frais bancaires, etc.).
   * Valeur par défaut : "EXCLUDE"
   */
  const [interestFilter, setInterestFilter] = useState<"ALL" | "EXCLUDE" | "ONLY">(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INTEREST_FILTER);
    if (saved === "ALL" || saved === "EXCLUDE" || saved === "ONLY") {
      return saved;
    }
    return "EXCLUDE";
  });

  /**
   * Motif/libellé sélectionné pour filtrage exact.
   * Pas de persistance (reset à chaque chargement de page).
   */
  const [selectedMotif, setSelectedMotif] = useState<string | null>(null);

  // --- SYNCHRONISATION LOCALSTORAGE (EFFECTS) ---

  /**
   * Sauvegarde automatique du filtre de type de compte.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_TYPE, accountTypeFilter);
  }, [accountTypeFilter]);

  /**
   * Sauvegarde automatique du compte spécifique.
   * Supprime la clé si null pour nettoyer le localStorage.
   */
  useEffect(() => {
    if (specificAccountId) {
      localStorage.setItem(STORAGE_KEYS.SPECIFIC_ACCOUNT, specificAccountId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SPECIFIC_ACCOUNT);
    }
  }, [specificAccountId]);

  /**
   * Sauvegarde automatique du filtre d'intérêts.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTEREST_FILTER, interestFilter);
  }, [interestFilter]);

  // --- EXPOSITION DE L'API PUBLIQUE ---

  return {
    // Filtres principaux
    accountTypeFilter,
    setAccountTypeFilter,
    specificAccountId,
    setSpecificAccountId,
    interestFilter,
    setInterestFilter,
    selectedMotif,
    setSelectedMotif,
  };
};
