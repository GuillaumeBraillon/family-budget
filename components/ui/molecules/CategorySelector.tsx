
import React, { useMemo } from 'react';
import { Tag, Layers } from 'lucide-react';
import { CategoryDef } from '../../../types';
import { SearchableTextInput, SelectInput } from './FormInputs';

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
  
  // Génération de la liste des suggestions
  // On privilégie l'affichage des catégories du type actif (ex: Revenus) en premier
  const suggestions = useMemo(() => {
    let sortedCats = [...categories];
    
    if (type) {
        sortedCats.sort((a, b) => {
            // Mettre les catégories du bon type en tête de liste
            if (a.type === type && b.type !== type) return -1;
            if (a.type !== type && b.type === type) return 1;
            return a.name.localeCompare(b.name);
        });
    } else {
        sortedCats.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return sortedCats.map(c => c.name);
  }, [categories, type]);

  // Récupération des sous-catégories si la catégorie saisie existe déjà dans les paramètres
  const activeSubCats = useMemo(() => {
    const cat = categories.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase());
    return cat ? [...cat.subCategories].sort((a, b) => a.localeCompare(b)) : [];
  }, [categories, selectedCategory]);

  return (
    <>
      <SearchableTextInput 
        label="Catégorie"
        icon={Tag}
        value={selectedCategory}
        onChange={(e) => {
            onCategoryChange(e.target.value);
            // Si l'utilisateur change la catégorie, on vide la sous-catégorie pour éviter les incohérences
            if (selectedSubCategory) onSubCategoryChange(''); 
        }}
        onSelectSuggestion={(val) => {
            onCategoryChange(val);
            onSubCategoryChange('');
        }}
        suggestions={suggestions}
        placeholder="Sélectionner ou saisir (ex: Intérêts)"
        className="w-full"
      />

      <SelectInput
        label="Sous-catégorie"
        icon={Layers}
        value={selectedSubCategory}
        onChange={(e) => onSubCategoryChange(e.target.value)}
        disabled={activeSubCats.length === 0}
      >
        <option value="">{activeSubCats.length === 0 ? '-- Aucune --' : '-- Optionnel --'}</option>
        {activeSubCats.map(sc => (
          <option key={sc} value={sc}>{sc}</option>
        ))}
      </SelectInput>
    </>
  );
};
