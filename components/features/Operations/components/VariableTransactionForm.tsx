
import React, { useState, useEffect, useMemo } from 'react';
import { Save, TrendingUp, TrendingDown, Calendar, Trash2, Clock, CheckCircle2, Star, MessageSquare, ArrowRightLeft, ArrowDown } from 'lucide-react';
import { VariableTransaction, Account, CategoryDef, AccountType, Person, SavingsTransaction, SavedLabel } from '../../../../types';
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
  savedLabels?: SavedLabel[];
  editingTransaction?: VariableTransaction | null;
  initialMode?: 'STANDARD' | 'TRANSFER';
  lockMode?: boolean; // Nouvelle prop pour empêcher le changement de mode
}

export const VariableTransactionForm: React.FC<VariableTransactionFormProps> = ({ 
  isOpen, onClose, accounts, categories, people, onAddTransaction, onDeleteTransaction, onUpsertSavings, defaultDate, labelsSuggestions = [], savedLabels = [], editingTransaction, initialMode = 'STANDARD', lockMode = false
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Mode switch: 'STANDARD' vs 'TRANSFER'
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

  // Calcul des suggestions dynamiques pour Opérations Standard
  const standardSuggestions = useMemo(() => {
    if (savedLabels.length > 0) {
        return savedLabels
            .filter(l => l.type === AccountType.CHECKING && l.isExpense === isExpense)
            .map(l => l.name);
    } else {
        return labelsSuggestions;
    }
  }, [savedLabels, labelsSuggestions, isExpense]);

  // Calcul des suggestions pour Virements (Utilise AccountType.TRANSFER)
  const transferSuggestions = useMemo(() => {
      // Uniquement les libellés sauvegardés spécifiquement pour les virements
      return savedLabels
        .filter(l => l.type === AccountType.TRANSFER)
        .map(l => l.name);
  }, [savedLabels]);

  useEffect(() => {
    if (isOpen) {
        if (editingTransaction) {
            // Si on édite, on détermine le mode en fonction du libellé ou d'une autre prop si dispo
            // Pour simplifier, si catégorie est Virement Interne -> TRANSFER
            const isTransfer = editingTransaction.category === 'Virement Interne';
            setMode(isTransfer ? 'TRANSFER' : 'STANDARD');
            
            setType(editingTransaction.type || 'EXPENSE');
            setDate(editingTransaction.date);
            // Nettoyage du libellé pour l'affichage si c'est un virement auto-généré
            let cleanLabel = editingTransaction.label;
            if (isTransfer) {
                const match = cleanLabel.match(/\((.*?)\)$/); // Extrait ce qu'il y a entre parenthèses à la fin
                if (match) cleanLabel = match[1];
            }
            setLabel(cleanLabel);
            
            setAmount(editingTransaction.amount.toString());
            
            if (isTransfer) {
                // En mode virement, on utilise le commentaire (qui stocke le nom du compte lié) pour retrouver la paire
                const otherAccountName = editingTransaction.comments; 
                const otherAccount = accounts.find(a => a.name === otherAccountName);

                if (editingTransaction.type === 'INCOME') {
                    // Transaction actuelle = Destination (Crédit)
                    setDestAccountId(editingTransaction.accountId);
                    // Le commentaire contient normalement le nom de la Source
                    if (otherAccount) {
                        setAccountId(otherAccount.id);
                    }
                } else {
                    // Transaction actuelle = Source (Débit)
                    setAccountId(editingTransaction.accountId);
                    // Le commentaire contient normalement le nom de la Destination
                    if (otherAccount) {
                        setDestAccountId(otherAccount.id);
                    }
                }
            } else {
                setAccountId(editingTransaction.accountId);
            }

            setCategory(editingTransaction.category);
            setSubCategory(editingTransaction.subCategory || '');
            setBeneficiaryId(editingTransaction.beneficiaryId || defaultBeneficiary);
            setIsExtra(!!editingTransaction.isExtra);
            setComments(editingTransaction.comments || '');
        } else {
            // Nouveau : On utilise le mode initial passé en props
            setMode(initialMode);
            setDate(defaultDate);
            setLabel(''); // Reset label à vide pour permettre la suggestion
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
        
        const amountNum = parseFloat(amount);
        const sourceAcc = accounts.find(a => a.id === accountId);
        const destAcc = accounts.find(a => a.id === destAccountId);
        
        const transferLabel = `Virement interne : ${sourceAcc?.name || '?'} => ${destAcc?.name || '?'} (${label})`;
        
        // Logique de préservation de l'ID pour maintenir l'ordre de tri en cas d'édition
        let baseTimestamp = Date.now();
        if (editingTransaction && editingTransaction.category === 'Virement Interne') {
             const match = editingTransaction.id.match(/var_tr_(?:in|out)_(\d+)/);
             if (match) {
                 baseTimestamp = parseInt(match[1], 10);
             }
        }

        // 1. Débit (Source)
        onAddTransaction({
            id: `var_tr_out_${baseTimestamp}`,
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
            comments: destAcc?.name // STOCKAGE NOM BRUT DESTINATION
        });

        // 1b. Si Source = EPARGNE
        if (sourceAcc?.type === AccountType.SAVINGS && onUpsertSavings) {
            onUpsertSavings({
                id: `sav_auto_out_${baseTimestamp}`,
                accountId: accountId,
                date: date,
                label: `Virement vers ${destAcc?.name} (${label})`,
                amount: -amountNum
            });
        }

        // 2. Crédit (Destination)
        onAddTransaction({
            id: `var_tr_in_${baseTimestamp}`,
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
            comments: sourceAcc?.name // STOCKAGE NOM BRUT SOURCE
        });

        // 2b. Si Dest = EPARGNE
        if (destAcc?.type === AccountType.SAVINGS && onUpsertSavings) {
            onUpsertSavings({
                id: `sav_auto_in_${baseTimestamp}`,
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
      return <ConfirmModal isOpen={true} title="Supprimer ?" message={`Voulez-vous supprimer "${editingTransaction?.label}" ?`} onConfirm={() => { onDeleteTransaction?.(editingTransaction!.id); setShowDeleteConfirm(false); onClose(); }} onCancel={() => setShowDeleteConfirm(false)} />;
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editingTransaction ? "Modifier l'opération" : (mode === 'TRANSFER' ? "Nouveau virement" : "Nouvelle opération")}
    >
      <div className="space-y-4">
        
        {/* SÉLECTEUR DE MODE (Visible uniquement si non locké et nouvelle opération) */}
        {!editingTransaction && !lockMode && (
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
                    onClick={() => { setMode('TRANSFER'); setLabel(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${mode === 'TRANSFER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ArrowRightLeft size={12}/> Virement Interne
                </button>
            </div>
        )}

        {mode === 'STANDARD' ? (
            /* --- MODE STANDARD --- */
            <>
                <div className="mb-2">
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

                <SearchableTextInput 
                    label="Libellé" 
                    value={label} 
                    onChange={e => setLabel(e.target.value)}
                    onSelectSuggestion={setLabel}
                    placeholder={isExpense ? "Ex: Courses Carrefour..." : "Ex: Vente Vinted..."}
                    suggestions={standardSuggestions}
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
            </>
        ) : (
            /* --- MODE VIREMENT INTERNE --- */
            <div className="space-y-6 pt-2">
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3">
                    <ArrowRightLeft className="text-indigo-600 mt-1" size={20} />
                    <p className="text-xs text-indigo-800 leading-relaxed">
                        Ce mode crée automatiquement deux opérations (un débit et un crédit) pour équilibrer vos comptes.
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

                <SearchableTextInput 
                    label="Motif du virement" 
                    value={label} 
                    onChange={e => setLabel(e.target.value)}
                    onSelectSuggestion={setLabel}
                    placeholder="Ex: Épargne, Remboursement, Apport..."
                    suggestions={transferSuggestions}
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

            {mode === 'TRANSFER' ? (
                <button 
                    onClick={() => handleSubmit(false)} 
                    className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700`}
                >
                    <Save size={18}/> {editingTransaction ? 'Enregistrer' : 'Exécuter le virement'}
                </button>
            ) : (
                <>
                    <button 
                        onClick={() => handleSubmit(true)} 
                        className="flex-1 bg-amber-100 text-amber-700 hover:bg-amber-200 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        <Clock size={18}/> {editingTransaction ? 'Sauver (Attente)' : 'En Attente'}
                    </button>
                    <button 
                        onClick={() => handleSubmit(false)} 
                        className={`flex-1 text-white py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 ${isExpense ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                    >
                        <CheckCircle2 size={18}/> {editingTransaction ? 'Sauver (Réel)' : 'Validé'}
                    </button>
                </>
            )}
        </div>
      </div>
    </Modal>
  );
};
