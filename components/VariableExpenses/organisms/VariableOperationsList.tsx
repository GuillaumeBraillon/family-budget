
import React from 'react';
import { VariableTransaction, Account, Person } from '../../../types';
import { Trash2, ShoppingCart, CreditCard, Tag, Calendar, Pencil, User, TrendingUp } from 'lucide-react';
import { Card } from '../../ui/Card';

interface VariableOperationsListProps {
  transactions: VariableTransaction[];
  accounts: Account[];
  people: Person[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: VariableTransaction) => void;
  monthShort: string;
}

export const VariableOperationsList: React.FC<VariableOperationsListProps> = ({ 
  transactions, accounts, people, onDeleteTransaction, onEditTransaction, monthShort 
}) => {
  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Détail des opérations</h3>
        <span className="text-xs px-2 py-1 bg-white border border-slate-200 rounded text-slate-500 font-medium">
          {transactions.length} opérations
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {transactions.map(item => {
            const account = accounts.find(a => a.id === item.accountId);
            const person = people.find(p => p.id === item.beneficiaryId);
            const date = new Date(item.date);
            const day = date.getDate();
            const isIncome = item.type === 'INCOME';
            
            return (
                <div key={item.id} className="p-4 flex items-center gap-4 group transition-colors hover:bg-slate-50">
                    {/* Icône */}
                    <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border ${isIncome ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {isIncome ? <TrendingUp size={18} /> : <ShoppingCart size={18} />}
                    </div>

                    {/* Date */}
                    <div className="flex-shrink-0 w-12 text-center">
                        <span className="text-lg font-bold block text-slate-800">{day}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">{monthShort}</span>
                    </div>

                    {/* Détails */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-slate-900 truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                                <Tag size={10}/> {item.category} {item.subCategory && `> ${item.subCategory}`}
                            </span>
                            {person && (
                                <span className="flex items-center gap-1 text-slate-500">
                                    <User size={10} /> {person.name}
                                </span>
                            )}
                            {account && (
                                <span className="flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    <CreditCard size={10} /> {account.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Montant & Actions */}
                    <div className="text-right flex items-center gap-4">
                        <span className={`font-bold text-lg ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isIncome ? '+' : ''}{item.amount.toFixed(2)} €
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => onEditTransaction(item)}
                                className="p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Modifier"
                            >
                                <Pencil size={18} />
                            </button>
                            <button 
                                onClick={() => onDeleteTransaction(item.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Supprimer"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            );
        })}
        {transactions.length === 0 && (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Calendar size={48} className="mb-4 text-slate-200" />
            <p className="text-sm">Aucune opération enregistrée pour cette période.</p>
          </div>
        )}
      </div>
    </Card>
  );
};
