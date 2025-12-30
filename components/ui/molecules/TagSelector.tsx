
import React from 'react';
import { Tag as TagIcon, Plus, X } from 'lucide-react';
import { Tag } from '../../../types';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  readOnly?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ tags, selectedTagIds, onToggleTag, readOnly = false }) => {
  if (tags.length === 0 && readOnly) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {!readOnly && (
        <span className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1 mr-1">
          <TagIcon size={12} /> Tags
        </span>
      )}
      
      {tags.map(tag => {
        const isSelected = selectedTagIds.includes(tag.id);
        if (readOnly && !isSelected) return null;

        // Styles dynamiques basés sur la couleur du tag
        // Note: pour simplifier on utilise des couleurs prédéfinies, ou on injecte le style hex
        const activeStyle = {
            backgroundColor: isSelected ? tag.color : 'transparent',
            borderColor: isSelected ? tag.color : '#e2e8f0', // slate-200
            color: isSelected ? '#ffffff' : '#64748b', // slate-500
        };

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => !readOnly && onToggleTag(tag.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'}`}
            style={activeStyle}
          >
            {tag.name}
            {!readOnly && isSelected && <X size={10} />}
            {!readOnly && !isSelected && <Plus size={10} />}
          </button>
        );
      })}
      
      {tags.length === 0 && !readOnly && (
          <span className="text-xs text-slate-400 italic">Aucun tag disponible. Ajoutez-en dans les paramètres.</span>
      )}
    </div>
  );
};
