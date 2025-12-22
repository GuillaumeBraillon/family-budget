
import React, { useState } from 'react';
import { Trash2, Save, Tag } from 'lucide-react';
import { SavedLabel, AccountType } from '../../../types';
import { ConfirmModal } from '../atoms/ConfirmModal';
import { LabelTypeSelector } from '../molecules/LabelTypeSelector';
import { DataList } from '../../ui/molecules/DataList';
import { DataListRow } from '../../ui/molecules/DataListRow';
import { Modal } from '../../ui/Modal';
import { TextInput } from '../../ui/molecules/FormInputs';

interface AccountLabelManagerProps {
    labels: SavedLabel[];
    onUpsertLabel: (l: SavedLabel) => void;
    onDeleteLabel: (id: string) => void;
}

export const AccountLabelManager: React.FC<AccountLabelManagerProps> = ({ labels, onUpsertLabel, onDeleteLabel }) => {
    const [type, setType] = useState<AccountType>(AccountType.CHECKING);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<SavedLabel | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
    const [name, setName] = useState('');

    const currentList = labels.filter(l => l.type === type).sort((a, b) => a.name.localeCompare(b.name));
    const isSavings = type === AccountType.SAVINGS;

    const resetForm = () => {
        setName('');
        setEditingLabel(null);
        setIsModalOpen(false);
        setDeleteConfirm(null);
    };

    const handleAddClick = () => {
        setEditingLabel(null);
        setName('');
        setIsModalOpen(true);
    };

    const handleEditClick = (label: SavedLabel) => {
        setEditingLabel(label);
        setName(label.name);
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        
        let newId = `lbl_${Date.now()}`;
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            newId = crypto.randomUUID();
        }

        const label: SavedLabel = {
            id: editingLabel ? editingLabel.id : newId,
            name: name.trim(),
            type: type
        };
        onUpsertLabel(label);
        resetForm();
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            onDeleteLabel(deleteConfirm.id);
            resetForm();
        }
    };

    return (
        <div className="space-y-4">
             <Modal 
                isOpen={isModalOpen} 
                onClose={resetForm} 
                title={editingLabel ? "Modifier le libellé" : "Ajouter un libellé"}
            >
                <div className="space-y-4">
                    <TextInput 
                        label="Libellé" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder={isSavings ? "Ex: Virement Épargne..." : "Ex: Courses..."}
                        required 
                        autoFocus
                    />
                    
                    <div className="flex gap-3 pt-2">
                        {editingLabel && (
                            <button 
                                type="button" 
                                onClick={() => setDeleteConfirm({ id: editingLabel.id, name: editingLabel.name })}
                                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleSubmit} 
                            className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> {editingLabel ? "Enregistrer" : "Ajouter"}
                        </button>
                    </div>
                </div>
            </Modal>

             <ConfirmModal 
                isOpen={!!deleteConfirm}
                title="Supprimer le libellé ?"
                message={<span>Voulez-vous vraiment supprimer le libellé <strong>{deleteConfirm?.name}</strong> ?</span>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
             />

             <LabelTypeSelector type={type} onChange={setType} />

            <DataList 
                title={isSavings ? "Libellés Épargne" : "Libellés Courants"}
                count={currentList.length} 
                onAdd={handleAddClick} 
                addButtonLabel="Ajouter un libellé"
                emptyMessage="Aucun libellé défini pour cette section."
            >
                {currentList.map(label => (
                    <DataListRow 
                        key={label.id}
                        icon={<Tag size={20} className={isSavings ? "text-emerald-500" : "text-indigo-500"} />}
                        label={label.name}
                        onClick={() => handleEditClick(label)}
                    />
                ))}
            </DataList>
        </div>
    );
};
