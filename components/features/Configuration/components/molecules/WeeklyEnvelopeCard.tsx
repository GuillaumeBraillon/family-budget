import React, { useState } from "react";
import { Euro, InfoIcon } from "lucide-react";
import { AppSettings } from "../../../../../types";
import { InfoBox } from "@/components/ui/InfoBox";

interface MonthlyEnvelopeCardProps {
  settings: AppSettings;
  onUpdate: (newEnv: number) => void;
}

export const MonthlyEnvelopeCard: React.FC<MonthlyEnvelopeCardProps> = ({ settings, onUpdate }) => {
  const [value, setValue] = useState(settings.monthly_envelope);

  const handleValueChange = (newVal: string) => {
    const numValue = parseFloat(newVal) || 0;
    setValue(numValue);

    // Appliquer immédiatement si valeur valide et positive
    if (numValue > 0) {
      onUpdate(numValue);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Euro size={20} className="text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900">Budget Variable Mensuel</h3>
          <p className="text-xs text-slate-500">Montant réparti entre les périodes en fonction du Découpage de l'Échéancier.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <InfoBox
            title="Couvre vos dépenses variables du foyer :"
            description="Courses alimentaires, tabac, sorties & loisirs, petits imprévus du quotidien."
            icon={<InfoIcon size={18} />}
          />
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                step="100"
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-full p-3 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold text-slate-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
