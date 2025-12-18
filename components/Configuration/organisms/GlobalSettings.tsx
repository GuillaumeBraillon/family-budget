
import React from 'react';
import { AppSettings } from '../../../types';
import { WeeklyEnvelopeCard } from '../molecules/WeeklyEnvelopeCard';
import { PeriodSettingsCard } from '../molecules/PeriodSettingsCard';

interface GlobalSettingsProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

/**
 * Organisme orchestrant les réglages globaux de l'application.
 * Affiche les cartes de configuration horizontalement sur desktop et verticalement sur mobile.
 */
export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ settings, onUpdate }) => {
  
  const updateEnvelope = (newEnv: number) => {
    onUpdate({ ...settings, weekly_envelope: newEnv });
  };

  const updatePeriod = (type: any, value: number) => {
    onUpdate({ ...settings, period_type: type, period_value: value });
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12 animate-in fade-in duration-500 items-start">
      {/* Carte 1 : Enveloppe Hebdomadaire */}
      <div className="h-full">
        <WeeklyEnvelopeCard 
          settings={settings} 
          onUpdate={updateEnvelope} 
        />
      </div>

      {/* Carte 2 : Découpage de l'Échéancier */}
      <div className="h-full">
        <PeriodSettingsCard 
          settings={settings} 
          onUpdate={updatePeriod} 
        />
      </div>
    </div>
  );
};
