
import React from 'react';
import { WeeklyBudget, VariableTransaction, Account, Person } from '../../../types';
import { CalendarRange, Wallet, Users } from 'lucide-react';

interface VariablePeriodSelectorProps {
  weeks: WeeklyBudget[];
  activeWeek: number;
  onSelect: (weekNumber: number) => void;
  transactions: VariableTransaction[];
  accounts: Account[];
  people: Person[];
}

export const VariablePeriodSelector: React.FC<VariablePeriodSelectorProps> = ({ 
  weeks, activeWeek, onSelect, transactions, accounts, people
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      {weeks.map((week) => {
        const isActive = activeWeek === week.weekNumber;
        
        // Filtrer les transactions de la période
        const txsInPeriod = transactions.filter(t => {
            const d = new Date(t.date).getDate();
            return d >= week.startDate && d <= week.endDate;
        });

        // Calcul des totaux
        const expenses = txsInPeriod.filter(t => t.type !== 'INCOME').reduce((sum, t) => sum + t.amount, 0);
        const incomes = txsInPeriod.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);

        const limit = week.periodLimit || 0;
        
        // Le "Reste" = Budget + RevenusVariables - Dépenses
        const remaining = (limit + incomes) - expenses;
        const isOver = remaining < 0;
        
        // Progression visuelle simple (Dépenses vs Budget Initial) - Pour ne pas casser l'UI si on a bcp de revenus
        const progress = Math.min((expenses / (limit || 1)) * 100, 100);

        // Calcul par compte
        const byAccount: Record<string, number> = {};
        txsInPeriod.forEach(t => {
            // On soustrait les revenus pour l'affichage du flux net par compte ? 
            // Ou on affiche juste le volume ? Ici affichons le flux net (Dépense = positif, Revenu = négatif pour réduire la "charge")
            const val = t.type === 'INCOME' ? -t.amount : t.amount;
            byAccount[t.accountId] = (byAccount[t.accountId] || 0) + val;
        });

        // Calcul par bénéficiaire
        const byBeneficiary: Record<string, number> = {};
        txsInPeriod.forEach(t => {
            if (t.beneficiaryId) {
                const val = t.type === 'INCOME' ? -t.amount : t.amount;
                byBeneficiary[t.beneficiaryId] = (byBeneficiary[t.beneficiaryId] || 0) + val;
            }
        });

        return (
          <button 
            key={week.weekNumber} 
            onClick={() => onSelect(week.weekNumber)} 
            className={`relative p-3 rounded-xl transition-all border text-left flex flex-col justify-between min-h-[140px] ${
              isActive 
                ? 'bg-white border-indigo-500 ring-2 ring-indigo-100 shadow-md z-10' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-indigo-300'
            }`}
          >
            {/* Header: Dates */}
            <div className="flex justify-between items-start w-full mb-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                    <CalendarRange size={14} className={isActive ? 'text-indigo-600' : 'text-slate-400'}/>
                    <span className={`text-xs font-bold uppercase ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>
                        Du {week.startDate} au {week.endDate}
                    </span>
                </div>
            </div>

            {/* Budget Progress */}
            <div className="w-full mb-3">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Reste</span>
                    <span className={`text-sm font-black ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                        {remaining.toFixed(0)} €
                    </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[9px] mt-1 font-medium text-slate-400">
                    <span>Conso: {expenses.toFixed(0)}€</span>
                    <span className="flex items-center gap-1">
                        {incomes > 0 && <span className="text-emerald-600">+{incomes.toFixed(0)}</span>}
                        <span>Budget: {limit.toFixed(0)}€</span>
                    </span>
                </div>
            </div>

            {/* Détails Compte / Bénéficiaires (Uniquement si actif ou dépense > 0) */}
            {(isActive || expenses > 0 || incomes > 0) && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 w-full animate-in fade-in">
                     {/* Par Compte */}
                     <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                            <Wallet size={10} /> Comptes
                        </div>
                        {Object.entries(byAccount).map(([accId, amount]) => {
                            const acc = accounts.find(a => a.id === accId);
                            return (
                                <div key={accId} className="flex justify-between text-[9px] text-slate-600 w-full">
                                    <span className="truncate flex-1 pr-1">{acc?.name || '?'}</span>
                                    <span className="font-medium whitespace-nowrap">{amount.toFixed(0)}€</span>
                                </div>
                            )
                        })}
                     </div>

                     {/* Par Bénéficiaire */}
                     <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                            <Users size={10} /> Bénéf.
                        </div>
                         {Object.entries(byBeneficiary).map(([pId, amount]) => {
                            const p = people.find(person => person.id === pId);
                            return (
                                <div key={pId} className="flex justify-between text-[9px] text-slate-600 w-full">
                                    <span className="truncate flex-1 pr-1">{p?.name || '?'}</span>
                                    <span className="font-medium whitespace-nowrap">{amount.toFixed(0)}€</span>
                                </div>
                            )
                        })}
                     </div>
                </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
