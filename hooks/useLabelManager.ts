
import { useState } from 'react';
import { SavedLabel, AccountType } from '../types';

export const useLabelManager = (
  labels: SavedLabel[],
  onUpsertLabel: (l: SavedLabel) => void,
  onDeleteLabel: (id: string) => void
) => {
  const [type, setType] = useState<AccountType>(AccountType.CHECKING);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

  const currentList = labels.filter(l => l.type === type).sort((a, b) => a.name.localeCompare(b.name));

  const addLabel = () => {
    const newLabel: SavedLabel = {
      id: `lbl_${Date.now()}`,
      name: 'Nouveau libellé',
      type: type
    };
    onUpsertLabel(newLabel);
    setEditingId(newLabel.id);
    setTempName(newLabel.name);
  };

  const saveLabelName = (id: string) => {
    const label = labels.find(l => l.id === id);
    if (label && tempName.trim()) {
      onUpsertLabel({ ...label, name: tempName.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDeleteLabel(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return {
    type, setType,
    currentList,
    editingId, setEditingId,
    tempName, setTempName,
    deleteConfirm, setDeleteConfirm,
    addLabel, saveLabelName, handleDelete
  };
};
