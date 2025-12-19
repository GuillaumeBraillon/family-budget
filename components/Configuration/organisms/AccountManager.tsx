
import React, { useState } from 'react';
import { Trash2, Pencil, X, CreditCard, Save, Settings2, PiggyBank, Building, Users } from 'lucide-react';
import { Account, Person, AccountType } from '../../../types';
import { ConfirmModal } from '../atoms/ConfirmModal';
import { MobileTooltip } from '../../ui/MobileTooltip';

interface AccountManagerProps {
    accounts: Account[];
    people: Person[];
    onUpsertAccount: (a: Account) => void;
    onDeleteAccount: (id: string) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, people, onUpsertAccount, onDeleteAccount }) => {
    const [editingAccId, setEditingAccId] = useState<string | null>(null);
    
    // États pour l'édition (valeurs temporaires)
    const [tempAccName, setTempAccName] = useState('');
    const [tempOwnerId, setTempOwnerId] = useState('');
    const [tempBankName, setTempBankName] = useState('');
    const [tempType, setTempType] = useState<AccountType>(AccountType.CHECKING);
    const [tempIsJoint, setTempIsJoint] = useState(false);
    const [tempRatio, setTempRatio] = useState<number | undefined>(undefined);
    const [tempCap, setTempCap] = useState<number | undefined>(undefined);

    // États pour la création
    const [newAccName, setNewAccName] = useState('');
    const [newAccBank, setNewAccBank] = useState('');
    const [newAccType, setNewAccType] = useState<AccountType>(AccountType.CHECKING);
    const [newAccIsJoint, setNewAccIsJoint] = useState(false);
    const [ownerId, setOwnerId] = useState(people.filter(p=>!p.isChild)[0]?.id || '');

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    const addAccount = () => {
        if(!newAccName) return;
        const newAcc: Account = { 
            id: `acc_${Date.now()}`, 
            name: newAccName, 
            ownerId, 
            type: newAccType,
            isJoint: newAccIsJoint,
            currentBalance: 0,
            bankName: newAccBank || 'Banque'
        };
        onUpsertAccount(newAcc);
        setNewAccName('');
        setNewAccBank('');
        setNewAccIsJoint(false);
    };

    const startEdit = (acc: Account) => {
        setEditingAccId(acc.id);
        setTempAccName(acc.name);
        setTempOwnerId(acc.ownerId);
        setTempBankName(acc.bankName || '');
        setTempType(acc.type);
        setTempIsJoint(!!acc.isJoint);
        setTempRatio(acc.targetRatio);
        setTempCap(acc.targetCap);
    };

    const saveEdit = () => {
        if (!editingAccId) return;
        const original = accounts.find(a => a.id === editingAccId);
        
        const updatedAccount: Account = {
            id: editingAccId,
            name: tempAccName,
            ownerId: tempOwnerId,
            bankName: tempBankName,
            type: tempType,
            isJoint: tempIsJoint,
            targetRatio: tempRatio,
            targetCap: tempCap,
            currentBalance: original?.currentBalance || 0
        };

        onUpsertAccount(updatedAccount);
        setEditingAccId(null);
    };

    const confirmDeleteAccount = (acc: Account) => {
        setDeleteConfirm({ id: acc.id, name: acc.name });
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            onDeleteAccount(deleteConfirm.id);
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

            {/* FORMULAIRE AJOUT RAPIDE */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col gap-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ajouter un compte</h4>
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-start">
                    <div className="flex-1 w-full space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Nom du Compte</label>
                        <input value={newAccName} onChange={e => setNewAccName(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 text-sm" placeholder="Ex: Compte Joint..." />
                    </div>
                    <div className="w-full md:w-48 space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Banque</label>
                        <input value={newAccBank} onChange={e => setNewAccBank(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 text-sm" placeholder="Ex: Bourso..." />
                    </div>
                     <div className="w-full md:w-40 space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Type</label>
                        <select value={newAccType} onChange={e => setNewAccType(e.target.value as AccountType)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 text-sm">
                            <option value={AccountType.CHECKING}>Courant</option>
                            <option value={AccountType.SAVINGS}>Épargne</option>
                        </select>
                    </div>
                     <div className="w-full md:w-48 space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Titulaire</label>
                        <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-900 text-sm">
                            {people.filter(p => !p.isChild).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    
                    <div className="h-full flex items-center pt-5">
                         <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-2 rounded h-10 hover:bg-slate-100 transition-colors">
                             <input type="checkbox" checked={newAccIsJoint} onChange={e => setNewAccIsJoint(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded" />
                             <span className="text-xs font-bold text-slate-700">Compte Joint</span>
                             <MobileTooltip text="Définit ce compte comme le pivot central. Il recevra l'argent du LDDS et alimentera les comptes personnels." />
                         </label>
                    </div>

                    <div className="h-full flex items-end pb-0.5">
                        <button onClick={addAccount} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 w-full md:w-auto text-sm">Ajouter</button>
                    </div>
                </div>
            </div>
            
             <div className="grid gap-3">
                {accounts.map(acc => {
                    const owner = people.find(p => p.id === acc.ownerId)?.name || '?';
                    const isChecking = acc.type === AccountType.CHECKING;
                    const isEditing = editingAccId === acc.id;

                    return (
                        <div key={acc.id} className={`bg-white p-4 rounded-lg border flex flex-col gap-3 shadow-sm transition-all ${isEditing ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3 flex-1">
                                    <div className={`p-2.5 rounded-xl ${
                                        acc.type === AccountType.SAVINGS 
                                            ? 'bg-emerald-100 text-emerald-600' 
                                            : (acc.isJoint ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600')
                                    }`}>
                                        {acc.type === AccountType.SAVINGS ? <PiggyBank size={20} /> : (acc.isJoint ? <Users size={20} /> : <CreditCard size={20} />)}
                                    </div>
                                    
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2 animate-in fade-in">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400">Nom</label>
                                                    <input value={tempAccName} onChange={e => setTempAccName(e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400">Banque</label>
                                                    <input value={tempBankName} onChange={e => setTempBankName(e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400">Type</label>
                                                    <select value={tempType} onChange={e => setTempType(e.target.value as AccountType)} className="w-full p-1.5 border rounded text-sm bg-white text-slate-900">
                                                        <option value={AccountType.CHECKING}>Compte Courant</option>
                                                        <option value={AccountType.SAVINGS}>Compte Épargne</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400">Titulaire</label>
                                                    <select value={tempOwnerId} onChange={e => setTempOwnerId(e.target.value)} className="w-full p-1.5 border rounded text-sm bg-white text-slate-900">
                                                        {people.filter(p => !p.isChild).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-2 pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer w-max">
                                                        <input type="checkbox" checked={tempIsJoint} onChange={e => setTempIsJoint(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded" />
                                                        <span className="text-sm font-bold text-slate-700">Compte Joint (Pivot)</span>
                                                        <MobileTooltip text="Ce compte devient le point central : il reçoit l'argent du LDDS pour payer les charges et alimente les comptes persos si besoin." />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900">{acc.name}</h3>
                                                    {acc.isJoint && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-purple-50 text-purple-700 border border-purple-100">
                                                            Compte Joint
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border ${
                                                        acc.type === AccountType.SAVINGS 
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                                    }`}>
                                                        {acc.type === AccountType.SAVINGS ? 'Épargne' : 'Courant'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1"><Building size={12}/> {acc.bankName || 'Banque non spécifiée'}</span>
                                                    <span>•</span>
                                                    <span>Titulaire : {owner}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {isEditing ? (
                                    <div className="flex gap-1 ml-4">
                                        <button onClick={saveEdit} className="text-white bg-green-600 p-2 hover:bg-green-700 rounded-lg shadow-sm"><Save size={18} /></button>
                                        <button onClick={() => setEditingAccId(null)} className="text-slate-500 bg-slate-100 p-2 hover:bg-slate-200 rounded-lg"><X size={18} /></button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 ml-4">
                                        <button onClick={() => startEdit(acc)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"><Pencil size={18} /></button>
                                        <button onClick={() => confirmDeleteAccount(acc)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                )}
                            </div>

                            {/* SECTION PARAMETRES AVANCÉS (VISIBLES EN MODE ÉDITION POUR COMPTES COURANTS) */}
                            {isEditing && tempType === AccountType.CHECKING && !tempIsJoint && (
                                <div className="mt-2 pt-3 border-t border-slate-100 animate-in fade-in">
                                    <div className="flex items-center gap-2 mb-3 text-indigo-600">
                                        <Settings2 size={14} />
                                        <span className="text-xs font-bold uppercase">Règles de Trésorerie (Comptes Persos)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                                        <div>
                                            <label className="text-[10px] text-indigo-900 font-bold uppercase block mb-1">
                                                Ratio Cible (% du budget)
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number" min="0" max="100" 
                                                    value={tempRatio === undefined ? '' : tempRatio} 
                                                    onChange={e => setTempRatio(e.target.value === '' ? undefined : Number(e.target.value))}
                                                    placeholder="ex: 30"
                                                    className="w-full p-2 border border-indigo-200 rounded text-sm text-indigo-900"
                                                />
                                                <span className="absolute right-3 top-2 text-xs text-indigo-400">%</span>
                                            </div>
                                            <p className="text-[10px] text-indigo-400 mt-1">Pour calcul auto des virements.</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-indigo-900 font-bold uppercase block mb-1">
                                                Plafond Max (Cap)
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="number" min="0"
                                                    value={tempCap === undefined ? '' : tempCap} 
                                                    onChange={e => setTempCap(e.target.value === '' ? undefined : Number(e.target.value))}
                                                    placeholder="ex: 50"
                                                    className="w-full p-2 border border-indigo-200 rounded text-sm text-indigo-900"
                                                />
                                                <span className="absolute right-3 top-2 text-xs text-indigo-400">€</span>
                                            </div>
                                            <p className="text-[10px] text-indigo-400 mt-1">Limite max du besoin.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AFFICHAGE DES REGLES EN LECTURE SEULE */}
                            {!isEditing && isChecking && !acc.isJoint && (acc.targetRatio !== undefined || acc.targetCap !== undefined) && (
                                <div className="mt-1 pt-2 border-t border-slate-50 flex gap-4 text-xs text-slate-600">
                                    {acc.targetRatio !== undefined && (
                                        <span className="bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 font-medium">Cible: {acc.targetRatio}%</span>
                                    )}
                                    {acc.targetCap !== undefined && (
                                        <span className="bg-amber-50 px-2 py-0.5 rounded text-amber-700 font-medium">Max: {acc.targetCap}€</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
