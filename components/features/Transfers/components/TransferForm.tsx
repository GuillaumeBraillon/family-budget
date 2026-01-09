/**
 * @file Formulaire de virement interne (composant dédié)
 * @description Composant pur dédié aux virements entre comptes.
 * Extrait depuis VariableTransactionForm pour respecter le principe SRP.
 *
 * @architecture
 * **Responsabilités UNIQUEMENT :**
 * - Affichage UI du formulaire de virement
 * - Coordination des callbacks (submit, delete, close)
 * - Délégation de la logique au hook useTransferForm
 *
 * **Ne gère PAS :**
 * - Transactions variables (dépenses/revenus) → VariableTransactionForm
 * - Logique métier → useTransferForm hook
 *
 * @dependencies
 * - hooks/transfers/useTransferForm : Hook de logique métier
 * - components/ui : Composants atomiques réutilisables
 */
import React, { useState, useRef } from "react";
import { useError } from "../../../../contexts/ErrorContext";
import { Save, TrendingUp, Calendar, Trash2, ArrowRightLeft, ArrowDown } from "lucide-react";
import { Transfer, Account, SavedLabel } from "../../../../types";
import { TextInput, AmountInput, SearchableTextInput } from "../../../ui/molecules/FormInputs";
import { AccountSelector } from "../../../ui/molecules/SmartSelectors";
import { ConfirmModal } from "../../../ui/atoms/ConfirmModal";
import { Modal } from "../../../ui/Modal";
import { ValidationErrorBlock } from "../../../ui/atoms/ValidationErrorBlock";
import { useValidationScroll } from "../../../../hooks/useValidationScroll";
import { useTransferForm } from "../../../../hooks/transfers/useTransferForm";
import { AdvancedOptionsAccordion } from "../../../ui/molecules/AdvancedOptionsAccordion";

interface TransferFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  savedLabels?: SavedLabel[];
  onUpsertTransfer: (t: Transfer) => void;
  onDeleteTransfer?: (id: string) => void;
  defaultDate: string;
  editingTransfer?: Transfer | null;
}

/**
 * Composant de formulaire pour virements internes.
 *
 * @description
 * Formulaire dédié à la création/édition de virements entre comptes.
 * Applique le principe SRP en gérant UNIQUEMENT les virements (pas les transactions variables).
 *
 * **Features :**
 * - Toggle "Intérêts ou Ajustement Exceptionnel"
 * - Sélection comptes source/destination avec filtrage intelligent
 * - Validation automatique (source ≠ destination)
 * - Auto-détection des intérêts depuis le label
 * - Affichage des soldes des comptes
 *
 * **Workflow :**
 * 1. User ouvre modale → Hook initialise avec editingTransfer ou defaults
 * 2. User modifie champs → Hook valide en temps réel
 * 3. User clique "Exécuter" → Hook construit Transfer + callback parent
 *
 * @example
 * ```tsx
 * <TransferForm
 *   isOpen={isFormOpen}
 *   onClose={() => setIsFormOpen(false)}
 *   accounts={accounts}
 *   savedLabels={savedLabels}
 *   onUpsertTransfer={onUpsertTransfer}
 *   onDeleteTransfer={onDeleteTransfer}
 *   defaultDate="2025-01-09"
 *   editingTransfer={editingTransfer}
 * />
 * ```
 */
export const TransferForm: React.FC<TransferFormProps> = ({
  isOpen,
  onClose,
  accounts,
  savedLabels = [],
  onUpsertTransfer,
  onDeleteTransfer,
  defaultDate,
  editingTransfer,
}) => {
  const { showError } = useError();

  // --- HOOKS SPÉCIALISÉS (LOGIQUE DÉLÉGUÉE) ---

  const form = useTransferForm({
    editingTransfer,
    accounts,
    savedLabels,
    defaultDate,
    isOpen,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const errorBlockRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers les erreurs de validation
  useValidationScroll(form.validationErrors, errorBlockRef);

  // --- HANDLERS ---

  const handleFormSubmit = async () => {
    try {
      const result = form.handleSubmit(onClose);
      if (!result) return;
      await onUpsertTransfer(result);
    } catch (err) {
      showError(err as Error, "Sauvegarde de virement");
    }
  };

  const handleDelete = async () => {
    try {
      if (editingTransfer && onDeleteTransfer) {
        await onDeleteTransfer(editingTransfer.id);
        setShowDeleteConfirm(false);
        onClose();
      }
    } catch (err) {
      showError(err as Error, "Suppression de virement");
      setShowDeleteConfirm(false);
    }
  };

  // --- MODALE DE CONFIRMATION SUPPRESSION ---

  if (showDeleteConfirm) {
    return (
      <ConfirmModal
        isOpen={true}
        title="Supprimer le virement ?"
        message={`Voulez-vous supprimer "${editingTransfer?.label}" ?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    );
  }

  // --- RENDER FORMULAIRE ---

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTransfer ? "Modifier le virement" : "Nouveau virement"}>
      <div className="space-y-2.5">
        <ValidationErrorBlock errors={form.validationErrors} ref={errorBlockRef} />

        {/* InfoBox explicative */}
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2.5">
          <ArrowRightLeft className="text-indigo-600 mt-1" size={20} />
          <p className="text-xs text-indigo-800 leading-relaxed">Virement entre deux comptes. Crée un mouvement unique lié.</p>
        </div>

        {/* Champs Montant et Date */}
        <div className="grid grid-cols-2 gap-2.5">
          <AmountInput label="Montant" value={form.amount} onChange={(e) => form.setAmount(e.target.value)} color="indigo" required autoFocus />
          <TextInput label="Date" type="date" icon={Calendar} value={form.date} onChange={(e) => form.setDate(e.target.value)} required />
        </div>

        {/* Sélection comptes Source → Destination */}
        <div className="relative">
          {!form.isInterest && <div className="absolute left-[13px] top-[34px] bottom-[34px] w-0.5 bg-slate-200 -z-10"></div>}
          <div className="space-y-2.5">
            {!form.isInterest && (
              <>
                <AccountSelector
                  label="Depuis (Source)"
                  accounts={form.filteredSourceAccounts}
                  value={form.sourceAccountId}
                  onChange={(e) => form.setSourceAccountId(e.target.value)}
                  color="indigo"
                  showBalance
                />
                <div className="flex justify-center -my-1.5 relative z-10">
                  <div className="bg-white p-1 rounded-full border border-slate-200 text-slate-400">
                    <ArrowDown size={14} />
                  </div>
                </div>
              </>
            )}
            <AccountSelector
              label={form.isInterest ? "Compte concerné" : "Vers (Destination)"}
              accounts={form.filteredDestAccounts}
              value={form.destinationAccountId}
              onChange={(e) => form.setDestinationAccountId(e.target.value)}
              color="emerald"
              showBalance
            />
          </div>
        </div>

        {/* Champ Motif avec suggestions */}
        <SearchableTextInput
          label="Motif"
          value={form.label}
          onChange={(e) => form.setLabel(e.target.value)}
          onSelectSuggestion={form.setLabel}
          placeholder="Ex: Épargne, Remboursement..."
          suggestions={form.transferSuggestions}
          required
        />

        <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
          {/* Toggle Intérêts/Ajustement */}
          <div
            onClick={() => form.setIsInterest(!form.isInterest)}
            className={`cursor-pointer px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${
              form.isInterest ? "bg-emerald-50 border-emerald-200" : "bg-white border-transparent hover:border-slate-200"
            }`}
          >
            <div className={`p-1 rounded ${form.isInterest ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
              <TrendingUp size={14} />
            </div>
            <div className="flex-1">
              <span className={`text-xs font-bold block ${form.isInterest ? "text-emerald-800" : "text-slate-600"}`}>Intérêts ou Ajustement Exceptionnel</span>
              {form.isInterest && (
                <span className="text-[10px] text-emerald-600 leading-none">
                  Ce mouvement représente des intérêts bancaires ou un ajustement manuel du solde.
                </span>
              )}
            </div>
            <input type="checkbox" checked={form.isInterest} onChange={() => {}} className="pointer-events-none" />
          </div>
        </AdvancedOptionsAccordion>

        {/* Boutons d'action */}
        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
          {editingTransfer && onDeleteTransfer && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            onClick={handleFormSubmit}
            className="flex-1 text-white py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Save size={18} /> {editingTransfer ? "Mettre à jour" : "Exécuter le virement"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
