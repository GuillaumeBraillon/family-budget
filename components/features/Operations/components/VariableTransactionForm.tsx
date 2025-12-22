
import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare, ArrowRightLeft, ArrowDown } from 'lucide-react';
import { VariableTransaction, Account, CategoryDef, AccountType, Person, SavingsTransaction } from '../../../../types';
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
  onUpsertSavings?: (t: SavingsTransaction) => void;
  defaultDate: string;
  labelsSuggestions?: string[];
  editingTransaction?: VariableTransaction | null;
}

export const VariableTransactionForm: React.FC<VariableTransactionFormProps> = ({ 
  isOpen, onClose, accounts, categories, people, onAddTransaction, onDeleteTransaction, onUpsertSavings, defaultDate, labelsSuggestions = [], editingTransaction
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Mode switch: 'STANDARD' vs 'TRANSFER'
  const [mode, setMode] = useState<'STANDARD' | 'TRANSFER'>('STANDARD');

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [date, setDate] = useState(defaultDate);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isWaiting, setIsWaiting] = useState<boolean>(true);
  const [isExtra, setIsExtra] = useState<boolean>(false);
  const [comments, setComments] = useState<string>('');
  
  const checkingAccounts = accounts.filter(a => a.type === AccountType.CHECKING);
  const [accountId, setAccountId] = useState(checkingAccounts[0]?.id || '');
  const [destAccountId, setDestAccountId] = useState(checkingAccounts[1]?.id || checkingAccounts[0]?.id || '');
  
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  
  const defaultBeneficiary = people.find(p => !p.isChild)?.id || people[0]?.id || '';
  const [beneficiaryId, setBeneficiaryId] = useState(defaultBeneficiary);

  useEffect(() => {
    if (isOpen) {
        if (editingTransaction) {
            setMode('STANDARD');
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
            setMode('STANDARD');
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

    if (mode === 'TRANSFER') {
        if (!destAccountId || accountId === destAccountId) return;
        
        const amountNum = parseFloat(amount);
        const sourceAcc = accounts.find(a => a.id === accountId);
        const destAcc = accounts.find(a => a.id === destAccountId);
        
        const transferLabel = `Virement interne : ${sourceAcc?.name || '?'} => ${destAcc?.name || '?'} (${label})`;
        
        // 1. Débit (Source)
        onAddTransaction({
            id: `var_tr_out_${Date.now()}`,
            date,
            label: transferLabel,
            amount: amountNum,
            category: 'Virement Interne',
            subCategory: 'Débit',
            accountId: accountId, // Source
            beneficiaryId: '', 
            type: 'EXPENSE',
            isWaiting: false, // Virement immédiat
            isExtra: false,   // Ne compte pas dans le budget
            comments: `Vers ${destAcc?.name}`
        });

        // 1b. Si Source = EPARGNE
        if (sourceAcc?.type === AccountType.SAVINGS && onUpsertSavings) {
            onUpsertSavings({
                id: `sav_auto_out_${Date.now()}`,
                accountId: accountId,
                date: date,
                label: `Virement vers ${destAcc?.name} (${label})`,
                amount: -amountNum
            });
        }

        // 2. Crédit (Destination)
        onAddTransaction({
            id: `var_tr_in_${Date.now()}`,
            date,
            label: transferLabel,
            amount: amountNum,
            category: 'Virement Interne',
            subCategory: 'Crédit',
            accountId: destAccountId, // Destination
            beneficiaryId: '',
            type: 'INCOME',
            isWaiting: false,
            isExtra: false,
            comments: `De ${sourceAcc?.name}`
        });

        // 2b. Si Dest = EPARGNE
        if (destAcc?.type === AccountType.SAVINGS && onUpsertSavings) {
            onUpsertSavings({
                id: `sav_auto_in_${Date.now()}`,
                accountId: destAccountId,
                date: date,
                label: `Virement depuis ${sourceAcc?.name} (${label})`,
                amount: amountNum
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
            isWaiting,
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

  const isExpense = type === 'EXPENSE';
  const themeColor = mode === 'TRANSFER' ? 'indigo' : (isExpense ? 'indigo' : 'emerald');

  if (showDeleteConfirm) {
      return <ConfirmModal isOpen={true} title="Supprimer ?" message={`Voulez-vous supprimer "${editingTransaction?.label}" ?`} onConfirm={() => { onDeleteTransaction?.(editingTransaction!.id); setShowDeleteConfirm(false); onClose(); }} onCancel={() => setShowDeleteConfirm(false)} />;
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingTransaction ? "Modifier l'opération" : "Nouvelle opération"}
    >
      <div className="space-y-4">
        
        {/* SÉLECTEUR DE MODE */}
        {!editingTransaction && (
            <div className="flex bg-slate-100 p-1 rounded-lg mb-2">
                <button
                    type="button"
                    onClick={() => setMode('STANDARD')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${mode === 'STANDARD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Opération Standard
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('TRANSFER'); setLabel('Virement interne'); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${mode === 'TRANSFER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowRightLeft size={12}/> Virement Interne
                </button>
            </div>
        )}

        {mode === 'STANDARD' ? (
            /* --- MODE STANDARD --- */
            <>
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
            </>
        ) : (
            /* --- MODE VIREMENT INTERNE --- */
            <div className="space-y-6 pt-2">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                    <ArrowRightLeft className="text-indigo-600 mt-1" size={20} />
                    <p className="text-xs text-indigo-800 leading-relaxed">
                        Ce mode crée automatiquement deux opérations (un débit et un crédit) pour équilibrer vos comptes. Ces mouvements ne seront pas comptabilisés comme des dépenses ou des revenus dans votre budget.
                    </p>
                </div>

                <AmountInput 
                    label="Montant à transférer"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    color="indigo"
                    required
                    autoFocus
                />

                <div className="relative">
                    <div className="absolute left-[13px] top-[34px] bottom-[34px] w-0.5 bg-slate-200 -z-10"></div>
                    <div className="space-y-4">
                        <AccountSelector 
                            label="Depuis le compte (Débit)"
                            accounts={accounts}
                            value={accountId}
                            onChange={e => setAccountId(e.target.value)}
                            color="indigo"
                            showBalance
                        />
                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-white p-1 rounded-full border border-slate-200 text-slate-400">
                                <ArrowDown size={14} />
                            </div>
                        </div>
                        <AccountSelector 
                            label="Vers le compte (Crédit)"
                            accounts={accounts}
                            value={destAccountId}
                            onChange={e => setDestAccountId(e.target.value)}
                            color="emerald"
                            showBalance
                        />
                    </div>
                </div>

                <TextInput 
                    label="Date du virement"
                    type="date"
                    icon={Calendar}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />

                <TextInput 
                    label="Raison du virement" 
                    value={label} 
                    onChange={e => setLabel(e.target.value)}
                    placeholder="Ex: Épargne, Remboursement..."
                    required
                />
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
                className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${editingTransaction ? 'bg-amber-600 hover:bg-amber-700' : (isExpense || mode === 'TRANSFER' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700')}`}
            >
                {editingTransaction ? <><Save size={18}/> Enregistrer</> : <><Save size={18}/> {mode === 'TRANSFER' ? 'Exécuter le virement' : (!isWaiting ? 'Ajouter au réel' : 'Saisir en attente')}</>}
            </button>
        </div>
      </div>
    </Modal>
  );
};
