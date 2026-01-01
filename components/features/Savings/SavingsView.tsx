
import React, { useState, useMemo } from 'react';
import { Account, AccountType, Transfer, AppSettings, SavedLabel, VariableTransaction } from '../../../types';
import { PiggyBank, PlusCircle } from 'lucide-react';
import { InfoBox } from '../../ui/InfoBox';
import { SavingsAccountView } from './SavingsAccountView';

interface SavingsViewProps {
  accounts: Account[];
  transfers: Transfer[];
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  savedLabels?: SavedLabel[];
  onUpsertTransfer: (t: Transfer) => void;
  onUpsertTransaction: (t: VariableTransaction) => void;
  onDeleteTransfer: (id: string) => void;
  onNavigateToConfig: () => void;
}

export const SavingsView: React.FC<SavingsViewProps> = ({ 
  accounts, transfers, variableTransactions, settings, savedLabels, onUpsertTransfer, onUpsertTransaction, onDeleteTransfer, onNavigateToConfig
}) => {
  const savingsAccounts = useMemo(() => accounts.filter(a => a.type === AccountType.SAVINGS), [accounts]);
  const [activeAccountId, setActiveAccountId] = useState<string>(savingsAccounts[0]?.id || '');

  if (activeAccountId && !savingsAccounts.find(a => a.id === activeAccountId) && savingsAccounts.length > 0) {
      setActiveAccountId(savingsAccounts[0].id);
  }

  const activeAccount = savingsAccounts.find(a => a.id === activeAccountId);
  
  // Filtrer les transferts ET les transactions directes (intérêts)
  const activeTransfers = useMemo(() => 
    transfers.filter(t => t.sourceAccountId === activeAccountId || t.destinationAccountId === activeAccountId), 
  [transfers, activeAccountId]);

  const activeDirectOps = useMemo(() => 
    variableTransactions.filter(t => t.accountId === activeAccountId),
  [variableTransactions, activeAccountId]);

  if (savingsAccounts.length === 0) {
    return (
      <div className="text-center py-12 space-y-4 animate-in fade-in">
        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-indigo-600">
           <PiggyBank size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Aucun compte d'épargne</h3>
        <p className="text-slate-500 max-w-md mx-auto">
           Pour suivre votre épargne, commencez par ajouter un compte de type "Épargne" dans les paramètres.
        </p>
        <button 
          onClick={onNavigateToConfig}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
        >
          <PlusCircle size={18} /> Créer un compte
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <InfoBox 
         title="Suivi de l'Épargne"
         description="Gérez vos livrets : virements internes et intérêts annuels."
         icon={<PiggyBank size={18} />}
       />

       <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          {savingsAccounts.map(acc => (
             <button
                key={acc.id}
                onClick={() => setActiveAccountId(acc.id)}
                className={`px-4 py-2.5 rounded-t-xl text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                    activeAccountId === acc.id 
                    ? 'bg-white border-indigo-600 text-indigo-700' 
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
             >
                <PiggyBank size={16} className={activeAccountId === acc.id ? 'text-indigo-600' : 'text-slate-400'} />
                {acc.name}
             </button>
          ))}
       </div>

       {activeAccount && (
          <div className="animate-in slide-in-from-bottom-2 duration-300">
             <SavingsAccountView 
                account={activeAccount}
                transfers={activeTransfers}
                directOps={activeDirectOps}
                allAccounts={accounts}
                savedLabels={savedLabels}
                onUpsertTransfer={onUpsertTransfer}
                onUpsertTransaction={onUpsertTransaction}
                onDeleteTransfer={onDeleteTransfer}
             />
          </div>
       )}
    </div>
  );
};
