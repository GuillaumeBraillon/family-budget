
import React, { useState } from 'react';
import { Info, Save, Euro, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { AppSettings } from '../../../types';

interface MonthlyEnvelopeCardProps {
  settings: AppSettings;
  onUpdate: (newEnv: number) => void;
}

export const MonthlyEnvelopeCard: React.FC<MonthlyEnvelopeCardProps> = ({ settings, onUpdate }) => {
  const [value, setValue] = useState(settings.monthly_envelope);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdate(value);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <Card className="shadow-sm border-slate-200 h-full">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="text-base flex items-center gap-2">
          <Euro size={18} className="text-indigo-600" />
          Budget Variable Mensuel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="number" 
                value={value} 
                onChange={e => setValue(parseFloat(e.target.value) || 0)}
                className="w-full p-3 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold text-slate-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">€</span>
            </div>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-start gap-2">
             <Layers size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
             <p className="text-[11px] text-indigo-800 leading-relaxed italic">
               Ce montant mensuel sera <strong>automatiquement réparti</strong> entre vos périodes de l'échéancier au prorata du nombre de jours de chaque période.
             </p>
          </div>

          <p className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-relaxed">
            <Info size={14} className="mt-0.5 flex-shrink-0 text-indigo-500" />
            Couvre vos dépenses variables du foyer (courses, tabac, sorties, imprévus).
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={value === settings.monthly_envelope && !isSaved}
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
            isSaved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-100'
          }`}
        >
          {isSaved ? 'Enregistré !' : <><Save size={16} /> Enregistrer le budget mensuel</>}
        </button>
      </CardContent>
    </Card>
  );
};
