
import React, { useState } from 'react';
import { Tag, Plus, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { AppSettings } from '../../../types';

interface SavingsLabelManagerProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

export const SavingsLabelManager: React.FC<SavingsLabelManagerProps> = ({ settings, onUpdate }) => {
  const [labels, setLabels] = useState<string[]>(settings.savings_labels || []);
  const [newLabel, setNewLabel] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel('');
      setIsSaved(false);
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setLabels(labels.filter(l => l !== labelToRemove));
    setIsSaved(false);
  };

  const handleSave = () => {
    onUpdate({ ...settings, savings_labels: labels });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const hasChanges = JSON.stringify(labels) !== JSON.stringify(settings.savings_labels || []);

  return (
    <Card className="shadow-sm border-slate-200 h-full">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag size={18} className="text-indigo-600" />
          Libellés d'épargne
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLabel()}
                placeholder="Nouveau libellé..."
                className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button 
                onClick={addLabel}
                disabled={!newLabel.trim()}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
                <Plus size={20} />
            </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[100px] content-start bg-slate-50 p-3 rounded-xl border border-slate-100">
            {labels.map((label, idx) => (
                <div key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700 flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                    {label}
                    <button onClick={() => removeLabel(label)} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                    </button>
                </div>
            ))}
            {labels.length === 0 && (
                <p className="text-xs text-slate-400 italic w-full text-center py-4">Aucun libellé configuré.</p>
            )}
        </div>

        <button 
          onClick={handleSave}
          disabled={!hasChanges && !isSaved}
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
            isSaved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-100'
          }`}
        >
          {isSaved ? 'Liste enregistrée !' : <><Save size={16} /> Enregistrer la liste</>}
        </button>
      </CardContent>
    </Card>
  );
};