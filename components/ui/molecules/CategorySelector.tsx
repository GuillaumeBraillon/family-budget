import React, { useMemo } from "react";
import { Tag, Layers, ChevronRight } from "lucide-react";
import { CategoryDef } from "../../../types";
import { SearchableTextInput } from "./FormInputs";

interface CategorySelectorProps {
  categories: CategoryDef[];
  type?: "EXPENSE" | "INCOME";
  selectedCategory: string;
  selectedSubCategory: string;
  onCategoryChange: (category: string) => void;
  onSubCategoryChange: (subCategory: string) => void;
  className?: string;
  /** "grid" (défaut) : catégorie + sous-catégorie groupées en chemin, avec puces rapides.
   *  "stack" : ancien rendu, deux champs empilés pleine largeur, sans puces. */
  layout?: "grid" | "stack";
  /** Nombre de puces de sélection rapide affichées (défaut 6). */
  quickPickCount?: number;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  type,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  layout = "grid",
  quickPickCount = 6,
}) => {
  // Génération de la liste des suggestions
  // On privilégie l'affichage des catégories du type actif (ex: Revenus) en premier
  const suggestions = useMemo(() => {
    const sortedCats = [...categories];

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

    return sortedCats.map((c) => c.name);
  }, [categories, type]);

  // Récupération des sous-catégories si la catégorie saisie existe déjà dans les paramètres
  const activeSubCats = useMemo(() => {
    const cat = categories.find((c) => c.name.toLowerCase() === selectedCategory.toLowerCase());
    return cat ? [...cat.subCategories].sort((a, b) => a.name.localeCompare(b.name)).map((sc) => sc.name) : [];
  }, [categories, selectedCategory]);

  // Catégories du type actif, pour sélection en un clic sans passer par le champ de recherche
  const quickPicks = useMemo(() => {
    return categories
      .filter((c) => !type || c.type === type)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, quickPickCount)
      .map((c) => c.name);
  }, [categories, type, quickPickCount]);

  const handleCategoryChange = (val: string) => {
    onCategoryChange(val);
    if (selectedSubCategory) onSubCategoryChange("");
  };

  const categoryField = (
    <SearchableTextInput
      label="Catégorie"
      icon={Tag}
      value={selectedCategory}
      onChange={(e) => handleCategoryChange(e.target.value)}
      onSelectSuggestion={handleCategoryChange}
      onClear={() => {
        onCategoryChange("");
        onSubCategoryChange("");
      }}
      suggestions={suggestions}
      placeholder="Sélectionner ou saisir (ex: Intérêts)"
      className={`w-full ${layout === "grid" ? "bg-white" : "bg-slate-100"}`}
    />
  );

  const subCategoryField = (
    <SearchableTextInput
      label="Sous-catégorie (optionnel)"
      icon={Layers}
      value={selectedSubCategory}
      onChange={(e) => onSubCategoryChange(e.target.value)}
      onSelectSuggestion={onSubCategoryChange}
      onClear={() => onSubCategoryChange("")}
      suggestions={activeSubCats}
      placeholder="Saisir librement"
      disabled={!selectedCategory}
      className={`w-full ${layout === "grid" ? "bg-white" : "bg-slate-100"}`}
    />
  );

  if (layout === "stack") {
    return (
      <>
        {categoryField}
        {subCategoryField}
      </>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      {/* Catégorie → sous-catégorie, reliées visuellement par un chevron */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:items-end">
        <div>{categoryField}</div>
        <div className={`hidden sm:flex items-center justify-center h-9 mb-px transition-colors ${selectedCategory ? "text-slate-400" : "text-slate-300"}`}>
          <ChevronRight size={16} />
        </div>
        <div>{subCategoryField}</div>
      </div>

      {/* Sélection rapide : un clic au lieu de taper, pour les catégories les plus fréquentes */}
      {quickPicks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200">
          {quickPicks.map((name) => {
            const active = selectedCategory.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleCategoryChange(active ? "" : name)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  active ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
