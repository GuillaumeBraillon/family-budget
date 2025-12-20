
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, CreditCard, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { IncomeConfig, CategoryDef, Person, Account } from '../../../types';
import { CategorySelector } from '../../molecules/CategorySelector';

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
    };

    const handleEdit = (inc: IncomeConfig) => {
        setFormData(inc);
        setEditingId(inc.id);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const final: IncomeConfig = {
            id: editingId || Date.now().toString(),
            ...formData as any
        };
        editingId ? onUpdateIncome(final) : onAddIncome(final);
        resetForm();
    };

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

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-medium text-slate-500 px-2 uppercase">Trier :</span>
                    <button onClick={() => toggleSort('dayOfMonth')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'dayOfMonth' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Date {sortKey === 'dayOfMonth' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('label')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'label' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Libellé {sortKey === 'label' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('amount')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'amount' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Montant {sortKey === 'amount' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                </div>
                {!isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm active:scale-95 transition-all">
                        <Plus size={18} /> Ajouter
                    </button>
                )}
            </div>

            {isFormOpen && (
                <Card className={`border ${editingId ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/50'}`}>
                    <CardHeader className="flex flex-row justify-between items-center py-3">
                        <CardTitle className="text-base">{editingId ? 'Modifier le revenu' : 'Nouveau Revenu Récurrent'}</CardTitle>
                        <button onClick={resetForm}><X size={20} className="text-slate-400" /></button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-slate-500 uppercase">Libellé</label>
                                <input type="text" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" placeholder="Ex: Salaire Guillaume, CAF..." />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Montant (€)</label>
                                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Jour du mois</label>
                                <input type="number" min="1" max="31" required value={formData.dayOfMonth} onChange={e => setFormData({...formData, dayOfMonth: parseInt(e.target.value)})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" />
                            </div>
                             <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Compte</label>
                                <select value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900">
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Bénéficiaire</label>
                                <select value={formData.beneficiaryId} onChange={e => setFormData({...formData, beneficiaryId: e.target.value})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900">
                                    {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            
                            {/* CATEGORY SELECTOR REUSABLE */}
                            <CategorySelector 
                                categories={categories}
                                type="INCOME"
                                selectedCategory={formData.category || ''}
                                selectedSubCategory={formData.subCategory || ''}
                                onCategoryChange={val => setFormData({...formData, category: val})}
                                onSubCategoryChange={val => setFormData({...formData, subCategory: val})}
                            />
                            
                            <button type="submit" className="md:col-span-2 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800">Sauvegarder</button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-3">
                {sortedIncomes.map(inc => {
                    const accountName = accounts.find(a => a.id === inc.accountId)?.name || 'Compte Inconnu';
                    const beneficiaryName = people.find(p => p.id === inc.beneficiaryId)?.name || '?';
                    return (
                        <div key={inc.id} className="bg-white p-4 rounded-lg border border-emerald-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">{inc.label}</h4>
                                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                                        <span className="bg-slate-100 px-1.5 rounded">Le {inc.dayOfMonth}</span>
                                        <span>•</span>
                                        <span>{inc.category} {inc.subCategory && `> ${inc.subCategory}`}</span>
                                        <span>•</span>
                                        <span className="text-indigo-600">Bénéf.: {beneficiaryName}</span>
                                        <span>•</span>
                                        <span className="text-emerald-600 flex items-center gap-1"><CreditCard size={10}/> {accountName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-emerald-600">+{inc.amount.toFixed(2)} €</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(inc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Pencil size={16} /></button>
                                    <button onClick={() => onDeleteIncome && onDeleteIncome(inc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
