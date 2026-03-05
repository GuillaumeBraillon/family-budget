import React from "react";
import { Session } from "@supabase/supabase-js";
import { AppSettings, PeriodType } from "../../../../../types";
import { PeriodSettingsCard } from "../molecules/PeriodSettingsCard";
import { BudgetModeCard } from "../molecules/BudgetModeCard";
import { FamilyVariableBudgetCard } from "../molecules/FamilyVariableBudgetCard";

interface GlobalSettingsProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  session?: Session | null;
}

/**
 * Composant de configuration budgétaire et des périodes.
 *
 * @description
 * Regroupe les paramètres liés à la gestion budgétaire :
 * - Montant mensuel du budget personnel par bénéficiaire (ALLOWANCE)
 * - Découpage des périodes (semaines, jours fixes, parts égales)
 *
 * @param {Object} props - Props du composant
 * @param {AppSettings} props.settings - Paramètres globaux de l'application
 * @param {Function} props.onUpdate - Callback pour mettre à jour les paramètres
 * @param {Session | null} [props.session] - Session utilisateur Supabase (non utilisée actuellement)
 */
export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ settings, onUpdate, session: _session }) => {
  const updatePeriod = (type: PeriodType, value: number) => {
    onUpdate({ ...settings, period_type: type, period_value: value });
  };

  const updateAllowanceAmount = (allowanceAmount: number) => {
    onUpdate({ ...settings, personal_budget_amount: allowanceAmount });
  };

  const updateFamilyVariableBudget = (familyVariableBudget: number) => {
    onUpdate({ ...settings, family_variable_budget: familyVariableBudget });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Configuration budgétaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BudgetModeCard settings={settings} onUpdateAllowanceAmount={updateAllowanceAmount} />
        <FamilyVariableBudgetCard settings={settings} onUpdateFamilyVariableBudget={updateFamilyVariableBudget} />
      </div>
      <PeriodSettingsCard settings={settings} onUpdate={updatePeriod} />
    </div>
  );
};
