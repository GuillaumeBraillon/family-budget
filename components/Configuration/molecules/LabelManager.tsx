
import React, { useState } from 'react';
import { Tag, Plus, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { SavedLabel } from '../../../types';

interface LabelManagerProps {
  title: string;
  labels: SavedLabel[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  color?: 'indigo' | 'emerald' | 'amber';
}

export const LabelManager: React.FC<LabelManagerProps> = ({ title, labels = [], onAdd, onDelete, color = 'indigo' }) => {
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (newLabel.trim()) {
      onAdd(newLabel.trim());
      setNewLabel('');
    }
  };

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
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Nouveau libellé..."
                className={`flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-${color}-500 outline-none`}
            />
            <button 
                onClick={handleAdd}
                disabled={!newLabel.trim()}
                className={`bg-${color}-600 text-white p-2 rounded-lg hover:bg-${color}-700 disabled:opacity-50 transition-colors`}
            >
                <Plus size={20} />
            </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[100px] content-start bg-slate-50 p-3 rounded-xl border border-slate-100">
            {labels.map((label) => (
                <div key={label.id} className="bg-white border border-slate-200 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700 flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                    {label.name}
                    <button onClick={() => onDelete(label.id)} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                    </button>
                </div>
            ))}
            {labels.length === 0 && (
                <p className="text-xs text-slate-400 italic w-full text-center py-4">Aucun libellé configuré.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
};
