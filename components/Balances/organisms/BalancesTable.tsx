
import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Wallet, Pencil, Check, X, Users } from 'lucide-react';
import { MobileTooltip } from '../../ui/MobileTooltip';

export interface BalanceRow {
  id: string;
  name: string;
  owner: string;
  balance: number;
  target: number;
  transfer: number;
  isJoint: boolean;
}

interface BalancesTableProps {
  rows: BalanceRow[];
  onUpdateBalance: (accountId: string, newBalance: number) => void;
}

export const BalancesTable: React.FC<BalancesTableProps> = ({ rows, onUpdateBalance }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>('');

  const startEdit = (id: string, balance: number) => {
    setEditingId(id);
    setTempBalance(balance.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempBalance('');
  };

  const saveEdit = (id: string) => {
    const newBalance = parseFloat(tempBalance);
    if (!isNaN(newBalance)) {
        onUpdateBalance(id, newBalance);
    }
    setEditingId(null);
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-xs">
                  <tr>
                      <th className="px-6 py-4">Compte</th>
                      <th className="px-6 py-4 text-right">
                          Solde Actuel (Réel)
                          <MobileTooltip text="Montant réel présent sur votre compte bancaire. Cliquez pour le modifier." iconClassName="text-indigo-300 hover:text-indigo-100 transition-colors" />
                      </th>
                      <th className="px-6 py-4 text-right">
                          Cible Période (Besoin)
                          <MobileTooltip text="Montant minimum requis sur ce compte. Pour les comptes persos : basé sur le ratio/plafond. Pour le compte joint : couvre les factures + besoins des comptes persos." iconClassName="text-indigo-300 hover:text-indigo-100 transition-colors" />
                      </th>
                      <th className="px-6 py-4 text-right bg-indigo-50/50 text-indigo-900">
                          Virement Nécessaire
                          <MobileTooltip text="Montant à ajouter pour atteindre la cible. Si Négatif, c'est que vous avez trop d'argent sur le compte (ex: salaire reçu) et qu'il faut le virer vers le compte pivot." iconClassName="text-indigo-600 hover:text-indigo-400 transition-colors" />
                      </th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {rows.map(row => (
                      <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${row.isJoint ? 'bg-purple-50/30' : ''}`}>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg text-slate-500 ${row.isJoint ? 'bg-purple-100 text-purple-600' : 'bg-slate-100'}`}>
                                      {row.isJoint ? <Users size={18} /> : <Wallet size={18} />}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-900 flex items-center gap-2">
                                          {row.name}
                                          {row.isJoint && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Joint</span>}
                                      </p>
                                      <p className="text-xs text-slate-400">{row.owner}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                              {editingId === row.id ? (
                                  <div className="flex items-center justify-end gap-2 animate-in fade-in zoom-in-95 duration-200">
                                      <input 
                                          autoFocus
                                          type="number"
                                          step="0.01"
                                          value={tempBalance} 
                                          onChange={e => setTempBalance(e.target.value)} 
                                          className="w-24 p-1 text-right text-sm border border-indigo-300 rounded bg-white text-slate-900 outline-none ring-2 ring-indigo-100 font-bold" 
                                          onKeyDown={e => e.key === 'Enter' && saveEdit(row.id)}
                                      />
                                      <button onClick={() => saveEdit(row.id)} className="bg-emerald-100 text-emerald-600 p-1.5 rounded-md hover:bg-emerald-200"><Check size={14} /></button>
                                      <button onClick={cancelEdit} className="bg-slate-100 text-slate-500 p-1.5 rounded-md hover:bg-slate-200"><X size={14} /></button>
                                  </div>
                              ) : (
                                  <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => startEdit(row.id, row.balance)}>
                                      <span className="font-mono font-medium text-slate-600 border-b border-dashed border-slate-300 pb-0.5 group-hover:border-indigo-400 group-hover:text-indigo-600 transition-colors">
                                          {row.balance.toFixed(2)} €
                                      </span>
                                      <Pencil size={12} className="text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                  </div>
                              )}
                          </td>
                          <td className="px-6 py-4 text-right">
                              <div className="inline-block px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono font-bold text-xs">
                                  {row.target.toFixed(2)} €
                              </div>
                              {row.isJoint && (
                                  <p className="text-[9px] text-slate-400 mt-1">Inclus factures + besoins persos</p>
                              )}
                          </td>
                          <td className="px-6 py-4 text-right bg-indigo-50/30 font-bold font-mono">
                              <div className="flex flex-col items-end">
                                  <span className={row.transfer > 0 ? 'text-indigo-600' : 'text-emerald-600'}>
                                      {row.transfer > 0 ? '+' : ''}{row.transfer.toFixed(2)} €
                                  </span>
                                  <span className="text-[9px] text-indigo-400 uppercase font-medium">
                                      {row.transfer > 0 
                                        ? (row.isJoint ? 'Depuis LDDS' : 'Depuis C. Joint')
                                        : (row.isJoint ? 'Vers LDDS' : 'Vers C. Joint')
                                      }
                                  </span>
                              </div>
                          </td>
                      </tr>
                  ))}
                  {rows.length === 0 && (
                      <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                              Aucun compte courant trouvé. <br/>
                              Veuillez configurer vos comptes dans les paramètres.
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </Card>
  );
};
