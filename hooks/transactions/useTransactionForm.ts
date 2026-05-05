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
import { useState, useEffect, useMemo, useCallback } from "react";
import { VariableTransaction, Account, AccountType, Person, SavedLabel, TagAmount, CategoryDef, BeneficiaryAmount } from "../../types";
import { useCategoryAutoSuggest } from "../useCategoryAutoSuggest";
import { getDefaultAccountId } from "../accounts/getDefaultAccountId";

/**
 * Type du mode formulaire.
 * - STANDARD : Transaction variable classique (dépense/revenu)
 */
export type FormMode = "STANDARD";

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
  /** Liste des catégories (pour résolution ID → nom) */
  categories?: CategoryDef[];
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

  category: string;
  setCategory: (category: string) => void;
  subCategory: string;
  setSubCategory: (subCategory: string) => void;
  beneficiaryId: string;
  setBeneficiaryId: (beneficiaryId: string) => void;
  selectedBeneficiaryAmounts: BeneficiaryAmount[];
  setSelectedBeneficiaryAmounts: (beneficiaryAmounts: BeneficiaryAmount[]) => void;

  isExtra: boolean;
  setIsExtra: (isExtra: boolean) => void;
  isSalary: boolean;
  setIsSalary: (isSalary: boolean) => void;
  comments: string;
  setComments: (comments: string) => void;
  selectedTagAmounts: TagAmount[];
  setSelectedTagAmounts: (tagAmounts: TagAmount[]) => void;

  // --- VALIDATION ---
  validationErrors: string[];

  // --- COMPUTED VALUES ---
  isExpense: boolean;
  themeColor: "indigo" | "emerald";
  checkingAccounts: Account[];
  standardSuggestions: string[];

  // --- ACTIONS ---
  handleSubmit: (targetIsWaiting: boolean, onSuccess: () => void) => VariableTransaction | null;
  resetForm: () => void;
  handleLabelChange: (newLabel: string) => Promise<void>;
  isSuggesting: boolean;
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
  categories = [],
}: UseTransactionFormProps): UseTransactionFormReturn => {
  // --- HOOKS SPÉCIALISÉS ---
  const { suggestFromLabel, isLoading: isSuggesting } = useCategoryAutoSuggest();

  // --- ÉTAT FORMULAIRE ---

  const [mode, setMode] = useState<FormMode>(initialMode);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [isRefund, setIsRefund] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [isSalary, setIsSalary] = useState<boolean>(false);
  const [comments, setComments] = useState<string>("");
  const [selectedTagAmounts, setSelectedTagAmounts] = useState<TagAmount[]>([]);

  // Filtrer les comptes COURANTS pour l'initialisation par défaut
  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === AccountType.CHECKING), [accounts]);

  // Déterminer le compte par défaut : priorité au compte joint, sinon premier compte COURANT
  // (filterChecking=true car pour les transactions variables, on privilégie les comptes COURANTS)
  const defaultAccountId = useMemo(() => getDefaultAccountId(accounts, true), [accounts]);

  const [accountId, setAccountId] = useState(defaultAccountId);

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");

  // Déterminer le bénéficiaire par défaut : priorité au displayOrder
  const defaultBeneficiary = useMemo(() => {
    // 1) Chercher la personne avec le plus petit displayOrder (première dans l'ordre)
    const sortedByOrder = [...people].sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
    if (sortedByOrder.length > 0) return sortedByOrder[0].id;
    // 2) Sinon, première personne non-enfant
    const nonChild = people.find((p) => !p.isChild);
    if (nonChild) return nonChild.id;
    // 3) Sinon, première personne
    if (people.length > 0) return people[0].id;
    // 4) Sinon, vide
    return "";
  }, [people]);

  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);
  const [selectedBeneficiaryAmounts, setSelectedBeneficiaryAmounts] = useState<BeneficiaryAmount[]>([]);

  const isExpenseCategory = useCallback(
    (categoryName: string) => {
      if (!categoryName) return false;
      if (categoryName === "Dépenses" || categoryName === "Remboursement") return true;
      const catDef = categories.find((c) => c.name === categoryName);
      return !!catDef && catDef.type === "EXPENSE";
    },
    [categories]
  );

  // --- COMPUTED VALUES ---

  const isExpense = type === "EXPENSE";

  /**
   * Couleur du thème selon le type.
   * - EXPENSE + Refund : Emerald (remboursement)
   * - EXPENSE : Indigo (dépense)
   * - INCOME : Emerald (revenu)
   */
  const themeColor: "indigo" | "emerald" = isExpense ? (isRefund ? "emerald" : "indigo") : "emerald";

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

  // --- INITIALISATION / RESET ---

  /**
   * Réinitialise le formulaire aux valeurs par défaut.
   * Utilisé lors de la fermeture ou lors du switch vers création.
   */
  const resetForm = useCallback(() => {
    setMode(initialMode);
    setDate(defaultDate);
    setLabel("");
    setAmount("");
    setCategory("");
    setSubCategory("");
    setBeneficiaryId(defaultBeneficiary);
    setSelectedBeneficiaryAmounts([]);
    setType("EXPENSE");
    setIsRefund(false);
    setIsExtra(false);
    setIsSalary(false);
    setComments("");
    setSelectedTagAmounts([]);
    setAccountId(defaultAccountId);
    setValidationErrors([]);
  }, [initialMode, defaultDate, defaultBeneficiary, defaultAccountId]);

  /**
   * Initialise le formulaire depuis editingTransaction ou reset.
   * Déclenché à l'ouverture de la modale ou changement d'editingTransaction.
   */
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (editingTransaction) {
          setMode(initialMode);

          // Gestion robuste du remboursement (legacy: EXPENSE négatif, nouveau format: INCOME + catégorie de dépense)
          const rawAmount = Number(editingTransaction.amount);
          const isLegacyRefund = editingTransaction.type === "EXPENSE" && rawAmount < 0;
          const isIncomeRefund = editingTransaction.type === "INCOME" && isExpenseCategory(editingTransaction.category);
          const isPersistedRefund = editingTransaction.isRefund === true;

          if (isPersistedRefund || isLegacyRefund || isIncomeRefund) {
            setType("EXPENSE");
            setIsRefund(true);
            setAmount(Math.abs(rawAmount).toString());
          } else {
            setType(editingTransaction.type || "EXPENSE");
            setIsRefund(false);
            setAmount(Math.abs(rawAmount).toString());
          }

          setDate(editingTransaction.date);
          setLabel(editingTransaction.label);

          setAccountId(editingTransaction.accountId);
          setComments(editingTransaction.comments || "");
          setSelectedTagAmounts(editingTransaction.tagAmounts || []);

          setCategory(editingTransaction.category);
          setSubCategory(editingTransaction.subCategory || "");
          setBeneficiaryId(editingTransaction.beneficiaryId || defaultBeneficiary);
          setSelectedBeneficiaryAmounts(
            editingTransaction.beneficiaryAmounts && editingTransaction.beneficiaryAmounts.length > 0
              ? editingTransaction.beneficiaryAmounts
              : editingTransaction.beneficiaryId && Math.abs(rawAmount) > 0
                ? [{ beneficiaryId: editingTransaction.beneficiaryId, amount: Math.abs(rawAmount) }]
                : []
          );
          setIsExtra(!!editingTransaction.isExtra);
          setIsSalary(!!editingTransaction.isSalary);
        } else {
          resetForm();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editingTransaction, initialMode, defaultBeneficiary, resetForm, isExpenseCategory]);

  // --- VALIDATION & SOUMISSION ---

  /**
   * Valide et soumet le formulaire.
   *
   * @description
   * 1. Valide tous les champs obligatoires
   * 2. Construit l'objet Transaction
   * 3. Appelle onSuccess si validation OK
   *
   * **Règles de validation :**
   * - Libellé non vide
   * - Montant > 0
   * - Compte source renseigné
   * - (TAGS) Somme tags ≤ montant total
   *
   * **Gestion du montant final :**
   * - EXPENSE + isRefund : -Math.abs(amount)
   * - Sinon : Math.abs(amount)
   *
   * @param {boolean} targetIsWaiting - Statut "en attente" ou "pointé"
   * @param {() => void} onSuccess - Callback appelé après validation réussie
   * @returns {VariableTransaction | null} Transaction construite ou null si erreur
   *
   */
  const handleSubmit = (targetIsWaiting: boolean, onSuccess: () => void): VariableTransaction | null => {
    const errors: string[] = [];

    // Validation des champs obligatoires
    if (!label.trim()) errors.push("Le libellé est obligatoire");
    if (!amount || parseFloat(amount) === 0) errors.push("Le montant est obligatoire et doit être différent de 0");
    if (!accountId) errors.push("Le compte est obligatoire");

    const totalAmount = Math.abs(parseFloat(amount) || 0);
    const normalizedBeneficiaryAmounts =
      selectedBeneficiaryAmounts.length > 0 ? selectedBeneficiaryAmounts : beneficiaryId ? [{ beneficiaryId, amount: totalAmount }] : [];

    if (normalizedBeneficiaryAmounts.length === 0) {
      errors.push("Au moins un bénéficiaire est obligatoire");
    }

    const hasInvalidBeneficiaryAmount = normalizedBeneficiaryAmounts.some(
      (beneficiaryAmount) => !beneficiaryAmount.beneficiaryId || !Number.isFinite(beneficiaryAmount.amount) || beneficiaryAmount.amount <= 0
    );
    if (hasInvalidBeneficiaryAmount) {
      errors.push("Chaque bénéficiaire doit avoir un montant strictement supérieur à 0€");
    }

    const sumBeneficiaryAmounts = normalizedBeneficiaryAmounts.reduce((sum, beneficiaryAmount) => sum + beneficiaryAmount.amount, 0);
    if (sumBeneficiaryAmounts > totalAmount + 0.01) {
      errors.push(
        `La somme des montants affectés aux bénéficiaires (${sumBeneficiaryAmounts.toFixed(2)}€) dépasse le montant total (${totalAmount.toFixed(2)}€)`
      );
    }

    // Validation des tagAmounts (permet ventilation partielle)
    if (selectedTagAmounts.length > 0) {
      const sumTagAmounts = selectedTagAmounts.reduce((sum, ta) => sum + ta.amount, 0);

      const hasInvalidTagAmount = selectedTagAmounts.some((ta) => !ta.tagId || !Number.isFinite(ta.amount) || ta.amount <= 0);
      if (hasInvalidTagAmount) {
        errors.push("Chaque tag doit avoir un montant strictement supérieur à 0€");
      }

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

    // Construction de la transaction (RPC impose un montant strictement positif)
    const normalizedAmount = Math.abs(parseFloat(amount));
    const isRefundTransaction = type === "EXPENSE" && isRefund;
    const finalType: TransactionType = isRefundTransaction ? "INCOME" : type;
    const finalAmount = normalizedAmount;

    const transaction: VariableTransaction = {
      id: editingTransaction?.id || `var_${Date.now()}`,
      date,
      label,
      amount: finalAmount,
      category,
      subCategory,
      accountId,
      beneficiaryId: normalizedBeneficiaryAmounts[0]?.beneficiaryId || beneficiaryId,
      beneficiaryAmounts: normalizedBeneficiaryAmounts,
      type: finalType,
      isRefund: isRefundTransaction,
      isSalary: !isRefundTransaction && isSalary ? true : undefined,
      isWaiting: targetIsWaiting,
      isExtra, // Toggle global au niveau opération
      comments: comments.trim() || undefined,
      tagAmounts: selectedTagAmounts.length > 0 ? selectedTagAmounts : undefined,
    };

    onSuccess();
    return transaction;
  };

  /**
   * Gère le changement de libellé avec auto-suggestion de catégorie, compte et bénéficiaire.
   *
   * @description
   * 1. Met à jour le libellé
   * 2. Recherche dans savedLabels si correspondance exacte
   * 3. Pré-remplit catégorie/sous-catégorie/compte/bénéficiaire si trouvés
   *
   * **Comportement :**
   * - Recherche directe dans savedLabels (plus rapide que RPC)
   * - Résout les IDs en noms pour affichage
   * - Charge également account_id et beneficiary_id (v2.6.6)
   * - Fallback sur RPC si savedLabels vide
   * - Non bloquant : erreur n'empêche pas saisie manuelle
   *
   * @param {string} newLabel - Nouveau libellé saisi
   *
   * @example
   * ```tsx
   * <input
   *   value={form.label}
   *   onChange={(e) => form.handleLabelChange(e.target.value)}
   * />
   * {form.isSuggesting && <Loader />}
   * ```
   */
  const handleLabelChange = useCallback(
    async (newLabel: string) => {
      setLabel(newLabel);

      // Auto-suggestion si libellé assez long
      if (newLabel.length >= 3) {
        // PRIORITÉ 1 : Recherche directe dans savedLabels (plus complet)
        const matchingLabel = savedLabels.find((sl) => sl.name.toLowerCase() === newLabel.toLowerCase() && sl.isExpense === isExpense);

        if (matchingLabel) {
          // Résoudre category_id → nom de catégorie
          if (matchingLabel.categoryId) {
            const cat = categories.find((c) => c.id === matchingLabel.categoryId);
            if (cat) {
              setCategory(cat.name);

              // Résoudre sub_category_id → nom de sous-catégorie
              if (matchingLabel.subCategoryId) {
                const sub = cat.subCategories.find((sc) => sc.id === matchingLabel.subCategoryId);
                if (sub) {
                  setSubCategory(sub.name);
                } else {
                  setSubCategory("");
                }
              } else {
                setSubCategory("");
              }
            }
          }

          // Auto-suggestion compte (v2.6.6)
          if (matchingLabel.accountId) {
            setAccountId(matchingLabel.accountId);
          }

          // Auto-suggestion bénéficiaire (v2.6.6)
          if (matchingLabel.beneficiaryId) {
            setBeneficiaryId(matchingLabel.beneficiaryId);
          }
        } else if (categories.length > 0) {
          // FALLBACK : Utiliser RPC (seulement pour catégorie/sous-catégorie)
          const suggestion = await suggestFromLabel(newLabel);

          if (suggestion) {
            // Résoudre category_id → nom de catégorie
            const cat = categories.find((c) => c.id === suggestion.category_id);
            if (cat) {
              setCategory(cat.name);

              // Résoudre sub_category_id → nom de sous-catégorie
              if (suggestion.sub_category_id) {
                const sub = cat.subCategories.find((sc) => sc.id === suggestion.sub_category_id);
                if (sub) {
                  setSubCategory(sub.name);
                } else {
                  setSubCategory("");
                }
              } else {
                setSubCategory("");
              }
            }
            // Note : RPC ne retourne pas account_id/beneficiary_id
          }
        }
      }
    },
    [categories, suggestFromLabel, savedLabels, isExpense]
  );

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

    category,
    setCategory,
    subCategory,
    setSubCategory,
    beneficiaryId,
    setBeneficiaryId,
    selectedBeneficiaryAmounts,
    setSelectedBeneficiaryAmounts,

    isExtra,
    setIsExtra,
    isSalary,
    setIsSalary,
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
    standardSuggestions,

    // Actions
    handleSubmit,
    resetForm,
    handleLabelChange,
    isSuggesting,
  };
};
