
import { useState } from 'react';
import { CategoryDef } from '../types';

export const useCategoryManager = (
  categories: CategoryDef[],
  onUpdateCategories: (cats: CategoryDef[]) => void
) => {
  const [mode, setMode] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  
  const [newSubCat, setNewSubCat] = useState('');
  const [editingSubCat, setEditingSubCat] = useState<{ catId: string, oldName: string } | null>(null);
  const [tempSubName, setTempSubName] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

  // Filtrage par mode et Tri Alphabétique
  const currentList = categories
    .filter(c => c.type === mode)
    .sort((a, b) => a.name.localeCompare(b.name));

  const applyChanges = (modifiedSubset: CategoryDef[]) => {
    const others = categories.filter(c => c.type !== mode);
    onUpdateCategories([...others, ...modifiedSubset]);
  };

  const addCategory = () => {
    const newCat: CategoryDef = { 
      id: `${mode === 'INCOME' ? 'inc' : 'cat'}_${Date.now()}`, 
      name: 'Nouvelle Catégorie', 
      type: mode, 
      subCategories: [] 
    };
    applyChanges([...currentList, newCat]);
    setEditingCatId(newCat.id);
    setTempName(newCat.name);
  };

  const saveCatName = (id: string) => {
    const updated = currentList.map(c => c.id === id ? { ...c, name: tempName } : c);
    applyChanges(updated);
    setEditingCatId(null);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      const updated = currentList.filter(c => c.id !== deleteConfirm.id);
      applyChanges(updated);
      setDeleteConfirm(null);
    }
  };

  const addSubCat = (catId: string) => {
    if(!newSubCat.trim()) return;
    const updated = currentList.map(c => {
        if (c.id === catId) {
            // Tri alphabétique aussi pour les sous-catégories lors de l'ajout/modif si souhaité, 
            // mais ici on ajoute simplement à la fin. 
            // Pour trier à l'affichage, c'est géré dans le composant ou ici.
            // On ajoute et on laisse l'utilisateur gérer ou on trie tout le tableau :
            const newSubs = [...c.subCategories, newSubCat].sort((a, b) => a.localeCompare(b));
            return { ...c, subCategories: newSubs };
        }
        return c;
    });
    applyChanges(updated);
    setNewSubCat('');
  };

  const removeSubCat = (catId: string, subName: string) => {
    const updated = currentList.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.filter(s => s !== subName) } : c);
    applyChanges(updated);
  };

  const saveSubCat = () => {
    if (!editingSubCat) return;
    const updated = currentList.map(c => {
      if (c.id === editingSubCat.catId) {
        const newSubs = c.subCategories.map(s => s === editingSubCat.oldName ? tempSubName : s).sort((a, b) => a.localeCompare(b));
        return {
          ...c,
          subCategories: newSubs
        };
      }
      return c;
    });
    applyChanges(updated);
    setEditingSubCat(null);
    setTempSubName('');
  };

  return {
    mode, setMode,
    currentList,
    expandedCat, setExpandedCat,
    editingCatId, setEditingCatId,
    tempName, setTempName,
    newSubCat, setNewSubCat,
    editingSubCat, setEditingSubCat,
    tempSubName, setTempSubName,
    deleteConfirm, setDeleteConfirm,
    addCategory, saveCatName, handleDelete,
    addSubCat, removeSubCat, saveSubCat
  };
};
