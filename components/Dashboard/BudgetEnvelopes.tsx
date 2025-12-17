
import React from 'react';
import { Transaction, TransactionType, Person } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface BudgetEnvelopesProps {
  transactions: Transaction[];
  people: Person[];
  weeklyLimit: number;
}

const VARIABLE_CATEGORIES = [
    'Alimentation & Restaurants',
    'Achats & Shopping',
    'Loisirs & Sorties',
    'Esthétique & Soins',
    'Divers',
    'Auto & Transports' 
];

export const BudgetEnvelopes: React.FC<BudgetEnvelopesProps> = ({ transactions, people, weeklyLimit }) => {
  
  const isThisWeek = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    return d >= startOfWeek;
  };

  const weeklyExpenses = transactions.filter(t => 
    t.type === TransactionType.DEBIT &&
    isThisWeek(t.date) &&
    VARIABLE_CATEGORIES.includes(t.category)
  );

  const payers = people.filter(p => !p.isChild && p.name !== 'Commun' && p.name !== 'Joint');
  
  const spendingByPayer = payers.map(p => ({
      name: p.name,
      spent: weeklyExpenses.filter(t => t.initiatedBy === p.id).reduce((acc, curr) => acc + curr.amount, 0),
      color: p.name === 'Guillaume' ? 'bg-blue-500' : 'bg-purple-500'
  }));

  const spentJoint = weeklyExpenses
      .filter(t => {
          const person = people.find(p => p.id === t.initiatedBy);
          return person?.name === 'Commun' || person?.name === 'Joint';
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

  const totalSpent = spendingByPayer.reduce((acc, curr) => acc + curr.spent, 0) + spentJoint;
  const remainingGlobal = weeklyLimit - totalSpent;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
            <span>Enveloppe Couple Hebdo</span>
            <span className="text-2xl font-bold text-indigo-600">{weeklyLimit} €</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Consommation totale</span>
                <span className={`font-semibold ${remainingGlobal < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                    {totalSpent.toFixed(2)} € dépensés
                </span>
            </div>
            <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${totalSpent > weeklyLimit ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min((totalSpent / weeklyLimit) * 100, 100)}%` }}
                />
            </div>
            <p className="text-right text-xs text-slate-500 mt-1">
                Reste global : <strong>{remainingGlobal.toFixed(2)} €</strong>
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {spendingByPayer.map((payer, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <h4 className="font-semibold text-sm">{payer.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">Dépensé cette semaine</p>
                    <p className="text-lg font-bold text-slate-800">{payer.spent.toFixed(2)} €</p>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
