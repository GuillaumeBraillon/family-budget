import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare, ArrowRightLeft, ArrowDown, RefreshCcw } from "lucide-react";
import { VariableTransaction, Account, CategoryDef, AccountType, Person, Transfer, SavedLabel, Tag } from "../../../../types";
import { CategorySelector } from "../../../ui/molecules/CategorySelector";
import { TextInput, AmountInput, SearchableTextInput } from "../../../ui/molecules/FormInputs";
import { AccountSelector, BeneficiarySelector } from "../../../ui/molecules/SmartSelectors";
import { ConfirmModal } from "../../../ui/atoms/ConfirmModal";
import { Modal } from "../../../ui/Modal";
import { TagSelector } from "../../../ui/molecules/TagSelector";

interface VariableTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: CategoryDef[];
  people: Person[];
  tags?: Tag[];
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onUpsertTransfer?: (t: Transfer) => void;
  defaultDate: string;
  labelsSuggestions?: string[];
  savedLabels?: SavedLabel[];
  editingTransaction?: VariableTransaction | null;
  initialMode?: "STANDARD" | "TRANSFER";
  lockMode?: boolean;
}

export const VariableTransactionForm: React.FC<VariableTransactionFormProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  people,
  tags = [],
  onAddTransaction,
  onDeleteTransaction,
  onUpsertTransfer,
  defaultDate,
  labelsSuggestions = [],
  savedLabels = [],
  editingTransaction,
  initialMode = "STANDARD",
  lockMode = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mode, setMode] = useState<"STANDARD" | "TRANSFER">(initialMode);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const errorBlockRef = useRef<HTMLDivElement>(null);

  // Scroller vers le bloc d'erreur quand des erreurs apparaissent
  useEffect(() => {
    if (validationErrors.length > 0 && errorBlockRef.current) {
      errorBlockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      errorBlockRef.current.focus();
    }
  }, [validationErrors]);

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [isRefund, setIsRefund] = useState(false);

  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<string>("");
  // isWaiting state removed, handling via submit buttons
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [comments, setComments] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Filtrer les comptes COURANTS pour l'initialisation par défaut
  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === AccountType.CHECKING), [accounts]);

  const [accountId, setAccountId] = useState(checkingAccounts[0]?.id || accounts[0]?.id || "");
  const [destAccountId, setDestAccountId] = useState(accounts[1]?.id || accounts[0]?.id || "");

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const defaultBeneficiary = people.find((p) => p.name === "Famille")?.id || people.find((p) => !p.isChild)?.id || people[0]?.id || "";
  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);

  const isExpense = type === "EXPENSE";

  const standardSuggestions = useMemo(() => {
    if (savedLabels.length > 0) {
      return savedLabels.filter((l) => l.type === AccountType.CHECKING && l.isExpense === isExpense).map((l) => l.name);
    } else {
      return labelsSuggestions;
    }
  }, [savedLabels, labelsSuggestions, isExpense]);

  const transferSuggestions = useMemo(() => {
    return savedLabels.filter((l) => l.type === AccountType.TRANSFER).map((l) => l.name);
  }, [savedLabels]);

  // Filtrage des comptes pour virements : un compte EPARGNE ne peut être jumelé qu'avec le compte pivot (isJoint)
  const filteredSourceAccounts = useMemo(() => {
    const destAccount = accounts.find((a) => a.id === destAccountId);
    if (destAccount && destAccount.type === AccountType.SAVINGS) {
      // Si destination = EPARGNE, source = pivot uniquement
      return accounts.filter((a) => a.isJoint);
    }
    // Sinon tous les comptes
    return accounts;
  }, [accounts, destAccountId]);

  const filteredDestAccounts = useMemo(() => {
    const srcAccount = accounts.find((a) => a.id === accountId);
    if (srcAccount && srcAccount.type === AccountType.SAVINGS) {
      // Si source = EPARGNE, destination = pivot uniquement
      return accounts.filter((a) => a.isJoint);
    }
    // Sinon tous les comptes
    return accounts;
  }, [accounts, accountId]);

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setMode(initialMode);
        setType(editingTransaction.type || "EXPENSE");

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
        // No need to set isWaiting state

        if (initialMode === "TRANSFER") {
          setAccountId(editingTransaction.accountId);
          if (editingTransaction.comments && accounts.some((a) => a.id === editingTransaction.comments)) {
            setDestAccountId(editingTransaction.comments);
          }
        } else {
          setAccountId(editingTransaction.accountId);
          setComments(editingTransaction.comments || "");
          setSelectedTagIds(editingTransaction.tagIds || []);
        }

        setCategory(editingTransaction.category);
        setSubCategory(editingTransaction.subCategory || "");
        setBeneficiaryId(editingTransaction.beneficiaryId || defaultBeneficiary);
        setIsExtra(!!editingTransaction.isExtra);
      } else {
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
        setSelectedTagIds([]);
        if (checkingAccounts.length > 0) setAccountId(checkingAccounts[0].id);
      }
      setValidationErrors([]);
    }
  }, [isOpen, editingTransaction, defaultDate, defaultBeneficiary, initialMode, accounts, checkingAccounts]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const handleSubmit = (targetIsWaiting: boolean) => {
    const errors: string[] = [];

    if (!label.trim()) errors.push("Le libellé est obligatoire");
    if (!amount || parseFloat(amount) === 0) errors.push("Le montant est obligatoire et doit être différent de 0");
    if (!accountId) errors.push("Le compte est obligatoire");

    if (mode === "TRANSFER") {
      if (!destAccountId) errors.push("Le compte de destination est obligatoire");
      if (accountId === destAccountId) errors.push("Le compte source et destination ne peuvent pas être identiques");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    if (mode === "TRANSFER") {
      if (!destAccountId || accountId === destAccountId) return;
      if (onUpsertTransfer) {
        onUpsertTransfer({
          id: editingTransaction?.id || `tr_${Date.now()}`,
          date,
          label,
          amount: parseFloat(amount),
          sourceAccountId: accountId,
          destinationAccountId: destAccountId,
        });
      }
    } else {
      let finalAmount = parseFloat(amount);
      if (type === "EXPENSE" && isRefund) {
        finalAmount = -Math.abs(finalAmount);
      } else {
        finalAmount = Math.abs(finalAmount);
      }

      onAddTransaction({
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
        isExtra,
        comments: comments.trim() || undefined,
        tagIds: selectedTagIds,
        position: editingTransaction?.position,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editingTransaction && onDeleteTransaction) {
      onDeleteTransaction(editingTransaction.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const themeColor = mode === "TRANSFER" ? "indigo" : isExpense ? (isRefund ? "emerald" : "indigo") : "emerald";

  if (showDeleteConfirm) {
    return (
      <ConfirmModal
        isOpen={true}
        title="Supprimer ?"
        message={`Voulez-vous supprimer "${editingTransaction?.label}" ?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTransaction ? "Modifier" : mode === "TRANSFER" ? "Nouveau virement" : "Nouvelle opération"}>
      <div className="space-y-2">
        {!editingTransaction && !lockMode && (
          <div className="flex bg-slate-100 p-1 rounded-lg mb-2">
            <button
              type="button"
              onClick={() => setMode("STANDARD")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                mode === "STANDARD" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Opération Standard
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("TRANSFER");
                setLabel("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${
                mode === "TRANSFER" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ArrowRightLeft size={12} /> Virement Interne
            </button>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div
            ref={errorBlockRef}
            tabIndex={-1}
            className="bg-rose-50 border border-rose-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200 outline-none focus:ring-2 focus:ring-rose-300"
          >
            <p className="text-xs font-bold text-rose-700 mb-1">⚠️ Champs manquants :</p>
            <ul className="text-xs text-rose-600 space-y-0.5 list-disc list-inside">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {mode === "STANDARD" ? (
          <>
            <div className="mb-2">
              <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Type</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setType("EXPENSE");
                    setIsRefund(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                    isExpense ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TrendingDown size={14} /> Dépense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("INCOME");
                    setIsRefund(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                    !isExpense ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <TrendingUp size={14} /> Revenu
                </button>
              </div>
            </div>

            <SearchableTextInput
              label="Libellé"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onSelectSuggestion={setLabel}
              placeholder={isExpense ? "Ex: Frais, Courses..." : "Ex: Vente, Remboursement..."}
              suggestions={standardSuggestions}
              required
              autoFocus={!editingTransaction}
            />
            <div className="grid grid-cols-2 gap-2">
              <AmountInput label="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} color={themeColor} required />
              <TextInput label="Date" type="date" icon={Calendar} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <AccountSelector
                label={isExpense ? (isRefund ? "Compte crédité (Remboursement)" : "Compte débité") : "Compte crédité"}
                accounts={accounts}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                color={themeColor}
                filterTypes={[AccountType.CHECKING]}
              />

              <BeneficiarySelector people={people} value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} color={themeColor} />
            </div>

            <CategorySelector
              categories={categories}
              type={type}
              selectedCategory={category}
              selectedSubCategory={subCategory}
              onCategoryChange={setCategory}
              onSubCategoryChange={setSubCategory}
            />

            <div className="border-t border-slate-100 pt-2"></div>

            <TagSelector tags={tags} selectedTagIds={selectedTagIds} onToggleTag={toggleTag} />
            {isExpense && (
              <div
                onClick={() => setIsRefund(!isRefund)}
                className={`cursor-pointer px-3 py-2 rounded-lg border transition-all flex items-center gap-3 ${
                  isRefund ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-transparent hover:border-slate-200"
                }`}
              >
                <div className={`p-1 rounded ${isRefund ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                  {isRefund ? <RefreshCcw size={14} /> : <TrendingDown size={14} />}
                </div>
                <div className="flex-1">
                  <span className={`text-xs font-bold block ${isRefund ? "text-emerald-800" : "text-slate-600"}`}>C'est un remboursement</span>
                  {isRefund && <span className="text-[10px] text-emerald-600 leading-none">Ce montant sera déduit de vos dépenses (ex: Mutuelle, Retour produit).</span>}
                </div>
                <input type="checkbox" checked={isRefund} onChange={() => {}} className="pointer-events-none" />
              </div>
            )}
            <TextInput
              label="Note / Commentaire"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Infos complémentaires..."
              icon={MessageSquare}
            />
          </>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2">
              <ArrowRightLeft className="text-indigo-600 mt-1" size={20} />
              <p className="text-xs text-indigo-800 leading-relaxed">Virement entre deux comptes. Crée un mouvement unique lié.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AmountInput label="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} color="indigo" required autoFocus />
              <TextInput label="Date" type="date" icon={Calendar} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="relative">
              <div className="absolute left-[13px] top-[34px] bottom-[34px] w-0.5 bg-slate-200 -z-10"></div>
              <div className="space-y-3">
                <AccountSelector
                  label="Depuis (Source)"
                  accounts={filteredSourceAccounts}
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  color="indigo"
                  showBalance
                />
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-white p-1 rounded-full border border-slate-200 text-slate-400">
                    <ArrowDown size={14} />
                  </div>
                </div>
                <AccountSelector
                  label="Vers (Destination)"
                  accounts={filteredDestAccounts}
                  value={destAccountId}
                  onChange={(e) => setDestAccountId(e.target.value)}
                  color="emerald"
                  showBalance
                />
              </div>
            </div>
            <SearchableTextInput
              label="Motif"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onSelectSuggestion={setLabel}
              placeholder="Ex: Épargne, Remboursement..."
              suggestions={transferSuggestions}
              required
            />
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          {editingTransaction && onDeleteTransaction && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}

          {mode === "TRANSFER" ? (
            <button
              onClick={() => handleSubmit(false)}
              className={`flex-1 text-white py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700`}
            >
              <Save size={18} /> {editingTransaction ? "Mettre à jour" : "Exécuter le virement"}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSubmit(true)}
                className="flex-1 bg-amber-100 text-amber-700 border border-amber-200 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 hover:bg-amber-200"
              >
                <Clock size={18} /> En attente
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className={`flex-1 text-white py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${
                  isExpense ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <CheckCircle2 size={18} /> Pointé (Réel)
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
