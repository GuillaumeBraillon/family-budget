
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
  className?: string; // Classe pour le conteneur des inputs (ex: pour la grille)
  layout?: 'grid' | 'stack'; // Pour gérer l'affichage si besoin
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  type,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange
}) => {
  // Filtrer les catégories selon le type (Dépense ou Revenu)
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === type);
  }, [categories, type]);

  // Récupérer les sous-catégories de la catégorie active
  const activeSubCats = useMemo(() => {
    return categories.find(c => c.name === selectedCategory)?.subCategories || [];
  }, [categories, selectedCategory]);

  // Déterminer la couleur de focus selon le type
  const focusRing = type === 'EXPENSE' ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500';

  // Effet de bord : Si la catégorie sélectionnée n'existe pas dans le type actuel (ex: switch dépense -> revenu), on reset
  useEffect(() => {
    // Si la liste filtrée n'est pas vide et que la catégorie actuelle n'est pas dedans
    if (filteredCategories.length > 0) {
      const isValid = filteredCategories.some(c => c.name === selectedCategory);
      if (!isValid) {
        // On sélectionne la première par défaut
        onCategoryChange(filteredCategories[0].name);
        onSubCategoryChange('');
      }
    } else if (filteredCategories.length === 0 && selectedCategory !== '') {
        // Cas rare : aucune catégorie définie pour ce type
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
            onSubCategoryChange(''); // Reset subcat on change
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
