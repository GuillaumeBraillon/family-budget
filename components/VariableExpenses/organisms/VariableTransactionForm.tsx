
import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, TrendingDown, Calendar, Trash2 } from 'lucide-react';
import { VariableTransaction, Account, CategoryDef, AccountType, Person } from '../../../types';
import { CategorySelector } from '../../molecules/CategorySelector';
import { TextInput, AmountInput } from '../../molecules/FormInputs';
import { AccountSelector, BeneficiarySelector } from '../../molecules/SmartSelectors';
import { ConfirmModal } from '../../Configuration/atoms/ConfirmModal';
import { Modal } from '../../ui/Modal';

interface VariableTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: CategoryDef[];
  people: Person[]; 
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  defaultDate: string;
  labelsSuggestions?: string[];
  editingTransaction?: VariableTransaction | null;
}

export const VariableTransactionForm: React.FC<VariableTransactionFormProps> = ({ 
  isOpen, onClose, accounts, categories, people, onAddTransaction, onDeleteTransaction, defaultDate, labelsSuggestions = [], editingTransaction
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // États du formulaire
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<string>('');
  
  const checkingAccounts = accounts.filter(a => a.type === AccountType.CHECKING);
  const [accountId, setAccountId] = useState(checkingAccounts[0]?.id || '');
  
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  
  const defaultBeneficiary = people.find(p => !p.isChild)?.id || people[0]?.id || '';
  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);

  // Synchronisation lors de l'ouverture ou de l'édition
  useEffect(() => {
    if (isOpen) {
        if (editingTransaction) {
            setType(editingTransaction.type || 'EXPENSE');
            setDate(editingTransaction.date);
            setLabel(editingTransaction.label);
            setAmount(editingTransaction.amount.toString());
            setAccountId(editingTransaction.accountId);
            setCategory(editingTransaction.category);
            setSubCategory(editingTransaction.subCategory || '');
            setBeneficiaryId(editingTransaction.beneficiaryId || defaultBeneficiary);
        } else {
            // Reset fields for new transaction
            setDate(defaultDate);
            setLabel('');
            setAmount('');
            setCategory('');
            setSubCategory('');
            setBeneficiaryId(defaultBeneficiary);
            setType('EXPENSE');
            // Keep current accountId if possible, or reset to default
            if (!accountId && checkingAccounts.length >0) setAccountId(checkingAccounts[0].id);
        }
    }
  }, [isOpen, editingTransaction, defaultDate, defaultBeneficiary]);

  const handleSubmit = () => {
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
    onClose();
  };

  const handleDelete = () => {
    if (editingTransaction && onDeleteTransaction) {
        onDeleteTransaction(editingTransaction.id);
        setShowDeleteConfirm(false);
        onClose();
    }
  };

  const isExpense = type === 'EXPENSE';
  const themeColor = isExpense ? 'indigo' : 'emerald';

  if (showDeleteConfirm) {
      return (
          <ConfirmModal 
             isOpen={true}
             title="Supprimer l'opération ?"
             message={`Voulez-vous vraiment supprimer "${editingTransaction?.label}" ?`}
             onConfirm={handleDelete}
             onCancel={() => setShowDeleteConfirm(false)}
          />
      );
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingTransaction ? "Modifier l'opération" : "Nouvelle opération"}
    >
      <div className="space-y-4">
        {/* TYPE SELECTOR */}
        <div>
            <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Type de mouvement</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${isExpense ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingDown size={16}/> Dépense
                </button>
                <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${!isExpense ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp size={16}/> Revenu
                </button>
            </div>
        </div>

        <TextInput 
            label="Libellé" 
            value={label} 
            onChange={e => setLabel(e.target.value)}
            placeholder={isExpense ? "Ex: Courses Carrefour..." : "Ex: Vente Vinted..."}
            required
            autoFocus={!editingTransaction}
        />
        
        {isExpense && labelsSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 -mt-2 mb-2">
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
        
        <AmountInput 
            label="Montant"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            color={themeColor}
            required
        />

        <TextInput 
            label="Date"
            type="date"
            icon={Calendar}
            value={date}
            onChange={e => setDate(e.target.value)}
            required
        />

        <AccountSelector 
            label={isExpense ? 'Compte débité' : 'Compte crédité'}
            accounts={checkingAccounts}
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            color={themeColor}
        />

        <CategorySelector 
            categories={categories}
            type={type}
            selectedCategory={category}
            selectedSubCategory={subCategory}
            onCategoryChange={setCategory}
            onSubCategoryChange={setSubCategory}
        />

        <BeneficiarySelector 
            people={people}
            value={beneficiaryId}
            onChange={e => setBeneficiaryId(e.target.value)}
            color={themeColor}
        />

        <div className="flex gap-3 pt-4 border-t border-slate-100">
             {/* Si on édite, on affiche le bouton supprimer */}
            {editingTransaction && onDeleteTransaction && (
                <button 
                    type="button" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                    title="Supprimer"
                >
                    <Trash2 size={18} />
                </button>
            )}

            <button 
                onClick={handleSubmit} 
                className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${editingTransaction ? 'bg-amber-600 hover:bg-amber-700' : (isExpense ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700')}`}
            >
                {editingTransaction ? <><Save size={18}/> Enregistrer</> : <><Save size={18}/> Ajouter</>}
            </button>
        </div>
      </div>
    </Modal>
  );
};
