
import React, { useState, useMemo } from 'react';
import { Trash2, CreditCard, Save, PiggyBank, Users, Wallet } from 'lucide-react';
import { Account, Person, AccountType } from '../../../types';
import { ConfirmModal } from '../atoms/ConfirmModal';
import { MobileTooltip } from '../../ui/MobileTooltip';
import { DataList } from '../../ui/molecules/DataList';
import { DataListRow } from '../../ui/molecules/DataListRow';
import { Modal } from '../../ui/Modal';
import { TextInput, SelectInput } from '../../ui/molecules/FormInputs';

interface AccountManagerProps {
    accounts: Account[];
    people: Person[];
    onUpsertAccount: (a: Account) => void;
    onDeleteAccount: (id: string) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, people, onUpsertAccount, onDeleteAccount }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [bankName, setBankName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.CHECKING);
    const [ownerId, setOwnerId] = useState('');
    const [isJoint, setIsJoint] = useState(false);
    const [targetRatio, setTargetRatio] = useState<string>('');
    const [targetCap, setTargetCap] = useState<string>('');

    // Tri alphabétique des comptes
    const sortedAccounts = useMemo(() => {
        return [...accounts].sort((a, b) => a.name.localeCompare(b.name));
    }, [accounts]);

    const resetForm = () => {
        setName('');
        setBankName('');
        setType(AccountType.CHECKING);
        setOwnerId(people.filter(p=>!p.isChild)[0]?.id || '');
        setIsJoint(false);
        setTargetRatio('');
        setTargetCap('');
        setEditingAccount(null);
        setIsModalOpen(false);
        setDeleteConfirm(null);
    };

    const handleAddClick = () => {
        setEditingAccount(null);
        // Defaults
        setName('');
        setBankName('');
        setType(AccountType.CHECKING);
        setOwnerId(people.filter(p=>!p.isChild)[0]?.id || '');
        setIsJoint(false);
        setTargetRatio('');
        setTargetCap('');
        
        setIsModalOpen(true);
    };

    const handleEditClick = (acc: Account) => {
        setEditingAccount(acc);
        setName(acc.name);
        setBankName(acc.bankName || '');
        setType(acc.type);
        setOwnerId(acc.ownerId);
        setIsJoint(!!acc.isJoint);
        setTargetRatio(acc.targetRatio !== undefined ? acc.targetRatio.toString() : '');
        setTargetCap(acc.targetCap !== undefined ? acc.targetCap.toString() : '');
        
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if(!name) return;
        
        const account: Account = {
            id: editingAccount ? editingAccount.id : `acc_${Date.now()}`,
            name,
            bankName,
            type,
            ownerId,
            isJoint,
            currentBalance: editingAccount ? editingAccount.currentBalance : 0,
            targetRatio: targetRatio ? parseFloat(targetRatio) : undefined,
            targetCap: targetCap ? parseFloat(targetCap) : undefined
        };

        onUpsertAccount(account);
        resetForm();
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            onDeleteAccount(deleteConfirm.id);
            resetForm();
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

            <Modal 
                isOpen={isModalOpen} 
                onClose={resetForm} 
                title={editingAccount ? "Modifier le compte" : "Ajouter un compte"}
            >
                <div className="space-y-4">
                    <TextInput 
                        label="Nom du compte" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Ex: Compte Joint, Livret A..."
                        required 
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput 
                            label="Banque" 
                            value={bankName} 
                            onChange={e => setBankName(e.target.value)} 
                            placeholder="Ex: Bourso..." 
                        />
                        <SelectInput 
                            label="Type" 
                            value={type} 
                            onChange={e => setType(e.target.value as AccountType)}
                        >
                            <option value={AccountType.CHECKING}>Courant</option>
                            <option value={AccountType.SAVINGS}>Épargne</option>
                        </SelectInput>
                    </div>

                    <SelectInput 
                        label="Titulaire" 
                        value={ownerId} 
                        onChange={e => setOwnerId(e.target.value)}
                    >
                        {people.filter(p => !p.isChild).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </SelectInput>

                    {/* Option Compte Joint */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isJoint} 
                                onChange={e => setIsJoint(e.target.checked)} 
                                className="h-4 w-4 text-indigo-600 rounded" 
                            />
                            <span className="text-sm font-bold text-slate-700">Compte Joint (Pivot)</span>
                            <MobileTooltip text="Ce compte devient le point central : il reçoit l'argent du LDDS pour payer les charges et alimente les comptes persos si besoin." />
                        </label>
                    </div>

                    {/* Règles de Trésorerie (Uniquement pour comptes courants non joints) */}
                    {type === AccountType.CHECKING && !isJoint && (
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <h4 className="text-[10px] font-bold text-indigo-900 uppercase mb-2">Règles de Trésorerie</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <TextInput 
                                    label="Ratio Cible (%)" 
                                    type="number"
                                    value={targetRatio}
                                    onChange={e => setTargetRatio(e.target.value)}
                                    placeholder="Ex: 30"
                                />
                                <TextInput 
                                    label="Plafond Max (€)" 
                                    type="number"
                                    value={targetCap}
                                    onChange={e => setTargetCap(e.target.value)}
                                    placeholder="Ex: 50"
                                />
                            </div>
                            <p className="text-[10px] text-indigo-500 mt-2 italic">
                                Définit le montant que ce compte doit recevoir depuis le compte joint.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {editingAccount && (
                            <button 
                                type="button" 
                                onClick={() => setDeleteConfirm({ id: editingAccount.id, name: editingAccount.name })}
                                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleSubmit} 
                            className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> {editingAccount ? "Enregistrer" : "Créer le compte"}
                        </button>
                    </div>
                </div>
            </Modal>
            
            <DataList 
                title="Vos Comptes" 
                count={sortedAccounts.length} 
                onAdd={handleAddClick} 
                addButtonLabel="Ajouter un compte"
            >
                {sortedAccounts.map(acc => {
                    const owner = people.find(p => p.id === acc.ownerId)?.name || 'Inconnu';
                    let iconNode = <CreditCard size={20} />;
                    if (acc.type === AccountType.SAVINGS) iconNode = <PiggyBank size={20} />;
                    else if (acc.isJoint) iconNode = <Users size={20} />;
                    else iconNode = <Wallet size={20} />;

                    return (
                        <DataListRow 
                            key={acc.id}
                            icon={iconNode}
                            label={acc.name}
                            amount={acc.currentBalance}
                            category={acc.bankName || 'Banque'}
                            beneficiary={owner}
                            onClick={() => handleEditClick(acc)}
                            badge={acc.isJoint ? <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">Joint</span> : null}
                        />
                    );
                })}
            </DataList>
        </div>
    );
};
