/**
 * @file Formulaire de transaction variable (refactorisé)
 * @description Container simplifié qui délègue la logique métier au hook useTransactionForm.
 * Ne gère QUE l'affichage UI et la coordination des callbacks.
 *
 * @architecture
 * **Refactorisation Clean Code :**
 * - Logique métier → `useTransactionForm` (hooks/transactions)
 * - UI pure → Ce composant
 *
 * **Design (v2 — mise en page large) :**
 * - Bandeau "ledger" en tête : type + montant, sur toute la largeur.
 * - Grille 2 colonnes pour les champs courts (date / compte, projet / note).
 * - Ventilation bénéficiaires et catégorie restent pleine largeur (contenu variable).
 * - Les flags (hors budget / remboursement / salaire) sont des puces inline
 *   toujours visibles, plus d'accordéon à déplier.
 *
 * La largeur passe par le prop `maxWidth` du composant <Modal> (défaut "max-w-md"),
 * ici réglé sur "max-w-3xl" pour accueillir la mise en page 2 colonnes.
 */
import React, { useState, useRef } from "react";
import { useError } from "../../../../contexts/ErrorContext";
import { TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare, RefreshCcw, Banknote, X, Check } from "lucide-react";
import { VariableTransaction, Account, CategoryDef, Person, SavedLabel, AccountType, Project } from "../../../../types";
import { CategorySelector } from "../../../ui/molecules/CategorySelector";
import { TextInput, AmountInput, SearchableTextInput } from "../../../ui/molecules/FormInputs";
import { AccountSelector, ProjectSelector } from "../../../ui/molecules/SmartSelectors";
import { ConfirmModal } from "../../../ui/atoms/ConfirmModal";
import { Modal } from "../../../ui/Modal";
import { BeneficiaryAmountSelector } from "../../../ui/molecules/BeneficiaryAmountSelector";
import { ValidationErrorBlock } from "../../../ui/atoms/ValidationErrorBlock";
import { useValidationScroll } from "../../../../hooks/useValidationScroll";
import { useTransactionForm } from "../../../../hooks/transactions";

interface VariableTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: CategoryDef[];
  people: Person[];
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  defaultDate: string;
  labelsSuggestions?: string[];
  savedLabels?: SavedLabel[];
  editingTransaction?: VariableTransaction | null;
  initialMode?: "STANDARD";
  lockMode?: boolean;
  projects?: Project[];
}

/** Puce d'option inline (remplace l'ancien accordéon "Options avancées") */
const FlagChip: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  tone: "amber" | "emerald";
}> = ({ active, onClick, icon, label, hint, tone }) => {
  const toneClasses = tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800";
  const iconBoxTone = tone === "amber" ? "bg-amber-500 border-amber-500" : "bg-emerald-500 border-emerald-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
        active ? toneClasses : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
      }`}
      title={hint}
    >
      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-all ${active ? iconBoxTone : "border-slate-300"}`}>
        {active && <Check size={9} className="text-white" strokeWidth={3} />}
      </span>
      {icon}
      {label}
    </button>
  );
};

export const VariableTransactionForm: React.FC<VariableTransactionFormProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  people,
  onAddTransaction,
  onDeleteTransaction,
  defaultDate,
  labelsSuggestions = [],
  savedLabels = [],
  editingTransaction,
  initialMode = "STANDARD",
  lockMode: _lockMode = false,
  projects = [],
}) => {
  const { showError } = useError();

  const form = useTransactionForm({
    editingTransaction,
    accounts,
    people,
    savedLabels,
    defaultDate,
    initialMode,
    labelsSuggestions,
    isOpen,
    categories,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const errorBlockRef = useRef<HTMLDivElement>(null);

  useValidationScroll(form.validationErrors, errorBlockRef);

  const handleFormSubmit = async (targetIsWaiting: boolean) => {
    try {
      const result = form.handleSubmit(targetIsWaiting);
      if (!result) return;
      await onAddTransaction(result as VariableTransaction);
      onClose();
    } catch (err) {
      showError(err as Error, "Sauvegarde de transaction");
    }
  };

  const handleNativeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleFormSubmit(false);
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

  const footer = (
    <div className="flex gap-2.5">
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
        type="button"
        onClick={() => handleFormSubmit(true)}
        className="flex-1 bg-amber-100 text-amber-700 border border-amber-200 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 hover:bg-amber-200"
      >
        <Clock size={18} /> En attente
      </button>
      <button
        type="submit"
        form="variable-transaction-form"
        className={`flex-1 text-white py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${
          form.isExpense ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        <CheckCircle2 size={18} /> Pointé (Réel)
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTransaction ? "Modifier l'opération" : "Nouvelle opération"} maxWidth="max-w-3xl" footer={footer}>
      <form id="variable-transaction-form" className="space-y-3" onSubmit={handleNativeSubmit}>
        <ValidationErrorBlock errors={form.validationErrors} ref={errorBlockRef} />

        {/* Bandeau ledger, compact : segmented control horizontal + montant sur une seule ligne */}
        <div
          className={`rounded-xl border p-1 transition-colors ${form.isExpense ? "bg-indigo-50/50 border-indigo-100" : "bg-emerald-50/50 border-emerald-100"}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
            <div className="shrink-0 flex flex-col gap-1 bg-white/70 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  form.setType("EXPENSE");
                  form.setIsRefund(false);
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  form.isExpense ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingDown size={13} /> Dépense
              </button>
              <button
                type="button"
                onClick={() => {
                  form.setType("INCOME");
                  form.setIsRefund(false);
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  !form.isExpense ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <TrendingUp size={13} /> Revenu
              </button>
            </div>
            <div className="flex-[2] min-w-[200px] relative">
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
              {form.isSuggesting && (
                <div className="absolute -bottom-4 left-0 text-[10px] text-indigo-600 italic animate-pulse">✨ Recherche de suggestion...</div>
              )}
            </div>
            <div className="flex-1 min-w-[140px]">
              <AmountInput label="Montant" value={form.amount} onChange={(e) => form.setAmount(e.target.value)} color={form.themeColor} required />
            </div>
          </div>
        </div>

        {/* Champs courts en 2 colonnes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <TextInput label="Date" type="date" icon={Calendar} value={form.date} onChange={(e) => form.setDate(e.target.value)} required />
          <AccountSelector
            label={form.isExpense ? (form.isRefund ? "Compte crédité" : "Compte débité") : "Compte crédité"}
            accounts={accounts}
            value={form.accountId}
            onChange={(e) => form.setAccountId(e.target.value)}
            color={form.themeColor}
            filterTypes={[AccountType.CHECKING]}
          />
        </div>

        {/* Catégorie (+ sous-catégorie) — pleine largeur, contenu variable */}
        <CategorySelector
          categories={categories}
          type={form.type}
          selectedCategory={form.category}
          selectedSubCategory={form.subCategory}
          onCategoryChange={form.setCategory}
          onSubCategoryChange={form.setSubCategory}
        />

        {/* Ventilation bénéficiaires — pleine largeur, contenu variable */}
        <BeneficiaryAmountSelector
          people={people}
          totalAmount={Math.abs(parseFloat(form.amount) || 0)}
          selectedBeneficiaryAmounts={form.selectedBeneficiaryAmounts}
          onBeneficiaryAmountsChange={form.setSelectedBeneficiaryAmounts}
        />

        {/* Options — puces inline, toujours visibles, plus d'accordéon */}

        <div className="flex flex-wrap gap-2">
          <FlagChip
            active={form.isExtra}
            onClick={() => form.setIsExtra(!form.isExtra)}
            icon={<Star size={12} fill={form.isExtra ? "currentColor" : "none"} />}
            label="Hors budget (exceptionnelle)"
            hint="Cette opération ne sera pas comptabilisée dans le budget courant."
            tone="amber"
          />

          {form.isExpense && (
            <FlagChip
              active={form.isRefund}
              onClick={() => form.setIsRefund(!form.isRefund)}
              icon={<RefreshCcw size={12} />}
              label="Remboursement"
              hint="Ce montant sera déduit de vos dépenses (ex: Mutuelle, Retour produit)."
              tone="emerald"
            />
          )}

          {!form.isExpense && (
            <FlagChip
              active={form.isSalary}
              onClick={() => form.setIsSalary(!form.isSalary)}
              icon={<Banknote size={12} />}
              label="Salaire / revenu structurel"
              hint="Ce revenu sera exclu du budget variable et comptabilisé comme revenu structurel."
              tone="emerald"
            />
          )}
        </div>

        {/* Projet + note en 2 colonnes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <ProjectSelector projects={projects} value={form.projectId} onChange={(e) => form.setProjectId(e.target.value)} />
          <TextInput
            label="Note / Commentaire"
            value={form.comments}
            onChange={(e) => form.setComments(e.target.value)}
            placeholder="Infos complémentaires..."
            icon={MessageSquare}
          />
        </div>
      </form>
    </Modal>
  );
};
