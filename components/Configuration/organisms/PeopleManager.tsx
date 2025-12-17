import React, { useState } from 'react';
import { Plus, Trash2, Pencil, X, User, Users, Save } from 'lucide-react';
import { Person } from '../../../types';
import { ConfirmModal } from '../atoms/ConfirmModal';

interface PeopleManagerProps {
    people: Person[];
    onUpdatePeople: (p: Person[]) => void;
}

export const PeopleManager: React.FC<PeopleManagerProps> = ({ people, onUpdatePeople }) => {
    const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [tempIsChild, setTempIsChild] = useState(false);
    
    const [newName, setNewName] = useState('');
    const [isChild, setIsChild] = useState(false);
    
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    const addPerson = () => {
        if(!newName) return;
        const newPerson: Person = { id: `p_${Date.now()}`, name: newName, isChild };
        onUpdatePeople([...people, newPerson]);
        setNewName('');
        setIsChild(false);
    };

    const startEdit = (p: Person) => {
        setEditingPersonId(p.id);
        setTempName(p.name);
        setTempIsChild(!!p.isChild);
    };

    const saveEdit = () => {
        if (!editingPersonId) return;
        onUpdatePeople(people.map(p => p.id === editingPersonId ? { ...p, name: tempName, isChild: tempIsChild } : p));
        setEditingPersonId(null);
    };

    const confirmDeletePerson = (p: Person) => {
        setDeleteConfirm({ id: p.id, name: p.name });
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            onUpdatePeople(people.filter(p => p.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="space-y-4">
             <ConfirmModal 
                isOpen={!!deleteConfirm}
                title="Supprimer la personne ?"
                message={<span>Voulez-vous vraiment supprimer <strong>{deleteConfirm?.name}</strong> ?<br/><br/>Attention : Cela peut affecter les règles de budget liées à cette personne.</span>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
             />

             <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col gap-3 shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-xs text-slate-500 uppercase font-medium">Ajouter une personne / Entité</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900" placeholder="Prénom..." />
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="child" checked={isChild} onChange={e => setIsChild(e.target.checked)} className="h-4 w-4 text-indigo-600 bg-white" />
                        <label htmlFor="child" className="text-sm text-slate-700">Enfant (Non payeur)</label>
                    </div>
                </div>
                <button onClick={addPerson} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 w-full sm:w-auto self-end">Ajouter</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {people.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                        {editingPersonId === p.id ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex-1 space-y-2">
                                    <input value={tempName} onChange={e => setTempName(e.target.value)} className="w-full p-1 border rounded text-sm bg-white text-slate-900" />
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={tempIsChild} onChange={e => setTempIsChild(e.target.checked)} className="h-4 w-4 bg-white" />
                                            <span className="text-xs text-slate-600">Enfant</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={saveEdit} className="text-green-600 p-2 hover:bg-green-50 rounded"><Save size={18} /></button>
                                    <button onClick={() => setEditingPersonId(null)} className="text-slate-400 p-2 hover:bg-slate-50 rounded"><X size={18} /></button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${p.isChild ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {p.isChild ? <User size={18} /> : <Users size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{p.name}</p>
                                        <div className="flex gap-2">
                                            {p.isChild && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Enfant</span>}
                                            {!p.isChild && <span className="text-[10px] text-slate-400">Adulte</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => startEdit(p)} className="text-slate-300 hover:text-indigo-500 p-1.5"><Pencil size={18} /></button>
                                    <button onClick={() => confirmDeletePerson(p)} className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 size={18} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};