import React, { useState, useEffect } from 'react';
import { ExpenseConfig, CategoryDef, Person, Account, AccountType } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Settings, Plus, Trash2, CalendarRange, Wallet, User, Pencil, X, Tag, Users, CreditCard, ChevronDown, ChevronRight, Save, Clock } from 'lucide-react';

interface ConfigurationViewProps {
  configs: ExpenseConfig[];
  categories: CategoryDef[];
  people: Person[];
  accounts: Account[];
  onAddConfig: (config: ExpenseConfig) => void;
  onUpdateConfig: (config: ExpenseConfig) => void;
  onDeleteConfig: (id: string) => void;
  onUpdateCategories: (newCategories: CategoryDef[]) => void;
  onUpdatePeople: (newPeople: Person[]) => void;
  onUpdateAccounts: (newAccounts: Account[]) => void;
}

type Tab = 'rules' | 'categories' | 'family' | 'accounts';

export const ConfigurationView: React.FC<ConfigurationViewProps> = ({ 
  configs, categories, people, accounts,
  onAddConfig, onUpdateConfig, onDeleteConfig, 
  onUpdateCategories, onUpdatePeople, onUpdateAccounts 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('rules');

  // --- SUB-COMPONENTS LOGIC (INLINED FOR SIMPLICITY) ---

  // 1. EXPENSE RULES EDITOR
  const ExpenseRulesEditor = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // State form
    const [formData, setFormData] = useState<Partial<ExpenseConfig>>({
        label: '', amount: 0, dayOfMonth: 1, ownerId: people[0]?.id, beneficiaryId: people.find(p => p.name === 'Commun')?.id || people[0]?.id, category: categories[0]?.name, subCategory: '', isExtra: false, startMonth: '', endMonth: ''
    });

    // Extra Duration Logic
    const [durationMode, setDurationMode] = useState<'dates' | 'duration'>('duration');
    const [durationMonths, setDurationMonths] = useState<number>(1);

    // Calcul automatique de la date de fin si on change la durée ou la date de début
    useEffect(() => {
        if (formData.isExtra && durationMode === 'duration' && formData.startMonth && durationMonths > 0) {
            const [year, month] = formData.startMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1); // JS months are 0-indexed
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + durationMonths - 1); // -1 car inclusif (ex: 1 mois = startMonth == endMonth)
            
            const endYear = endDate.getFullYear();
            const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
            setFormData(prev => ({ ...prev, endMonth: `${endYear}-${endMonth}` }));
        }
    }, [formData.startMonth, durationMonths, durationMode, formData.isExtra]);

    const resetForm = () => {
        setFormData({ 
            label: '', amount: 0, dayOfMonth: 1, 
            ownerId: people[0]?.id, beneficiaryId: people.find(p => p.name === 'Commun')?.id || people[0]?.id, 
            category: categories[0]?.name, subCategory: '', 
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
        // Detect duration logic if needed (optional inference)
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

    const activeSubCats = categories.find(c => c.name === formData.category)?.subCategories || [];

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                {!isFormOpen && (
                    <button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                        <Plus size={16} /> Ajouter une règle
                    </button>
                )}
            </div>

            {isFormOpen && (
                <Card className={`border ${editingId ? 'border-amber-200 bg-amber-50/30' : 'border-indigo-100 bg-indigo-50/50'}`}>
                    <CardHeader className="flex flex-row justify-between items-center py-3">
                        <CardTitle className="text-base">{editingId ? 'Modifier la dépense' : 'Nouvelle Règle'}</CardTitle>
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
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase">Sous-Catégorie</label>
                                <select value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} className="w-full p-2 rounded border border-slate-300" disabled={activeSubCats.length === 0}>
                                    <option value="">-- Aucune --</option>
                                    {activeSubCats.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                                </select>
                            </div>
                            
                            {/* EXTRA EXPENSE SECTION */}
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
                                                <button 
                                                    type="button" 
                                                    onClick={() => setDurationMode('duration')}
                                                    className={`px-2 py-1 rounded ${durationMode === 'duration' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    Par durée
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setDurationMode('dates')}
                                                    className={`px-2 py-1 rounded ${durationMode === 'dates' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}
                                                >
                                                    Par date de fin
                                                </button>
                                            </div>

                                            {durationMode === 'duration' ? (
                                                <div>
                                                     <label className="text-xs font-medium text-slate-500 uppercase">Durée (Mois)</label>
                                                     <div className="flex items-center gap-2">
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            value={durationMonths} 
                                                            onChange={e => setDurationMonths(parseInt(e.target.value) || 1)} 
                                                            className="w-full p-2 rounded border border-slate-300" 
                                                        />
                                                        <span className="text-xs text-slate-500 whitespace-nowrap">
                                                            Fin : {formData.endMonth || '...'}
                                                        </span>
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
                {configs.map(config => {
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
                                        <span>
                                            {config.category}
                                            {config.subCategory && <span className="text-slate-400 mx-1">&gt;</span>}
                                            {config.subCategory}
                                        </span>
                                        <span>•</span>
                                        <span className="text-indigo-600">Pour {beneficiaryName}</span>
                                        <span>•</span>
                                        <span className="text-slate-600">Par {ownerName}</span>
                                        {config.isExtra && config.startMonth && (
                                            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 rounded flex items-center gap-1">
                                                <Clock size={10} />
                                                {config.startMonth} ➔ {config.endMonth}
                                            </span>
                                        )}
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

  // 2. CATEGORY MANAGER
  const CategoryManager = () => {
    const [expandedCat, setExpandedCat] = useState<string | null>(null);
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    
    // SubCategory Edit State
    const [newSubCat, setNewSubCat] = useState('');
    const [editingSubCat, setEditingSubCat] = useState<{ catId: string, oldName: string } | null>(null);
    const [tempSubName, setTempSubName] = useState('');

    const addCategory = () => {
        const newCat: CategoryDef = { id: Date.now().toString(), name: 'Nouvelle Catégorie', subCategories: [] };
        onUpdateCategories([...categories, newCat]);
        setEditingCatId(newCat.id);
        setTempName(newCat.name);
    };

    const saveCatName = (id: string) => {
        onUpdateCategories(categories.map(c => c.id === id ? { ...c, name: tempName } : c));
        setEditingCatId(null);
    };

    const deleteCat = (id: string) => {
        if(confirm("Supprimer cette catégorie ?")) onUpdateCategories(categories.filter(c => c.id !== id));
    };

    const addSubCat = (catId: string) => {
        if(!newSubCat) return;
        onUpdateCategories(categories.map(c => c.id === catId ? { ...c, subCategories: [...c.subCategories, newSubCat] } : c));
        setNewSubCat('');
    };

    const removeSubCat = (catId: string, subName: string) => {
        onUpdateCategories(categories.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.filter(s => s !== subName) } : c));
    };

    const startEditSubCat = (catId: string, subName: string) => {
        setEditingSubCat({ catId, oldName: subName });
        setTempSubName(subName);
    };

    const saveSubCat = () => {
        if (!editingSubCat) return;
        onUpdateCategories(categories.map(c => {
            if (c.id === editingSubCat.catId) {
                return {
                    ...c,
                    subCategories: c.subCategories.map(s => s === editingSubCat.oldName ? tempSubName : s)
                };
            }
            return c;
        }));
        setEditingSubCat(null);
        setTempSubName('');
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-end">
                <button onClick={addCategory} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={16} /> Nouvelle Catégorie
                </button>
            </div>
            <div className="grid gap-2">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
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
                                <button onClick={() => deleteCat(cat.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
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
                                        <button onClick={() => addSubCat(cat.id)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded"><Plus size={18} /></button>
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

  // 3. PEOPLE MANAGER
  const PeopleManager = () => {
    const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [tempIsChild, setTempIsChild] = useState(false);

    // New person state
    const [newName, setNewName] = useState('');
    const [isChild, setIsChild] = useState(false);

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

    const removePerson = (id: string) => {
        if(confirm("Supprimer cette personne ? Attention aux dépenses liées.")) {
            onUpdatePeople(people.filter(p => p.id !== id));
        }
    };

    return (
        <div className="space-y-4">
             <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-end md:items-center shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-xs text-slate-500 uppercase font-medium">Ajouter une personne</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2 border border-slate-300 rounded" placeholder="Prénom..." />
                </div>
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                    <input type="checkbox" id="child" checked={isChild} onChange={e => setIsChild(e.target.checked)} className="h-4 w-4 text-indigo-600" />
                    <label htmlFor="child" className="text-sm text-slate-700">Enfant (Non payeur)</label>
                </div>
                <button onClick={addPerson} className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 w-full md:w-auto">Ajouter</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {people.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                        {editingPersonId === p.id ? (
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex-1 space-y-2">
                                    <input value={tempName} onChange={e => setTempName(e.target.value)} className="w-full p-1 border rounded text-sm" />
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={tempIsChild} onChange={e => setTempIsChild(e.target.checked)} className="h-4 w-4" />
                                        <span className="text-xs text-slate-600">Enfant</span>
                                    </div>
                                </div>
                                <button onClick={saveEdit} className="text-green-600 p-2 hover:bg-green-50 rounded"><Save size={18} /></button>
                                <button onClick={() => setEditingPersonId(null)} className="text-slate-400 p-2 hover:bg-slate-50 rounded"><X size={18} /></button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                                        {p.isChild ? <User size={18} /> : <Users size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.isChild ? 'Enfant' : 'Adulte / Payeur'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => startEdit(p)} className="text-slate-300 hover:text-indigo-500 p-1.5"><Pencil size={18} /></button>
                                    <button onClick={() => removePerson(p.id)} className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 size={18} /></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
  };

   // 4. ACCOUNT MANAGER
   const AccountManager = () => {
    const [editingAccId, setEditingAccId] = useState<string | null>(null);
    const [tempAccName, setTempAccName] = useState('');
    const [tempOwnerId, setTempOwnerId] = useState('');

    const [newAccName, setNewAccName] = useState('');
    const [ownerId, setOwnerId] = useState(people.filter(p=>!p.isChild)[0]?.id || '');

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

    const deleteAccount = (id: string) => {
        if(confirm("Supprimer ce compte ?")) onUpdateAccounts(accounts.filter(a => a.id !== id));
    };

    return (
        <div className="space-y-4">
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
                                    <button onClick={() => deleteAccount(acc.id)} className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 size={18} /></button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
   };


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
            Dépenses Récurrentes
         </button>
         <button onClick={() => setActiveTab('categories')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Catégories
         </button>
         <button onClick={() => setActiveTab('family')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'family' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Famille & Bénéficiaires
         </button>
         <button onClick={() => setActiveTab('accounts')} className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'accounts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Comptes Bancaires
         </button>
      </div>

      <div className="pt-2">
        {activeTab === 'rules' && <ExpenseRulesEditor />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'family' && <PeopleManager />}
        {activeTab === 'accounts' && <AccountManager />}
      </div>
    </div>
  );
};
