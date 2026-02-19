/**
 * @file Hook de gestion du formulaire de virements internes
 * @description Centralise toute la logique métier des virements entre comptes.
 * Extrait depuis useTransactionForm pour respecter le principe SRP.
 *
 * @architecture
 * **Responsabilités :**
 * - Gestion de l'état du formulaire de virement (6 champs)
 * - Initialisation depuis Transfer en édition
 * - Validation des champs (4 règles)
 * - Construction de l'objet Transfer final
 * - Filtrage intelligent des comptes (règles pivot/épargne)
 *
 * **Règles métier :**
 * - **Compte pivot** : Seul compte autorisé pour virements vers/depuis épargne
 * - **Validation stricte** : Source ≠ Destination
 * - **Auto-détection intérêts** : Depuis label lors de l'édition
 * - **isInterest** : Marque les intérêts bancaires ou ajustements exceptionnels
 *
 * @dependencies
 * - types.ts : Interfaces Transfer, Account, SavedLabel
 * - useState, useEffect, useMemo : Hooks React pour l'état et la memoization
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Transfer, Account, AccountType, SavedLabel } from "../../types";
import { getDefaultAccountId } from "../accounts/getDefaultAccountId";

/**
 * Props du hook useTransferForm.
 */
interface UseTransferFormProps {
  /** Transfer en cours d'édition (null pour création) */
  editingTransfer?: Transfer | null;
  /** Liste des comptes disponibles */
  accounts: Account[];
  /** Libellés sauvegardés pour suggestions */
  savedLabels?: SavedLabel[];
  /** Date par défaut pour nouveau virement */
  defaultDate: string;
  /** Modale ouverte/fermée (pour reset) */
  isOpen: boolean;
}

/**
 * Résultat du hook useTransferForm.
 */
interface UseTransferFormReturn {
  // --- ÉTAT FORMULAIRE ---
  date: string;
  setDate: (date: string) => void;
  label: string;
  setLabel: (label: string) => void;
  amount: string;
  setAmount: (amount: string) => void;

  sourceAccountId: string;
  setSourceAccountId: (id: string) => void;
  destinationAccountId: string;
  setDestinationAccountId: (id: string) => void;

  isInterest: boolean;
  setIsInterest: (isInterest: boolean) => void;

  // --- VALIDATION ---
  validationErrors: string[];

  // --- COMPUTED VALUES ---
  filteredSourceAccounts: Account[];
  filteredDestAccounts: Account[];
  transferSuggestions: string[];

  // --- ACTIONS ---
  handleSubmit: (onSuccess: () => void) => Transfer | null;
  resetForm: () => void;
}

/**
 * Hook de gestion du formulaire de virements internes.
 *
 * @description
 * Centralise toute la logique d'état et de validation du formulaire de virement.
 * Applique le principe SRP (Single Responsibility) en se concentrant uniquement
 * sur les virements entre comptes.
 *
 * **Workflow :**
 * 1. Initialisation : Chargement depuis editingTransfer ou valeurs par défaut
 * 2. Édition : Mise à jour de l'état via les setters exposés
 * 3. Validation : Vérification des champs obligatoires et règles métier
 * 4. Soumission : Construction de l'objet Transfer final
 *
 * **Règles de validation :**
 * - Libellé obligatoire (non vide)
 * - Montant obligatoire et > 0
 * - Compte source obligatoire
 * - Compte destination obligatoire et différent de source
 *
 * **Gestion des comptes filtrés :**
 * - Comptes ÉPARGNE : Peuvent uniquement échanger avec le compte pivot (isJoint)
 * - Comptes COURANTS : Peuvent échanger avec tous les comptes
 *
 * @param {UseTransferFormProps} props - Props de configuration du hook
 * @returns {UseTransferFormReturn} État du formulaire et actions
 *
 * @example
 * ```tsx
 * const form = useTransferForm({
 *   editingTransfer,
 *   accounts,
 *   savedLabels,
 *   defaultDate: "2025-01-07",
 *   isOpen: true
 * });
 *
 * // Utilisation dans le render
 * <input value={form.label} onChange={(e) => form.setLabel(e.target.value)} />
 * <button onClick={() => form.handleSubmit(onClose)}>Valider</button>
 * ```
 */
export const useTransferForm = ({ editingTransfer, accounts, savedLabels = [], defaultDate, isOpen }: UseTransferFormProps): UseTransferFormReturn => {
  // --- ÉTAT FORMULAIRE ---

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [isInterest, setIsInterest] = useState<boolean>(false);

  // Déterminer le compte par défaut : priorité au compte joint, sinon premier compte
  // (filterChecking=false car pour les virements, tous les types de comptes sont acceptés)
  const defaultAccountId = useMemo(() => getDefaultAccountId(accounts, false), [accounts]);

  const [sourceAccountId, setSourceAccountId] = useState(defaultAccountId);
  const [destinationAccountId, setDestinationAccountId] = useState(defaultAccountId);

  // --- COMPUTED VALUES ---

  /**
   * Suggestions de libellés pour virements.
   * Filtre les libellés sauvegardés de type TRANSFER.
   */
  const transferSuggestions = useMemo(() => {
    return savedLabels.filter((l) => l.type === AccountType.TRANSFER).map((l) => l.name);
  }, [savedLabels]);

  /**
   * Filtrage des comptes sources pour virements.
   *
   * **Règle métier :**
   * Si la destination est un compte ÉPARGNE, la source DOIT être le compte pivot (isJoint).
   * Sinon, tous les comptes sont autorisés.
   */
  const filteredSourceAccounts = useMemo(() => {
    const destAccount = accounts.find((a) => a.id === destinationAccountId);
    if (destAccount && destAccount.type === AccountType.SAVINGS) {
      return accounts.filter((a) => a.isJoint);
    }
    return accounts;
  }, [accounts, destinationAccountId]);

  /**
   * Filtrage des comptes destinations pour virements.
   *
   * **Règle métier :**
   * - Si `isInterest` est actif : Seuls les comptes ÉPARGNE sont autorisés (intérêts bancaires)
   * - Sinon, si la source est un compte ÉPARGNE : La destination DOIT être le compte pivot (isJoint)
   * - Sinon : Tous les comptes sont autorisés
   */
  const filteredDestAccounts = useMemo(() => {
    // Règle 1 : Mode Intérêts/Ajustement → Uniquement comptes ÉPARGNE
    if (isInterest) {
      return accounts.filter((a) => a.type === AccountType.SAVINGS);
    }

    // Règle 2 : Source ÉPARGNE → Destination doit être pivot
    const srcAccount = accounts.find((a) => a.id === sourceAccountId);
    if (srcAccount && srcAccount.type === AccountType.SAVINGS) {
      return accounts.filter((a) => a.isJoint);
    }

    // Règle 3 : Cas général → Tous les comptes
    return accounts;
  }, [accounts, sourceAccountId, isInterest]);

  // --- INITIALISATION / RESET ---

  /**
   * Réinitialise le formulaire aux valeurs par défaut.
   * Utilisé lors de la fermeture ou lors du switch vers création.
   */
  const resetForm = useCallback(() => {
    setDate(defaultDate);
    setLabel("");
    setAmount("");
    setIsInterest(false);
    setSourceAccountId(defaultAccountId);
    setDestinationAccountId(defaultAccountId);
    setValidationErrors([]);
  }, [defaultDate, defaultAccountId]);

  /**
   * Initialise le formulaire depuis editingTransfer ou reset.
   * Déclenché à l'ouverture de la modale ou changement d'editingTransfer.
   */
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (editingTransfer) {
          setDate(editingTransfer.date);
          setLabel(editingTransfer.label);
          setAmount(editingTransfer.amount.toString());
          setSourceAccountId(editingTransfer.sourceAccountId);
          setDestinationAccountId(editingTransfer.destinationAccountId);
          setIsInterest(!!editingTransfer.isInterest);

          // Détection automatique des intérêts depuis le label
          const labelLower = editingTransfer.label.toLowerCase();
          if (labelLower.includes("intérêt") || labelLower.includes("ajustement") || labelLower.startsWith("intérêts")) {
            setIsInterest(true);
          }
        } else {
          resetForm();
        }
        setValidationErrors([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editingTransfer, resetForm]);

  /**
   * Ajustement automatique de la destination si on sélectionne un compte ÉPARGNE comme source.
   * Force la destination vers le compte joint (pivot) pour respecter la règle métier.
   */
  useEffect(() => {
    const srcAccount = accounts.find((a) => a.id === sourceAccountId);
    const destAccount = accounts.find((a) => a.id === destinationAccountId);
    const jointAccount = accounts.find((a) => a.isJoint);

    // Si source = ÉPARGNE et destination actuelle n'est pas le compte joint
    if (srcAccount && srcAccount.type === AccountType.SAVINGS && destAccount && !destAccount.isJoint && jointAccount) {
      // Forcer la destination vers le compte joint
      const timer = setTimeout(() => setDestinationAccountId(jointAccount.id), 0);
      return () => clearTimeout(timer);
    }
  }, [sourceAccountId, destinationAccountId, accounts]);

  // --- VALIDATION & SOUMISSION ---

  /**
   * Valide et soumet le formulaire.
   *
   * @description
   * 1. Valide tous les champs obligatoires
   * 2. Valide les règles métier (pivot obligatoire pour épargne)
   * 3. Construit l'objet Transfer
   * 4. Appelle onSuccess si validation OK
   *
   * **Règles de validation :**
   * - Libellé non vide
   * - Montant > 0
   * - Compte source renseigné
   * - Compte destination renseigné et différent de source
   * - **RÈGLE PIVOT** : Si source = ÉPARGNE → destination DOIT être compte joint (pivot)
   * - **RÈGLE PIVOT** : Si destination = ÉPARGNE → source DOIT être compte joint (pivot)
   *
   * @param {() => void} onSuccess - Callback appelé après validation réussie
   * @returns {Transfer | null} Transfer construit ou null si erreur
   *
   * @example
   * ```tsx
   * const transfer = form.handleSubmit(() => {
   *   console.log("Virement validé !");
   *   onClose();
   * });
   * if (transfer) {
   *   onUpsertTransfer(transfer);
   * }
   * ```
   */
  const handleSubmit = (onSuccess: () => void): Transfer | null => {
    const errors: string[] = [];

    // Validation des champs obligatoires
    if (!label.trim()) errors.push("Le motif est obligatoire");
    if (!amount || parseFloat(amount) <= 0) errors.push("Le montant est obligatoire et doit être supérieur à 0");
    if (!sourceAccountId) errors.push("Le compte source est obligatoire");
    if (!destinationAccountId) errors.push("Le compte de destination est obligatoire");
    if (sourceAccountId === destinationAccountId) errors.push("Le compte source et destination ne peuvent pas être identiques");

    // VALIDATION RÈGLE PIVOT : Virements depuis/vers ÉPARGNE
    const srcAccount = accounts.find((a) => a.id === sourceAccountId);
    const destAccount = accounts.find((a) => a.id === destinationAccountId);
    const jointAccount = accounts.find((a) => a.isJoint);

    if (srcAccount && srcAccount.type === AccountType.SAVINGS) {
      // Si source = ÉPARGNE → destination DOIT être le compte joint
      if (!destAccount?.isJoint) {
        errors.push(
          `Les virements depuis un compte d'épargne (${srcAccount.name}) doivent OBLIGATOIREMENT aller vers le compte joint${
            jointAccount ? ` (${jointAccount.name})` : ""
          }.`
        );
      }
    }

    if (destAccount && destAccount.type === AccountType.SAVINGS) {
      // Si destination = ÉPARGNE → source DOIT être le compte joint
      if (!srcAccount?.isJoint) {
        errors.push(
          `Les virements vers un compte d'épargne (${destAccount.name}) doivent OBLIGATOIREMENT provenir du compte joint${
            jointAccount ? ` (${jointAccount.name})` : ""
          }.`
        );
      }
    }

    // Si erreurs, arrêt de la soumission
    if (errors.length > 0) {
      setValidationErrors(errors);
      return null;
    }

    setValidationErrors([]);

    // Construction de l'objet Transfer
    const transfer: Transfer = {
      id: editingTransfer?.id || `tr_${Date.now()}`,
      date,
      label,
      amount: parseFloat(amount),
      sourceAccountId,
      destinationAccountId,
      isInterest, // Marquage intérêts/ajustement
    };

    onSuccess();
    return transfer;
  };

  // --- RETOUR PUBLIC ---

  return {
    // État formulaire
    date,
    setDate,
    label,
    setLabel,
    amount,
    setAmount,

    sourceAccountId,
    setSourceAccountId,
    destinationAccountId,
    setDestinationAccountId,

    isInterest,
    setIsInterest,

    // Validation
    validationErrors,

    // Computed values
    filteredSourceAccounts,
    filteredDestAccounts,
    transferSuggestions,

    // Actions
    handleSubmit,
    resetForm,
  };
};
