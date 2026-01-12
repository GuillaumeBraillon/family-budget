import { useState } from "react";
import { CategoryDef, SubCategory } from "../types";

/**
 * Hook de gestion des catégories de dépenses/revenus.
 *
 * @description
 * Fournit une interface complète pour gérer les catégories et sous-catégories :
 * - Ajout, édition, suppression de catégories
 * - Gestion des sous-catégories (objets SubCategory)
 * - Filtre par type (EXPENSE/INCOME)
 * - Expansion/collapse des catégories
 * - Confirmation de suppression
 *
 * @param {CategoryDef[]} categories - Liste des catégories existantes
 * @param {Function} onUpdateCategories - Callback de mise à jour des catégories
 * @returns {Object} État et actions de gestion des catégories
 *
 * @example
 * ```tsx
 * const categoryManager = useCategoryManager(categories, updateCategories);
 *
 * return (
 *   <CategoryList
 *     categories={categoryManager.filteredCategories}
 *     onAddCategory={categoryManager.addCategory}
 *     onDeleteCategory={categoryManager.deleteCategory}
 *   />
 * );
 * ```
 */
export const useCategoryManager = (categories: CategoryDef[], onUpdateCategories: (cats: CategoryDef[]) => void) => {
  const [mode, setMode] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  const [newSubCat, setNewSubCat] = useState("");
  const [editingSubCat, setEditingSubCat] = useState<{ catId: string; subCatId: string } | null>(null);
  const [tempSubName, setTempSubName] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Filtrage par mode et Tri Alphabétique
  const currentList = categories.filter((c) => c.type === mode).sort((a, b) => a.name.localeCompare(b.name));

  const applyChanges = (modifiedSubset: CategoryDef[]) => {
    const others = categories.filter((c) => c.type !== mode);
    onUpdateCategories([...others, ...modifiedSubset]);
  };

  const addCategory = () => {
    const newCat: CategoryDef = {
      id: `${mode === "INCOME" ? "inc" : "cat"}_${Date.now()}`,
      name: "Nouvelle Catégorie",
      type: mode,
      subCategories: [],
    };
    applyChanges([...currentList, newCat]);
    setEditingCatId(newCat.id);
    setTempName(newCat.name);
  };

  const saveCatName = (id: string) => {
    const updated = currentList.map((c) => (c.id === id ? { ...c, name: tempName } : c));
    applyChanges(updated);
    setEditingCatId(null);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      const updated = currentList.filter((c) => c.id !== deleteConfirm.id);
      applyChanges(updated);
      setDeleteConfirm(null);
    }
  };

  const addSubCat = (catId: string) => {
    if (!newSubCat.trim()) return;
    const updated = currentList.map((c) => {
      if (c.id === catId) {
        // Créer un nouvel objet SubCategory
        const newSubCategory: SubCategory = {
          id: `sub_${Date.now()}`,
          name: newSubCat.trim(),
          categoryId: catId,
        };
        // Ajouter et trier par nom
        const newSubs = [...c.subCategories, newSubCategory].sort((a, b) => a.name.localeCompare(b.name));
        return { ...c, subCategories: newSubs };
      }
      return c;
    });
    applyChanges(updated);
    setNewSubCat("");
  };

  const removeSubCat = (catId: string, subCatId: string) => {
    const updated = currentList.map((c) => (c.id === catId ? { ...c, subCategories: c.subCategories.filter((s) => s.id !== subCatId) } : c));
    applyChanges(updated);
  };

  const saveSubCat = () => {
    if (!editingSubCat) return;
    const updated = currentList.map((c) => {
      if (c.id === editingSubCat.catId) {
        const newSubs = c.subCategories
          .map((s) => (s.id === editingSubCat.subCatId ? { ...s, name: tempSubName } : s))
          .sort((a, b) => a.name.localeCompare(b.name));
        return {
          ...c,
          subCategories: newSubs,
        };
      }
      return c;
    });
    applyChanges(updated);
    setEditingSubCat(null);
    setTempSubName("");
  };

  return {
    mode,
    setMode,
    currentList,
    expandedCat,
    setExpandedCat,
    editingCatId,
    setEditingCatId,
    tempName,
    setTempName,
    newSubCat,
    setNewSubCat,
    editingSubCat,
    setEditingSubCat,
    tempSubName,
    setTempSubName,
    deleteConfirm,
    setDeleteConfirm,
    addCategory,
    saveCatName,
    handleDelete,
    addSubCat,
    removeSubCat,
    saveSubCat,
  };
};
