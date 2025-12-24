
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { SavingsTransaction, TransactionType, SavedLabel, AccountType } from '../../types';
import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '../Configuration/atoms/ConfirmModal';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: SavingsTransaction | null;
  accountId: string;
  suggestions?: string[];
  savedLabels?: SavedLabel[];
  onSave: (t: SavingsTransaction) => void;
  onDelete?: (id: string) => void; 
}

const DEFAULT_LABELS = [
  "Virement mensuel",
  "Épargne automatique",
  "Intérêts",
  "Retrait",
  "Apport exceptionnel",
  "Régularisation"
];

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ isOpen, onClose, transaction, accountId, suggestions, savedLabels, onSave, onDelete }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<TransactionType>(TransactionType.CREDIT);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filtrage dynamique des suggestions en fonction du sens du mouvement (Crédit/Débit)
  const labelsToUse = useMemo(() => {
      if (savedLabels && savedLabels.length > 0) {
          const isExpense = type === TransactionType.DEBIT;
          return savedLabels
            .filter(l => l.type === AccountType.SAVINGS && l.isExpense === isExpense)
            .map(l => l.name);
      }
      return (suggestions && suggestions.length > 0) ? suggestions : DEFAULT_LABELS;
  }, [savedLabels, suggestions, type]);

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date);
      setLabel(transaction.label);
      setAmount(Math.abs(transaction.amount));
      setType(transaction.amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setLabel('');
      setAmount(0);
      setType(TransactionType.CREDIT);
    }
  }, [transaction, isOpen]);

  const handleSubmit = () => {
    if (!label || amount === 0) return;

    const finalAmount = type === TransactionType.CREDIT ? Math.abs(amount) : -Math.abs(amount);
    
    const newTransaction: SavingsTransaction = {
      id: transaction?.id || `sav_${Date.now()}`,
      accountId,
      date,
      label,
      amount: finalAmount
    };

    onSave(newTransaction);
    onClose();
  };

  const handleDelete = () => {
      if (transaction && onDelete) {
          onDelete(transaction.id);
          setShowDeleteConfirm(false);
          onClose();
      }
  };

  if (showDeleteConfirm) {
      return (
          <ConfirmModal 
             isOpen={true}
             title="Supprimer la transaction ?"
             message={`Voulez-vous vraiment supprimer "${transaction?.label}" ?`}
             onConfirm={handleDelete}
             onCancel={() => setShowDeleteConfirm(false)}
          />
      );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={transaction ? "Modifier le mouvement" : "Nouveau mouvement d'épargne"}>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Type de mouvement</label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setType(TransactionType.CREDIT)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.CREDIT ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              Crédit (+)
            </button>
            <button 
              onClick={() => setType(TransactionType.DEBIT)}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === TransactionType.DEBIT ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
            >
              Débit (-)
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Libellé</label>
          <input 
            type="text" 
            value={label} 
            onChange={e => setLabel(e.target.value)} 
            placeholder="Ex: Virement mensuel, Retrait..." 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {labelsToUse.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setLabel(s)}
                className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 border border-transparent transition-all font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 uppercase block mb-1">Montant (€)</label>
          <input 
            type="number" 
            step="0.01"
            value={amount} 
            onChange={e => setAmount(parseFloat(e.target.value))} 
            className="w-full p-2.5 border border-slate-200 rounded-lg text-lg font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>

        <div className="flex gap-3 pt-2">
            {transaction && onDelete && (
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-3 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
                >
                    <Trash2 size={20} />
                </button>
            )}
            <button 
            onClick={handleSubmit}
            className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
            Enregistrer
            </button>
        </div>
      </div>
    </Modal>
  );
};
