import React, { useState } from 'react';
import { Plus, Trash2, Pencil, X, CreditCard, Save } from 'lucide-react';
import { Account, Person, AccountType } from '../../../types';
import { ConfirmModal } from '../atoms/ConfirmModal';

interface AccountManagerProps {
    accounts: Account[];
    people: Person[];
    onUpdateAccounts: (a: Account[]) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, people, onUpdateAccounts }) => {
    const [editingAccId, setEditingAccId] = useState<string | null>(null);
    const [tempAccName, setTempAccName] = useState('');
    const [tempOwnerId, setTempOwnerId] = useState('');

    const [newAccName, setNewAccName] = useState('');
    const [ownerId, setOwnerId] = useState(people.filter(p=>!p.isChild)[0]?.id || '');

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    const addAccount = () => {
        if(!newAccName) return;
        const newAcc: Account = { 
            id: `acc_${Date.now()}`, 
            name: newAccName, 
            ownerId, 
            type: AccountType.CHECKING, 
            currentBalance: 0,
            bankName: 'Banque'
        };
        onUpdateAccounts([...accounts, newAcc]);
        setNewAccName('');
    };

    const startEdit = (acc: Account) => {
        setEditingAccId(acc.id);
        setTempAccName(acc.name);
        setTempOwnerId(acc.ownerId);
    };

    const saveEdit = () => {
        if (!editingAccId) return;
        onUpdateAccounts(accounts.map(a => a.id === editingAccId ? { ...a, name: tempAccName, ownerId: tempOwnerId } : a));
        setEditingAccId(null);
    };

    const confirmDeleteAccount = (acc: Account) => {
        setDeleteConfirm({ id: acc.id, name: acc.name });
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            onUpdateAccounts(accounts.filter(a => a.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="space-y-4">
            <ConfirmModal 
                isOpen={!!deleteConfirm}
                title="Supprimer le compte ?"
                message={<span>Voulez-vous vraiment supprimer le compte <strong>{deleteConfirm?.name}</strong> ?</span>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
             />

            <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-end md:items-center shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-xs text-slate-500 uppercase font-medium">Nom du Compte</label>
                    <input value={newAccName} onChange={e => setNewAccName(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900" placeholder="Ex: Compte Joint..." />
                </div>
                 <div className="w-full md:w-48">
                    <label className="text-xs text-slate-500 uppercase font-medium">Titulaire</label>
                    <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900">
                        {people.filter(p => !p.isChild).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <button onClick={addAccount} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 w-full md:w-auto">Ajouter</button>
            </div>
             <div className="grid gap-3">
                {accounts.map(acc => {
                    const owner = people.find(p => p.id === acc.ownerId)?.name || '?';
                    return (
                        <div key={acc.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><CreditCard size={20} /></div>
                                {editingAccId === acc.id ? (
                                    <div className="flex flex-col sm:flex-row gap-2 w-full mr-4">
                                        <input value={tempAccName} onChange={e => setTempAccName(e.target.value)} className="p-1 border rounded text-sm flex-1 bg-white text-slate-900" />
                                        <select value={tempOwnerId} onChange={e => setTempOwnerId(e.target.value)} className="p-1 border rounded text-sm bg-white text-slate-900">
                                            {people.filter(p => !p.isChild).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-semibold text-slate-900">{acc.name}</p>
                                        <p className="text-xs text-slate-500">Titulaire : {owner}</p>
                                    </div>
                                )}
                            </div>
                            
                            {editingAccId === acc.id ? (
                                <div className="flex gap-1">
                                    <button onClick={saveEdit} className="text-green-600 p-1.5 hover:bg-green-50 rounded"><Save size={18} /></button>
                                    <button onClick={() => setEditingAccId(null)} className="text-slate-400 p-1.5 hover:bg-slate-50 rounded"><X size={18} /></button>
                                </div>
                            ) : (
                                <div className="flex gap-1">
                                    <button onClick={() => startEdit(acc)} className="text-slate-300 hover:text-indigo-500 p-1.5"><Pencil size={18} /></button>
                                    <button onClick={() => confirmDeleteAccount(acc)} className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 size={18} /></button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};