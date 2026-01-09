import React from "react";
import { Session } from "@supabase/supabase-js";
import { AppSettings, PeriodType, CarryoverStrategy } from "../../../../../types";
import { MonthlyEnvelopeCard } from "../molecules/WeeklyEnvelopeCard";
import { PeriodSettingsCard } from "../molecules/PeriodSettingsCard";
import { CarryoverStrategyCard } from "../molecules/CarryoverStrategyCard";
import { DatabaseConnectionCard } from "../molecules/DatabaseConnectionCard";
import { LocalStorageManager } from "../molecules/LocalStorageManager";

interface GlobalSettingsProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onResetConnection: () => void;
  session?: Session | null;
}

/**
 * Organisme orchestrant les réglages globaux.
 */
export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ settings, onUpdate, onResetConnection, session: _session }) => {
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
      <MonthlyEnvelopeCard settings={settings} onUpdate={updateEnvelope} />
      <PeriodSettingsCard settings={settings} onUpdate={updatePeriod} />
      <CarryoverStrategyCard settings={settings} onUpdate={updateCarryoverStrategy} />

      {/* Actions système */}
      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
          <span className="text-slate-400">⚙️</span> Actions Système
        </h3>
        <div className="space-y-4">
          <LocalStorageManager />
          <DatabaseConnectionCard onReset={onResetConnection} />
        </div>
      </div>
    </div>
  );
};
