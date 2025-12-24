
import React, { useState, useEffect, useMemo } from 'react';
import { Save, TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare, ArrowRightLeft, ArrowDown } from 'lucide-react';
import { VariableTransaction, Account, CategoryDef, AccountType, Person, Transfer, SavedLabel } from '../../../../types';
import { CategorySelector } from '../../../ui/molecules/CategorySelector';
import { TextInput, AmountInput, SearchableTextInput } from '../../../ui/molecules/FormInputs';
import { AccountSelector, BeneficiarySelector } from '../../../ui/molecules/SmartSelectors';
import { ConfirmModal } from '../../../ui/atoms/ConfirmModal';
import { Modal } from '../../../ui/Modal';

interface VariableTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: CategoryDef[];
  people: Person[]; 
  onAddTransaction: (t: VariableTransaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onUpsertTransfer?: (t: Transfer) => void;
  defaultDate: string;
  labelsSuggestions?: string[];
  savedLabels?: SavedLabel[];
  editingTransaction?: VariableTransaction | null;
  initialMode?: 'STANDARD' | 'TRANSFER';
  lockMode?: boolean; 
}

export const VariableTransactionForm: React.FC<VariableTransactionFormProps> = ({ 
  isOpen, onClose, accounts, categories, people, onAddTransaction, onDeleteTransaction, onUpsertTransfer, defaultDate, labelsSuggestions = [], savedLabels = [], editingTransaction, initialMode = 'STANDARD', lockMode = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mode, setMode] = useState<'STANDARD' | 'TRANSFER'>(initialMode);

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [comments, setComments] = useState<string>('');
  
  const checkingAccounts = accounts.filter(a => a.type === AccountType.CHECKING);
  const [accountId, setAccountId] = useState(checkingAccounts[0]?.id || '');
  const [destAccountId, setDestAccountId] = useState(checkingAccounts[1]?.id || checkingAccounts[0]?.id || '');
  
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const defaultBeneficiary = people.find(p => !p.isChild)?.id || people[0]?.id || '';
  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);

  const isExpense = type === 'EXPENSE';

  const standardSuggestions = useMemo(() => {
    if (savedLabels.length > 0) {
        return savedLabels
            .filter(l => l.type === AccountType.CHECKING && l.isExpense === isExpense)
            .map(l => l.name);
    } else {
        return labelsSuggestions;
    }
  }, [savedLabels, labelsSuggestions, isExpense]);

  const transferSuggestions = useMemo(() => {
      return savedLabels
        .filter(l => l.type === AccountType.TRANSFER)
        .map(l => l.name);
  }, [savedLabels]);

  useEffect(() => {
    if (isOpen) {
        if (editingTransaction) {
            setMode(initialMode);
            setType(editingTransaction.type || 'EXPENSE');
            setDate(editingTransaction.date);
            setLabel(editingTransaction.label);
            setAmount(editingTransaction.amount.toString());
            
            if (initialMode === 'TRANSFER') {
                setAccountId(editingTransaction.accountId); // Source
                // On utilise le champ comments comme "Destination Account ID" pour le pre-fill lors de l'edit depuis TransfersView
                if (editingTransaction.comments && accounts.some(a => a.id === editingTransaction.comments)) {
                    setDestAccountId(editingTransaction.comments);
                }
            } else {
                setAccountId(editingTransaction.accountId);
                setComments(editingTransaction.comments || '');
            }

            setCategory(editingTransaction.category);
            setSubCategory(editingTransaction.subCategory || '');
            setBeneficiaryId(editingTransaction.beneficiaryId || defaultBeneficiary);
            setIsExtra(!!editingTransaction.isExtra);
        } else {
            setMode(initialMode);
            setDate(defaultDate);
            setLabel('');
            setAmount('');
            setCategory('');
            setSubCategory('');
            setBeneficiaryId(defaultBeneficiary);
            setType('EXPENSE');
            setIsExtra(false);
            setComments('');
            if (!accountId && checkingAccounts.length > 0) setAccountId(checkingAccounts[0].id);
        }
    }
  }, [isOpen, editingTransaction, defaultDate, defaultBeneficiary, initialMode, accounts]);

  const handleSubmit = (targetIsWaiting: boolean) => {
    if (!label || !amount || !accountId) return;

    if (mode === 'TRANSFER') {
        if (!destAccountId || accountId === destAccountId) return;
        if (onUpsertTransfer) {
            onUpsertTransfer({
                id: editingTransaction?.id || `tr_${Date.now()}`,
                date,
                label,
                amount: parseFloat(amount),
                sourceAccountId: accountId,
                destinationAccountId: destAccountId
            });
        }
    } else {
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
            isWaiting: targetIsWaiting,
            isExtra,
            comments: comments.trim() || undefined
        });
    }
    onClose();
  };

  const handleDelete = () => {
    if (editingTransaction && onDeleteTransaction) {
        onDeleteTransaction(editingTransaction.id);
        setShowDeleteConfirm(false);
        onClose();
    }
  };

  const themeColor = mode === 'TRANSFER' ? 'indigo' : (isExpense ? 'indigo' : 'emerald');

  if (showDeleteConfirm) {
      return <ConfirmModal isOpen={true} title="Supprimer ?" message={`Voulez-vous supprimer "${editingTransaction?.label}" ?`} onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />;
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingTransaction ? "Modifier" : (mode === 'TRANSFER' ? "Nouveau virement" : "Nouvelle opération")}
    >
      <div className="space-y-4">
        
        {!editingTransaction && !lockMode && (
            <div className="flex bg-slate-100 p-1 rounded-lg mb-2">
                <button type="button" onClick={() => setMode('STANDARD')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${mode === 'STANDARD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Opération Standard</button>
                <button type="button" onClick={() => { setMode('TRANSFER'); setLabel(''); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${mode === 'TRANSFER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ArrowRightLeft size={12}/> Virement Interne</button>
            </div>
        )}

        {mode === 'STANDARD' ? (
            <>
                <div className="mb-2">
                    <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Type de flux</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button type="button" onClick={() => setType('EXPENSE')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${isExpense ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><TrendingDown size={14}/> Dépense</button>
                        <button type="button" onClick={() => setType('INCOME')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${!isExpense ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp size={14}/> Revenu</button>
                    </div>
                </div>
                <SearchableTextInput label="Libellé" value={label} onChange={e => setLabel(e.target.value)} onSelectSuggestion={setLabel} placeholder={isExpense ? "Ex: Courses Carrefour..." : "Ex: Vente Vinted..."} suggestions={standardSuggestions} required autoFocus={!editingTransaction} />
                <AmountInput label="Montant" value={amount} onChange={e => setAmount(e.target.value)} color={themeColor} required />
                <TextInput label="Date" type="date" icon={Calendar} value={date} onChange={e => setDate(e.target.value)} required />
                <div className={`p-3 rounded-xl border-2 transition-all ${isExtra ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={isExtra} onChange={e => setIsExtra(e.target.checked)} className="h-5 w-5 text-amber-600 rounded" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Star size={14} className={isExtra ? 'text-amber-500' : 'text-slate-400'} /> Hors budget</span>
                        </div>
                    </label>
                </div>
                <AccountSelector label={isExpense ? 'Compte débité' : 'Compte crédité'} accounts={checkingAccounts} value={accountId} onChange={e => setAccountId(e.target.value)} color={themeColor} />
                <CategorySelector categories={categories} type={type} selectedCategory={category} selectedSubCategory={subCategory} onCategoryChange={setCategory} onSubCategoryChange={setSubCategory} />
                <BeneficiarySelector people={people} value={beneficiaryId} onChange={e => setBeneficiaryId(e.target.value)} color={themeColor} label="Bénéficiaires" />
                <TextInput label="Note / Commentaire" value={comments} onChange={e => setComments(e.target.value)} placeholder="Infos complémentaires..." icon={MessageSquare} />
            </>
        ) : (
            <div className="space-y-6 pt-2">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                    <ArrowRightLeft className="text-indigo-600 mt-1" size={20} />
                    <p className="text-xs text-indigo-800 leading-relaxed">Virement entre deux comptes. Crée un mouvement unique lié.</p>
                </div>
                <AmountInput label="Montant" value={amount} onChange={e => setAmount(e.target.value)} color="indigo" required autoFocus />
                <div className="relative">
                    <div className="absolute left-[13px] top-[34px] bottom-[34px] w-0.5 bg-slate-200 -z-10"></div>
                    <div className="space-y-4">
                        <AccountSelector label="Depuis (Source)" accounts={accounts} value={accountId} onChange={e => setAccountId(e.target.value)} color="indigo" showBalance />
                        <div className="flex justify-center -my-2 relative z-10"><div className="bg-white p-1 rounded-full border border-slate-200 text-slate-400"><ArrowDown size={14} /></div></div>
                        <AccountSelector label="Vers (Destination)" accounts={accounts} value={destAccountId} onChange={e => setDestAccountId(e.target.value)} color="emerald" showBalance />
                    </div>
                </div>
                <TextInput label="Date" type="date" icon={Calendar} value={date} onChange={e => setDate(e.target.value)} required />
                <SearchableTextInput label="Motif" value={label} onChange={e => setLabel(e.target.value)} onSelectSuggestion={setLabel} placeholder="Ex: Épargne, Remboursement..." suggestions={transferSuggestions} required />
            </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
            {editingTransaction && onDeleteTransaction && (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
            )}
            <button onClick={() => handleSubmit(false)} className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${mode === 'TRANSFER' ? 'bg-indigo-600 hover:bg-indigo-700' : (isExpense ? 'bg-indigo-600' : 'bg-emerald-600')}`}>
                <Save size={18}/> {editingTransaction ? 'Mettre à jour' : 'Enregistrer'}
            </button>
        </div>
      </div>
    </Modal>
  );
};
