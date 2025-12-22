
import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare } from 'lucide-react';
import { VariableTransaction, Account, CategoryDef, AccountType, Person } from '../../../types';
import { CategorySelector } from '../../molecules/CategorySelector';
import { TextInput, AmountInput, SearchableTextInput } from '../../molecules/FormInputs';
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
  
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isWaiting, setIsWaiting] = useState<boolean>(true);
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [comments, setComments] = useState<string>('');
  
  const checkingAccounts = accounts.filter(a => a.type === AccountType.CHECKING);
  const [accountId, setAccountId] = useState(checkingAccounts[0]?.id || '');
  
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  
  const defaultBeneficiary = people.find(p => !p.isChild)?.id || people[0]?.id || '';
  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);

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
            setIsWaiting(!!editingTransaction.isWaiting);
            setIsExtra(!!editingTransaction.isExtra);
            setComments(editingTransaction.comments || '');
        } else {
            setDate(defaultDate);
            setLabel('');
            setAmount('');
            setCategory('');
            setSubCategory('');
            setBeneficiaryId(defaultBeneficiary);
            setType('EXPENSE');
            setIsWaiting(true);
            setIsExtra(false);
            setComments('');
            if (!accountId && checkingAccounts.length > 0) setAccountId(checkingAccounts[0].id);
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
      type,
      isWaiting,
      isExtra,
      comments: comments.trim() || undefined
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
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Type de flux</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setType('EXPENSE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${isExpense ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingDown size={14}/> Dépense
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('INCOME')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${!isExpense ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingUp size={14}/> Revenu
                    </button>
                </div>
            </div>

            <div>
                <label className="text-xs font-medium text-slate-500 uppercase block mb-1">État du pointage</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => setIsWaiting(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${!isWaiting ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <CheckCircle2 size={14}/> Réel
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsWaiting(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${isWaiting ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Clock size={14}/> Attente
                    </button>
                </div>
            </div>
        </div>

        <SearchableTextInput 
            label="Libellé" 
            value={label} 
            onChange={e => setLabel(e.target.value)}
            onSelectSuggestion={setLabel}
            placeholder={isExpense ? "Ex: Courses Carrefour..." : "Ex: Vente Vinted..."}
            suggestions={isExpense ? labelsSuggestions : []}
            required
            autoFocus={!editingTransaction}
        />
        
        <AmountInput 
            label="Montant"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            color={themeColor}
            required
        />

        <TextInput 
            label="Date de l'achat"
            type="date"
            icon={Calendar}
            value={date}
            onChange={e => setDate(e.target.value)}
            required
        />

        <div className={`p-3 rounded-xl border-2 transition-all ${isExtra ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={isExtra}
                    onChange={e => setIsExtra(e.target.checked)}
                    className="h-5 w-5 text-amber-600 rounded"
                />
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Star size={14} className={isExtra ? 'text-amber-500' : 'text-slate-400'} /> Opération Extra / Exceptionnelle
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                        Exclut ce montant de la consommation de votre budget variable hebdomadaire.
                    </span>
                </div>
            </label>
        </div>

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
            label="Bénéficiaires"
        />

        <TextInput 
            label="Note / Commentaire" 
            value={comments} 
            onChange={e => setComments(e.target.value)}
            placeholder="Infos complémentaires..."
            icon={MessageSquare}
        />

        {isWaiting && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-3 animate-in slide-in-from-top-2">
                <Clock size={18} className="text-amber-500 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-tight">
                    Cette opération apparaîtra en ambre dans l'échéancier. Vous pourrez la valider d'un clic lorsqu'elle sera visible sur votre compte bancaire.
                </p>
            </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
            {editingTransaction && onDeleteTransaction && (
                <button 
                    type="button" 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            )}

            <button 
                onClick={handleSubmit} 
                className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${editingTransaction ? 'bg-amber-600 hover:bg-amber-700' : (isExpense ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700')}`}
            >
                {editingTransaction ? <><Save size={18}/> Enregistrer</> : <><Save size={18}/> {!isWaiting ? 'Ajouter au réel' : 'Saisir en attente'}</>}
            </button>
        </div>
      </div>
    </Modal>
  );
};
