/**
 * @file Hook de gestion du formulaire de transactions variables
 * @description Centralise toute la logique métier du formulaire (état, validation, soumission)
 * pour simplifier le composant VariableTransactionForm.tsx et améliorer la testabilité.
 *
 * @architecture
 * **Responsabilités :**
 * - Gestion de l'état du formulaire (14 champs)
 * - Initialisation depuis editingTransaction
 * - Validation des champs (6 règles)
 * - Construction de l'objet Transaction final
 * - Filtrage intelligent des comptes (règles pivot/épargne)
 *
 * **Règles métier :**
 * - **Remboursement** : Dépense avec montant négatif (isRefund toggle)
 * - **Compte pivot** : Seul compte autorisé pour virements vers/depuis épargne
 * - **Validation partielle tags** : La somme peut être < montant total (reste non taggé)
 * - **Toggle Extra** : Compatible avec tags individuels Extra
 *
 * @dependencies
 * - types.ts : Interfaces VariableTransaction, Transfer, Account, etc.
 * - useState, useEffect, useMemo : Hooks React pour l'état et la memoization
 */
import { useState, useEffect, useMemo } from "react";
import { VariableTransaction, Transfer, Account, AccountType, Person, SavedLabel, TagAmount } from "../../types";

/**
 * Type du mode formulaire.
 * - STANDARD : Transaction variable classique (dépense/revenu)
 * - TRANSFER : Virement interne entre comptes
 */
export type FormMode = "STANDARD" | "TRANSFER";

/**
 * Type de transaction.
 * - EXPENSE : Dépense (montant positif, sauf remboursement)
 * - INCOME : Revenu (montant positif)
 */
export type TransactionType = "EXPENSE" | "INCOME";

/**
 * Props du hook useTransactionForm.
 */
interface UseTransactionFormProps {
  /** Transaction en cours d'édition (null pour création) */
  editingTransaction?: VariableTransaction | null;
  /** Liste des comptes disponibles */
  accounts: Account[];
  /** Liste des membres de la famille */
  people: Person[];
  /** Libellés sauvegardés pour suggestions */
  savedLabels?: SavedLabel[];
  /** Date par défaut pour nouvelle transaction */
  defaultDate: string;
  /** Mode initial du formulaire */
  initialMode?: FormMode;
  /** Suggestions de libellés (fallback si savedLabels vide) */
  labelsSuggestions?: string[];
  /** Modale ouverte/fermée (pour reset) */
  isOpen: boolean;
}

/**
 * Résultat du hook useTransactionForm.
 */
interface UseTransactionFormReturn {
  // --- ÉTAT FORMULAIRE ---
  mode: FormMode;
  setMode: (mode: FormMode) => void;
  type: TransactionType;
  setType: (type: TransactionType) => void;
  isRefund: boolean;
  setIsRefund: (isRefund: boolean) => void;

  date: string;
  setDate: (date: string) => void;
  label: string;
  setLabel: (label: string) => void;
  amount: string;
  setAmount: (amount: string) => void;

  accountId: string;
  setAccountId: (accountId: string) => void;
  destAccountId: string;
  setDestAccountId: (destAccountId: string) => void;

  category: string;
  setCategory: (category: string) => void;
  subCategory: string;
  setSubCategory: (subCategory: string) => void;
  beneficiaryId: string;
  setBeneficiaryId: (beneficiaryId: string) => void;

  isExtra: boolean;
  setIsExtra: (isExtra: boolean) => void;
  comments: string;
  setComments: (comments: string) => void;
  selectedTagAmounts: TagAmount[];
  setSelectedTagAmounts: (tagAmounts: TagAmount[]) => void;

  // --- VALIDATION ---
  validationErrors: string[];

  // --- COMPUTED VALUES ---
  isExpense: boolean;
  themeColor: string;
  checkingAccounts: Account[];
  filteredSourceAccounts: Account[];
  filteredDestAccounts: Account[];
  standardSuggestions: string[];
  transferSuggestions: string[];

  // --- ACTIONS ---
  handleSubmit: (targetIsWaiting: boolean, onSuccess: () => void) => VariableTransaction | Transfer | null;
  resetForm: () => void;
}

/**
 * Hook de gestion du formulaire de transactions variables.
 *
 * @description
 * Centralise toute la logique d'état et de validation du formulaire.
 * Applique le principe SRP (Single Responsibility) en séparant la logique
 * métier de l'affichage UI.
 *
 * **Workflow :**
 * 1. Initialisation : Chargement depuis editingTransaction ou valeurs par défaut
 * 2. Édition : Mise à jour de l'état via les setters exposés
 * 3. Validation : Vérification des champs obligatoires et règles métier
 * 4. Soumission : Construction de l'objet Transaction final
 *
 * **Règles de validation :**
 * - Libellé obligatoire (non vide)
 * - Montant obligatoire et différent de 0
 * - Compte source obligatoire
 * - (MODE TRANSFER) Compte destination obligatoire et différent de source
 * - (TAGS) Somme des montants tags ≤ montant total
 *
 * **Gestion des comptes filtrés :**
 * - Comptes ÉPARGNE : Peuvent uniquement échanger avec le compte pivot (isJoint)
 * - Comptes COURANTS : Peuvent échanger avec tous les comptes
 *
 * @param {UseTransactionFormProps} props - Props de configuration du hook
 * @returns {UseTransactionFormReturn} État du formulaire et actions
 *
 * @example
 * ```tsx
 * const form = useTransactionForm({
 *   editingTransaction,
 *   accounts,
 *   people,
 *   savedLabels,
 *   defaultDate: "2025-01-07",
 *   initialMode: "STANDARD",
 *   isOpen: true
 * });
 *
 * // Utilisation dans le render
 * <input value={form.label} onChange={(e) => form.setLabel(e.target.value)} />
 * <button onClick={() => form.handleSubmit(false, onClose)}>Valider</button>
 * ```
 */
export const useTransactionForm = ({
  editingTransaction,
  accounts,
  people,
  savedLabels = [],
  defaultDate,
  initialMode = "STANDARD",
  labelsSuggestions = [],
  isOpen,
}: UseTransactionFormProps): UseTransactionFormReturn => {
  // --- ÉTAT FORMULAIRE ---

  const [mode, setMode] = useState<FormMode>(initialMode);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [isRefund, setIsRefund] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [comments, setComments] = useState<string>("");
  const [selectedTagAmounts, setSelectedTagAmounts] = useState<TagAmount[]>([]);

  // Filtrer les comptes COURANTS pour l'initialisation par défaut
  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === AccountType.CHECKING), [accounts]);

  const [accountId, setAccountId] = useState(checkingAccounts[0]?.id || accounts[0]?.id || "");
  const [destAccountId, setDestAccountId] = useState(accounts[1]?.id || accounts[0]?.id || "");

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  const defaultBeneficiary = people.find((p) => p.name === "Famille")?.id || people.find((p) => !p.isChild)?.id || people[0]?.id || "";
  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);

  // --- COMPUTED VALUES ---

  const isExpense = type === "EXPENSE";

  /**
   * Couleur du thème selon le mode/type.
   * - TRANSFER : Indigo (virement)
   * - EXPENSE + Refund : Emerald (remboursement)
   * - EXPENSE : Indigo (dépense)
   * - INCOME : Emerald (revenu)
   */
  const themeColor = mode === "TRANSFER" ? "indigo" : isExpense ? (isRefund ? "emerald" : "indigo") : "emerald";

  /**
   * Suggestions de libellés pour mode STANDARD.
   * Priorité : savedLabels > labelsSuggestions (fallback).
   * Filtre selon type (isExpense) si savedLabels disponibles.
   */
  const standardSuggestions = useMemo(() => {
    if (savedLabels.length > 0) {
      return savedLabels.filter((l) => l.type === AccountType.CHECKING && l.isExpense === isExpense).map((l) => l.name);
    } else {
      return labelsSuggestions;
    }
  }, [savedLabels, labelsSuggestions, isExpense]);

  /**
   * Suggestions de libellés pour mode TRANSFER.
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
    const destAccount = accounts.find((a) => a.id === destAccountId);
    if (destAccount && destAccount.type === AccountType.SAVINGS) {
      return accounts.filter((a) => a.isJoint);
    }
    return accounts;
  }, [accounts, destAccountId]);

  /**
   * Filtrage des comptes destinations pour virements.
   *
   * **Règle métier :**
   * Si la source est un compte ÉPARGNE, la destination DOIT être le compte pivot (isJoint).
   * Sinon, tous les comptes sont autorisés.
   */
  const filteredDestAccounts = useMemo(() => {
    const srcAccount = accounts.find((a) => a.id === accountId);
    if (srcAccount && srcAccount.type === AccountType.SAVINGS) {
      return accounts.filter((a) => a.isJoint);
    }
    return accounts;
  }, [accounts, accountId]);

  // --- INITIALISATION / RESET ---

  /**
   * Réinitialise le formulaire aux valeurs par défaut.
   * Utilisé lors de la fermeture ou lors du switch vers création.
   */
  const resetForm = () => {
    setMode(initialMode);
    setDate(defaultDate);
    setLabel("");
    setAmount("");
    setCategory("");
    setSubCategory("");
    setBeneficiaryId(defaultBeneficiary);
    setType("EXPENSE");
    setIsRefund(false);
    setIsExtra(false);
    setComments("");
    setSelectedTagAmounts([]);
    if (checkingAccounts.length > 0) setAccountId(checkingAccounts[0].id);
    setValidationErrors([]);
  };

  /**
   * Initialise le formulaire depuis editingTransaction ou reset.
   * Déclenché à l'ouverture de la modale ou changement d'editingTransaction.
   */
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setMode(initialMode);
        setType(editingTransaction.type || "EXPENSE");

        // Gestion du remboursement (montant négatif pour EXPENSE)
        const rawAmount = editingTransaction.amount;
        if (editingTransaction.type === "EXPENSE" && rawAmount < 0) {
          setIsRefund(true);
          setAmount(Math.abs(rawAmount).toString());
        } else {
          setIsRefund(false);
          setAmount(rawAmount.toString());
        }

        setDate(editingTransaction.date);
        setLabel(editingTransaction.label);

        // Mode TRANSFER : Charger comptes source/dest depuis comments
        if (initialMode === "TRANSFER") {
          setAccountId(editingTransaction.accountId);
          if (editingTransaction.comments && accounts.some((a) => a.id === editingTransaction.comments)) {
            setDestAccountId(editingTransaction.comments);
          }
        } else {
          setAccountId(editingTransaction.accountId);
          setComments(editingTransaction.comments || "");
          setSelectedTagAmounts(editingTransaction.tagAmounts || []);
        }

        setCategory(editingTransaction.category);
        setSubCategory(editingTransaction.subCategory || "");
        setBeneficiaryId(editingTransaction.beneficiaryId || defaultBeneficiary);
        setIsExtra(!!editingTransaction.isExtra);
      } else {
        resetForm();
      }
      setValidationErrors([]);
    }
  }, [isOpen, editingTransaction, defaultDate, defaultBeneficiary, initialMode, accounts, checkingAccounts]);

  // --- VALIDATION & SOUMISSION ---

  /**
   * Valide et soumet le formulaire.
   *
   * @description
   * 1. Valide tous les champs obligatoires
   * 2. Construit l'objet Transaction ou Transfer
   * 3. Appelle onSuccess si validation OK
   *
   * **Règles de validation :**
   * - Libellé non vide
   * - Montant > 0
   * - Compte source renseigné
   * - (TRANSFER) Compte dest renseigné et différent de source
   * - (TAGS) Somme tags ≤ montant total
   *
   * **Gestion du montant final :**
   * - MODE STANDARD + EXPENSE + isRefund : -Math.abs(amount)
   * - MODE STANDARD : Math.abs(amount)
   * - MODE TRANSFER : Math.abs(amount)
   *
   * @param {boolean} targetIsWaiting - Statut "en attente" ou "pointé"
   * @param {() => void} onSuccess - Callback appelé après validation réussie
   * @returns {VariableTransaction | Transfer | null} Transaction construite ou null si erreur
   *
   * @example
   * ```tsx
   * const transaction = form.handleSubmit(false, () => {
   *   console.log("Transaction validée !");
   *   onClose();
   * });
   * if (transaction) {
   *   onAddTransaction(transaction as VariableTransaction);
   * }
   * ```
   */
  const handleSubmit = (targetIsWaiting: boolean, onSuccess: () => void): VariableTransaction | Transfer | null => {
    const errors: string[] = [];

    // Validation des champs obligatoires
    if (!label.trim()) errors.push("Le libellé est obligatoire");
    if (!amount || parseFloat(amount) === 0) errors.push("Le montant est obligatoire et doit être différent de 0");
    if (!accountId) errors.push("Le compte est obligatoire");

    // Validation spécifique MODE TRANSFER
    if (mode === "TRANSFER") {
      if (!destAccountId) errors.push("Le compte de destination est obligatoire");
      if (accountId === destAccountId) errors.push("Le compte source et destination ne peuvent pas être identiques");
    }

    // Validation des tagAmounts (permet ventilation partielle)
    if (selectedTagAmounts.length > 0) {
      const totalAmount = parseFloat(amount) || 0;
      const sumTagAmounts = selectedTagAmounts.reduce((sum, ta) => sum + ta.amount, 0);
      if (sumTagAmounts > totalAmount + 0.01) {
        errors.push(`La somme des montants affectés aux tags (${sumTagAmounts.toFixed(2)}€) dépasse le montant total (${totalAmount.toFixed(2)}€)`);
      }
    }

    // Si erreurs, arrêt de la soumission
    if (errors.length > 0) {
      setValidationErrors(errors);
      return null;
    }

    setValidationErrors([]);

    // Construction de l'objet final
    if (mode === "TRANSFER") {
      if (!destAccountId || accountId === destAccountId) return null;

      const transfer: Transfer = {
        id: editingTransaction?.id || `tr_${Date.now()}`,
        date,
        label,
        amount: parseFloat(amount),
        sourceAccountId: accountId,
        destinationAccountId: destAccountId,
      };

      onSuccess();
      return transfer;
    } else {
      // MODE STANDARD
      let finalAmount = parseFloat(amount);
      if (type === "EXPENSE" && isRefund) {
        // Remboursement : montant négatif
        finalAmount = -Math.abs(finalAmount);
      } else {
        finalAmount = Math.abs(finalAmount);
      }

      const transaction: VariableTransaction = {
        id: editingTransaction?.id || `var_${Date.now()}`,
        date,
        label,
        amount: finalAmount,
        category,
        subCategory,
        accountId,
        beneficiaryId,
        type,
        isWaiting: targetIsWaiting,
        isExtra, // Toggle global au niveau opération
        comments: comments.trim() || undefined,
        tagAmounts: selectedTagAmounts.length > 0 ? selectedTagAmounts : undefined,
        position: editingTransaction?.position,
      };

      onSuccess();
      return transaction;
    }
  };

  // --- RETOUR PUBLIC ---

  return {
    // État formulaire
    mode,
    setMode,
    type,
    setType,
    isRefund,
    setIsRefund,

    date,
    setDate,
    label,
    setLabel,
    amount,
    setAmount,

    accountId,
    setAccountId,
    destAccountId,
    setDestAccountId,

    category,
    setCategory,
    subCategory,
    setSubCategory,
    beneficiaryId,
    setBeneficiaryId,

    isExtra,
    setIsExtra,
    comments,
    setComments,
    selectedTagAmounts,
    setSelectedTagAmounts,

    // Validation
    validationErrors,

    // Computed values
    isExpense,
    themeColor,
    checkingAccounts,
    filteredSourceAccounts,
    filteredDestAccounts,
    standardSuggestions,
    transferSuggestions,

    // Actions
    handleSubmit,
    resetForm,
  };
};
