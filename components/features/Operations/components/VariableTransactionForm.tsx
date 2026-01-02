
import React, { useState, useEffect, useMemo } from 'react';
import { Save, TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare, ArrowRightLeft, ArrowDown } from 'lucide-react';
import { VariableTransaction, Account, CategoryDef, AccountType, Person, Transfer, SavedLabel, Tag } from '../../../../types';
import { CategorySelector } from '../../../ui/molecules/CategorySelector';
import { TextInput, AmountInput, SearchableTextInput } from '../../../ui/molecules/FormInputs';
import { AccountSelector, BeneficiarySelector } from '../../../ui/molecules/SmartSelectors';
import { ConfirmModal } from '../../../ui/atoms/ConfirmModal';
import { Modal } from '../../../ui/Modal';
import { TagSelector } from '../../../ui/molecules/TagSelector';

interface VariableTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: CategoryDef[];
  people: Person[]; 
  tags?: Tag[];
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
  isOpen, onClose, accounts, categories, people, tags = [], onAddTransaction, onDeleteTransaction, onUpsertTransfer, defaultDate, labelsSuggestions = [], savedLabels = [], editingTransaction, initialMode = 'STANDARD', lockMode = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mode, setMode] = useState<'STANDARD' | 'TRANSFER'>(initialMode);

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [comments, setComments] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Utilisation de tous les comptes fournis, sans filtrage forcé ici.
  // C'est au parent de décider quels comptes passer.
  // Pour le mode Virement, on garde la logique source/dest.
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destAccountId, setDestAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  
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
                if (editingTransaction.comments && accounts.some(a => a.id === editingTransaction.comments)) {
                    setDestAccountId(editingTransaction.comments);
                }
            } else {
                setAccountId(editingTransaction.accountId);
                setComments(editingTransaction.comments || '');
                setSelectedTagIds(editingTransaction.tagIds || []);
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
            setSelectedTagIds([]);
            // Reset account to first available if new
            if (accounts.length > 0) setAccountId(accounts[0].id);
        }
    }
  }, [isOpen, editingTransaction, defaultDate, defaultBeneficiary, initialMode, accounts]);

  const toggleTag = (tagId: string) => {
      setSelectedTagIds(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

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
            comments: comments.trim() || undefined,
            tagIds: selectedTagIds
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
                <SearchableTextInput label="Libellé" value={label} onChange={e => setLabel(e.target.value)} onSelectSuggestion={setLabel} placeholder={isExpense ? "Ex: Frais bancaires..." : "Ex: Intérêts annuels..."} suggestions={standardSuggestions} required autoFocus={!editingTransaction} />
                <AmountInput label="Montant" value={amount} onChange={e => setAmount(e.target.value)} color={themeColor} required />
                <TextInput label="Date" type="date" icon={Calendar} value={date} onChange={e => setDate(e.target.value)} required />
                
                <AccountSelector label={isExpense ? 'Compte débité' : 'Compte crédité'} accounts={accounts} value={accountId} onChange={e => setAccountId(e.target.value)} color={themeColor} />
                
                <div className="border-t border-slate-100 pt-3"></div>
                
                <TagSelector tags={tags} selectedTagIds={selectedTagIds} onToggleTag={toggleTag} />
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
                <SearchableTextInput 
                    label="Motif" 
                    value={label} 
                    onChange={e => setLabel(e.target.value)} 
                    onSelectSuggestion={setLabel}
                    placeholder="Ex: Épargne, Remboursement..." 
                    suggestions={transferSuggestions}
                    required 
                />
            </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
            {editingTransaction && onDeleteTransaction && (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
            )}
            
            {mode === 'TRANSFER' ? (
                <button 
                    onClick={() => handleSubmit(false)} 
                    className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700`}
                >
                    <Save size={18}/> {editingTransaction ? 'Mettre à jour' : 'Exécuter le virement'}
                </button>
            ) : (
                <button 
                    onClick={() => handleSubmit(false)} 
                    className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${isExpense ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    <CheckCircle2 size={18}/> {editingTransaction ? 'Enregistrer' : 'Valider'}
                </button>
            )}
        </div>
      </div>
    </Modal>
  );
};
