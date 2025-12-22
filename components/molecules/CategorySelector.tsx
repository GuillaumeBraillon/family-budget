
import React, { useMemo, useEffect } from 'react';
import { Tag, Layers } from 'lucide-react';
import { CategoryDef } from '../../../types';

interface CategorySelectorProps {
  categories: CategoryDef[];
  type: 'EXPENSE' | 'INCOME';
  selectedCategory: string;
  selectedSubCategory: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (subCategory: string) => void;
  className?: string; 
  layout?: 'grid' | 'stack';
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  type,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange
}) => {
  // Filtrer et TRIER les catégories par ordre alphabétique
  const filteredCategories = useMemo(() => {
    return [...categories]
      .filter(c => c.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, type]);

  // Récupérer et TRIER les sous-catégories de la catégorie active
  const activeSubCats = useMemo(() => {
    const subs = categories.find(c => c.name === selectedCategory)?.subCategories || [];
    return [...subs].sort((a, b) => a.localeCompare(b));
  }, [categories, selectedCategory]);

  const focusRing = type === 'EXPENSE' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500';

  useEffect(() => {
    if (filteredCategories.length > 0) {
      const isValid = filteredCategories.some(c => c.name === selectedCategory);
      if (!isValid) {
        onCategoryChange(filteredCategories[0].name);
        onSubCategoryChange('');
      }
    } else if (filteredCategories.length === 0 && selectedCategory !== '') {
        onCategoryChange('');
        onSubCategoryChange('');
    }
  }, [type, filteredCategories, selectedCategory, onCategoryChange, onSubCategoryChange]);

  return (
    <>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
          <Tag size={12} /> Catégorie
        </label>
        <select
          value={selectedCategory}
          onChange={e => {
            onCategoryChange(e.target.value);
            onSubCategoryChange(''); 
          }}
          className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 outline-none ${focusRing}`}
        >
          {filteredCategories.length > 0 ? (
            filteredCategories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))
          ) : (
            <option value="">Aucune catégorie</option>
          )}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1">
          <Layers size={12} /> Sous-catégorie
        </label>
        <select
          value={selectedSubCategory}
          onChange={e => onSubCategoryChange(e.target.value)}
          className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 outline-none ${focusRing} disabled:bg-slate-50 disabled:text-slate-400`}
          disabled={activeSubCats.length === 0}
        >
          <option value="">{activeSubCats.length === 0 ? '-- Aucune --' : '-- Optionnel --'}</option>
          {activeSubCats.map(sc => (
            <option key={sc} value={sc}>{sc}</option>
          ))}
        </select>
      </div>
    </>
  );
};