
import React from 'react';
import { Card, CardContent } from '../../../ui/Card';
import { ArrowRightLeft, PiggyBank } from 'lucide-react';

interface TransferSummaryCardProps {
  amount: number;
}

export const TransferSummaryCard: React.FC<TransferSummaryCardProps> = ({ amount }) => {
  return (
    <div className="mt-8">
      <Card className={`border-l-4 shadow-md transition-all ${amount > 0 ? 'border-l-indigo-600 bg-white' : 'border-l-emerald-500 bg-emerald-50/50'}`}>
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-full shadow-sm ${amount > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {amount > 0 ? <ArrowRightLeft size={32} /> : <PiggyBank size={32} />}
                  </div>
                  <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Vir LDDS vers Joint</h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-md">
                          {amount > 0 
                              ? "Montant total à transférer de votre Livret d'Épargne vers le Compte Joint pour couvrir les factures globales ET les besoins de trésorerie des comptes personnels."
                              : "Aucun virement nécessaire depuis le LDDS. Le Compte Joint dispose d'assez de provision."}
                      </p>
                  </div>
              </div>
              <div className="text-right">
                  <div className={`text-4xl font-black tracking-tighter ${amount > 0 ? 'text-indigo-600' : 'text-emerald-600'}`}>
                      {amount > 0 ? amount.toFixed(2) : '0.00'} €
                  </div>
                  {amount < 0 && (
                      <p className="text-xs font-bold text-emerald-700 mt-1 uppercase bg-emerald-100 px-2 py-1 rounded inline-block">
                          Excédent Joint : {Math.abs(amount).toFixed(2)} €
                      </p>
                  )}
              </div>
          </CardContent>
      </Card>
    </div>
  );
};
