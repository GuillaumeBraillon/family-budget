import React, { useState } from "react";
import { User, Plus, X, AlertCircle } from "lucide-react";
import { BeneficiaryAmount, Person } from "../../../types";

interface BeneficiaryAmountSelectorProps {
  people: Person[];
  totalAmount: number;
  selectedBeneficiaryAmounts: BeneficiaryAmount[];
  onBeneficiaryAmountsChange: (beneficiaryAmounts: BeneficiaryAmount[]) => void;
}

export const BeneficiaryAmountSelector: React.FC<BeneficiaryAmountSelectorProps> = ({
  people,
  totalAmount,
  selectedBeneficiaryAmounts,
  onBeneficiaryAmountsChange,
}) => {
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");

  const totalAllocated = selectedBeneficiaryAmounts.reduce((sum, ba) => sum + ba.amount, 0);
  const remaining = totalAmount - totalAllocated;
  const hasError = remaining < -0.01;

  const usedBeneficiaryIds = selectedBeneficiaryAmounts.map((ba) => ba.beneficiaryId);
  const availablePeople = people.filter((person) => !usedBeneficiaryIds.includes(person.id));

  const handleAddBeneficiary = () => {
    if (!selectedBeneficiaryId) return;

    const newBeneficiaryAmount: BeneficiaryAmount = {
      beneficiaryId: selectedBeneficiaryId,
      amount: remaining > 0 ? remaining : 0,
    };

    onBeneficiaryAmountsChange([...selectedBeneficiaryAmounts, newBeneficiaryAmount]);
    setSelectedBeneficiaryId("");
    setShowAddBeneficiary(false);
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
          <User size={12} />
          Ventilation bénéficiaires
        </label>
        {selectedBeneficiaryAmounts.length > 1 && (
          <button type="button" onClick={handleDistributeEqually} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            Répartir équitablement
          </button>
        )}
      </div>

      {selectedBeneficiaryAmounts.length > 0 && (
        <div className="space-y-1.5">
          {selectedBeneficiaryAmounts.map((beneficiaryAmount) => {
            const person = people.find((p) => p.id === beneficiaryAmount.beneficiaryId);
            if (!person) return null;

            return (
              <div key={person.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-sm text-slate-700 flex-1">
                  {person.name} {person.isChild ? "(Enfant)" : ""}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={beneficiaryAmount.amount}
                  onChange={(e) => handleAmountChange(person.id, parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-sm border border-slate-300 rounded bg-white text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">€</span>
                <button
                  type="button"
                  onClick={() => handleRemoveBeneficiary(person.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`Retirer ${person.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-600">Montant total :</span>
          <span className="font-bold text-slate-900">{totalAmount.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Affecté aux bénéficiaires :</span>
          <span className={`font-bold ${hasError ? "text-amber-600" : "text-emerald-600"}`}>{totalAllocated.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-1">
          <span className="text-slate-600">Reste non ventilé :</span>
          <span className={`font-bold ${remaining < -0.01 ? "text-rose-600" : remaining > 0.01 ? "text-blue-600" : "text-emerald-600"}`}>
            {remaining.toFixed(2)} €
          </span>
        </div>
      </div>

      {hasError && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-start gap-2">
          <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-rose-700">La somme ventilée dépasse le montant total de l'opération.</p>
        </div>
      )}

      {!showAddBeneficiary && availablePeople.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAddBeneficiary(true)}
          className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Ajouter un bénéficiaire
        </button>
      )}

      {showAddBeneficiary && (
        <div className="flex gap-2">
          <select
            value={selectedBeneficiaryId}
            onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
            className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            autoFocus
          >
            <option value="">Sélectionner un bénéficiaire</option>
            {availablePeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} {person.isChild ? "(Enfant)" : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddBeneficiary}
            disabled={!selectedBeneficiaryId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => setShowAddBeneficiary(false)}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
