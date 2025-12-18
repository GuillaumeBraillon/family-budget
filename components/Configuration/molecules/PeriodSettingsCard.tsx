
import React, { useState } from 'react';
import { CalendarClock, Split, TableProperties, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { AppSettings, PeriodType } from '../../../types';

interface PeriodSettingsCardProps {
  settings: AppSettings;
  onUpdate: (type: PeriodType, value: number) => void;
}

export const PeriodSettingsCard: React.FC<PeriodSettingsCardProps> = ({ settings, onUpdate }) => {
  const [type, setType] = useState<PeriodType>(settings.period_type || 'FIXED_DAYS');
  const [val, setVal] = useState(settings.period_value || 7);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdate(type, val);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const hasChanges = type !== settings.period_type || val !== settings.period_value;

  return (
    <Card className="shadow-sm border-slate-200 h-full">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock size={18} className="text-indigo-600" />
          Découpage de l'Échéancier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PeriodOption 
            active={type === 'FIXED_DAYS'} 
            onClick={() => setType('FIXED_DAYS')}
            icon={<TableProperties size={20} />}
            label="Jours Fixes"
            desc="Blocs de X jours"
          />
          <PeriodOption 
            active={type === 'CALENDAR_WEEKS'} 
            onClick={() => setType('CALENDAR_WEEKS')}
            icon={<CalendarClock size={20} />}
            label="Calendrier"
            desc="Semaines réelles"
          />
          <PeriodOption 
            active={type === 'CUSTOM_SPLIT'} 
            onClick={() => setType('CUSTOM_SPLIT')}
            icon={<Split size={20} />}
            label="Division"
            desc="X parts égales"
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          {type === 'FIXED_DAYS' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Jours par période</label>
              <input 
                type="number" 
                min="1" max="31"
                value={val} 
                onChange={e => setVal(parseInt(e.target.value) || 7)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-500 italic">Exemple : 7 jours = 4 périodes (le reste au dernier bloc).</p>
            </div>
          )}

          {type === 'CALENDAR_WEEKS' && (
            <p className="text-sm text-slate-600 leading-relaxed py-2">
              L'échéancier suit les semaines du calendrier (lundi au dimanche). Idéal pour un suivi hebdomadaire classique.
            </p>
          )}

          {type === 'CUSTOM_SPLIT' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Nombre de divisions</label>
              <input 
                type="number" 
                min="1" max="10"
                value={val} 
                onChange={e => setVal(parseInt(e.target.value) || 2)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-500 italic">Exemple : 2 parts = Le mois divisé en deux (quatorzaine).</p>
            </div>
          )}
        </div>

        <button 
          onClick={handleSave}
          disabled={!hasChanges && !isSaved}
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
            isSaved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-100'
          }`}
        >
          {isSaved ? 'Découpage mis à jour !' : <><Save size={16} /> Enregistrer le découpage</>}
        </button>
      </CardContent>
    </Card>
  );
};

const PeriodOption: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }> = ({ active, onClick, icon, label, desc }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
      active ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
    }`}
  >
    {icon}
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-tight">{label}</p>
      <p className="text-[9px] opacity-75 whitespace-nowrap">{desc}</p>
    </div>
  </button>
);
