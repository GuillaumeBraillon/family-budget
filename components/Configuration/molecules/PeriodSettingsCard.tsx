
import React, { useState, useEffect } from 'react';
import { CalendarClock, Split, TableProperties, Save, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { AppSettings, PeriodType } from '../../../types';

interface PeriodSettingsCardProps {
  settings: AppSettings;
  onUpdate: (type: PeriodType, value: number) => void;
}

export const PeriodSettingsCard: React.FC<PeriodSettingsCardProps> = ({ settings, onUpdate }) => {
  const [type, setType] = useState<PeriodType>(settings.period_type || 'FIXED_DAYS');
  // Utilisation de string pour permettre de vider l'input (suppression caractère par caractère)
  const [val, setVal] = useState<string>(String(settings.period_value || 7));
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Synchronisation si les props changent (ex: après un reset global)
    setType(settings.period_type || 'FIXED_DAYS');
    setVal(String(settings.period_value || 7));
  }, [settings]);

  const handleSave = () => {
    // Fallback de sécurité si l'input est vide
    const defaultValue = type === 'FIXED_DAYS' ? 7 : 2;
    const numValue = parseInt(val) || defaultValue;
    
    onUpdate(type, numValue);
    setVal(String(numValue)); // On remet une valeur propre
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const hasChanges = type !== settings.period_type || parseInt(val) !== settings.period_value;

  // Réinitialisation de la valeur par défaut si changement de type drastique (optionnel mais meilleur UX)
  const handleTypeChange = (newType: PeriodType) => {
      setType(newType);
      // Si on passe à Division et que la valeur est > 10, on remet à 2 pour éviter les incohérences
      if (newType === 'CUSTOM_SPLIT' && parseInt(val) > 10) {
          setVal("2");
      }
      // Si on passe à Jours Fixes et valeur < 1, on remet à 7
      if (newType === 'FIXED_DAYS' && parseInt(val) < 1) {
          setVal("7");
      }
  };

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
            onClick={() => handleTypeChange('FIXED_DAYS')}
            icon={<TableProperties size={20} />}
            label="Jours Fixes"
            desc="Blocs constants"
          />
          <PeriodOption 
            active={type === 'CALENDAR_WEEKS'} 
            onClick={() => handleTypeChange('CALENDAR_WEEKS')}
            icon={<CalendarClock size={20} />}
            label="Calendrier"
            desc="Lundi au Dimanche"
          />
          <PeriodOption 
            active={type === 'CUSTOM_SPLIT'} 
            onClick={() => handleTypeChange('CUSTOM_SPLIT')}
            icon={<Split size={20} />}
            label="Division"
            desc="X parts égales"
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          {type === 'FIXED_DAYS' && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                 <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                 <p className="text-xs text-slate-600 leading-relaxed">
                    Découpe le mois en blocs de <strong>X jours</strong>, peu importe le jour de la semaine.<br/>
                    <span className="italic text-slate-500">Exemple (7 jours) : Période 1 du 1er au 7, Période 2 du 8 au 14, etc.</span>
                 </p>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Durée d'une période (Jours)</label>
                <input 
                    type="number" 
                    min="1" max="31"
                    value={val} 
                    onChange={e => setVal(e.target.value)}
                    className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {type === 'CALENDAR_WEEKS' && (
            <div className="space-y-3">
                <div className="flex items-start gap-2">
                    <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Suit les semaines civiles du calendrier (Lundi au Dimanche). Idéal pour gérer vos courses hebdomadaires.
                    </p>
                </div>
                <div className="flex items-start gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-800">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] leading-tight">
                        <strong>Attention :</strong> La première et la dernière période du mois peuvent être incomplètes (ex: 2 jours si le mois commence un samedi), ce qui réduira proportionnellement leur budget alloué.
                    </p>
                </div>
            </div>
          )}

          {type === 'CUSTOM_SPLIT' && (
            <div className="space-y-3">
                <div className="flex items-start gap-2">
                    <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                        Divise le mois en <strong>X parties égales</strong> (autant que possible).<br/>
                        <span className="italic text-slate-500">Exemple (2 parts) : Le mois est coupé en deux (quinzaine).</span>
                    </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Nombre de divisions</label>
                    <input 
                        type="number" 
                        min="1" max="10"
                        value={val} 
                        onChange={e => setVal(e.target.value)}
                        className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
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
