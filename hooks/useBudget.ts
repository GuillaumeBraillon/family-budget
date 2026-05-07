/**
 * @file Hook central de gestion de l'état global des finances (refactorisé)
 * @description Hook orchestrateur qui coordonne l'état budgétaire global avec délégation
 * des responsabilités aux hooks spécialisés. Applique le principe de composition pour
 * une architecture modulaire et maintenable.
 *
 * @architecture
 * **Refactorisation Atomic Design :**
 * - `useBudget` (orchestrateur) : Gestion d'état + coordination
 * - `useBudgetBalances` (logique métier) : Ajustements de soldes
 * - `useBudgetActions` (actions CRUD) : Opérations DB wrappées
 *
 * **Principes appliqués :**
 * - **SRP (Single Responsibility)** : Chaque hook a une responsabilité unique
 * - **Composition over Inheritance** : Assemblage de hooks spécialisés
 * - **DRY** : Logique factorisée dans des modules réutilisables
 * - **Optimistic Updates** : UI réactive avec mise à jour immédiate
 *
 * **Flux de données :**
 * ```
 * App.tsx → useBudget (état global)
 *             ↓
 *       ┌─────┴──────┐
 *       ↓            ↓
 * useBudgetBalances  useBudgetActions
 * (soldes)           (CRUD)
 * ```
 *
 * @dependencies
 * - hooks/budget/useBudgetBalances : Gestion des soldes
 * - hooks/budget/useBudgetActions : Actions CRUD avec reload
 * - services/api : fetchInitialData, apiSetPaidStatus, apiUpdateSettings, etc.
 * - services/supabase : Configuration et vérification
 * - services/logger : Traçage des opérations
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Account,
  ExpenseConfig,
  IncomeConfig,
  CategoryDef,
  Person,
  PaidItemDetails,
  AppSettings,
  Transfer,
  VariableTransaction,
  SavedLabel,
  AccountType,
  Tag,
  PlannedItem,
  AuthorizedUser,
} from "../types";
import { useBudgetBalances } from "./budget/useBudgetBalances";
import { useBudgetActions } from "./budget/useBudgetActions";
import {
  fetchInitialData,
  apiSetPaidStatus,
  apiUpdateSettings,
  apiUpsertTransfer,
  apiDeleteTransfer,
  apiUpsertVariableTransaction,
  apiDeleteVariableTransaction,
} from "../services/api";
import { isSupabaseConfigured } from "../services/supabase";

/**
 * Libellés par défaut suggérés pour les transactions d'épargne.
 * Utilisés si aucun libellé personnalisé n'est défini en base.
 */
const DEFAULT_SAVINGS_LABELS = ["Virement mensuel", "Épargne automatique", "Intérêts", "Retrait", "Apport exceptionnel", "Régularisation"];

/**
 * Libellés par défaut suggérés pour les transactions variables (dépenses courantes).
 * Utilisés si aucun libellé personnalisé n'est défini en base.
 */
const DEFAULT_VARIABLE_LABELS = ["Courses Alimentaires", "Essence / Carburant", "Restaurant", "Pharmacie", "Loisirs", "Shopping"];

/**
 * Hook central orchestrateur de l'état budgétaire global.
 *
 * @description
 * **REFACTORISATION CLEAN CODE :**
 * Ce hook a été refactorisé pour appliquer les principes SOLID :
 * - Logique des soldes → `useBudgetBalances`
 * - Actions CRUD → `useBudgetActions`
 * - Orchestration d'état → `useBudget` (ce hook)
 *
 * **Responsabilités :**
 * - Chargement initial des données depuis Supabase
 * - Gestion de l'état global centralisé
 * - Coordination des hooks spécialisés
 * - Actions spécifiques (setPaidStatus, moveItem, updateSettings)
 * - Détection de base vide (première utilisation)
 *
 * **Architecture :**
 * ```
 * useBudget (200L)
 *   ├─ État : budgetData (comptes, configs, catégories, etc.)
 *   ├─ Chargement : loadData + fetchInitialData
 *   ├─ Délégation : useBudgetBalances + useBudgetActions
 *   └─ Actions spécifiques : setPaidStatus, moveItem, transfers, variables
 * ```
 *
 * @returns {Object} État budgétaire et actions
 * @returns {Account[]} accounts - Liste des comptes bancaires
 * @returns {ExpenseConfig[]} configs - Modèles de dépenses récurrentes
 * @returns {IncomeConfig[]} incomeConfigs - Modèles de revenus récurrents
 * @returns {CategoryDef[]} categories - Définitions des catégories
 * @returns {Person[]} people - Liste des bénéficiaires/membres
 * @returns {Record<string, PaidItemDetails>} paidItems - Pointages mensuels
 * @returns {AppSettings} settings - Paramètres globaux (enveloppe, périodes)
 * @returns {Transfer[]} transfers - Virements internes
 * @returns {VariableTransaction[]} variableTransactions - Transactions variables
 * @returns {SavedLabel[]} savedLabels - Libellés sauvegardés
 * @returns {Tag[]} tags - Tags de ventilation
 * @returns {AuthorizedUser[]} authorizedUsers - Whitelist utilisateurs
 * @returns {boolean} loading - Indicateur de chargement
 * @returns {string | null} error - Message d'erreur utilisateur
 * @returns {boolean} isDbEmpty - Base vide (première utilisation)
 * @returns {Object} actions - Toutes les actions disponibles
 *
 * @example
 * ```tsx
 * const { accounts, configs, loading, actions } = useBudget();
 *
 * // Actions déléguées (CRUD simple)
 * await actions.upsertConfig(config);
 * await actions.deleteCategory(id);
 *
 * // Actions spécifiques (logique complexe)
 * await actions.setPaidStatus(details, instanceId);
 * await actions.moveItem(item, position);
 * ```
 */
export const useBudget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDbEmpty, setIsDbEmpty] = useState(false);

  const [budgetData, setBudgetData] = useState({
    accounts: [] as Account[],
    configs: [] as ExpenseConfig[],
    incomeConfigs: [] as IncomeConfig[],
    categories: [] as CategoryDef[],
    people: [] as Person[],
    paidItems: {} as Record<string, PaidItemDetails>,
    settings: {
      personal_budget_amount: 350,
      family_variable_budget: 0,
      period_type: "FIXED_DAYS",
      period_value: 7,
    } as AppSettings,
    transfers: [] as Transfer[],
    variableTransactions: [] as VariableTransaction[],
    savedLabels: [] as SavedLabel[],
    tags: [] as Tag[],
    authorizedUsers: [] as AuthorizedUser[],
  });

  // Ref pour accéder aux données actuelles dans les fonctions async sans stale closures
  const budgetDataRef = useRef(budgetData);
  useEffect(() => {
    budgetDataRef.current = budgetData;
  }, [budgetData]);

  // --- CHARGEMENT INITIAL DES DONNÉES ---

  /**
   * Charge toutes les données budgétaires depuis Supabase.
   *
   * @description
   * Fonction centrale de récupération des données. Exécute un appel parallèle via `fetchInitialData`
   * pour charger tous les types d'entités (comptes, opérations, catégories, etc.).
   *
   * **Comportement :**
   * - Mode normal (`silent=false`) : Affiche le loader pendant le chargement
   * - Mode silencieux (`silent=true`) : Recharge en arrière-plan sans loader (utilisé après mutations)
   * - Détecte une base vide si aucune personne ni compte (première utilisation)
   * - Gestion centralisée des erreurs avec messages utilisateur
   *
   * @param {boolean} [silent=false] - Si true, ne modifie pas l'état `isLoading` (rechargement discret)
   *
   * @example
   * ```tsx
   * // Rechargement complet avec loader
   * await loadData();
   *
   * // Rechargement silencieux après mutation
   * await loadData(true);
   * ```
   */
  const loadData = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      if (!silent) setIsLoading(true);
      setErrorMessage(null);
      const res = await fetchInitialData();

      setIsDbEmpty(res.people.length === 0 && res.accounts.length === 0);

      setBudgetData({
        accounts: res.accounts,
        configs: res.configs,
        incomeConfigs: res.incomeConfigs,
        categories: res.categories,
        people: res.people,
        paidItems: res.paidItems,
        settings: res.settings,
        transfers: res.transfers,
        variableTransactions: res.variableTransactions,
        savedLabels: res.savedLabels,
        tags: res.tags,
        authorizedUsers: res.authorizedUsers ?? [],
      });
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "Erreur lors du chargement des données");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Charger une SEULE fois au montage initial
  const loadDataCalledRef = useRef(false);
  useEffect(() => {
    // Empêcher les rechargements multiples (StrictMode, focus, etc.)
    if (loadDataCalledRef.current) return;

    loadDataCalledRef.current = true;
    let isMounted = true;

    if (isMounted) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides = une seule fois (loadData ne doit pas déclencher de re-render)

  // --- HOOKS SPÉCIALISÉS (DÉLÉGATION DE RESPONSABILITÉS) ---

  // Hook de gestion des soldes de comptes
  const balanceHandlers = useBudgetBalances(budgetDataRef, setBudgetData);

  // Hook des actions CRUD wrappées avec reload
  const crudActions = useBudgetActions(loadData, setErrorMessage);

  // --- ACTIONS SPÉCIFIQUES (NON DÉLÉGUÉES) ---

  /**
   * Met à jour le tri manuel des opérations.
   *
   * @param {string[]} newSorting - Nouvel ordre complet des instance_ids
   */
  const updateOperationsSorting = async (newSorting: string[]) => {
    const newSettings = { ...budgetDataRef.current.settings, operations_sorting: newSorting };

    // Mise à jour optimiste
    setBudgetData((prev) => ({ ...prev, settings: newSettings }));

    try {
      const { error: apiErr } = await apiUpdateSettings(newSettings);
      if (apiErr) throw apiErr;
    } catch (err) {
      setErrorMessage((err as Error).message || "Erreur lors de la mise à jour du tri");
      loadData();
    }
  };

  /**
   * Met à jour le tri manuel des comptes (Configuration > Comptes).
   *
   * @param {string[]} newSorting - Nouvel ordre complet des account_ids
   */
  const updateAccountsSorting = async (newSorting: string[]) => {
    const newSettings = { ...budgetDataRef.current.settings, accounts_sorting: newSorting };

    // Mise à jour optimiste
    setBudgetData((prev) => ({ ...prev, settings: newSettings }));

    try {
      const { error: apiErr } = await apiUpdateSettings(newSettings);
      if (apiErr) throw apiErr;
    } catch (err) {
      setErrorMessage((err as Error).message || "Erreur lors de la mise à jour du tri des comptes");
      loadData();
    }
  };

  /**
   * Pointe ou dépointe une opération récurrente pour un mois donné.
   *
   * @description
   * Marque une instance mensuelle d'une opération récurrente comme "payée" ou la dépointe.
   * Gère automatiquement l'ajustement des soldes de comptes selon le statut et le type d'opération.
   *
   * **Workflow :**
   * 1. Mise à jour optimiste de l'UI (immédiate)
   * 2. Ajustement des soldes si changement de statut "en attente" ↔ "pointé"
   * 3. Persistence en base via API
   * 4. Rollback en cas d'erreur (rechargement complet)
   *
   * **Gestion des soldes :**
   * - Dépense pointée : solde - montant
   * - Revenu pointé : solde + montant
   * - Dépointage : opération inverse
   * - Modification (ancien pointé → nouveau pointé) : ajuste les 2 comptes si différents
   *
   * @param {PaidItemDetails | null} details - Détails du pointage (null pour dépointer)
   * @param {string} instanceId - Identifiant de l'instance mensuelle (format: "configId-YYYY-MM")
   *
   * @throws {Error} En cas d'échec API, affiche un message utilisateur et recharge les données
   *
   * @example
   * ```tsx
   * // Pointer une dépense
   * await setPaidStatus({
   *   instanceId: "exp_123-2025-01",
   *   amount: 50,
   *   paymentDate: "2025-01-15",
   *   accountId: "acc_1",
   *   isWaiting: false,
   *   // ... autres champs
   * }, "exp_123-2025-01");
   *
   * // Dépointer
   * await setPaidStatus(null, "exp_123-2025-01");
   * ```
   */
  const setPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
    const oldItem = budgetDataRef.current.paidItems[instanceId];

    // Si on crée un nouvel item (passage d'attente à réel), on l'ajoute au début du tri manuel
    let newSorting = budgetDataRef.current.settings.operations_sorting || [];
    if (details && !oldItem && !newSorting.includes(instanceId)) {
      newSorting = [instanceId, ...newSorting];
    }

    // 1. Mise à jour Optimiste de l'UI
    setBudgetData((prev) => {
      const nextPaid = { ...prev.paidItems };
      if (!details) delete nextPaid[instanceId];
      else nextPaid[instanceId] = details;

      return {
        ...prev,
        paidItems: nextPaid,
        settings: { ...prev.settings, operations_sorting: newSorting },
      };
    });

    try {
      // 2. Impacts solde
      await balanceHandlers.handlePaidItemBalance(oldItem, details);

      // 3. Appel API (Statut)
      const { error: apiErr } = await apiSetPaidStatus(details, instanceId);
      if (apiErr) throw apiErr;

      // 4. Appel API (Tri si changé)
      if (newSorting !== budgetDataRef.current.settings.operations_sorting) {
        await apiUpdateSettings({ ...budgetDataRef.current.settings, operations_sorting: newSorting });
      }
    } catch (err) {
      setErrorMessage((err as Error).message || "Erreur lors de la mise à jour du statut");
      loadData();
    }
  };

  /**
   * Retire le suffixe mensuel (c_noveo-2026-03 → c_noveo).
   * Utilisé pour écrire des IDs stables cross-mois dans operations_sorting.
   */
  const toStableId = (id: string) => id.replace(/-\d{4}-\d{2}$/, "");

  /**
   * Déplace une opération dans l'ordre d'affichage manuel.
   * Normalise et déduplique l'array à chaque écriture pour auto-réparer
   * les données corrompues (doublons, IDs mensuels mélangés).
   */
  const moveItem = async (item: PlannedItem, targetId: string) => {
    const currentSorting = budgetDataRef.current.settings.operations_sorting || [];

    // Normaliser + dédupliquer (auto-réparation de l'array corrompu)
    const seen = new Set<string>();
    const newSorting = currentSorting.map(toStableId).filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const stableItemId = toStableId(item.instanceId);
    const stableTargetId = toStableId(targetId);

    if (!newSorting.includes(stableItemId)) {
      newSorting.push(stableItemId);
    }
    if (!newSorting.includes(stableTargetId)) {
      newSorting.push(stableTargetId);
    }

    const oldIndex = newSorting.indexOf(stableItemId);
    if (oldIndex === -1) return;

    // Capturer l'index original du target AVANT suppression pour détecter la direction
    const originalTargetIndex = newSorting.indexOf(stableTargetId);
    const movingDown = originalTargetIndex > oldIndex;

    newSorting.splice(oldIndex, 1);

    // Re-chercher le target dans le tableau modifié (l'index a peut-être décalé)
    const targetIndex = newSorting.indexOf(stableTargetId);
    if (targetIndex === -1) {
      newSorting.push(stableItemId);
    } else if (movingDown) {
      // Déplacement vers le bas : insérer APRÈS le target
      // (dnd-kit sémantique : l'item prend la place juste après l'item survolé)
      newSorting.splice(targetIndex + 1, 0, stableItemId);
    } else {
      // Déplacement vers le haut : insérer AVANT le target
      newSorting.splice(targetIndex, 0, stableItemId);
    }

    // moveItem: updateOperationsSorting called with normalized, deduped array

    await updateOperationsSorting(newSorting);
  };

  const upsertVariableTransaction = async (tx: VariableTransaction) => {
    const oldTx = budgetDataRef.current.variableTransactions.find((t) => t.id === tx.id);
    const isNew = !oldTx;

    // Gestion des soldes
    await balanceHandlers.handleVariableTransactionBalance(oldTx, tx);

    // Si c'est une nouvelle transaction, on l'ajoute au tri manuel
    if (isNew) {
      const currentSorting = budgetDataRef.current.settings.operations_sorting || [];
      // Normaliser + dédupliquer au passage
      const seen = new Set<string>();
      const stableSorting = currentSorting.map(toStableId).filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      if (!stableSorting.includes(tx.id)) {
        const newSorting = [tx.id, ...stableSorting];
        await apiUpdateSettings({ ...budgetDataRef.current.settings, operations_sorting: newSorting });
      }
    }

    // CRUD avec reload
    const res = await apiUpsertVariableTransaction(tx);
    if (res.error) {
      throw res.error;
    }
    await loadData(true);
    return res;
  };

  const deleteVariableTransaction = async (id: string) => {
    const oldTx = budgetDataRef.current.variableTransactions.find((t) => t.id === id);

    // Gestion des soldes (DÉLÉGUÉ)
    await balanceHandlers.handleVariableTransactionBalance(oldTx, null);

    // CRUD avec reload
    const res = await apiDeleteVariableTransaction(id);
    await loadData(true);
    return res;
  };

  const upsertTransfer = async (t: Transfer) => {
    const oldTransfer = budgetDataRef.current.transfers.find((tr) => tr.id === t.id);

    // Gestion des soldes (DÉLÉGUÉ)
    await balanceHandlers.handleTransferBalances(oldTransfer, t);

    // CRUD avec reload
    const res = await apiUpsertTransfer(t);
    await loadData(true);
    return res;
  };

  const deleteTransfer = async (id: string) => {
    const oldTransfer = budgetDataRef.current.transfers.find((tr) => tr.id === id);

    // Gestion des soldes (DÉLÉGUÉ)
    await balanceHandlers.handleTransferBalances(oldTransfer, null);

    // CRUD avec reload
    const res = await apiDeleteTransfer(id);
    await loadData(true);
    return res;
  };

  const updateSettings = async (settings: AppSettings) => {
    try {
      const { error: apiErr } = await apiUpdateSettings(settings);
      if (apiErr) throw apiErr;
      setBudgetData((prev) => ({ ...prev, settings }));
    } catch (err) {
      const error = err as Error;
      setErrorMessage(error.message || "Érreur lors de la mise à jour des paramètres");
      loadData();
    }
  };

  // --- GÉNÉRATION DES SUGGESTIONS DE LIBELLÉS ---

  const savingsSuggestions = budgetData.savedLabels.filter((l) => l.type === AccountType.SAVINGS).map((l) => l.name);

  const variableSuggestions = budgetData.savedLabels.filter((l) => l.type === AccountType.CHECKING).map((l) => l.name);

  const finalSavingsSuggestions = savingsSuggestions.length > 0 ? savingsSuggestions : DEFAULT_SAVINGS_LABELS;
  const finalVariableSuggestions = variableSuggestions.length > 0 ? variableSuggestions : DEFAULT_VARIABLE_LABELS;

  const settingsWithLabels = {
    ...budgetData.settings,
    savings_labels: finalSavingsSuggestions,
    variable_labels: finalVariableSuggestions,
  };

  // --- EXPOSITION DE L'API PUBLIQUE ---

  return {
    ...budgetData,
    settings: settingsWithLabels,
    savedLabels: budgetData.savedLabels,
    tags: budgetData.tags,
    authorizedUsers: budgetData.authorizedUsers,
    loading: isLoading,
    error: errorMessage,
    isDbEmpty,
    actions: {
      // Actions de chargement
      loadData,

      // Actions spécifiques (logique complexe)
      setPaidStatus,
      moveItem,
      updateSettings,
      updateAccountsSorting,
      upsertTransfer,
      deleteTransfer,
      upsertVariableTransaction,
      deleteVariableTransaction,

      // Actions CRUD déléguées (pattern HOF)
      ...crudActions,
    },
  };
};
