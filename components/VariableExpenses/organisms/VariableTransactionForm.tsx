
import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, CreditCard, ShoppingBag, Save, RotateCcw, User, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { VariableTransaction, Account, CategoryDef, AccountType, Person } from '../../../types';
import { CategorySelector } from '../../molecules/CategorySelector';

interface VariableTransactionFormProps {
  accounts: Account[];
  categories: CategoryDef[];
  people: Person[]; 
  onAddTransaction: (t: VariableTransaction) => void;
  defaultDate: string;
  labelsSuggestions?: string[];
  editingTransaction?: VariableTransaction | null;
  onCancelEdit?: () => void;
}

export const VariableTransactionForm: React.FC<VariableTransactionFormProps> = ({ 
  accounts, categories, people, onAddTransaction, defaultDate, labelsSuggestions = [], editingTransaction, onCancelEdit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // États du formulaire
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<string>('');
  
  // Filtrage des comptes : uniquement les comptes COURANTS
  const checkingAccounts = accounts.filter(a => a.type === AccountType.CHECKING);
  const [accountId, setAccountId] = useState(checkingAccounts[0]?.id || '');
  
  // Gestion de la catégorie via le composant dédié
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  
  // Sélection du bénéficiaire par défaut (le premier adulte trouvé ou le premier de la liste)
  const defaultBeneficiary = people.find(p => !p.isChild)?.id || people[0]?.id || '';
  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);

  // Synchronisation lors de l'édition
  useEffect(() => {
    if (editingTransaction) {
        setIsOpen(true);
        setType(editingTransaction.type || 'EXPENSE');
        setDate(editingTransaction.date);
        setLabel(editingTransaction.label);
        setAmount(editingTransaction.amount.toString());
        setAccountId(editingTransaction.accountId);
        setCategory(editingTransaction.category);
        setSubCategory(editingTransaction.subCategory || '');
        setBeneficiaryId(editingTransaction.beneficiaryId || defaultBeneficiary);
        // Scroll vers le formulaire
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Reset partiel si on sort du mode édition
        setDate(defaultDate);
    }
  }, [editingTransaction, defaultDate, defaultBeneficiary]);

  const resetForm = () => {
      setLabel('');
      setAmount('');
      // Note: Category et SubCategory seront reset par le CategorySelector quand le type changera ou au mount
      setSubCategory('');
      setBeneficiaryId(defaultBeneficiary);
      setType('EXPENSE');
      if (onCancelEdit) onCancelEdit();
      setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !amount || !accountId) return;

    onAddTransaction({
      id: editingTransaction?.id || `var_${Date.now()}`,
      date,
      label,
      amount: parseFloat(amount),
      category,
      subCategory,
      accountId,
      beneficiaryId,
      type
    });

    if (editingTransaction && onCancelEdit) onCancelEdit();
    
    // Si c'est un ajout, on reset juste les champs texte
    if (!editingTransaction) {
        setLabel('');
        setAmount('');
        setSubCategory('');
        setType('EXPENSE');
    } else {
        setIsOpen(false);
    }
  };

  const isExpense = type === 'EXPENSE';
  const colorClass = isExpense ? 'indigo' : 'emerald';

  if (!isOpen && !editingTransaction) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-white border-2 border-dashed border-indigo-200 text-indigo-600 p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
      >
        <Plus size={20} />
        Nouvelle Dépense / Revenu
      </button>
    );
  }

  return (
    <Card className={`shadow-md animate-in fade-in zoom-in-95 duration-200 border-2 ${editingTransaction ? 'border-amber-200 bg-amber-50/20' : `border-${colorClass}-100`}`}>
      <CardHeader className={`flex flex-row justify-between items-center py-3 border-b ${editingTransaction ? 'bg-amber-50/50 border-amber-100' : `bg-${colorClass}-50/50 border-${colorClass}-100`}`}>
        <CardTitle className="text-base flex items-center gap-2">
            {editingTransaction ? <RotateCcw size={18} className="text-amber-600"/> : <ShoppingBag size={18} className={`text-${colorClass}-600`}/>}
            {editingTransaction ? 'Modifier l\'opération' : 'Ajouter une opération'}
        </CardTitle>
        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
        </button>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TYPE SELECTOR */}
            <div className="md:col-span-2 flex justify-center pb-2">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setType('EXPENSE')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${isExpense ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingDown size={16}/> Dépense
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('INCOME')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${!isExpense ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingUp size={16}/> Revenu
                    </button>
                </div>
            </div>

            <div className="md:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Libellé</label>
                <input 
                    autoFocus={!editingTransaction}
                    type="text" 
                    required 
                    value={label} 
                    onChange={e => setLabel(e.target.value)} 
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                    placeholder={isExpense ? "Ex: Courses Carrefour..." : "Ex: Vente Vinted..."}
                />
                {/* Suggestions de libellés (Uniquement pour les dépenses pour l'instant) */}
                {isExpense && labelsSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {labelsSuggestions.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setLabel(s)}
                                className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-indigo-100 hover:text-indigo-700 border border-slate-200 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Montant (€)</label>
                <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-bold text-lg focus:ring-2 outline-none ${isExpense ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
                    placeholder="0.00"
                />
            </div>

            <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar size={12}/> Date</label>
                <input 
                    type="date" 
                    required 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 outline-none ${isExpense ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`} 
                />
            </div>

            <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1"><CreditCard size={12}/> {isExpense ? 'Compte débité' : 'Compte crédité'}</label>
                <select 
                    value={accountId} 
                    onChange={e => setAccountId(e.target.value)} 
                    className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 outline-none ${isExpense ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
                >
                    {checkingAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    {checkingAccounts.length === 0 && <option value="">Aucun compte courant</option>}
                </select>
            </div>

            {/* CATEGORY SELECTOR REUSABLE */}
            <CategorySelector 
                categories={categories}
                type={type}
                selectedCategory={category}
                selectedSubCategory={subCategory}
                onCategoryChange={setCategory}
                onSubCategoryChange={setSubCategory}
            />

            <div>
                 <label className="text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-1"><User size={12}/> Bénéficiaire</label>
                 <select 
                     value={beneficiaryId} 
                     onChange={e => setBeneficiaryId(e.target.value)} 
                     className={`w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 outline-none ${isExpense ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
                 >
                     {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
            </div>

            <div className="md:col-span-2 pt-2 flex gap-3">
                <button type="submit" className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${editingTransaction ? 'bg-amber-600 hover:bg-amber-700' : (isExpense ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700')}`}>
                    {editingTransaction ? <><Save size={18}/> Enregistrer les modifications</> : <><Plus size={18}/> {isExpense ? 'Ajouter la dépense' : 'Ajouter le revenu'}</>}
                </button>
            </div>
        </form>
      </CardContent>
    </Card>
  );
};
