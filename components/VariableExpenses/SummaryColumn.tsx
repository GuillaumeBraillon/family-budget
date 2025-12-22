
import React, { useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { VariableTransaction, WeeklyBudget, IncomeConfig, Person, AppSettings, PaidItemDetails } from '../../types';
import { Calculator, Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';
import { MobileTooltip } from '../ui/MobileTooltip';

interface SummaryColumnProps {
  transactions: VariableTransaction[];
  weeks: WeeklyBudget[];
  incomeConfigs: IncomeConfig[];
  paidItems?: Record<string, PaidItemDetails>;
  people: Person[];
  settings: AppSettings;
  currentDate: Date;
}

export const SummaryColumn: React.FC<SummaryColumnProps> = ({ 
  transactions, weeks, incomeConfigs, paidItems = {}, people, settings, currentDate 
}) => {
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Totaux globaux
  const totalExpensesMonth = transactions.filter(t => t.type !== 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalVarIncomeMonth = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  
  // Calcul des salaires : On prend le REEL (paidItems) si dispo, sinon le PRÉVU (config)
  const salaries: Record<string, { amount: number, isReal: boolean }> = useMemo(() => {
    const map: Record<string, { amount: number, isReal: boolean }> = {};
    
    incomeConfigs.forEach(inc => {
        const instanceId = `${inc.id}-${currentMonthKey}`;
        const paidItem = paidItems[instanceId];
        
        // Initialisation si nécessaire
        if (!map[inc.beneficiaryId]) {
            map[inc.beneficiaryId] = { amount: 0, isReal: false };
        }
        
        if (paidItem) {
            map[inc.beneficiaryId].amount += paidItem.amount;
            map[inc.beneficiaryId].isReal = true; // Au moins un revenu réel détecté pour cette personne
        } else {
            map[inc.beneficiaryId].amount += inc.amount;
        }
    });
    return map;
  }, [incomeConfigs, paidItems, currentMonthKey]);

  const totalSalaries: number = Object.values(salaries).reduce((acc, v) => acc + v.amount, 0);

  // Calcul du "Reste" sur l'enveloppe : Budget + Revenus Variables - Dépenses Variables
  const totalBudget = settings.monthly_envelope;
  const remaining = (totalBudget + totalVarIncomeMonth) - totalExpensesMonth;

  return (
    <div className="flex-shrink-0 w-full md:w-80 space-y-4 border-l-0 xl:border-l xl:border-slate-200 xl:pl-6 pt-6 xl:pt-0 mt-6 xl:mt-0">
        
        {/* RÉSUMÉ MENSUEL */}
        <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Calculator size={18} className="text-slate-600" />
                    <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Mois en cours ({monthLabel})</h3>
                </div>

                {weeks.map(week => {
                   const txInWeek = transactions.filter(t => {
                       const d = new Date(t.date).getDate();
                       return d >= week.startDate && d <= week.endDate;
                   });
                   
                   const weekExpenses = txInWeek.filter(t => t.type !== 'INCOME').reduce((sum, t) => sum + t.amount, 0);
                   const weekIncome = txInWeek.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
                   
                   const weekBudget = week.periodLimit || 0;
                   const weekRemaining = (weekBudget + weekIncome) - weekExpenses;
                   const isOver = weekRemaining < 0;

                   return (
                       <div key={week.weekNumber} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0">
                           <span className="text-slate-600">Semaine {week.weekNumber}</span>
                           <div className="text-right">
                               <span className="font-bold block">{weekExpenses.toFixed(0)} €</span>
                               <span className={`text-[10px] ${isOver ? 'text-red-500' : 'text-emerald-600'}`}>
                                   / {(weekBudget + weekIncome).toFixed(0)} €
                               </span>
                           </div>
                       </div>
                   );
                })}
                
                <div className="pt-2 border-t-2 border-slate-200 mt-2 space-y-1">
                     <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-500 uppercase">Dépenses Variables</span>
                        <span className="font-bold text-lg text-slate-900">{totalExpensesMonth.toFixed(2)} €</span>
                     </div>
                     
                     {totalVarIncomeMonth > 0 && (
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-emerald-600 font-medium flex items-center gap-1"><TrendingUp size={10}/> Revenus Variables</span>
                            <span className="font-bold text-emerald-600">+{totalVarIncomeMonth.toFixed(2)} €</span>
                         </div>
                     )}

                     <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Budget Autorisé</span>
                        <span className="font-medium text-slate-600">{totalBudget.toFixed(2)} €</span>
                     </div>
                     <div className={`mt-3 p-2 rounded-lg text-center font-bold text-sm ${remaining >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                         {remaining >= 0 ? 'Reste : ' : 'Dépassement : '}{Math.abs(remaining).toFixed(2)} €
                     </div>
                </div>
            </CardContent>
        </Card>

        {/* SECTION SALAIRES */}
        <Card className="bg-white border-indigo-100">
             <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-indigo-900 uppercase text-xs tracking-wider">Revenus Fixes</h3>
                </div>
                
                <div className="space-y-3">
                    {people.filter(p => !p.isChild).map(p => {
                        const data = salaries[p.id] || { amount: 0, isReal: false };
                        return (
                            <div key={p.id} className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                                    {p.name}
                                    {data.isReal && <CheckCircle2 size={12} className="text-emerald-500" />}
                                </span>
                                <span className={`font-bold ${data.isReal ? 'text-emerald-700' : 'text-slate-900'}`}>
                                    {data.amount.toFixed(0)} €
                                </span>
                            </div>
                        );
                    })}
                    
                    <div className="border-t border-indigo-50 pt-3 mt-2 flex justify-between items-center">
                        <span className="font-bold text-indigo-700 text-sm">TOTAL REVENUS</span>
                        <span className="font-black text-indigo-700 text-lg">{totalSalaries.toFixed(2)} €</span>
                    </div>

                    <div className="text-center pt-2">
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                           Solde Théorique (Par pers.) : {((totalSalaries - totalExpensesMonth + totalVarIncomeMonth) / 2).toFixed(0)} €
                           <MobileTooltip text="Revenus totaux (fixes + variables) moins dépenses variables, divisé par 2. Les revenus fixes sont basés sur le réel si pointé dans l'échéancier." />
                        </span>
                    </div>
                </div>
             </CardContent>
        </Card>
    </div>
  );
};
