
import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../../hooks/usePlanner';
import { usePlannerUI } from '../../../hooks/usePlannerUI';
import { ExpenseConfig, IncomeConfig, Account, Person, PaidItemDetails, PlannedItem, AppSettings, VariableTransaction, OperationFilters, SavingsTransaction, SavedLabel, AccountType } from '../../../types';
import { ArrowRightLeft, Filter, X } from 'lucide-react';

// Imports UI Atomic
import { MonthNavigator } from '../../ui/molecules/MonthNavigator';
import { WeekSelector } from '../../ui/molecules/WeekSelector';
import { SearchBar } from '../../ui/atoms/SearchBar';
import { InfoBox } from '../../ui/InfoBox';

// Imports Feature Components
import { TransfersList, TransferPair } from './components/TransfersList';
import { VariableTransactionForm } from '../Operations/components/VariableTransactionForm';
import { TransfersKPIs } from './components/TransfersKPIs';

interface TransfersViewProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[]; 
  variableTransactions: VariableTransaction[];
  accounts: Account[];
  people: Person[]; 
  paidItems: Record<string, PaidItemDetails>; 
  settings: AppSettings;
  categories: any[];
  savedLabels?: SavedLabel[]; 
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
  onUpsertVariable: (t: VariableTransaction) => void;
  onDeleteVariable: (id: string) => void;
  onUpsertSavings?: (t: SavingsTransaction) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ 
  configs, incomeConfigs, variableTransactions, accounts, people, paidItems, settings, categories, savedLabels,
  onUpsertVariable, onDeleteVariable, onUpsertSavings
}) => {
  const ui = usePlannerUI();
  const [isVarFormOpen, setIsVarFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariableTransaction | null>(null);
  const [selectedMotif, setSelectedMotif] = useState<string | null>(null);
  
  // Filtres de base pour usePlanner : on ne filtre que sur "Virement Interne"
  // On ignore flux/source/status/etc car non pertinents ici selon demande utilisateur
  const filters: OperationFilters = {
    flux: 'ALL', 
    source: 'ALL', 
    status: 'ALL', 
    extra: 'ALL', 
    transfer: 'ONLY', 
    salary: 'ALL', 
    accountIds: [], 
    beneficiaryIds: []
  };
  
  const { filteredWeeks } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, ui.currentDate, ui.searchQuery, settings, filters);
  const currentWeekIndex = filteredWeeks.some(w => w.weekNumber === ui.activeWeek) ? ui.activeWeek : 1;
  const currentWeekData = filteredWeeks.find(w => w.weekNumber === currentWeekIndex);
  const currentItems = currentWeekData?.items || [];

  // --- CONSTRUCTION DES PAIRES & EXTRACTION DES MOTIFS ---
  const { pairs, motifs } = useMemo(() => {
    const pairsMap = new Map<string, TransferPair>();
    const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(ui.currentDate);
    const foundMotifs = new Set<string>();

    // 1. Regroupement
    currentItems.forEach(item => {
        const match = item.instanceId.match(/var_tr_(in|out)_(\d+)/);
        let key = item.instanceId;
        let type: 'in' | 'out' = item.type === 'INCOME' ? 'in' : 'out';

        if (match) {
            key = match[2];
            type = match[1] as 'in' | 'out';
        }

        const current = pairsMap.get(key) || {
            id: key,
            date: item.day,
            monthShort,
            amount: item.amount,
            label: item.label,
            from: undefined,
            to: undefined
        };

        if (type === 'out') current.from = item;
        else current.to = item;

        // Extraction du motif propre
        // Format attendu : "Virement interne : Source => Dest (Motif)"
        const labelMatch = item.label.match(/\((.*?)\)$/);
        const motif = labelMatch ? labelMatch[1] : item.label.replace('Virement interne : ', '');
        
        // On met à jour le label affichable dans l'objet pair directement pour simplifier
        // Note: On stocke le motif brut dans une propriété temporaire pour le filtrage
        (current as any).rawMotif = motif;
        foundMotifs.add(motif);

        // Mise à jour si orphelin trouvé
        if (!current.label && item.label) current.label = item.label;

        pairsMap.set(key, current);
    });

    // 2. Conversion en tableau
    let allPairs = Array.from(pairsMap.values());

    // 3. Filtrage par Motif (si sélectionné)
    if (selectedMotif) {
        allPairs = allPairs.filter(p => (p as any).rawMotif === selectedMotif);
    }

    // 4. Tri Chronologique
    allPairs.sort((a, b) => {
        if (a.date !== b.date) return a.date - b.date;
        return b.id.localeCompare(a.id);
    });

    return { 
        pairs: allPairs, 
        motifs: Array.from(foundMotifs).sort() 
    };
  }, [currentItems, ui.currentDate, selectedMotif]);

  // --- CALCUL DES INDICATEURS ANALYTIQUES ---
  const stats = useMemo(() => {
    let toSavings = 0;
    let fromSavings = 0;
    let internalChecking = 0;

    pairs.forEach(pair => {
        const fromAcc = accounts.find(a => a.id === pair.from?.accountId);
        const toAcc = accounts.find(a => a.id === pair.to?.accountId);

        const isFromSavings = fromAcc?.type === AccountType.SAVINGS;
        const isToSavings = toAcc?.type === AccountType.SAVINGS;

        if (isToSavings && !isFromSavings) {
            toSavings += pair.amount;
        } else if (isFromSavings && !isToSavings) {
            fromSavings += pair.amount;
        } else if (!isFromSavings && !isToSavings) {
            internalChecking += pair.amount;
        }
    });

    return { toSavings, fromSavings, internalChecking };
  }, [pairs, accounts]);

  const handleItemClick = (item: PlannedItem) => {
    const tx = variableTransactions.find(t => t.id === item.instanceId);
    if (tx) { setEditingVar(tx); setIsVarFormOpen(true); }
  };

  const defaultVarDate = (() => {
      const today = new Date();
      if (today.getMonth() === ui.currentDate.getMonth() && today.getFullYear() === ui.currentDate.getFullYear()) return today.toISOString().split('T')[0];
      if (currentWeekData) return new Date(ui.currentDate.getFullYear(), ui.currentDate.getMonth(), currentWeekData.startDate, 12).toISOString().split('T')[0];
      return new Date().toISOString().split('T')[0];
  })();

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
          
          <WeekSelector 
            weeks={filteredWeeks} 
            activeWeek={currentWeekIndex} 
            onSelect={ui.setActiveWeek} 
            searchQuery={ui.searchQuery}
          />

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

          <TransfersList 
            pairs={pairs}
            accounts={accounts}
            onItemClick={handleItemClick}
            onAddClick={() => { setEditingVar(null); setIsVarFormOpen(true); }}
          />
      </div>

      <VariableTransactionForm 
        isOpen={isVarFormOpen} 
        onClose={() => setIsVarFormOpen(false)} 
        accounts={accounts} 
        categories={categories} 
        people={people} 
        onAddTransaction={onUpsertVariable} 
        onDeleteTransaction={onDeleteVariable} 
        defaultDate={defaultVarDate} 
        savedLabels={savedLabels} 
        labelsSuggestions={settings.variable_labels} 
        editingTransaction={editingVar} 
        onUpsertSavings={onUpsertSavings} 
        initialMode="TRANSFER"
        lockMode={true} // Force le mode virement
      />
    </div>
  );
};
