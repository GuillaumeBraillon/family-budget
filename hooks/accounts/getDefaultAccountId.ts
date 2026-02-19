/**
 * @file Utilitaire pour sélectionner le compte par défaut
 * @description Logique centralisée pour déterminer le compte par défaut
 * utilisée dans les formulaires de transactions et virements.
 *
 * **Logique de priorité :**
 * 1. Compte avec isJoint = true (compte joint principal)
 * 2. Si filterChecking: premier compte COURANT, sinon: premier compte
 * 3. Sinon: string vide
 */
import { Account, AccountType } from "../../types";

/**
 * Détermine le compte par défaut selon une priorisation intelligente.
 *
 * @description
 * Logique centralisée utilisée dans les hooks useTransactionForm et useTransferForm
 * pour éviter la duplication de code.
 *
 * @param {Account[]} accounts - Liste des comptes disponibles
 * @param {boolean} filterChecking - Si true, privilégie les comptes COURANT (CHECKING)
 *                                   entre le compte joint et le premier compte.
 *                                   Si false, utilise simplement le premier compte.
 * @returns {string} ID du compte par défaut, ou string vide si aucun compte disponible
 *
 * @example
 * ```tsx
 * // Pour transactions variables (dépenses/revenus)
 * const defaultAccountId = getDefaultAccountId(accounts, true);
 * // Priorité : isJoint → premier compte COURANT → premier compte → ""
 *
 * // Pour virements
 * const defaultAccountId = getDefaultAccountId(accounts, false);
 * // Priorité : isJoint → premier compte → ""
 * ```
 */
export const getDefaultAccountId = (accounts: Account[], filterChecking: boolean = false): string => {
  // 1) Chercher le compte joint d'abord
  const jointAccount = accounts.find((a) => a.isJoint);
  if (jointAccount) return jointAccount.id;

  // 2) Si filterChecking, chercher le premier compte COURANT
  if (filterChecking) {
    const checkingAccount = accounts.find((a) => a.type === AccountType.CHECKING);
    if (checkingAccount) return checkingAccount.id;
  }

  // 3) Sinon, premier compte (peu importe le type)
  if (accounts.length > 0) return accounts[0].id;

  // 4) Sinon, vide
  return "";
};
