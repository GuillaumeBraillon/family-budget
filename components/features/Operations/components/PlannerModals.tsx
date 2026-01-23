import React, { useState } from "react";
import { X, Check, MessageSquare } from "lucide-react";
import { Modal } from "../../../ui/Modal";
import { FormField } from "../../../ui/atoms/FormField";
import { Account, PaidItemDetails, Tag } from "../../../../types";
import { useError } from "../../../../contexts/ErrorContext";
import { AdvancedOptionsAccordion } from "../../../ui/molecules/AdvancedOptionsAccordion";

interface PlannerModalsProps {
  confirmModal: { instanceId: string; newStatus: boolean } | null;
  uncheckModal: { instanceId: string; paidDetails: PaidItemDetails } | null;
  accounts: Account[];
  tags?: Tag[];
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
  onCloseConfirm: () => void;
  onCloseUncheck: () => void;
  setConfirmModal: (data: { instanceId: string; newStatus: boolean } | null) => void;
}

export const PlannerModals: React.FC<PlannerModalsProps> = ({
  confirmModal,
  uncheckModal,
  accounts,
  tags: _tags = [],
  onTogglePaid,
  onCloseConfirm,
  onCloseUncheck,
  setConfirmModal,
}) => {
  const { showError } = useError();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <>
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={onCloseConfirm}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-900">{confirmModal.item?.type === "INCOME" ? "Confirmer la réception" : "Confirmer le paiement"}</h3>
              <button onClick={onCloseConfirm} className="text-slate-400 hover:text-slate-600" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-2.5 overflow-y-auto">
              <FormField label="Libellé">
                <input
                  type="text"
                  value={confirmModal.label}
                  onChange={(e) => setConfirmModal({ ...confirmModal, label: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2.5">
                <FormField label="Montant (€)">
                  <input
                    type="number"
                    step="0.01"
                    value={confirmModal.amount}
                    onChange={(e) => setConfirmModal({ ...confirmModal, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold"
                  />
                </FormField>
                <FormField label="Date effective">
                  <input
                    type="date"
                    value={confirmModal.paymentDate}
                    onChange={(e) => setConfirmModal({ ...confirmModal, paymentDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                  />
                </FormField>
              </div>
              <FormField label="Compte impacté">
                <select
                  value={confirmModal.accountId}
                  onChange={(e) => setConfirmModal({ ...confirmModal, accountId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </FormField>

              <AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>
                <FormField label="Note / Commentaire">
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Note optionnelle..."
                      value={confirmModal.comments}
                      onChange={(e) => setConfirmModal({ ...confirmModal, comments: e.target.value })}
                      className="w-full p-2 pl-9 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 text-sm"
                    />
                  </div>
                </FormField>
              </AdvancedOptionsAccordion>

              <button
                onClick={async () => {
                  try {
                    if (confirmModal.item) {
                      await onTogglePaid(
                        {
                          ...confirmModal.item,
                          amount: confirmModal.amount,
                          paymentDate: confirmModal.paymentDate,
                          accountId: confirmModal.accountId,
                          label: confirmModal.label,
                          comments: confirmModal.comments.trim() || undefined,
                          isWaiting: false,
                          isVariable: false,
                        } as PaidItemDetails,
                        confirmModal.item.instanceId
                      );
                    }
                    onCloseConfirm();
                  } catch (err) {
                    showError(err as Error, "Pointage d'opération");
                  }
                }}
                className={`w-full py-3 rounded-lg text-white font-medium shadow-sm hover:opacity-90 flex items-center justify-center gap-2 ${
                  confirmModal.item?.type === "INCOME" ? "bg-emerald-600" : "bg-indigo-600"
                }`}
              >
                <Check size={20} /> Valider l'opération
              </button>
            </div>
          </div>
        </div>
      )}
      <Modal isOpen={uncheckModal.isOpen} onClose={onCloseUncheck} title="Annuler le pointage ?">
        <p className="text-sm text-slate-600 mb-6">Remettre l'opération "{uncheckModal.item?.label}" en attente ?</p>
        <div className="flex gap-2.5">
          <button onClick={onCloseUncheck} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50">
            Garder
          </button>
          <button
            onClick={async () => {
              try {
                if (uncheckModal.item) {
                  await onTogglePaid(null, uncheckModal.item.instanceId);
                }
                onCloseUncheck();
              } catch (err) {
                showError(err as Error, "Annulation du pointage");
              }
            }}
            className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            Oui, annuler
          </button>
        </div>
      </Modal>
    </>
  );
};
