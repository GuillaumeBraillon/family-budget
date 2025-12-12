import React from 'react';
import { Account, AccountType, Person } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { PiggyBank, CreditCard } from 'lucide-react';

interface AccountsOverviewProps {
  accounts: Account[];
  people: Person[];
}

export const AccountsOverview: React.FC<AccountsOverviewProps> = ({ accounts, people }) => {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  
  const formatEuro = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <div className="space-y-6">
      {/* Total Aggrégé */}
      <Card className="bg-slate-900 text-white border-slate-800">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Patrimoine Total</p>
          <h2 className="text-4xl font-bold">{formatEuro(totalBalance)}</h2>
        </CardContent>
      </Card>

      {/* Liste des comptes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account) => {
            const ownerName = people.find(p => p.id === account.ownerId)?.name || 'Inconnu';
            return (
                <Card key={account.id} className="transition-all hover:shadow-md">
                    <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                        account.type === AccountType.SAVINGS 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-indigo-100 text-indigo-600'
                        }`}>
                        {account.type === AccountType.SAVINGS ? <PiggyBank size={20} /> : <CreditCard size={20} />}
                        </div>
                        <div>
                        <p className="font-semibold text-slate-900 text-sm">{account.name}</p>
                        <p className="text-xs text-slate-500">{account.bankName} • {ownerName}</p>
                        </div>
                    </div>
                    <p className={`font-mono font-medium ${account.currentBalance < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                        {formatEuro(account.currentBalance)}
                    </p>
                    </div>
                </Card>
            );
        })}
      </div>
    </div>
  );
};