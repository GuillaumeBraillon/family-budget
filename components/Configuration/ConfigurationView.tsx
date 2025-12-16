import React, { useState, useMemo, useEffect } from 'react';
import { ExpenseConfig, IncomeConfig, CategoryDef, Person, Account, AccountType } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Settings, Plus, Trash2, CalendarRange, Wallet, User, Pencil, X, Tag, Users, CreditCard, ChevronDown, ChevronRight, Save, Clock, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';

// --- TYPES ---

type Tab = 'rules' | 'incomes' | 'categories' | 'family' | 'accounts';
type SortKey = 'dayOfMonth' | 'label' | 'amount';
type SortOrder = 'asc' | 'desc';

interface ConfigurationViewProps {
  configs: ExpenseConfig[];
  incomeConfigs?: IncomeConfig[]; 
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  onAddConfig: (config: ExpenseConfig) => void;
  onUpdateConfig: (config: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddIncome?: (config: IncomeConfig) => void;
  onUpdateIncome?: (config: IncomeConfig) => void;
  onDeleteIncome?: (id: string) => void;
  onUpdateCategories: (newCategories: CategoryDef[]) => void;
  onUpdatePeople: (newPeople: Person[]) => void;
  onUpdateAccounts: (newAccounts: Account[]) => void;
}

// --- INTERNAL CONFIRM MODAL COMPONENT ---
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl shadow-lg max-w-sm w-full overflow-hidden">
         <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3 text-red-600">
            <AlertCircle size={24} />
            <h3 className="font-semibold text-slate-900">{title}</h3>
         </div>
         <div className="p-6">
            <div className="text-slate-600 mb-6 text-sm">{message}</div>
            <div className="flex gap-3 justify-end">
                <button 
                    onClick={onCancel} 
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 text-sm"
                >
                    Annuler
                </button>
                <button 
                    onClick={onConfirm} 
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm text-sm"
                >
                    Supprimer
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS EXTRACTED ---

// 1. EXPENSE RULES EDITOR
const ExpenseRulesEditor: React.FC<{
    configs: ExpenseConfig[];
    categories: CategoryDef[];
    people: Person[];
    onAddConfig: (c: ExpenseConfig) => void;
    onUpdateConfig: (c: ExpenseConfig) => void;
    onDeleteConfig: (id: string) => void;
}> = ({ configs, categories, people, onAddConfig, onUpdateConfig, onDeleteConfig }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    const [sortKey, setSortKey] = useState<SortKey>('dayOfMonth');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
    const defaultCat = expenseCategories[0]?.name || '';

    const [formData, setFormData] = useState<Partial<ExpenseConfig>>({
        label: '', amount: 0, dayOfMonth: 1, ownerId: people[0]?.id, beneficiaryId: people[0]?.id, 
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
            ownerId: people[0]?.id, beneficiaryId: people[0]?.id, 
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
                res = a[sortKey] - b[sortKey];
            }
            return sortOrder === 'asc' ? res : -res;
        });
    }, [configs, sortKey, sortOrder]);

    const activeSubCats = categories.find(c => c.name === formData.category)?.subCategories || [];

    return (
        <div className="space-y-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-medium text-slate-500 px-2 uppercase">Trier par :</span>
                    <button onClick={() => toggleSort('dayOfMonth')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'dayOfMonth' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Date {sortKey === 'dayOfMonth' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('label')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'label' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Libellé {sortKey === 'label' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('amount')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'amount' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>Montant {sortKey === 'amount' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                </div>
                {!isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                        <Plus size={16} /> Ajouter une règle
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
                                <input type="text" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full p-2 rounded border border-slate-300" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Montant (€)</label>
                                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 rounded border border-slate-300" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Jour du mois</label>
                                <input type="number" min="1" max="31" required value={formData.dayOfMonth} onChange={e => setFormData({...formData, dayOfMonth: parseInt(e.target.value)})} className="w-full p-2 rounded border border-slate-300" />
                            </div>
                             <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Compte Payeur</label>
                                <select value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} className="w-full p-2 rounded border border-slate-300">
                                    {people.filter(p => !p.isChild).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Bénéficiaire</label>
                                <select value={formData.beneficiaryId} onChange={e => setFormData({...formData, beneficiaryId: e.target.value})} className="w-full p-2 rounded border border-slate-300">
                                    {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Catégorie</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, subCategory: ''})} className="w-full p-2 rounded border border-slate-300">
                                    {expenseCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Sous-Catégorie</label>
                                <select value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} className="w-full p-2 rounded border border-slate-300" disabled={activeSubCats.length === 0}>
                                    <option value="">-- Aucune --</option>
                                    {activeSubCats.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                                </select>
                            </div>
                            
                            <div className="md:col-span-2 bg-white/50 p-3 rounded-lg border border-slate-200 mt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <input type="checkbox" id="extra" checked={formData.isExtra} onChange={e => setFormData({...formData, isExtra: e.target.checked})} className="h-4 w-4 text-indigo-600 rounded" />
                                    <label htmlFor="extra" className="text-sm font-semibold text-slate-700">Dépense temporaire / Exceptionnelle</label>
                                </div>
                                {formData.isExtra && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-xs font-medium text-slate-500 uppercase">Mois de début</label>
                                            <input type="month" required={formData.isExtra} value={formData.startMonth} onChange={e => setFormData({...formData, startMonth: e.target.value})} className="w-full p-2 rounded border border-slate-300" />
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
                                                        <input type="number" min="1" value={durationMonths} onChange={e => setDurationMonths(parseInt(e.target.value) || 1)} className="w-full p-2 rounded border border-slate-300" />
                                                        <span className="text-xs text-slate-500 whitespace-nowrap">Fin : {formData.endMonth || '...'}</span>
                                                     </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-xs font-medium text-slate-500 uppercase">Mois de fin</label>
                                                    <input type="month" required={formData.isExtra} value={formData.endMonth} onChange={e => setFormData({...formData, endMonth: e.target.value})} className="w-full p-2 rounded border border-slate-300" />
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
                    const ownerName = people.find(p => p.id === config.ownerId)?.name || '?';
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
                                        <span className="text-slate-600">Par {ownerName}</span>
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

// 2. INCOME EDITOR
const IncomeEditor: React.FC<{
    incomeConfigs: IncomeConfig[];
    people: Person[];
    categories: CategoryDef[];
    onAddIncome: (i: IncomeConfig) => void;
    onUpdateIncome: (i: IncomeConfig) => void;
    onDeleteIncome: (id: string) => void;
}> = ({ incomeConfigs, people, categories, onAddIncome, onUpdateIncome, onDeleteIncome }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [sortKey, setSortKey] = useState<SortKey>('dayOfMonth');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const incomeCategories = categories.filter(c => c.type === 'INCOME');
    const defaultIncomeCat = incomeCategories[0]?.name || 'Salaire';

    const [formData, setFormData] = useState<Partial<IncomeConfig>>({
        label: '', amount: 0, dayOfMonth: 1, ownerId: people[0]?.id, 
        category: defaultIncomeCat
    });

    const resetForm = () => {
        setFormData({ label: '', amount: 0, dayOfMonth: 1, ownerId: people[0]?.id, category: incomeCategories[0]?.name || 'Salaire' });
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
                res = a[sortKey] - b[sortKey];
            }
            return sortOrder === 'asc' ? res : -res;
        });
    }, [incomeConfigs, sortKey, sortOrder]);

    return (
        <div className="space-y-4">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-xs font-medium text-slate-500 px-2 uppercase">Trier par :</span>
                    <button onClick={() => toggleSort('dayOfMonth')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'dayOfMonth' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Date {sortKey === 'dayOfMonth' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('label')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'label' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Libellé {sortKey === 'label' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                    <button onClick={() => toggleSort('amount')} className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${sortKey === 'amount' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-600'}`}>Montant {sortKey === 'amount' && (sortOrder === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</button>
                </div>
                {!isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-emerald-700">
                        <Plus size={16} /> Ajouter un revenu
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
                                <input type="text" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full p-2 rounded border border-slate-300" placeholder="Ex: Salaire Guillaume, CAF..." />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Montant (€)</label>
                                <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 rounded border border-slate-300" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Jour de réception</label>
                                <input type="number" min="1" max="31" required value={formData.dayOfMonth} onChange={e => setFormData({...formData, dayOfMonth: parseInt(e.target.value)})} className="w-full p-2 rounded border border-slate-300" />
                            </div>
                             <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Compte de réception</label>
                                <select value={formData.ownerId} onChange={e => setFormData({...formData, ownerId: e.target.value})} className="w-full p-2 rounded border border-slate-300">
                                    {people.filter(p => !p.isChild).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Type</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 rounded border border-slate-300">
                                    {incomeCategories.length > 0 ? (
                                        incomeCategories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))
                                    ) : (
                                        <option value="Salaire">Salaire</option>
                                    )}
                                </select>
                            </div>
                            <button type="submit" className="md:col-span-2 bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800">Sauvegarder</button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-3">
                {sortedIncomes.map(inc => {
                    const ownerName = people.find(p => p.id === inc.ownerId)?.name || '?';
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
                                        <span>{inc.category}</span>
                                        <span>•</span>
                                        <span className="text-emerald-600">Versé sur : {ownerName}</span>
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

// 3. CATEGORY MANAGER
const CategoryManager: React.FC<{
    categories: CategoryDef[];
    onUpdateCategories: (cats: CategoryDef[]) => void;
}> = ({ categories, onUpdateCategories }) => {
    // Mode toggle: 'EXPENSE' (default) vs 'INCOME'
    const [mode, setMode] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    
    const currentList = categories.filter(c => c.type === mode);

    const [expandedCat, setExpandedCat] = useState<string | null>(null);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    
    const [newSubCat, setNewSubCat] = useState('');
    const [editingSubCat, setEditingSubCat] = useState<{ catId: string, oldName: string } | null>(null);
    const [tempSubName, setTempSubName] = useState('');

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);

    // --- GENERIC UPDATER HELPER ---
    const applyChanges = (modifiedSubset: CategoryDef[]) => {
        const others = categories.filter(c => c.type !== mode);
        const final = [...others, ...modifiedSubset];
        onUpdateCategories(final);
    };

    const addCategory = () => {
        const newCat: CategoryDef = { 
            id: `${mode === 'INCOME' ? 'inc' : 'cat'}_${Date.now()}`, 
            name: 'Nouvelle Catégorie', 
            type: mode, 
            subCategories: [] 
        };
        applyChanges([...currentList, newCat]);
        setEditingCatId(newCat.id);
        setTempName(newCat.name);
    };

    const saveCatName = (id: string) => {
        const updated = currentList.map(c => c.id === id ? { ...c, name: tempName } : c);
        applyChanges(updated);
        setEditingCatId(null);
    };

    const confirmDeleteCat = (cat: CategoryDef) => {
        setDeleteConfirm({ id: cat.id, name: cat.name });
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            const updated = currentList.filter(c => c.id !== deleteConfirm.id);
            applyChanges(updated);
            setDeleteConfirm(null);
        }
    };

    const addSubCat = (catId: string) => {
        if(!newSubCat) return;
        const updated = currentList.map(c => c.id === catId ? { ...c, subCategories: [...c.subCategories, newSubCat] } : c);
        applyChanges(updated);
        setNewSubCat('');
    };

    const removeSubCat = (catId: string, subName: string) => {
        const updated = currentList.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.filter(s => s !== subName) } : c);
        applyChanges(updated);
    };

    const startEditSubCat = (catId: string, subName: string) => {
        setEditingSubCat({ catId, oldName: subName });
        setTempSubName(subName);
    };

    const saveSubCat = () => {
        if (!editingSubCat) return;
        const updated = currentList.map(c => {
            if (c.id === editingSubCat.catId) {
                return {
                    ...c,
                    subCategories: c.subCategories.map(s => s === editingSubCat.oldName ? tempSubName : s)
                };
            }
            return c;
        });
        applyChanges(updated);
        setEditingSubCat(null);
        setTempSubName('');
    };

    return (
        <div className="space-y-4">
             <ConfirmModal 
                isOpen={!!deleteConfirm}
                title="Supprimer la catégorie ?"
                message={<span>Voulez-vous vraiment supprimer la catégorie <strong>{deleteConfirm?.name}</strong> ?</span>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
             />

             {/* MODE SWITCHER */}
             <div className="flex justify-center mb-6">
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                     <button 
                        onClick={() => setMode('EXPENSE')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'EXPENSE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                     >
                        Catégories Dépenses
                     </button>
                     <button 
                        onClick={() => setMode('INCOME')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${mode === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                     >
                        Types de Revenus
                     </button>
                 </div>
             </div>

             <div className="flex justify-end">
                <button onClick={addCategory} className={`${mode === 'EXPENSE' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2`}>
                    <Plus size={16} /> {mode === 'EXPENSE' ? 'Nouvelle Dépense' : 'Nouveau Type de Revenu'}
                </button>
            </div>
            <div className="grid gap-2">
                {currentList.map(cat => (
                    <div key={cat.id} className={`bg-white border rounded-lg overflow-hidden ${mode === 'INCOME' ? 'border-emerald-100' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between p-3 bg-slate-50">
                            <div className="flex items-center gap-2 flex-1">
                                <button onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} className="text-slate-500">
                                    {expandedCat === cat.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                                {editingCatId === cat.id ? (
                                    <div className="flex items-center gap-2">
                                        <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} className="p-1 text-sm border rounded" />
                                        <button onClick={() => saveCatName(cat.id)} className="text-green-600"><Save size={16} /></button>
                                    </div>
                                ) : (
                                    <span className="font-semibold text-slate-800 cursor-pointer" onClick={() => setExpandedCat(cat.id)}>{cat.name}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingCatId(cat.id); setTempName(cat.name); }} className="text-slate-400 hover:text-indigo-600"><Pencil size={16} /></button>
                                <button onClick={() => confirmDeleteCat(cat)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        {expandedCat === cat.id && (
                            <div className="p-3 bg-white border-t border-slate-100">
                                <div className="space-y-2">
                                    {cat.subCategories.map((sub, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm pl-8 pr-2 py-1 hover:bg-slate-50 rounded group">
                                            {editingSubCat?.catId === cat.id && editingSubCat?.oldName === sub ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                     <input 
                                                        autoFocus 
                                                        value={tempSubName} 
                                                        onChange={e => setTempSubName(e.target.value)} 
                                                        className="p-1 text-sm border rounded w-full"
                                                        onKeyDown={e => e.key === 'Enter' && saveSubCat()} 
                                                    />
                                                     <button onClick={saveSubCat} className="text-green-600"><Save size={14} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>{sub}</span>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditSubCat(cat.id, sub)} className="text-slate-300 hover:text-indigo-500"><Pencil size={14} /></button>
                                                        <button onClick={() => removeSubCat(cat.id, sub)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 pl-8 mt-2 border-t border-dashed border-slate-200 pt-2">
                                        <input 
                                            placeholder="Nouvelle sous-catégorie..." 
                                            className="text-sm p-1.5 border border-slate-300 rounded flex-1"
                                            value={newSubCat}
                                            onChange={e => setNewSubCat(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addSubCat(cat.id)}
                                        />
                                        <button onClick={() => addSubCat(cat.id)} className={`${mode === 'INCOME' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-indigo-600 hover:bg-indigo-50'} p-1 rounded`}><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. PEOPLE MANAGER
const PeopleManager: React.FC<{
    people: Person[];
    onUpdatePeople: (p: Person[]) => void;
}> = ({ people, onUpdatePeople }) => {
    const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [tempIsChild, setTempIsChild] = useState(false);
    
    // New person state
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
                    <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2 border border-slate-300 rounded" placeholder="Prénom..." />
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="child" checked={isChild} onChange={e => setIsChild(e.target.checked)} className="h-4 w-4 text-indigo-600" />
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
                                    <input value={tempName} onChange={e => setTempName(e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={tempIsChild} onChange={e => setTempIsChild(e.target.checked)} className="h-4 w-4" />
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

// 5. ACCOUNT MANAGER
const AccountManager: React.FC<{
    accounts: Account[];
    people: Person[];
    onUpdateAccounts: (a: Account[]) => void;
}> = ({ accounts, people, onUpdateAccounts }) => {
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
                    <input value={newAccName} onChange={e => setNewAccName(e.target.value)} className="w-full p-2 border border-slate-300 rounded" placeholder="Ex: Compte Joint..." />
                </div>
                 <div className="w-full md:w-48">
                    <label className="text-xs text-slate-500 uppercase font-medium">Titulaire</label>
                    <select value={ownerId} onChange={e => setOwnerId(e.target.value)} className="w-full p-2 border border-slate-300 rounded">
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
                                        <input value={tempAccName} onChange={e => setTempAccName(e.target.value)} className="p-1 border rounded text-sm flex-1" />
                                        <select value={tempOwnerId} onChange={e => setTempOwnerId(e.target.value)} className="p-1 border rounded text-sm">
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

// --- MAIN COMPONENT ---

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  configs, incomeConfigs = [], categories, people, accounts,
  onAddConfig, onUpdateConfig, onDeleteConfig, 
  onAddIncome, onUpdateIncome, onDeleteIncome,
  onUpdateCategories,
  onUpdatePeople, onUpdateAccounts 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('rules');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="text-indigo-600" />
            Paramètres
        </h2>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto scrollbar-hide">
         <button onClick={() => setActiveTab('rules')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rules' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Dépenses
         </button>
         <button onClick={() => setActiveTab('incomes')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'incomes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Revenus
         </button>
         <button onClick={() => setActiveTab('categories')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Catégories
         </button>
         <button onClick={() => setActiveTab('family')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'family' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Famille
         </button>
         <button onClick={() => setActiveTab('accounts')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'accounts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Comptes
         </button>
      </div>

      <div className="pt-2">
        {activeTab === 'rules' && (
            <ExpenseRulesEditor 
                configs={configs} 
                categories={categories} 
                people={people} 
                onAddConfig={onAddConfig} 
                onUpdateConfig={onUpdateConfig} 
                onDeleteConfig={onDeleteConfig} 
            />
        )}
        {activeTab === 'incomes' && (
            <IncomeEditor 
                incomeConfigs={incomeConfigs} 
                people={people} 
                categories={categories} 
                onAddIncome={onAddIncome!} 
                onUpdateIncome={onUpdateIncome!} 
                onDeleteIncome={onDeleteIncome!} 
            />
        )}
        {activeTab === 'categories' && (
            <CategoryManager 
                categories={categories} 
                onUpdateCategories={onUpdateCategories} 
            />
        )}
        {activeTab === 'family' && (
            <PeopleManager 
                people={people} 
                onUpdatePeople={onUpdatePeople} 
            />
        )}
        {activeTab === 'accounts' && (
            <AccountManager 
                accounts={accounts} 
                people={people} 
                onUpdateAccounts={onUpdateAccounts} 
            />
        )}
      </div>
    </div>
  );
};