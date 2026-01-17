import React from "react";
import { Session } from "@supabase/supabase-js";
import { AppSettings, PeriodType, CarryoverStrategy } from "../../../../../types";
import { MonthlyEnvelopeCard } from "../molecules/WeeklyEnvelopeCard";
import { PeriodSettingsCard } from "../molecules/PeriodSettingsCard";
import { CarryoverStrategyCard } from "../molecules/CarryoverStrategyCard";

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
 * - Enveloppe mensuelle (budget total alloué)
 * - Découpage des périodes (semaines, jours fixes, parts égales)
 * - Stratégie de gestion des dépassements (déduction simple vs étalement)
 *
 * @param {Object} props - Props du composant
 * @param {AppSettings} props.settings - Paramètres globaux de l'application
 * @param {Function} props.onUpdate - Callback pour mettre à jour les paramètres
 * @param {Session | null} [props.session] - Session utilisateur Supabase (non utilisée actuellement)
 */
export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ settings, onUpdate, session: _session }) => {
  const updateEnvelope = (newEnv: number) => {
    onUpdate({ ...settings, monthly_envelope: newEnv });
  };

  const updatePeriod = (type: PeriodType, value: number) => {
    onUpdate({ ...settings, period_type: type, period_value: value });
  };

  const updateCarryoverStrategy = (strategy: CarryoverStrategy) => {
    onUpdate({ ...settings, carryover_strategy: strategy });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Configuration budgétaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthlyEnvelopeCard settings={settings} onUpdate={updateEnvelope} />
        <CarryoverStrategyCard settings={settings} onUpdate={updateCarryoverStrategy} />
      </div>
      <PeriodSettingsCard settings={settings} onUpdate={updatePeriod} />
    </div>
  );
};
