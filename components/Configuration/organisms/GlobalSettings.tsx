
import React, { useState } from 'react';
import { Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { AppSettings } from '../../../types';

interface GlobalSettingsProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ settings, onUpdate }) => {
  const [value, setValue] = useState(settings.weekly_envelope);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate({ weekly_envelope: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Configurations Générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enveloppe Hebdomadaire (Couple)
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={value} 
                onChange={e => setValue(parseFloat(e.target.value) || 0)}
                className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-slate-900"
              />
              <span className="text-xl font-bold text-slate-400">€</span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info size={12} /> Ce montant sert de base de calcul pour le suivi des dépenses variables sur le Dashboard.
            </p>
          </div>

          <button 
            onClick={handleSave}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {saved ? 'Enregistré !' : <><Save size={18} /> Sauvegarder les paramètres</>}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
