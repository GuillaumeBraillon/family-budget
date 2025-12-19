
import React from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { SavingsTransaction } from '../../../types';

interface HistoryItem extends SavingsTransaction {
  balanceAfter: number;
}

interface SavingsHistoryTableProps {
  history: HistoryItem[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: SavingsTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const SavingsHistoryTable: React.FC<SavingsHistoryTableProps> = ({ 
  history, 
  onAddTransaction, 
  onEditTransaction, 
  onDeleteTransaction 
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
         <h3 className="font-bold text-slate-800 flex items-center gap-2">
           Historique
           <span className="text-xs font-normal text-slate-500 bg-white border px-2 py-0.5 rounded-full">{history.length} ops</span>
         </h3>
         <div className="flex gap-2">
            <button 
              onClick={onAddTransaction}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus size={16} /> Ajouter une ligne
            </button>
         </div>
      </div>
      
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                      <th className="px-6 py-3 w-32">Date</th>
                      <th className="px-6 py-3">Libellé</th>
                      <th className="px-6 py-3 text-right text-red-600 w-32">Débit</th>
                      <th className="px-6 py-3 text-right text-emerald-600 w-32">Crédit</th>
                      <th className="px-6 py-3 text-right bg-slate-100/50 w-32">Solde</th>
                      <th className="px-4 py-3 w-20 text-center">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {history.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-3 font-mono text-slate-600">
                              {new Date(tx.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-800">
                              {tx.label}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-red-600">
                              {tx.amount < 0 ? tx.amount.toFixed(2) + ' €' : '-'}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-emerald-600">
                              {tx.amount > 0 ? '+' + tx.amount.toFixed(2) + ' €' : '-'}
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-slate-800 bg-slate-50/30 font-mono">
                              {tx.balanceAfter.toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => onEditTransaction(tx)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                      <Pencil size={14} />
                                  </button>
                                  <button onClick={() => onDeleteTransaction(tx.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {history.length === 0 && (
                      <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                              Aucune transaction enregistrée pour ce compte.
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};
