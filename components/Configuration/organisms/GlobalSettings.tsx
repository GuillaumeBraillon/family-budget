
import React, { useState } from 'react';
import { Save, Info, CalendarClock, Split, TableProperties } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { AppSettings, PeriodType } from '../../../types';

interface GlobalSettingsProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ settings, onUpdate }) => {
  const [envValue, setEnvValue] = useState(settings.weekly_envelope);
  const [periodType, setPeriodType] = useState<PeriodType>(settings.period_type || 'FIXED_DAYS');
  const [periodValue, setPeriodValue] = useState(settings.period_value || 7);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate({ 
        weekly_envelope: envValue,
        period_type: periodType,
        period_value: periodValue
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Configurations Générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* SECTION ENVELOPPE */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              Enveloppe Hebdomadaire (Couple)
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                value={envValue} 
                onChange={e => setEnvValue(parseFloat(e.target.value) || 0)}
                className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-slate-900"
              />
              <span className="text-xl font-bold text-slate-400">€</span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info size={12} /> Utilisé pour le suivi des dépenses variables (Alimentation, Loisirs, etc.)
            </p>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* SECTION DÉCOUPAGE */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Découpage de l'Échéancier
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <PeriodOption 
                    active={periodType === 'FIXED_DAYS'} 
                    onClick={() => setPeriodType('FIXED_DAYS')}
                    icon={<TableProperties size={20} />}
                    label="Jours Fixes"
                    desc="Blocs de X jours"
                />
                <PeriodOption 
                    active={periodType === 'CALENDAR_WEEKS'} 
                    onClick={() => setPeriodType('CALENDAR_WEEKS')}
                    icon={<CalendarClock size={20} />}
                    label="Calendrier"
                    desc="Semaines réelles"
                />
                <PeriodOption 
                    active={periodType === 'CUSTOM_SPLIT'} 
                    onClick={() => setPeriodType('CUSTOM_SPLIT')}
                    icon={<Split size={20} />}
                    label="Division"
                    desc="X parts égales"
                />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {periodType === 'FIXED_DAYS' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Nombre de jours par période</label>
                        <input 
                            type="number" 
                            min="1" max="31"
                            value={periodValue} 
                            onChange={e => setPeriodValue(parseInt(e.target.value) || 7)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                        <p className="text-[10px] text-slate-500">Exemple : 7 jours = 4 périodes de 7 jours, le reste au dernier bloc.</p>
                    </div>
                )}

                {periodType === 'CALENDAR_WEEKS' && (
                    <div className="text-sm text-slate-600">
                        L'échéancier suivra les semaines du calendrier (lundi au dimanche). Le nombre de périodes variera automatiquement selon le mois (4, 5 ou 6).
                    </div>
                )}

                {periodType === 'CUSTOM_SPLIT' && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Nombre de divisions du mois</label>
                        <input 
                            type="number" 
                            min="1" max="10"
                            value={periodValue} 
                            onChange={e => setPeriodValue(parseInt(e.target.value) || 2)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                        />
                        <p className="text-[10px] text-slate-500">Exemple : 2 parts = Le mois divisé en deux (quatorzaine).</p>
                    </div>
                )}
            </div>
          </div>

          <button 
            onClick={handleSave}
            className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {saved ? 'Paramètres mis à jour !' : <><Save size={18} /> Enregistrer les réglages</>}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

const PeriodOption: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }> = ({ active, onClick, icon, label, desc }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
            active ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
        }`}
    >
        {icon}
        <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-tight">{label}</p>
            <p className="text-[9px] opacity-75">{desc}</p>
        </div>
    </button>
);
