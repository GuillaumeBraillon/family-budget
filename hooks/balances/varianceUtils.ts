/**
 * @file Calculs de variance pour la vue Balances
 * @description Fonctions pures qui alimentent les tooltips Excédent/Déficit/Neutre.
 * Extraites de BalancesView pour permettre les tests unitaires.
 *
 * **Vocabulaire :**
 * - `availableTarget`   : Budget cible de la période (allowance + carryover)
 * - `paidConsumedAmount`: Montant réel déjà dépensé/encaissé (standard uniquement)
 * - `countedPendingAmount`: Opérations planifiées non encore pointées de la période
 * - `accountPendingAmount`: Opérations en attente côté compte (crédit ou débit)
 * - `availableTotal`    : Budget brut de la période (= "Disponible" affiché)
 * - `availableRemaining`: Restant après déduction des opérations en attente personnelles
 * - `immediateAmount`   : Écart immédiat = Solde - Restant (positif = excédent, négatif = déficit)
 * - `projectedAmount`   : Écart projeté si les opérations en attente du compte se réalisent
 */

export interface PersonalVarianceInput {
  /** Solde actuel du compte */
  balance: number;
  /** Budget cible de la période (allowance + carryover) */
  availableTarget: number;
  /** Montant réel consommé (dépenses standard pointées - revenus standard pointés) */
  paidConsumedAmount: number;
  /** Opérations personnelles planifiées non encore pointées */
  countedPendingAmount: number;
  /** Opérations en attente côté compte (ex: CB non débitée) */
  accountPendingAmount: number;
}

export interface PersonalVarianceResult {
  /** Budget brut = allowance + consommé - en attente perso (affiché "Disponible pour la période") */
  availableTotal: number;
  /** Restant = budget cible - en attente perso */
  availableRemaining: number;
  /** Écart immédiat = solde - restant (>0 excédent, <0 déficit) */
  immediateAmount: number;
  /** Budget cible de la période (ligne "Perso projeté") */
  personalProjectedAmount: number;
  /** Écart projeté si les opérations en attente du compte se réalisent */
  projectedAmount: number;
  /** Montant en attente crédité (uniquement si > 0) */
  pendingCreditAmount: number;
  /** True si des opérations en attente créditées existent (> 0.01€) */
  hasPendingCredit: boolean;
  /** True si le pending du compte ≈ le pending compté (delta < 0.01€) */
  hasSamePendingAmount: boolean;
}

/**
 * Calcule les données de variance pour un compte personnel.
 * Utilisé par BalancesView pour alimenter les tooltips Excédent/Déficit/Neutre.
 */
export const computePersonalVariance = ({
  balance,
  availableTarget,
  paidConsumedAmount,
  countedPendingAmount,
  accountPendingAmount,
}: PersonalVarianceInput): PersonalVarianceResult => {
  const pendingCreditAmount = Math.max(accountPendingAmount, 0);
  const hasPendingCredit = pendingCreditAmount > 0.01;
  const availableTotal = availableTarget + paidConsumedAmount - countedPendingAmount;
  const availableRemaining = availableTarget - countedPendingAmount;
  const immediateAmount = balance - availableRemaining;
  const personalProjectedAmount = availableTarget;
  const projectedAmount = balance + accountPendingAmount - personalProjectedAmount;
  const hasSamePendingAmount = Math.abs(accountPendingAmount - countedPendingAmount) < 0.01;

  return {
    availableTotal,
    availableRemaining,
    immediateAmount,
    personalProjectedAmount,
    projectedAmount,
    pendingCreditAmount,
    hasPendingCredit,
    hasSamePendingAmount,
  };
};
