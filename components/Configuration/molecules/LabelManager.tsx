
import React, { useState } from 'react';
import { Tag, Plus, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';

interface LabelManagerProps {
  title: string;
  labels: string[];
  onUpdate: (newLabels: string[]) => void;
  color?: 'indigo' | 'emerald' | 'amber';
}

export const LabelManager: React.FC<LabelManagerProps> = ({ title, labels = [], onUpdate, color = 'indigo' }) => {
  const [localLabels, setLocalLabels] = useState<string[]>(labels);
  const [newLabel, setNewLabel] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Synchronisation si les props changent (ex: chargement initial)
  React.useEffect(() => {
    setLocalLabels(labels);
  }, [labels]);

  const addLabel = () => {
    if (newLabel.trim() && !localLabels.includes(newLabel.trim())) {
      setLocalLabels([...localLabels, newLabel.trim()]);
      setNewLabel('');
      setIsSaved(false);
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setLocalLabels(localLabels.filter(l => l !== labelToRemove));
    setIsSaved(false);
  };

  const handleSave = () => {
    onUpdate(localLabels);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const hasChanges = JSON.stringify(localLabels) !== JSON.stringify(labels);
  const btnColor = isSaved ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800';

  return (
    <Card className="shadow-sm border-slate-200 h-full">
      <CardHeader className="bg-slate-50/50">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag size={18} className={`text-${color}-600`} />
          {title}
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
                className={`flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-${color}-500 outline-none`}
            />
            <button 
                onClick={addLabel}
                disabled={!newLabel.trim()}
                className={`bg-${color}-600 text-white p-2 rounded-lg hover:bg-${color}-700 disabled:opacity-50 transition-colors`}
            >
                <Plus size={20} />
            </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[100px] content-start bg-slate-50 p-3 rounded-xl border border-slate-100">
            {localLabels.map((label, idx) => (
                <div key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700 flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                    {label}
                    <button onClick={() => removeLabel(label)} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                    </button>
                </div>
            ))}
            {localLabels.length === 0 && (
                <p className="text-xs text-slate-400 italic w-full text-center py-4">Aucun libellé configuré.</p>
            )}
        </div>

        <button 
          onClick={handleSave}
          disabled={!hasChanges && !isSaved}
          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-100 ${btnColor}`}
        >
          {isSaved ? 'Liste enregistrée !' : <><Save size={16} /> Enregistrer la liste</>}
        </button>
      </CardContent>
    </Card>
  );
};
