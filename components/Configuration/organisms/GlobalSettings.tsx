
import React from 'react';
import { AppSettings } from '../../../types';
import { MonthlyEnvelopeCard } from '../molecules/WeeklyEnvelopeCard';
import { PeriodSettingsCard } from '../molecules/PeriodSettingsCard';
import { DatabaseConnectionCard } from '../molecules/DatabaseConnectionCard';
import { LabelManager } from '../molecules/LabelManager';

interface GlobalSettingsProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onResetConnection: () => void;
}

/**
 * Organisme orchestrant les réglages globaux.
 */
export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ settings, onUpdate, onResetConnection }) => {
  
  const updateEnvelope = (newEnv: number) => {
    onUpdate({ ...settings, monthly_envelope: newEnv });
  };

  const updatePeriod = (type: any, value: number) => {
    onUpdate({ ...settings, period_type: type, period_value: value });
  };

  const updateSavingsLabels = (labels: string[]) => {
      onUpdate({ ...settings, savings_labels: labels });
  };

  const updateVariableLabels = (labels: string[]) => {
      onUpdate({ ...settings, variable_labels: labels });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <MonthlyEnvelopeCard 
          settings={settings} 
          onUpdate={updateEnvelope} 
        />
        <PeriodSettingsCard 
          settings={settings} 
          onUpdate={updatePeriod} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <LabelManager 
            title="Libellés d'Épargne"
            labels={settings.savings_labels || []}
            onUpdate={updateSavingsLabels}
            color="emerald"
         />
         <LabelManager 
            title="Libellés d'Opérations (Variables)"
            labels={settings.variable_labels || []}
            onUpdate={updateVariableLabels}
            color="indigo"
         />
      </div>
      
      <div className="border-t border-slate-200 pt-6">
        <DatabaseConnectionCard onReset={onResetConnection} />
      </div>
    </div>
  );
};
