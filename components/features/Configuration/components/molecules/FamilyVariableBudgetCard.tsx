import React from "react";
import { Home, Info } from "lucide-react";
import { AppSettings } from "../../../../../types";
import { MobileTooltip } from "../../../../ui/MobileTooltip";

interface FamilyVariableBudgetCardProps {
  settings: AppSettings;
  onUpdateFamilyVariableBudget: (amount: number) => void;
}

export const FamilyVariableBudgetCard: React.FC<FamilyVariableBudgetCardProps> = ({ settings, onUpdateFamilyVariableBudget }) => {
  const familyVariableBudget = settings.family_variable_budget || 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Home size={20} className="text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Budget variable Famille</h3>
            <MobileTooltip
              text="Montant mensuel alloué aux dépenses variables ventilées sur le bénéficiaire Famille. Ce montant est ensuite réparti automatiquement selon le nombre de périodes de l'échéancier. Les montants Extra sont exclus."
              icon={<Info size={14} className="text-slate-600 hover:text-slate-800" />}
              widthClass="w-72"
            />
          </div>
          <p className="text-xs text-slate-500">Montant mensuel (répartition automatique par période)</p>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Montant mensuel</label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="10"
            value={familyVariableBudget}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value) && value >= 0) {
                onUpdateFamilyVariableBudget(value);
              }
            }}
            className="w-full p-2.5 pr-8 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">€</span>
        </div>
        <p className="text-[11px] text-slate-500">Utilisé dans Balances : montant mensuel réparti automatiquement selon le découpage des périodes.</p>
      </div>
    </div>
  );
};
