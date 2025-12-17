
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, CalendarRange, Wallet, Pencil, X, CreditCard, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { ExpenseConfig, CategoryDef, Person, Account } from '../../../types';

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
    const [sortKey, setSortKey] = useState<SortKey>('dayOfMonth');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
    const defaultCat = expenseCategories[0]?.name || '';
    const defaultAccount = accounts[0]?.id || '';

    const [formData, setFormData] = useState<Partial<ExpenseConfig>>({
        label: '', amount: 0, dayOfMonth: 1, 
        accountId: defaultAccount, 
        beneficiaryId: people[0]?.id, 
        category: defaultCat, subCategory: '', isExtra: false, startMonth: '', endMonth: ''
    });

    const [durationMode, setDurationMode] = useState<'dates' | 'duration'>('duration');
    const [durationMonths, setDurationMonths] = useState<number>(1);

    useEffect(() => {
        if (formData.isExtra && durationMode === 'duration' && formData.startMonth && durationMonths > 0) {
            const [year, month] = formData.startMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + durationMonths - 1);
            
            const endYear = endDate.getFullYear();
            const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
            setFormData(prev => ({ ...prev, endMonth: `${endYear}-${endMonth}` }));
        }
    }, [formData.startMonth, durationMonths, durationMode, formData.isExtra]);

    const resetForm = () => {
        setFormData({ 
            label: '', amount: 0, dayOfMonth: 1, 
            accountId: accounts[0]?.id || '', 
            beneficiaryId: people[0]?.id, 
            category: expenseCategories[0]?.name || '', subCategory: '', 
            isExtra: false, startMonth: '', endMonth: '' 
        });
        setDurationMode('duration');
        setDurationMonths(3);
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (config: ExpenseConfig) => {
        setFormData(config);
        setEditingId(config.id);
        setIsFormOpen(true);
        setDurationMode('dates'); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalConfig: ExpenseConfig = {
            id: editingId || Date.now().toString(),
            ...formData as any
        };
        editingId ? onUpdateConfig(finalConfig) : onAddConfig(finalConfig);
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

    const activeSubCats = categories.find(c => c.name === formData.category)?.subCategories || [];

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-medium text-slate-500 px-2 uppercase">Trier :</span>
                    <button onClick={() => toggleSort('dayOfMonth')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'dayOfMonth' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Date {sortKey === 'dayOfMonth' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('label')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'label' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Libellé {sortKey === 'label' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('amount')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'amount' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Montant {sortKey === 'amount' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                </div>
                {!isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm active:scale-95 transition-all">
                        <Plus size={18} /> Ajouter
                    </button>
                )}
            </div>

            {isFormOpen && (
                <Card className={`border ${editingId ? 'border-amber-200 bg-amber-50/30' : 'border-indigo-100 bg-indigo-50/50'}`}>
                    <CardHeader className="flex flex-row justify-between items-center py-3">
                        <CardTitle className="text-base">{editingId ? 'Modifier la dépense' : 'Nouvelle Dépense Récurrente'}</CardTitle>
                        <button onClick={resetForm}><X size={20} className="text-slate-400" /></button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-slate-500 uppercase">Libellé</label>
                                <input type="text" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" />
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
                             <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Catégorie</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, subCategory: ''})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900">
                                    {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Sous-Catégorie</label>
                                <select value={formData.subCategory || ''} onChange={e => setFormData({...formData, subCategory: e.target.value})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" disabled={activeSubCats.length === 0}>
                                    <option value="">-- Aucune --</option>
                                    {activeSubCats.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2 bg-white/50 p-3 rounded-lg border border-slate-200 mt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <input type="checkbox" id="extra" checked={formData.isExtra} onChange={e => setFormData({...formData, isExtra: e.target.checked})} className="h-4 w-4 text-indigo-600 rounded bg-white" />
                                    <label htmlFor="extra" className="text-sm font-semibold text-slate-700">Dépense temporaire / Exceptionnelle</label>
                                </div>
                                {formData.isExtra && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase">Mois de début</label>
                                            <input type="month" required={formData.isExtra} value={formData.startMonth} onChange={e => setFormData({...formData, startMonth: e.target.value})} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2 text-xs">
                                                <button type="button" onClick={() => setDurationMode('duration')} className={`px-2 py-1 rounded ${durationMode === 'duration' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}>Par durée</button>
                                                <button type="button" onClick={() => setDurationMode('dates')} className={`px-2 py-1 rounded ${durationMode === 'dates' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}>Par date de fin</button>
                                            </div>
                                            {durationMode === 'duration' ? (
                                                <div>
                                                     <label className="text-xs font-medium text-slate-500 uppercase">Durée (Mois)</label>
                                                     <div className="flex items-center gap-2">
                                                        <input type="number" min="1" value={durationMonths} onChange={e => setDurationMonths(parseInt(e.target.value) || 1)} className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" />
                                                        <span className="text-xs text-slate-500 whitespace-nowrap">Fin : {formData.endMonth || '...'}</span>
                                                     </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-xs font-medium text-slate-500 uppercase">Mois de fin</label>
                                                    <input 
                                                        type="month" 
                                                        required={formData.isExtra} 
                                                        value={formData.endMonth} 
                                                        onChange={e => {
                                                            setDurationMonths(0);
                                                            setFormData({...formData, endMonth: e.target.value});
                                                        }} 
                                                        className="w-full p-2 rounded border border-slate-300 bg-white text-slate-900" 
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="md:col-span-2 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800">Sauvegarder</button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-3">
                {sortedConfigs.map(config => {
                    const accountName = accounts.find(a => a.id === config.accountId)?.name || 'Compte inconnu';
                    const beneficiaryName = people.find(p => p.id === config.beneficiaryId)?.name || '?';
                    return (
                        <div key={config.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${config.isExtra ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {config.isExtra ? <CalendarRange size={18} /> : <Wallet size={18} />}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900">{config.label}</h4>
                                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                                        <span className="bg-slate-100 px-1.5 rounded">Le {config.dayOfMonth}</span>
                                        <span>•</span>
                                        <span>{config.category} {config.subCategory && `> ${config.subCategory}`}</span>
                                        <span>•</span>
                                        <span className="text-indigo-600">Pour {beneficiaryName}</span>
                                        <span>•</span>
                                        <span className="text-slate-600 flex items-center gap-1"><CreditCard size={10}/> {accountName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-700">{config.amount.toFixed(2)} €</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(config)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Pencil size={16} /></button>
                                    <button onClick={() => onDeleteConfig(config.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
