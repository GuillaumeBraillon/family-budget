/**
 * @file Hook de gestion des ajustements automatiques de soldes de comptes
 * @description Centralise la logique métier d'ajustement des soldes bancaires lors des opérations
 * financières (pointages, virements, suppressions). Applique le principe de responsabilité unique
 * en isolant cette logique du hook principal useBudget.
 *
 * @architecture
 * **Principes appliqués :**
 * - **SRP (Single Responsibility)** : Ne gère QUE les soldes, rien d'autre
 * - **Pure functions** : Tous les calculs sont déterministes et sans effets de bord
 * - **Optimistic updates** : UI mise à jour immédiatement, persistence asynchrone
 *
 * **Règles métier :**
 * - Dépense pointée → solde - montant
 * - Revenu pointé → solde + montant
 * - Virement → débit source + crédit destination
 * - Seuil minimal : ignore les ajustements < 0.01€
 *
 * @dependencies
 * - services/api : apiUpsertAccount pour persistence
 * - types : Account pour le typage
 */
import { Account, VariableTransaction, Transfer, PaidItemDetails } from "../../types";
import { apiUpsertAccount } from "../../services/api";

/**
 * Hook de gestion des ajustements automatiques de soldes.
 *
 * @description
 * Fournit des fonctions pour ajuster automatiquement les soldes de comptes lors des opérations
 * financières. Utilise une référence aux données actuelles pour éviter les stale closures.
 *
 * **Workflow d'ajustement :**
 * 1. Vérification du montant (seuil 0.01€)
 * 2. Récupération du compte concerné
 * 3. Calcul du nouveau solde
 * 4. Mise à jour optimiste de l'état local (setState callback)
 * 5. Persistence asynchrone en base
 *
 * @param {React.MutableRefObject} budgetDataRef - Ref vers les données actuelles (évite stale closures)
 * @param {Function} setBudgetData - Setter pour mettre à jour l'état global
 *
 * @returns {Object} Fonctions d'ajustement des soldes
 * @returns {Function} adjustAccountBalance - Ajuste un compte d'un montant delta
 * @returns {Function} handleVariableTransactionBalance - Gère les soldes pour transactions variables
 * @returns {Function} handleTransferBalances - Gère les soldes pour virements
 * @returns {Function} handlePaidItemBalance - Gère les soldes pour pointages
 *
 * @example
 * ```tsx
 * const {
 *   adjustAccountBalance,
 *   handleVariableTransactionBalance,
 *   handleTransferBalances
 * } = useBudgetBalances(budgetDataRef, setBudgetData);
 *
 * // Ajuster manuellement un compte
 * await adjustAccountBalance('acc_123', -50); // Débiter 50€
 *
 * // Gérer une transaction variable
 * await handleVariableTransactionBalance(oldTx, newTx);
 * ```
 */
type BudgetData = {
  accounts: Account[];
  configs: unknown[];
  incomeConfigs: unknown[];
  categories: unknown[];
  people: unknown[];
  paidItems: Record<string, unknown>;
  settings: unknown;
  transfers: unknown[];
  variableTransactions: unknown[];
  savedLabels: unknown[];
  tags: unknown[];
  authorizedUsers: unknown[];
};

export const useBudgetBalances = (budgetDataRef: React.MutableRefObject<BudgetData>, setBudgetData: React.Dispatch<React.SetStateAction<BudgetData>>) => {
  /**
   * Ajuste le solde d'un compte bancaire d'un montant delta.
   *
   * @description
   * Fonction atomique d'ajustement de solde. Ignore les micro-ajustements (<0.01€) pour éviter
   * les erreurs d'arrondi. Applique une mise à jour optimiste de l'UI avant la persistence.
   *
   * **Comportement :**
   * - Montant positif = crédit (augmente le solde)
   * - Montant négatif = débit (diminue le solde)
   * - Seuil d'ignorance : |montant| < 0.01€
   * - Pas de rollback si la persistence échoue (optimistic final)
   *
   * @param {string} accountId - ID unique du compte à ajuster
   * @param {number} amountDelta - Delta à appliquer (+ pour crédit, - pour débit)
   *
   * @example
   * ```tsx
   * // Débiter 50€ d'un compte
   * await adjustAccountBalance('acc_1', -50);
   *
   * // Créditer 100.50€
   * await adjustAccountBalance('acc_2', 100.50);
   *
   * // Ignoré (< 0.01€)
   * await adjustAccountBalance('acc_3', 0.005);
   * ```
   */
  const adjustAccountBalance = async (accountId: string, amountDelta: number) => {
    // Seuil d'ignorance pour éviter les erreurs d'arrondi
    if (Math.abs(amountDelta) < 0.01) return;

    const account = budgetDataRef.current.accounts.find((a: Account) => a.id === accountId);
    if (!account) return;

    const newBalance = account.currentBalance + amountDelta;

    // Optimistic Update : UI mise à jour immédiatement
    setBudgetData((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a: Account) => (a.id === accountId ? { ...a, currentBalance: newBalance } : a)),
    }));

    // Persistence asynchrone (pas de rollback)
    await apiUpsertAccount({ ...account, currentBalance: newBalance });
  };

  /**
   * Gère les ajustements de soldes pour une transaction variable (upsert ou delete).
   *
   * @description
   * Annule l'impact de l'ancienne transaction (si existante et pointée) puis applique
   * l'impact de la nouvelle transaction (si pointée). Gère automatiquement les cas :
   * - Création (oldTx = null)
   * - Modification (oldTx ≠ newTx)
   * - Suppression (newTx = null)
   * - Transactions en attente (isWaiting = true) : aucun impact solde
   *
   * **Règle métier :**
   * Seules les transactions pointées (isWaiting = false) impactent les soldes.
   *
   * @param {VariableTransaction | undefined} oldTransaction - Ancienne transaction (ou undefined si création)
   * @param {VariableTransaction | null} newTransaction - Nouvelle transaction (ou null si suppression)
   *
   * @example
   * ```tsx
   * // Création d'une nouvelle transaction pointée
   * await handleVariableTransactionBalance(undefined, {
   *   id: 'tx_1',
   *   amount: 50,
   *   type: 'EXPENSE',
   *   isWaiting: false,
   *   accountId: 'acc_1'
   * }); // Débitera 50€
   *
   * // Suppression d'une transaction pointée
   * await handleVariableTransactionBalance(oldTx, null); // Annulera l'impact
   * ```
   */
  const handleVariableTransactionBalance = async (oldTransaction: VariableTransaction | undefined, newTransaction: VariableTransaction | null) => {
    // Annuler l'impact de l'ancienne transaction si elle était pointée
    if (oldTransaction && !oldTransaction.isWaiting) {
      const sign = oldTransaction.type === "INCOME" ? -1 : 1;
      await adjustAccountBalance(oldTransaction.accountId, oldTransaction.amount * sign);
    }

    // Appliquer l'impact de la nouvelle transaction si elle est pointée
    if (newTransaction && !newTransaction.isWaiting) {
      const sign = newTransaction.type === "INCOME" ? 1 : -1;
      await adjustAccountBalance(newTransaction.accountId, newTransaction.amount * sign);
    }
  };

  /**
   * Gère les ajustements de soldes pour un virement (upsert ou delete).
   *
   * @description
   * Applique les débits/crédits sur les comptes source et destination lors d'un virement.
   * Annule l'ancien virement (si modification) puis applique le nouveau.
   *
   * **Workflow modification :**
   * 1. Annuler l'ancien virement (source +montant, destination -montant)
   * 2. Appliquer le nouveau virement (source -montant, destination +montant)
   *
   * **Workflow suppression :**
   * - Passer newTransfer = null pour annuler uniquement
   *
   * @param {Transfer | undefined} oldTransfer - Ancien virement (ou undefined si création)
   * @param {Transfer | null} newTransfer - Nouveau virement (ou null si suppression)
   *
   * @example
   * ```tsx
   * // Création d'un virement
   * await handleTransferBalances(undefined, {
   *   id: 'transfer_1',
   *   amount: 200,
   *   sourceAccountId: 'acc_1',
   *   destinationAccountId: 'acc_2'
   * }); // acc_1 -200€, acc_2 +200€
   *
   * // Suppression d'un virement
   * await handleTransferBalances(oldTransfer, null); // Annule les mouvements
   * ```
   */
  const handleTransferBalances = async (oldTransfer: Transfer | undefined, newTransfer: Transfer | null) => {
    // Annuler l'ancien virement si modification/suppression
    if (oldTransfer) {
      await adjustAccountBalance(oldTransfer.sourceAccountId, oldTransfer.amount); // Rembourser source
      await adjustAccountBalance(oldTransfer.destinationAccountId, -oldTransfer.amount); // Débiter destination
    }

    // Appliquer le nouveau virement si création/modification
    if (newTransfer) {
      await adjustAccountBalance(newTransfer.sourceAccountId, -newTransfer.amount); // Débiter source
      await adjustAccountBalance(newTransfer.destinationAccountId, newTransfer.amount); // Créditer destination
    }
  };

  /**
   * Gère les ajustements de soldes pour un pointage d'opération récurrente.
   *
   * @description
   * Applique la logique métier de pointage/dépointage des opérations récurrentes.
   * Gère les cas de modification (changement de compte, montant, type).
   *
   * **Workflow :**
   * 1. Annuler l'impact de l'ancien pointage (si existant et pointé)
   * 2. Appliquer l'impact du nouveau pointage (si pointé)
   *
   * **Règle métier :**
   * Seuls les items pointés (isWaiting = false) impactent les soldes.
   *
   * @param {PaidItemDetails | undefined} oldItem - Ancien pointage (ou undefined si premier pointage)
   * @param {PaidItemDetails | null} newItem - Nouveau pointage (ou null si dépointage)
   *
   * @example
   * ```tsx
   * // Premier pointage d'une dépense
   * await handlePaidItemBalance(undefined, {
   *   instanceId: 'exp_123-2025-01',
   *   amount: 50,
   *   type: 'EXPENSE',
   *   isWaiting: false,
   *   accountId: 'acc_1'
   * }); // Débitera 50€
   *
   * // Dépointage
   * await handlePaidItemBalance(oldItem, null); // Annulera l'impact
   * ```
   */
  const handlePaidItemBalance = async (oldItem: PaidItemDetails | undefined, newItem: PaidItemDetails | null) => {
    // Annuler l'impact de l'ancien pointage si pointé
    if (oldItem && !oldItem.isWaiting) {
      const sign = oldItem.type === "INCOME" ? -1 : 1;
      await adjustAccountBalance(oldItem.accountId, oldItem.amount * sign);
    }

    // Appliquer l'impact du nouveau pointage si pointé
    if (newItem && !newItem.isWaiting) {
      const sign = newItem.type === "INCOME" ? 1 : -1;
      await adjustAccountBalance(newItem.accountId, newItem.amount * sign);
    }
  };

  return {
    adjustAccountBalance,
    handleVariableTransactionBalance,
    handleTransferBalances,
    handlePaidItemBalance,
  };
};
