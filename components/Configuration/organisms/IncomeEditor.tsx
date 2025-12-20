
import React, { useState, useMemo } from 'react';
import { Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { IncomeConfig, CategoryDef, Person, Account } from '../../../types';
import { CategorySelector } from '../../molecules/CategorySelector';
import { TextInput, AmountInput } from '../../molecules/FormInputs';
import { AccountSelector, BeneficiarySelector } from '../../molecules/SmartSelectors';
import { DataList, DataListRow } from '../../molecules/DataList';
import { ConfirmModal } from '../atoms/ConfirmModal';
import { Modal } from '../../ui/Modal';

interface IncomeEditorProps {
    incomeConfigs: IncomeConfig[];
    people: Person[];
    categories: CategoryDef[];
    accounts: Account[];
    onAddIncome: (i: IncomeConfig) => void;
    onUpdateIncome: (i: IncomeConfig) => void;
    onDeleteIncome: (id: string) => void;
}

type SortKey = 'dayOfMonth' | 'label' | 'amount';
type SortOrder = 'asc' | 'desc';

export const IncomeEditor: React.FC<IncomeEditorProps> = ({ 
    incomeConfigs, people, categories, accounts, onAddIncome, onUpdateIncome, onDeleteIncome 
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [sortKey, setSortKey] = useState<SortKey>('dayOfMonth');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    
    const defaultAccount = accounts[0]?.id || '';

    const [formData, setFormData] = useState<Partial<IncomeConfig>>({
        label: '', amount: 0, dayOfMonth: 1, 
        accountId: defaultAccount, 
        beneficiaryId: people[0]?.id,
        category: '',
        subCategory: ''
    });

    const resetForm = () => {
        setFormData({ 
            label: '', amount: 0, dayOfMonth: 1, 
            accountId: accounts[0]?.id || '', 
            beneficiaryId: people[0]?.id,
            category: '',
            subCategory: ''
        });
        setEditingId(null);
        setIsFormOpen(false);
        setShowDeleteConfirm(false);
    };

    const handleEdit = (inc: IncomeConfig) => {
        setFormData(inc);
        setEditingId(inc.id);
        setIsFormOpen(true);
    };

    const handleAddClick = () => {
        setEditingId(null);
        setFormData({ 
            label: '', amount: 0, dayOfMonth: 1, 
            accountId: accounts[0]?.id || '', 
            beneficiaryId: people[0]?.id,
            category: '',
            subCategory: ''
        });
        setIsFormOpen(true);
    }

    const handleSubmit = () => {
        if (!formData.label || !formData.amount) return;
        const final: IncomeConfig = {
            id: editingId || Date.now().toString(),
            ...formData as any
        };
        editingId ? onUpdateIncome(final) : onAddIncome(final);
        resetForm();
    };

    const handleDelete = () => {
        if (editingId) {
            onDeleteIncome(editingId);
            resetForm();
        }
    }

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const sortedIncomes = useMemo(() => {
        return [...incomeConfigs].sort((a, b) => {
            let res = 0;
            if (sortKey === 'label') {
                res = a.label.localeCompare(b.label);
            } else {
                res = (a[sortKey] as number) - (b[sortKey] as number);
            }
            return sortOrder === 'asc' ? res : -res;
        });
    }, [incomeConfigs, sortKey, sortOrder]);

    if (showDeleteConfirm) {
        return (
            <ConfirmModal 
               isOpen={true}
               title="Supprimer la règle ?"
               message={`Voulez-vous vraiment supprimer "${formData.label}" ?`}
               onConfirm={handleDelete}
               onCancel={() => setShowDeleteConfirm(false)}
            />
        );
   }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-medium text-slate-500 px-2 uppercase">Trier :</span>
                    <button onClick={() => toggleSort('dayOfMonth')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'dayOfMonth' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Date {sortKey === 'dayOfMonth' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('label')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'label' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Libellé {sortKey === 'label' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('amount')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'amount' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Montant {sortKey === 'amount' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                </div>
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={resetForm}
                title={editingId ? 'Modifier le revenu' : 'Nouveau Revenu Récurrent'}
            >
                <div className="space-y-4">
                    <TextInput 
                        label="Libellé" 
                        value={formData.label} 
                        onChange={e => setFormData({...formData, label: e.target.value})} 
                        placeholder="Ex: Salaire Guillaume, CAF..."
                        required
                    />
                    
                    <AmountInput 
                        label="Montant"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                        color="emerald"
                        required
                    />

                    <TextInput 
                        label="Jour du mois"
                        type="number"
                        min={1} max={31}
                        value={formData.dayOfMonth}
                        onChange={e => setFormData({...formData, dayOfMonth: parseInt(e.target.value)})}
                        required
                    />
                    
                    <AccountSelector 
                        accounts={accounts}
                        value={formData.accountId}
                        onChange={e => setFormData({...formData, accountId: e.target.value})}
                        color="emerald"
                    />
                    
                    <BeneficiarySelector 
                        people={people}
                        value={formData.beneficiaryId}
                        onChange={e => setFormData({...formData, beneficiaryId: e.target.value})}
                        color="emerald"
                    />
                    
                    <CategorySelector 
                        categories={categories}
                        type="INCOME"
                        selectedCategory={formData.category || ''}
                        selectedSubCategory={formData.subCategory || ''}
                        onCategoryChange={val => setFormData({...formData, category: val})}
                        onSubCategoryChange={val => setFormData({...formData, subCategory: val})}
                    />
                    
                    <div className="flex gap-3 pt-2">
                        {editingId && (
                            <button 
                                type="button" 
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={handleSubmit} className="flex-1 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
                            <Save size={18}/> Sauvegarder
                        </button>
                    </div>
                </div>
            </Modal>

            <DataList 
                title="Modèles de Revenus" 
                count={incomeConfigs.length} 
                onAdd={handleAddClick}
                addButtonLabel="Créer un modèle"
            >
                {sortedIncomes.map(inc => {
                    const accountName = accounts.find(a => a.id === inc.accountId)?.name || 'Compte Inconnu';
                    const beneficiaryName = people.find(p => p.id === inc.beneficiaryId)?.name || '?';
                    return (
                        <DataListRow
                            key={inc.id}
                            date={{ day: inc.dayOfMonth, month: 'DU MOIS' }}
                            label={inc.label}
                            amount={inc.amount}
                            isIncome={true}
                            category={inc.category}
                            subCategory={inc.subCategory}
                            beneficiary={beneficiaryName}
                            accountName={accountName}
                            onClick={() => handleEdit(inc)}
                        />
                    );
                })}
            </DataList>
        </div>
    );
};
