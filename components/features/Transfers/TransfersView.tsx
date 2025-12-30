
import React, { useState, useMemo } from 'react';
import { usePlannerUI } from '../../../hooks/usePlannerUI';
import { Account, Person, Transfer, AppSettings, SavedLabel, AccountType } from '../../../types';
import { ArrowRightLeft, Filter, X, ArrowRight, Calendar } from 'lucide-react';

// Imports UI Atomic
import { MonthNavigator } from '../../ui/molecules/MonthNavigator';
import { SearchBar } from '../../ui/atoms/SearchBar';
import { InfoBox } from '../../ui/InfoBox';
import { DataList } from '../../ui/molecules/DataList';

// Imports Feature Components
import { VariableTransactionForm } from '../Operations/components/VariableTransactionForm';
import { TransfersKPIs } from './components/TransfersKPIs';

interface TransfersViewProps {
  transfers: Transfer[];
  accounts: Account[];
  people: Person[]; 
  settings: AppSettings;
  categories: any[];
  savedLabels?: SavedLabel[]; 
  onUpsertTransfer: (t: Transfer) => void;
  onDeleteTransfer: (id: string) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ 
  transfers, accounts, people, settings, categories, savedLabels,
  onUpsertTransfer, onDeleteTransfer
}) => {
  const ui = usePlannerUI();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [selectedMotif, setSelectedMotif] = useState<string | null>(null);
  
  // --- CALCUL DES SOLDES EFFECTIFS (EPARGNE) ---
  // Les comptes d'épargne ne stockent pas leur solde dans .currentBalance mais sont calculés via l'historique des transferts.
  // On injecte ici le solde calculé pour l'affichage dans le formulaire.
  const accountsWithBalances = useMemo(() => {
    return accounts.map(acc => {
        if (acc.type === AccountType.SAVINGS) {
            const balance = transfers.reduce((sum, t) => {
                if (t.destinationAccountId === acc.id) return sum + t.amount;
                if (t.sourceAccountId === acc.id) return sum - t.amount;
                return sum;
            }, 0);
            return { ...acc, currentBalance: balance };
        }
        return acc;
    });
  }, [accounts, transfers]);

  // --- FILTRAGE ET TRI DES TRANSFERTS ---
  const { currentTransfers, motifs } = useMemo(() => {
    const currentMonth = ui.currentDate.getMonth();
    const currentYear = ui.currentDate.getFullYear();
    const foundMotifs = new Set<string>();

    const filtered = transfers.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .filter(t => {
        if (ui.searchQuery) {
            const q = ui.searchQuery.toLowerCase();
            return t.label.toLowerCase().includes(q) || t.amount.toString().includes(q);
        }
        return true;
    })
    .filter(t => {
        if (selectedMotif) return t.label === selectedMotif;
        return true;
    })
    .sort((a, b) => {
        // Tri principal par Date (Récent -> Ancien)
        const dateDiff = b.date.localeCompare(a.date);
        if (dateDiff !== 0) return dateDiff;
        // Tri secondaire par Heure de création (Récent -> Ancien)
        return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    // Extraction des motifs pour le filtre
    transfers.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            foundMotifs.add(t.label);
        }
    });

    return { currentTransfers: filtered, motifs: Array.from(foundMotifs).sort() };
  }, [transfers, ui.currentDate, ui.searchQuery, selectedMotif]);

  // --- CALCUL DES INDICATEURS ---
  const stats = useMemo(() => {
    let toSavings = 0;
    let fromSavings = 0;
    let internalChecking = 0;

    currentTransfers.forEach(t => {
        const source = accounts.find(a => a.id === t.sourceAccountId);
        const dest = accounts.find(a => a.id === t.destinationAccountId);

        const isSourceSavings = source?.type === AccountType.SAVINGS;
        const isDestSavings = dest?.type === AccountType.SAVINGS;

        if (isDestSavings && !isSourceSavings) {
            toSavings += t.amount;
        } else if (isSourceSavings && !isDestSavings) {
            fromSavings += t.amount;
        } else if (!isSourceSavings && !isDestSavings) {
            internalChecking += t.amount;
        }
    });

    return { toSavings, fromSavings, internalChecking };
  }, [currentTransfers, accounts]);

  const handleEdit = (t: Transfer) => {
      // Mapping Transfer -> VariableTransaction pour réutiliser le formulaire
      const mockTx: any = {
          id: t.id,
          date: t.date,
          label: t.label,
          amount: t.amount,
          category: 'Virement Interne',
          accountId: t.sourceAccountId, // Source par défaut pour l'édition
          isWaiting: false,
          isExtra: false,
          type: 'EXPENSE',
          // On utilise comments pour passer l'ID de destination au formulaire via le mode 'TRANSFER'
          comments: t.destinationAccountId 
      };
      setEditingTransfer(t); // On garde le vrai objet pour la suppression
      setEditingVar(mockTx); 
      setIsFormOpen(true);
  };

  // State temporaire pour le formulaire (VariableTransaction est attendu par le form existant)
  const [editingVar, setEditingVar] = useState<any | null>(null);

  const defaultDate = new Date().toISOString().split('T')[0];

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Inconnu';

  return (
    <div className="space-y-6">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <InfoBox 
            title="Gestion des Virements" 
            description="Suivez ici les mouvements d'argent entre vos comptes (Courant vers Épargne, Équilibrage Compte Joint, etc.)." 
            icon={<ArrowRightLeft size={18} />}
          />

          <div className="flex flex-col md:flex-row justify-between gap-4">
            <MonthNavigator date={ui.currentDate} onPrev={ui.handlePrevMonth} onNext={ui.handleNextMonth} />
            <SearchBar value={ui.searchQuery} onChange={ui.setSearchQuery} />
          </div>

          <TransfersKPIs stats={stats} />

          {/* BARRE DE FILTRES MOTIFS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Filter size={14} /> Filtrer par Motif
                  </span>
                  {selectedMotif && (
                      <button 
                          onClick={() => setSelectedMotif(null)} 
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 uppercase transition-colors"
                      >
                          <X size={12} /> Effacer filtre
                      </button>
                  )}
              </div>
              
              {motifs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                      {motifs.map(motif => (
                          <button
                              key={motif}
                              onClick={() => setSelectedMotif(selectedMotif === motif ? null : motif)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  selectedMotif === motif
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                              }`}
                          >
                              {motif}
                          </button>
                      ))}
                  </div>
              ) : (
                  <p className="text-xs text-slate-400 italic">Aucun virement ce mois-ci.</p>
              )}
          </div>

          <DataList 
            title="Historique des Virements" 
            count={currentTransfers.length} 
            onAdd={() => { setEditingTransfer(null); setEditingVar(null); setIsFormOpen(true); }}
            addButtonLabel="Nouveau virement" 
            emptyMessage="Aucun virement trouvé pour cette période."
          >
            {currentTransfers.map(t => (
                <div 
                    key={t.id} 
                    onClick={() => handleEdit(t)}
                    className="p-4 flex items-center gap-4 group transition-all cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                    <div className="flex-shrink-0 w-12 text-center flex flex-col items-center justify-center rounded-lg py-1 border bg-slate-50 border-slate-100">
                        <span className="text-sm font-bold block text-slate-700 leading-none">{new Date(t.date).getDate()}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none mt-0.5">
                            {new Date(t.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate mb-1">{t.label}</div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-medium">
                                {getAccountName(t.sourceAccountId)}
                            </span>
                            <ArrowRight size={12} className="text-slate-400" />
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">
                                {getAccountName(t.destinationAccountId)}
                            </span>
                        </div>
                    </div>

                    <div className="text-right font-black text-base text-indigo-700">
                        {t.amount.toFixed(2)} €
                    </div>
                </div>
            ))}
          </DataList>
      </div>

      <VariableTransactionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        accounts={accountsWithBalances} 
        categories={categories} 
        people={people} 
        onAddTransaction={() => {}} // Non utilisé en mode Transfer pur (géré par onUpsertTransfer dans le form)
        onUpsertTransfer={onUpsertTransfer}
        onDeleteTransaction={() => {
            if(editingTransfer) onDeleteTransfer(editingTransfer.id);
        }}
        defaultDate={defaultDate} 
        savedLabels={savedLabels} 
        labelsSuggestions={settings.variable_labels} 
        editingTransaction={editingVar} // Mock passé pour pré-remplir
        initialMode="TRANSFER"
        lockMode={true} 
      />
    </div>
  );
};
