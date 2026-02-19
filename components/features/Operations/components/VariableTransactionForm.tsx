/**
 * @file Formulaire de transaction variable (refactorisé)
 * @description Container simplifié qui délègue la logique métier au hook useTransactionForm.
 * Ne gère QUE l'affichage UI et la coordination des callbacks.
 *
 * @architecture
 * **Refactorisation Clean Code :**
 * - Logique métier → `useTransactionForm` (hooks/transactions)
 * - UI pure → Ce composant (~200L)
 * - Réduction : 507L → ~200L (-60%)
 *
 * **Flux de données :**
 * ```
 * Props → useTransactionForm (état + validation)
 *           ↓
 *     Composant (render pur)
 * ```
 */
import React, { useState, useRef } from "react";
import { useError } from "../../../../contexts/ErrorContext";
import { TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare, RefreshCcw } from "lucide-react";
import { VariableTransaction, Account, CategoryDef, Person, SavedLabel, Tag, AccountType } from "../../../../types";
import { CategorySelector } from "../../../ui/molecules/CategorySelector";
import { TextInput, AmountInput, SearchableTextInput } from "../../../ui/molecules/FormInputs";
import { AccountSelector, BeneficiarySelector } from "../../../ui/molecules/SmartSelectors";
import { ConfirmModal } from "../../../ui/atoms/ConfirmModal";
import { Modal } from "../../../ui/Modal";
import { TagAmountSelector } from "../../../ui/molecules/TagAmountSelector";
import { ValidationErrorBlock } from "../../../ui/atoms/ValidationErrorBlock";
import { useValidationScroll } from "../../../../hooks/useValidationScroll";
import { useTransactionForm } from "../../../../hooks/transactions";
import { AdvancedOptionsAccordion } from "../../../ui/molecules/AdvancedOptionsAccordion";

interface VariableTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: CategoryDef[];
  people: Person[];
  tags?: Tag[];
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  defaultDate: string;
  labelsSuggestions?: string[];
  savedLabels?: SavedLabel[];
  editingTransaction?: VariableTransaction | null;
  initialMode?: "STANDARD";
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
  defaultDate,
  labelsSuggestions = [],
  savedLabels = [],
  editingTransaction,
  initialMode = "STANDARD",
  lockMode: _lockMode = false,
}) => {
  const { showError } = useError();
  // --- HOOKS SPÉCIALISÉS (LOGIQUE DÉLÉGUÉE) ---

  const form = useTransactionForm({
    editingTransaction,
    accounts,
    people,
    savedLabels,
    defaultDate,
    initialMode,
    labelsSuggestions,
    isOpen,
    categories, // Pour résolution des IDs lors de l'auto-suggestion
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const errorBlockRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers les erreurs de validation
  useValidationScroll(form.validationErrors, errorBlockRef);

  const handleFormSubmit = async (targetIsWaiting: boolean) => {
    try {
      const result = form.handleSubmit(targetIsWaiting, onClose);
      if (!result) return;
      await onAddTransaction(result as VariableTransaction);
    } catch (err) {
      showError(err as Error, "Sauvegarde de transaction");
    }
  };

  const handleDelete = async () => {
    try {
      if (editingTransaction && onDeleteTransaction) {
        await onDeleteTransaction(editingTransaction.id);
        setShowDeleteConfirm(false);
        onClose();
      }
    } catch (err) {
      showError(err as Error, "Suppression de transaction");
      setShowDeleteConfirm(false);
    }
  };

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
    <Modal isOpen={isOpen} onClose={onClose} title={editingTransaction ? "Modifier l'opération" : "Nouvelle opération"}>
      <div className="space-y-2.5">
        <ValidationErrorBlock errors={form.validationErrors} ref={errorBlockRef} />

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase block mb-1.5">Type</label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                form.setType("EXPENSE");
                form.setIsRefund(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                form.isExpense ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <TrendingDown size={14} /> Dépense
            </button>
            <button
              type="button"
              onClick={() => {
                form.setType("INCOME");
                form.setIsRefund(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                !form.isExpense ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <TrendingUp size={14} /> Revenu
            </button>
          </div>
        </div>

        <SearchableTextInput
          label="Libellé"
          value={form.label}
          onChange={(e) => form.handleLabelChange(e.target.value)}
          onSelectSuggestion={(val) => form.handleLabelChange(val)}
          placeholder={form.isExpense ? "Ex: Frais, Courses..." : "Ex: Vente, Remboursement..."}
          suggestions={form.standardSuggestions}
          required
          autoFocus={!editingTransaction}
        />
        {form.isSuggesting && <div className="text-xs text-indigo-600 italic animate-pulse -mt-1">✨ Recherche de suggestion...</div>}
        <div className="grid grid-cols-2 gap-2.5">
          <AmountInput label="Montant" value={form.amount} onChange={(e) => form.setAmount(e.target.value)} color={form.themeColor} required />
          <TextInput label="Date" type="form.date" icon={Calendar} value={form.date} onChange={(e) => form.setDate(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <AccountSelector
            label={form.isExpense ? (form.isRefund ? "Compte crédité (Remboursement)" : "Compte débité") : "Compte crédité"}
            accounts={accounts}
            value={form.accountId}
            onChange={(e) => form.setAccountId(e.target.value)}
            color={form.themeColor}
            filterTypes={[AccountType.CHECKING]}
          />

          <BeneficiarySelector people={people} value={form.beneficiaryId} onChange={(e) => form.setBeneficiaryId(e.target.value)} color={form.themeColor} />
        </div>

        <CategorySelector
          categories={categories}
          type={form.type}
          selectedCategory={form.category}
          selectedSubCategory={form.subCategory}
          onCategoryChange={form.setCategory}
          onSubCategoryChange={form.setSubCategory}
        />

        <TextInput
          label="Note / Commentaire"
          value={form.comments}
          onChange={(e) => form.setComments(e.target.value)}
          placeholder="Infos complémentaires..."
          icon={MessageSquare}
        />

        <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
          <TagAmountSelector
            tags={tags}
            selectedTagAmounts={form.selectedTagAmounts}
            onTagAmountsChange={form.setSelectedTagAmounts}
            totalAmount={parseFloat(form.amount) || 0}
          />

          {/* Toggle Extra Global - Compatible avec les tags individuels */}
          <div
            onClick={() => form.setIsExtra(!form.isExtra)}
            className={`cursor-pointer px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${
              form.isExtra ? "bg-amber-50 border-amber-200" : "bg-white border-transparent hover:border-slate-200"
            }`}
          >
            <div className={`p-1 rounded ${form.isExtra ? "bg-amber-200 text-amber-700" : "bg-slate-200 text-slate-500"}`}>
              <Star size={14} fill={form.isExtra ? "currentColor" : "none"} />
            </div>
            <div className="flex-1">
              <span className={`text-xs font-bold block ${form.isExtra ? "text-amber-800" : "text-slate-600"}`}>
                Dépense temporaire / Exceptionnelle (Hors Budget)
              </span>
              {form.isExtra && (
                <span className="text-[10px] text-amber-600 leading-none">Cette opération ne sera pas comptabilisée dans le budget courant.</span>
              )}
            </div>
            <input type="checkbox" checked={form.isExtra} onChange={() => {}} className="pointer-events-none" />
          </div>

          {form.isExpense && (
            <div
              onClick={() => form.setIsRefund(!form.isRefund)}
              className={`cursor-pointer px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${
                form.isRefund ? "bg-emerald-50 border-emerald-200" : "bg-white border-transparent hover:border-slate-200"
              }`}
            >
              <div className={`p-1 rounded ${form.isRefund ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                {form.isRefund ? <RefreshCcw size={14} /> : <TrendingDown size={14} />}
              </div>
              <div className="flex-1">
                <span className={`text-xs font-bold block ${form.isRefund ? "text-emerald-800" : "text-slate-600"}`}>C'est un remboursement</span>
                {form.isRefund && (
                  <span className="text-[10px] text-emerald-600 leading-none">Ce montant sera déduit de vos dépenses (ex: Mutuelle, Retour produit).</span>
                )}
              </div>
              <input type="checkbox" checked={form.isRefund} onChange={() => {}} className="pointer-events-none" />
            </div>
          )}
        </AdvancedOptionsAccordion>

        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
          {editingTransaction && onDeleteTransaction && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            onClick={() => handleFormSubmit(true)}
            className="flex-1 bg-amber-100 text-amber-700 border border-amber-200 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 hover:bg-amber-200"
          >
            <Clock size={18} /> En attente
          </button>
          <button
            onClick={() => handleFormSubmit(false)}
            className={`flex-1 text-white py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${
              form.isExpense ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <CheckCircle2 size={18} /> Pointé (Réel)
          </button>
        </div>
      </div>
    </Modal>
  );
};
