import React from 'react';
import { Users, Banknote, Wallet, Check } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Person, Account } from '../../../types';

interface DetailedAnalysisProps {
  stats: any;
  people: Person[];
  accounts: Account[];
}

/**
 * Section d'analyse détaillée affichant les dépenses/revenus par bénéficiaire et par compte.
 * Affiche désormais les montants prévus vs réels (payés).
 */
export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ stats, people, accounts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* DÉPENSES / BÉNÉF. */}
      <Card className="p-4 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
          <Users size={12}/> Dépenses / Bénéf.
        </h3>
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {Object.entries(stats.expByBeneficiary || {})
            .sort((a: any, b: any) => b[1].planned - a[1].planned)
            .map(([id, s]: [string, any]) => (
              <div key={id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-600 truncate max-w-[90px] mt-0.5">
                  {people.find(p => p.id === id)?.name || 'Inconnu'}
                </span>
                <div className="text-right">
                    <span className="block font-bold text-slate-900">{s.paid.toFixed(2)} € <span className="text-[10px] font-normal text-slate-400">Réel</span></span>
                    <span className="text-[10px] text-slate-400">Prévu: {s.planned.toFixed(2)} €</span>
                </div>
              </div>
          ))}
          {Object.keys(stats.expByBeneficiary || {}).length === 0 && (
            <p className="text-[10px] text-slate-400 italic">Aucune dépense.</p>
          )}
        </div>
      </Card>

      {/* REVENUS / BÉNÉF. */}
      <Card className="p-4 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
          <Banknote size={12}/> Revenus / Bénéf.
        </h3>
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {Object.entries(stats.incByBeneficiary || {})
            .sort((a: any, b: any) => b[1].planned - a[1].planned)
            .map(([id, s]: [string, any]) => (
              <div key={id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-600 truncate max-w-[90px] mt-0.5">
                  {people.find(p => p.id === id)?.name || 'Inconnu'}
                </span>
                <div className="text-right">
                    <span className="block font-bold text-emerald-600">+{s.paid.toFixed(2)} € <span className="text-[10px] font-normal text-emerald-600/50">Réel</span></span>
                    <span className="text-[10px] text-slate-400">Prévu: {s.planned.toFixed(2)} €</span>
                </div>
              </div>
          ))}
          {Object.keys(stats.incByBeneficiary || {}).length === 0 && (
            <p className="text-[10px] text-slate-400 italic">Aucun revenu.</p>
          )}
        </div>
      </Card>

      {/* PAR COMPTE */}
      <Card className="p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Wallet size={48} />
        </div>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
          <Wallet size={12}/> Par Compte
        </h3>
        <div className="space-y-3 relative z-10 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {(!stats.byAccount || Object.keys(stats.byAccount).length === 0) && (
            <p className="text-xs text-slate-400 italic">Aucune donnée.</p>
          )}
          {Object.entries(stats.byAccount || {}).map(([account_id, s]: [string, any]) => {
            const account = accounts.find(a => a.id === account_id);
            const displayName = account ? account.name : 'Compte Inconnu';
            return (
              <div key={account_id} className="flex justify-between items-start text-xs border-b border-slate-50 pb-2 last:border-0">
                <span className="font-medium text-slate-700 truncate pr-2 mt-0.5" title={displayName}>
                  {displayName}
                </span>
                <div className="text-right whitespace-nowrap">
                  <span className="block font-bold text-slate-900">{s.paid.toFixed(2)} € <span className="text-[10px] font-normal text-slate-400">Réel</span></span>
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-400">Prévu: {s.planned.toFixed(2)} €</span>
                      {s.remaining !== 0 ? (
                        <span className="text-[10px] text-amber-600 font-medium">Reste: {s.remaining.toFixed(2)} €</span>
                      ) : (
                        s.planned !== 0 && (
                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                <Check size={10}/> Soldé
                            </span>
                        )
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};