
import React, { useState, useMemo } from 'react';
import { Trash2, User, Users, Save, Baby } from 'lucide-react';
import { Person } from '../../../types';
import { ConfirmModal } from '../atoms/ConfirmModal';
import { DataList } from '../../ui/molecules/DataList';
import { DataListRow } from '../../ui/molecules/DataListRow';
import { Modal } from '../../ui/Modal';
import { TextInput } from '../../ui/molecules/FormInputs';

interface PeopleManagerProps {
    people: Person[];
    onUpsertPerson: (p: Person) => void;
    onDeletePerson: (id: string) => void;
}

export const PeopleManager: React.FC<PeopleManagerProps> = ({ people, onUpsertPerson, onDeletePerson }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [isChild, setIsChild] = useState(false);

    // Tri alphabétique des bénéficiaires
    const sortedPeople = useMemo(() => {
        return [...people].sort((a, b) => a.name.localeCompare(b.name));
    }, [people]);

    const resetForm = () => {
        setName('');
        setIsChild(false);
        setEditingPerson(null);
        setIsModalOpen(false);
        setDeleteConfirm(null);
    };

    const handleAddClick = () => {
        setEditingPerson(null);
        setName('');
        setIsChild(false);
        setIsModalOpen(true);
    };

    const handleEditClick = (p: Person) => {
        setEditingPerson(p);
        setName(p.name);
        setIsChild(!!p.isChild);
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if(!name) return;
        const person: Person = {
            id: editingPerson ? editingPerson.id : `p_${Date.now()}`,
            name,
            isChild
        };
        onUpsertPerson(person);
        resetForm();
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            onDeletePerson(deleteConfirm.id);
            resetForm();
        }
    };

    return (
        <div className="space-y-4">
             <ConfirmModal 
                isOpen={!!deleteConfirm}
                title="Supprimer le bénéficiaire ?"
                message={<span>Voulez-vous vraiment supprimer <strong>{deleteConfirm?.name}</strong> ?<br/><br/>Attention : Cela peut affecter les règles de budget liées à cette personne.</span>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
             />

             <Modal 
                isOpen={isModalOpen} 
                onClose={resetForm} 
                title={editingPerson ? "Modifier le bénéficiaire" : "Ajouter un bénéficiaire"}
            >
                <div className="space-y-4">
                    <TextInput 
                        label="Prénom / Nom" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Ex: Guillaume, Nelly, Enfant 1..."
                        required 
                        autoFocus
                    />
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isChild} 
                                onChange={e => setIsChild(e.target.checked)} 
                                className="h-5 w-5 text-indigo-600 rounded bg-white border-slate-300 focus:ring-indigo-500" 
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Baby size={16} className="text-indigo-500" /> Enfant (Non contributeur)
                                </span>
                                <span className="text-xs text-slate-500">
                                    Les revenus et dépenses de ce bénéficiaire ne seront pas comptabilisés dans le calcul de l'équité du couple.
                                </span>
                            </div>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {editingPerson && (
                            <button 
                                type="button" 
                                onClick={() => setDeleteConfirm({ id: editingPerson.id, name: editingPerson.name })}
                                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleSubmit} 
                            className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> {editingPerson ? "Enregistrer" : "Ajouter"}
                        </button>
                    </div>
                </div>
            </Modal>

            <DataList 
                title="Bénéficiaires du Foyer" 
                count={sortedPeople.length} 
                onAdd={handleAddClick} 
                addButtonLabel="Ajouter un bénéficiaire"
                emptyMessage="Aucun bénéficiaire défini."
            >
                {sortedPeople.map(p => (
                    <DataListRow 
                        key={p.id}
                        icon={p.isChild ? <Baby size={20} /> : <User size={20} />}
                        label={p.name}
                        category={p.isChild ? "Enfant" : "Adulte / Payeur"}
                        onClick={() => handleEditClick(p)}
                        badge={p.isChild ? <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">Enfant</span> : null}
                    />
                ))}
            </DataList>
        </div>
    );
};
