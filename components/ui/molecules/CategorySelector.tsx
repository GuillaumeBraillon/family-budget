
import React, { useMemo, useEffect } from 'react';
import { Tag, Layers } from 'lucide-react';
import { CategoryDef } from '../../../types';

interface CategorySelectorProps {
  categories: CategoryDef[];
  type?: 'EXPENSE' | 'INCOME';
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
  // Séparation pour affichage groupé (OptGroup)
  // On ne filtre plus par type pour permettre l'utilisation croisée (ex: Remboursement sur catégorie Dépense)
  const { expenseCats, incomeCats } = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    return {
        expenseCats: sorted.filter(c => c.type === 'EXPENSE'),
        incomeCats: sorted.filter(c => c.type === 'INCOME')
    };
  }, [categories]);

  // Liste plate pour la validation
  const allCats = useMemo(() => [...expenseCats, ...incomeCats], [expenseCats, incomeCats]);

  // Récupération des sous-catégories de la catégorie sélectionnée (quel que soit son type d'origine)
  const activeSubCats = useMemo(() => {
    const cat = categories.find(c => c.name === selectedCategory);
    return cat ? [...cat.subCategories].sort((a, b) => a.localeCompare(b)) : [];
  }, [categories, selectedCategory]);

  const focusRing = type === 'INCOME' ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500';

  useEffect(() => {
    // Si la catégorie sélectionnée n'existe plus dans la liste globale (ex: supprimée), on reset
    if (allCats.length > 0 && selectedCategory) {
      const isValid = allCats.some(c => c.name === selectedCategory);
      if (!isValid) {
        onCategoryChange('');
        onSubCategoryChange('');
      }
    }
  }, [allCats, selectedCategory, onCategoryChange, onSubCategoryChange]);

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
          <option value="">Aucune catégorie</option>
          {expenseCats.length > 0 && (
              <optgroup label="Dépenses">
                  {expenseCats.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
              </optgroup>
          )}
          {incomeCats.length > 0 && (
              <optgroup label="Revenus">
                  {incomeCats.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
              </optgroup>
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
