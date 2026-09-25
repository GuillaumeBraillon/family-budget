import React from "react";
import { User, X, AlertCircle, Equal } from "lucide-react";
import { BeneficiaryAmount, Person } from "../../../types";

interface BeneficiaryAmountSelectorProps {
  people: Person[];
  totalAmount: number;
  selectedBeneficiaryAmounts: BeneficiaryAmount[];
  onBeneficiaryAmountsChange: (beneficiaryAmounts: BeneficiaryAmount[]) => void;
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const BeneficiaryAmountSelector: React.FC<BeneficiaryAmountSelectorProps> = ({
  people,
  totalAmount,
  selectedBeneficiaryAmounts,
  onBeneficiaryAmountsChange,
}) => {
  const totalAllocated = selectedBeneficiaryAmounts.reduce((sum, ba) => sum + ba.amount, 0);
  const remaining = totalAmount - totalAllocated;
  const hasError = remaining < -0.01;
  const isComplete = Math.abs(remaining) <= 0.01 && totalAmount > 0;
  const allocationRatio = totalAmount > 0 ? Math.min(100, Math.max(0, (totalAllocated / totalAmount) * 100)) : 0;

  const usedBeneficiaryIds = selectedBeneficiaryAmounts.map((ba) => ba.beneficiaryId);
  const availablePeople = people.filter((person) => !usedBeneficiaryIds.includes(person.id));

  const handleAddBeneficiary = (beneficiaryId: string) => {
    const newBeneficiaryAmount: BeneficiaryAmount = {
      beneficiaryId,
      amount: remaining > 0 ? parseFloat(remaining.toFixed(2)) : 0,
    };

    onBeneficiaryAmountsChange([...selectedBeneficiaryAmounts, newBeneficiaryAmount]);
  };

  const handleRemoveBeneficiary = (beneficiaryId: string) => {
    onBeneficiaryAmountsChange(selectedBeneficiaryAmounts.filter((ba) => ba.beneficiaryId !== beneficiaryId));
  };

  const handleAmountChange = (beneficiaryId: string, newAmount: number) => {
    onBeneficiaryAmountsChange(selectedBeneficiaryAmounts.map((ba) => (ba.beneficiaryId === beneficiaryId ? { ...ba, amount: newAmount } : ba)));
  };

  const handleDistributeEqually = () => {
    if (selectedBeneficiaryAmounts.length === 0) return;
    const amountPerBeneficiary = totalAmount / selectedBeneficiaryAmounts.length;
    onBeneficiaryAmountsChange(selectedBeneficiaryAmounts.map((ba) => ({ ...ba, amount: parseFloat(amountPerBeneficiary.toFixed(2)) })));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
          <User size={12} />
          Ventilation bénéficiaires
        </label>
        {selectedBeneficiaryAmounts.length > 1 && (
          <button
            type="button"
            onClick={handleDistributeEqually}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <Equal size={12} />
            Répartir équitablement
          </button>
        )}
      </div>

      {selectedBeneficiaryAmounts.length > 0 && (
        <div className="space-y-1.5">
          {selectedBeneficiaryAmounts.map((beneficiaryAmount) => {
            const person = people.find((p) => p.id === beneficiaryAmount.beneficiaryId);
            // Bénéficiaire orphelin (personne supprimée/introuvable) : affiché quand même pour rester visible et corrigeable.
            const displayName = person ? person.name : `Bénéficiaire inconnu`;
            const share = totalAmount > 0 ? (beneficiaryAmount.amount / totalAmount) * 100 : 0;

            return (
              <div
                key={beneficiaryAmount.beneficiaryId}
                className={`flex items-center gap-2.5 rounded-lg border bg-white px-2.5 py-2 ${person ? "border-slate-200" : "border-amber-200 bg-amber-50"}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    person ? "bg-indigo-50 text-indigo-600" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {person ? initials(person.name) || "?" : "?"}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold truncate ${person ? "text-slate-800" : "text-amber-700 italic"}`}>{displayName}</span>
                    {person?.isChild && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">Enfant</span>
                    )}
                  </div>
                  {totalAmount > 0 && <span className="text-[10px] font-medium text-slate-400">{share.toFixed(0)}% du montant</span>}
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={beneficiaryAmount.amount}
                    onChange={(e) => handleAmountChange(beneficiaryAmount.beneficiaryId, parseFloat(e.target.value) || 0)}
                    className="w-[6.5rem] pl-2.5 pr-7 py-1.5 text-sm font-bold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">€</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBeneficiary(beneficiaryAmount.beneficiaryId)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                  aria-label={`Retirer ${displayName}`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className={`${selectedBeneficiaryAmounts.length > 0 ? "mt-2.5 pt-2.5 border-t border-slate-200" : ""} space-y-1.5`}>
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-slate-500">
            {totalAllocated.toFixed(2)} € / {totalAmount.toFixed(2)} €
          </span>
          <span className={hasError ? "text-rose-600" : isComplete ? "text-emerald-600" : remaining > 0.01 ? "text-indigo-600" : "text-slate-500"}>
            {hasError ? `Dépassement ${Math.abs(remaining).toFixed(2)} €` : isComplete ? "Ventilé" : `Reste ${remaining.toFixed(2)} €`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${hasError ? "bg-rose-500" : isComplete ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ width: `${hasError ? 100 : allocationRatio}%` }}
          />
        </div>
      </div>

      {hasError && (
        <div className="mt-2.5 bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-start gap-2">
          <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-rose-700">La somme ventilée dépasse le montant total de l'opération.</p>
        </div>
      )}

      {availablePeople.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 ${selectedBeneficiaryAmounts.length > 0 || hasError ? "mt-2.5 pt-2.5 border-t border-slate-200" : ""}`}>
          {availablePeople.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => handleAddBeneficiary(person.id)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              + {person.name}
              {person.isChild ? " (Enfant)" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
