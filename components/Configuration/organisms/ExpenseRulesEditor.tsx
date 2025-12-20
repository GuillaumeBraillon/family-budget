
import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { ExpenseConfig, CategoryDef, Person, Account } from '../../../types';
import { CategorySelector } from '../../molecules/CategorySelector';
import { TextInput, AmountInput } from '../../molecules/FormInputs';
import { AccountSelector, BeneficiarySelector } from '../../molecules/SmartSelectors';
import { DataList, DataListRow } from '../../molecules/DataList';
import { ConfirmModal } from '../atoms/ConfirmModal';
import { Modal } from '../../ui/Modal';

interface ExpenseRulesEditorProps {
    configs: ExpenseConfig[];
    categories: CategoryDef[];
    people: Person[];
    accounts: Account[];
    onAddConfig: (c: ExpenseConfig) => void;
    onUpdateConfig: (c: ExpenseConfig) => void;
    onDeleteConfig: (id: string) => void;
}

type SortKey = 'dayOfMonth' | 'label' | 'amount';
type SortOrder = 'asc' | 'desc';

export const ExpenseRulesEditor: React.FC<ExpenseRulesEditorProps> = ({ 
    configs, categories, people, accounts, onAddConfig, onUpdateConfig, onDeleteConfig 
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const [sortKey, setSortKey] = useState<SortKey>('dayOfMonth');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    
    const defaultAccount = accounts[0]?.id || '';

    const [formData, setFormData] = useState<Partial<ExpenseConfig>>({
        label: '', amount: 0, dayOfMonth: 1, 
        accountId: defaultAccount, 
        beneficiaryId: people[0]?.id, 
        category: '', subCategory: '', isExtra: false, startMonth: '', endMonth: ''
    });

    const [durationMode, setDurationMode] = useState<'dates' | 'duration'>('duration');
    const [durationMonths, setDurationMonths] = useState<number>(3);

    useEffect(() => {
        if (formData.isExtra && durationMode === 'duration' && formData.startMonth && durationMonths > 0) {
            const [year, month] = formData.startMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + durationMonths - 1);
            
            const endYear = endDate.getFullYear();
            const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
            const calculatedEnd = `${endYear}-${endMonth}`;
            
            if (formData.endMonth !== calculatedEnd) {
                setFormData(prev => ({ ...prev, endMonth: calculatedEnd }));
            }
        }
    }, [formData.startMonth, durationMonths, durationMode, formData.isExtra, formData.endMonth]);

    const resetForm = () => {
        setFormData({ 
            label: '', amount: 0, dayOfMonth: 1, 
            accountId: accounts[0]?.id || '', 
            beneficiaryId: people[0]?.id, 
            category: '', subCategory: '', 
            isExtra: false, startMonth: '', endMonth: '' 
        });
        setDurationMode('duration');
        setDurationMonths(3);
        setEditingId(null);
        setIsFormOpen(false);
        setShowDeleteConfirm(false);
    };

    const handleEdit = (config: ExpenseConfig) => {
        setFormData(config);
        setEditingId(config.id);
        setIsFormOpen(true);
        setDurationMode('dates'); 
    };

    const handleAddClick = () => {
        setEditingId(null);
        // Reset form data for new entry
        setFormData({ 
            label: '', amount: 0, dayOfMonth: 1, 
            accountId: accounts[0]?.id || '', 
            beneficiaryId: people[0]?.id, 
            category: '', subCategory: '', 
            isExtra: false, startMonth: '', endMonth: '' 
        });
        setIsFormOpen(true);
    }

    const handleSubmit = () => {
        if (!formData.label || !formData.amount) return;
        const finalConfig: ExpenseConfig = {
            id: editingId || Date.now().toString(),
            ...formData as any
        };
        editingId ? onUpdateConfig(finalConfig) : onAddConfig(finalConfig);
        resetForm();
    };

    const handleDelete = () => {
        if (editingId) {
            onDeleteConfig(editingId);
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

    const sortedConfigs = useMemo(() => {
        return [...configs].sort((a, b) => {
            let res = 0;
            if (sortKey === 'label') {
                res = a.label.localeCompare(b.label);
            } else {
                res = (a[sortKey] as number) - (b[sortKey] as number);
            }
            return sortOrder === 'asc' ? res : -res;
        });
    }, [configs, sortKey, sortOrder]);

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
                    <button onClick={() => toggleSort('dayOfMonth')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'dayOfMonth' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Date {sortKey === 'dayOfMonth' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('label')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'label' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Libellé {sortKey === 'label' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('amount')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'amount' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Montant {sortKey === 'amount' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                </div>
            </div>

            <Modal 
                isOpen={isFormOpen} 
                onClose={resetForm} 
                title={editingId ? 'Modifier la dépense' : 'Nouvelle Dépense Récurrente'}
            >
                <div className="space-y-4">
                    <TextInput 
                        label="Libellé" 
                        value={formData.label} 
                        onChange={e => setFormData({...formData, label: e.target.value})} 
                        required
                    />
                    
                    <AmountInput 
                        label="Montant"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
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
                    />
                    
                    <BeneficiarySelector 
                        people={people}
                        value={formData.beneficiaryId}
                        onChange={e => setFormData({...formData, beneficiaryId: e.target.value})}
                    />
                    
                    <CategorySelector 
                        categories={categories}
                        type="EXPENSE"
                        selectedCategory={formData.category || ''}
                        selectedSubCategory={formData.subCategory || ''}
                        onCategoryChange={val => setFormData({...formData, category: val})}
                        onSubCategoryChange={val => setFormData({...formData, subCategory: val})}
                    />
                    
                    {/* OPTION EXTRA */}
                    <div className="bg-white/60 p-3 rounded-lg border border-slate-200 mt-2">
                        <div className="flex items-center gap-2 mb-3">
                            <input 
                                type="checkbox" 
                                id="extra" 
                                checked={formData.isExtra} 
                                onChange={e => setFormData({...formData, isExtra: e.target.checked})} 
                                className="h-4 w-4 text-indigo-600 rounded bg-white" 
                            />
                            <label htmlFor="extra" className="text-sm font-bold text-slate-800 cursor-pointer">
                                Dépense temporaire / Exceptionnelle
                            </label>
                        </div>
                        
                        {formData.isExtra && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <TextInput 
                                    label="Mois de début"
                                    type="month"
                                    value={formData.startMonth}
                                    onChange={e => setFormData({...formData, startMonth: e.target.value})}
                                    required={formData.isExtra}
                                />
                                
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2 text-xs mb-1">
                                        <button type="button" onClick={() => setDurationMode('duration')} className={`px-2 py-1 rounded ${durationMode === 'duration' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}>Par durée</button>
                                        <button type="button" onClick={() => setDurationMode('dates')} className={`px-2 py-1 rounded ${durationMode === 'dates' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}>Par date de fin</button>
                                    </div>
                                    {durationMode === 'duration' ? (
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Durée (Mois)</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" min="1" 
                                                    value={durationMonths} 
                                                    onChange={e => setDurationMonths(parseInt(e.target.value) || 1)} 
                                                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900" 
                                                />
                                                <span className="text-xs text-slate-500 whitespace-nowrap bg-slate-100 px-2 py-2 rounded">
                                                    Fin : {formData.endMonth || '?'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <TextInput 
                                            label="Mois de fin"
                                            type="month"
                                            value={formData.endMonth}
                                            onChange={e => {
                                                setDurationMonths(0);
                                                setFormData({...formData, endMonth: e.target.value});
                                            }}
                                            required={formData.isExtra}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
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
                        <button onClick={handleSubmit} className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                            <Save size={18} /> {editingId ? 'Mettre à jour' : 'Créer la règle'}
                        </button>
                    </div>
                </div>
            </Modal>

            <DataList 
                title="Modèles de Dépenses" 
                count={configs.length} 
                onAdd={handleAddClick}
                addButtonLabel="Créer un modèle"
            >
                {sortedConfigs.map(config => {
                    const accountName = accounts.find(a => a.id === config.accountId)?.name || 'Inconnu';
                    const beneficiaryName = people.find(p => p.id === config.beneficiaryId)?.name || '?';
                    return (
                        <DataListRow 
                            key={config.id}
                            date={{ day: config.dayOfMonth, month: 'DU MOIS' }}
                            label={config.label}
                            amount={config.amount}
                            category={config.category}
                            subCategory={config.subCategory}
                            beneficiary={beneficiaryName}
                            accountName={accountName}
                            onClick={() => handleEdit(config)}
                            badge={config.isExtra ? <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Temp</span> : null}
                        />
                    );
                })}
            </DataList>
        </div>
    );
};
