
import React, { useState } from 'react';
import { Tag as TagIcon, Save, Trash2, Plus } from 'lucide-react';
import { Tag } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { ConfirmModal } from '../atoms/ConfirmModal';

interface TagManagerProps {
  tags: Tag[];
  onUpsertTag: (tag: Tag) => void;
  onDeleteTag: (id: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#64748b', // slate
];

export const TagManager: React.FC<TagManagerProps> = ({ tags, onUpsertTag, onDeleteTag }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTag: Tag = {
      id: `tag_${Date.now()}`,
      name: name.trim(),
      color: selectedColor
    };
    onUpsertTag(newTag);
    setName('');
    // Rotation couleur simple
    const nextColorIndex = (PRESET_COLORS.indexOf(selectedColor) + 1) % PRESET_COLORS.length;
    setSelectedColor(PRESET_COLORS[nextColorIndex]);
  };

  return (
    <div className="space-y-4">
      <ConfirmModal 
        isOpen={!!deleteConfirm}
        title="Supprimer le tag ?"
        message="Cette action retirera ce tag de toutes les opérations associées."
        onConfirm={() => { if(deleteConfirm) onDeleteTag(deleteConfirm); setDeleteConfirm(null); }}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-base flex items-center gap-2">
            <TagIcon size={18} className="text-indigo-600" />
            Gestion des Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
             <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Nouveau Tag</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ex: Vacances, Noël..."
                        className="flex-1 p-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button 
                        type="submit"
                        disabled={!name.trim()}
                        className="bg-indigo-600 text-white px-4 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Ajouter
                    </button>
                </div>
             </div>
             
             <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Couleur</label>
                <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-slate-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
             </div>
          </form>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Tags existants</label>
             <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <div 
                        key={tag.id}
                        className="pl-3 pr-2 py-1.5 rounded-lg border flex items-center gap-2 text-white text-sm font-bold shadow-sm animate-in zoom-in duration-200"
                        style={{ backgroundColor: tag.color, borderColor: tag.color }}
                    >
                        {tag.name}
                        <button 
                            onClick={() => setDeleteConfirm(tag.id)}
                            className="p-1 hover:bg-white/20 rounded-md transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {tags.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Aucun tag créé.</p>
                )}
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
