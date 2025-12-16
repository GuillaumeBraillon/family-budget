import React, { useState, useMemo, useEffect } from 'react';
import { ExpenseConfig, IncomeConfig, WeeklyBudget, Account, AccountType, PlannedItem, Person, PaidItemDetails } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Check, AlertTriangle, ArrowRightLeft, Calendar, ChevronLeft, ChevronRight, User, Users, Clock, Search, X, CreditCard, RotateCcw, TrendingUp, Calculator, Wallet, PieChart, Banknote } from 'lucide-react';

interface BudgetPlannerProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  accounts: Account[];
  people: Person[]; 
  // Paid items contains full details now
  paidItems: Record<string, PaidItemDetails>; 
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ configs, incomeConfigs, accounts, people, paidItems, onTogglePaid }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');

  // --- PAYMENT MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
    amount: number;
    paymentDate: string;
    accountId: string;
    label: string;
  }>({ 
    isOpen: false, item: null, amount: 0, 
    paymentDate: new Date().toISOString().split('T')[0], 
    accountId: '',
    label: ''
  });

  // --- UNCHECK (CANCEL) MODAL STATE ---
  const [uncheckModal, setUncheckModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
  }>({ isOpen: false, item: null });

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setActiveWeek(1); 
  };

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // 1. Génération des données brutes pour le mois (DÉPENSES + REVENUS)
  const generatedWeeks = useMemo(() => {
    const weeks: WeeklyBudget[] = [
      { weekNumber: 1, label: "Semaine 1 (1 au 7)", items: [] },
      { weekNumber: 2, label: "Semaine 2 (8 au 14)", items: [] },
      { weekNumber: 3, label: "Semaine 3 (15 au 21)", items: [] },
      { weekNumber: 4, label: "Semaine 4 (22 à fin)", items: [] },
    ];

    // -- A. TRAITEMENT DES DÉPENSES --
    const activeConfigs = configs.filter(conf => {
      if (!conf.startMonth) return true; 
      if (currentMonthKey < conf.startMonth) return false; 
      if (conf.endMonth && currentMonthKey > conf.endMonth) return false;
      return true;
    });

    activeConfigs.forEach(conf => {
      let targetWeekIndex = 0;
      if (conf.dayOfMonth <= 7) targetWeekIndex = 0;
      else if (conf.dayOfMonth <= 14) targetWeekIndex = 1;
      else if (conf.dayOfMonth <= 21) targetWeekIndex = 2;
      else targetWeekIndex = 3;

      const instanceId = `${conf.id}-${currentMonthKey}`;
      const paidInfo = paidItems[instanceId];
      
      const effectiveAmount = paidInfo ? paidInfo.amount : conf.amount;
      const effectiveLabel = paidInfo ? paidInfo.label : conf.label;
      
      weeks[targetWeekIndex].items.push({
        type: 'EXPENSE',
        configId: conf.id,
        instanceId: instanceId,
        day: conf.dayOfMonth,
        label: effectiveLabel,
        amount: effectiveAmount,
        category: conf.category,
        subCategory: conf.subCategory,
        beneficiaryId: conf.beneficiaryId,
        ownerId: conf.ownerId, 
        isExtra: conf.isExtra,
        startMonth: conf.startMonth,
        endMonth: conf.endMonth,
        isPaid: !!paidInfo,
        paidDetails: paidInfo
      });
    });

    // -- B. TRAITEMENT DES REVENUS --
    incomeConfigs.forEach(inc => {
      let targetWeekIndex = 0;
      if (inc.dayOfMonth <= 7) targetWeekIndex = 0;
      else if (inc.dayOfMonth <= 14) targetWeekIndex = 1;
      else if (inc.dayOfMonth <= 21) targetWeekIndex = 2;
      else targetWeekIndex = 3;

      const instanceId = `${inc.id}-${currentMonthKey}`;
      const paidInfo = paidItems[instanceId];

      const effectiveAmount = paidInfo ? paidInfo.amount : inc.amount;
      const effectiveLabel = paidInfo ? paidInfo.label : inc.label;

      weeks[targetWeekIndex].items.push({
        type: 'INCOME',
        configId: inc.id,
        instanceId: instanceId,
        day: inc.dayOfMonth,
        label: effectiveLabel,
        amount: effectiveAmount,
        category: inc.category,
        subCategory: '',
        beneficiaryId: inc.beneficiaryId, // La personne qui gagne l'argent (le bénéficiaire du revenu)
        ownerId: inc.ownerId, // Le compte de réception
        isExtra: false,
        isPaid: !!paidInfo,
        paidDetails: paidInfo
      });
    });

    weeks.forEach(w => w.items.sort((a, b) => a.day - b.day));
    return weeks;
  }, [configs, incomeConfigs, currentMonthKey, paidItems]);

  // 2. Filtrage basé sur la recherche
  const filteredWeeks = useMemo(() => {
    if (!searchQuery.trim()) return generatedWeeks;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    return generatedWeeks.map(week => ({
      ...week,
      items: week.items.filter(item => 
        item.label.toLowerCase().includes(lowerQuery) || 
        (item.amount || 0).toString().includes(lowerQuery)
      )
    }));
  }, [generatedWeeks, searchQuery]);

  const currentWeekDisplayData = filteredWeeks.find(w => w.weekNumber === activeWeek);

  const getExtraInfo = (item: PlannedItem) => {
    if (!item.isExtra || !item.startMonth || !item.endMonth) return null;
    const [startYear, startMonth] = item.startMonth.split('-').map(Number);
    const [endYear, endMonth] = item.endMonth.split('-').map(Number);
    const [currYear, currMonth] = currentMonthKey.split('-').map(Number);
    const startVal = startYear * 12 + (startMonth - 1);
    const endVal = endYear * 12 + (endMonth - 1);
    const currVal = currYear * 12 + (currMonth - 1);
    const totalSteps = endVal - startVal + 1;
    const currentStep = currVal - startVal + 1;
    const endDate = new Date(endYear, endMonth - 1);
    const endDateStr = endDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    return { progress: `${currentStep}/${totalSteps}`, endDate: endDateStr };
  };

  // --- CALCUL DES STATISTIQUES HEBDOMADAIRES ---
  const weeklyStats = useMemo(() => {
    const items = currentWeekDisplayData?.items || [];
    
    // 1. GLOBAL
    const totalPlanned = items.reduce((acc, item) => {
        return item.type === 'EXPENSE' ? acc + item.amount : acc - item.amount;
    }, 0);

    const remainingToPay = items.reduce((acc, item) => {
        if(item.isPaid) return acc;
        return item.type === 'EXPENSE' ? acc + item.amount : acc - item.amount;
    }, 0);

    // 2. PAR PAYEUR (Owner) - Sert pour les comptes
    const byPayer: Record<string, { total: number, remaining: number }> = {};
    
    // 3. PAR BÉNÉFICIAIRE (DÉPENSES) - Qui dépense ?
    const expenseByBeneficiary: Record<string, { total: number }> = {};
    
    // 4. PAR BÉNÉFICIAIRE (REVENUS) - Qui rapporte ?
    const incomeByBeneficiary: Record<string, { total: number }> = {};

    items.forEach(item => {
        // Init Payers
        if (!byPayer[item.ownerId]) byPayer[item.ownerId] = { total: 0, remaining: 0 };
        
        const amount = item.amount;
        
        // Update Payer Logic (Expense = +, Income = -)
        if (item.type === 'EXPENSE') {
            byPayer[item.ownerId].total += amount;
            if(!item.isPaid) byPayer[item.ownerId].remaining += amount;

            // Stats Bénéficiaire Dépense
            if (!expenseByBeneficiary[item.beneficiaryId]) expenseByBeneficiary[item.beneficiaryId] = { total: 0 };
            expenseByBeneficiary[item.beneficiaryId].total += amount;

        } else {
            // Income reduces the payer's "cost" (trésorerie)
            byPayer[item.ownerId].total -= amount;
            if(!item.isPaid) byPayer[item.ownerId].remaining -= amount;

            // Stats Bénéficiaire Revenu
            if (!incomeByBeneficiary[item.beneficiaryId]) incomeByBeneficiary[item.beneficiaryId] = { total: 0 };
            incomeByBeneficiary[item.beneficiaryId].total += amount;
        }
    });

    return { totalPlanned, remainingToPay, byPayer, expenseByBeneficiary, incomeByBeneficiary };

  }, [currentWeekDisplayData]);


  // --- HANDLERS ---

  const handleItemClick = (item: PlannedItem, e?: React.MouseEvent) => {
    if (e) {
        e.stopPropagation();
    }
    
    if (item.isPaid) {
        setUncheckModal({ isOpen: true, item: item });
    } else {
        let defaultAccountId = '';
        
        // Pour une dépense : Compte Payeur
        // Pour un revenu : Compte Bénéficiaire (où l'argent arrive)
        const targetAccount = accounts.find(a => 
            a.ownerId === item.ownerId && 
            a.type === AccountType.CHECKING
        );
        
        defaultAccountId = targetAccount?.id || '';

        if (!defaultAccountId) {
            // Fallback au compte joint ou premier compte courant trouvé
             defaultAccountId = accounts.find(a => a.name.toLowerCase().includes('joint') && a.type === AccountType.CHECKING)?.id || accounts.find(a => a.type === AccountType.CHECKING)?.id || '';
        }

        setConfirmModal({
            isOpen: true,
            item: item,
            amount: item.amount || 0,
            paymentDate: new Date().toISOString().split('T')[0],
            accountId: defaultAccountId,
            label: item.label
        });
    }
  };

  const handleConfirmPayment = () => {
    if (confirmModal.item && confirmModal.accountId) {
        const details: PaidItemDetails = {
            instanceId: confirmModal.item.instanceId,
            amount: confirmModal.amount,
            paymentDate: confirmModal.paymentDate,
            accountId: confirmModal.accountId,
            beneficiaryId: confirmModal.item.beneficiaryId,
            label: confirmModal.label,
            category: confirmModal.item.category,
            subCategory: confirmModal.item.subCategory
        };

        onTogglePaid(details, confirmModal.item.instanceId);
        setConfirmModal({ ...confirmModal, isOpen: false, item: null });
    }
  };

  const handleConfirmUncheck = () => {
      if (uncheckModal.item) {
          onTogglePaid(null, uncheckModal.item.instanceId);
          setUncheckModal({ isOpen: false, item: null });
      }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* --- CONFIRM UNCHECK MODAL --- */}
      {uncheckModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <RotateCcw size={18} className="text-amber-500" />
                        {uncheckModal.item?.type === 'INCOME' ? 'Annuler la réception' : 'Annuler le paiement'}
                    </h3>
                    <button onClick={() => setUncheckModal({ ...uncheckModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-slate-600 mb-2">Voulez-vous vraiment annuler ce pointage ?</p>
                    <p className="font-medium text-slate-900 mb-6">"{uncheckModal.item?.label}"</p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setUncheckModal({ ...uncheckModal, isOpen: false })}
                            className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                        >
                            Non
                        </button>
                        <button 
                            onClick={handleConfirmUncheck}
                            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-sm"
                        >
                            Oui
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- PAYMENT / RECEPTION MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-900">
                        {confirmModal.item?.type === 'INCOME' ? 'Confirmer la réception' : 'Confirmer le paiement'}
                    </h3>
                    <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Libellé Editable */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Libellé</label>
                        <input 
                            type="text" 
                            value={confirmModal.label}
                            onChange={(e) => setConfirmModal({ ...confirmModal, label: e.target.value })}
                            className="w-full p-2 border border-slate-300 rounded font-medium text-slate-700"
                        />
                    </div>

                    {/* Montant */}
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Montant Réel (€)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                step="0.01" 
                                autoFocus
                                value={confirmModal.amount}
                                onChange={(e) => setConfirmModal({ ...confirmModal, amount: parseFloat(e.target.value) })}
                                className={`w-full text-2xl font-bold border-b-2 outline-none py-2 px-1 bg-transparent ${
                                    confirmModal.item?.type === 'INCOME' ? 'text-emerald-600 border-emerald-200 focus:border-emerald-600' : 'text-slate-900 border-indigo-200 focus:border-indigo-600'
                                }`}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-medium">EUR</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Date</label>
                            <input 
                                type="date"
                                value={confirmModal.paymentDate}
                                onChange={(e) => setConfirmModal({ ...confirmModal, paymentDate: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded text-slate-700"
                            />
                        </div>
                        
                        {/* Compte */}
                        <div>
                             <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">
                                {confirmModal.item?.type === 'INCOME' ? 'Compte Crédité' : 'Compte Débité'}
                             </label>
                             <select 
                                value={confirmModal.accountId} 
                                onChange={(e) => setConfirmModal({ ...confirmModal, accountId: e.target.value })}
                                className="w-full p-2 border border-slate-300 rounded text-slate-700 text-sm"
                             >
                                {accounts.map(acc => {
                                    const owner = people.find(p => p.id === acc.ownerId)?.name || '?';
                                    const isDefault = acc.id === confirmModal.accountId; 
                                    return (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({owner}) {isDefault ? '✨' : ''}
                                        </option>
                                    );
                                })}
                             </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                        >
                            Annuler
                        </button>
                        <button 
                            onClick={handleConfirmPayment}
                            className={`flex-1 py-2.5 rounded-lg text-white font-medium shadow-sm ${
                                confirmModal.item?.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                        >
                            Valider
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}


      {/* Header Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" />
                Budget Mensuel
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Month Navigation */}
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="px-4 font-semibold text-slate-800 min-w-[140px] text-center capitalize">
                        {monthLabel}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* Week Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
            {filteredWeeks.map((week) => {
                const hasSearch = searchQuery.length > 0;
                const matchCount = week.items.length;
                const unpaidCount = hasSearch ? 0 : week.items.filter(i => !i.isPaid).length;

                return (
                    <button
                        key={week.weekNumber}
                        onClick={() => setActiveWeek(week.weekNumber)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeWeek === week.weekNumber
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <span>{week.label}</span>
                        {!hasSearch && unpaidCount > 0 && (
                            <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {unpaidCount}
                            </span>
                        )}
                        {hasSearch && matchCount > 0 && (
                             <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Search size={8} /> {matchCount}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center bg-slate-50/50">
            <CardTitle>{currentWeekDisplayData?.label}</CardTitle>
            <div className="text-sm text-slate-500 hidden sm:block">
                {/* On n'affiche plus qu'un simple résumé, le détail est en bas */}
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
                {currentWeekDisplayData?.items.map((item) => {
                    const ownerName = people.find(p => p.id === item.ownerId)?.name || 'Inconnu';
                    const beneficiaryName = people.find(p => p.id === item.beneficiaryId)?.name || 'Inconnu';
                    const extraInfo = getExtraInfo(item);
                    
                    const paidAccountName = item.isPaid && item.paidDetails
                        ? accounts.find(a => a.id === item.paidDetails?.accountId)?.name 
                        : null;

                    const isIncome = item.type === 'INCOME';

                    return (
                        <div 
                            key={item.instanceId} 
                            onClick={(e) => handleItemClick(item, e)}
                            className={`p-4 flex items-center justify-between transition-colors cursor-pointer ${
                                item.isPaid 
                                ? 'bg-slate-50/80 opacity-60' 
                                : isIncome ? 'hover:bg-emerald-50' : 'hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => handleItemClick(item, e)}
                                    title={item.isPaid ? "Décocher" : "Pointer"}
                                    className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                                        item.isPaid 
                                        ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-red-500 hover:border-red-500' 
                                        : 'border-slate-300 hover:border-indigo-500 text-transparent'
                                    }`}
                                >
                                    <Check size={14} strokeWidth={3} className={item.isPaid ? "" : "text-indigo-200"} />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-medium text-sm ${item.isPaid ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                            {item.label}
                                        </p>
                                        {isIncome && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">REVENU</span>
                                        )}
                                        {item.isExtra && (
                                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                                {extraInfo ? (
                                                  <>
                                                    <span className="font-bold">{extraInfo.progress}</span>
                                                    <span className="text-amber-400">•</span>
                                                    <span className="flex items-center gap-0.5"><Clock size={10} /> Fin {extraInfo.endDate}</span>
                                                  </>
                                                ) : (
                                                  <span>EXTRA</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                                        <span className="text-xs text-slate-500">Le {item.day}</span>
                                        <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-600">{item.category}</span>
                                        
                                        {item.isPaid ? (
                                            <span className="text-[10px] flex items-center gap-1 text-emerald-600 font-medium">
                                                <CreditCard size={10}/> {isIncome ? 'Reçu sur' : 'Payé par'} : {paidAccountName || '?'}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] flex items-center gap-1 text-slate-500">
                                                {isIncome ? <TrendingUp size={10} /> : <User size={10}/>} 
                                                {isIncome ? 'Sur compte' : 'Payeur'} : {ownerName}
                                            </span>
                                        )}

                                        {!isIncome && (
                                            <span className="text-[10px] flex items-center gap-1 text-indigo-600"><Users size={10}/> Pour {beneficiaryName}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-mono font-medium ${item.isPaid ? 'text-slate-400' : isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    {isIncome ? '+' : ''}{(item.amount || 0).toFixed(2)} €
                                </p>
                            </div>
                        </div>
                    );
                })}
                {currentWeekDisplayData?.items.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        {searchQuery 
                            ? "Aucun résultat pour cette semaine." 
                            : "Aucune opération planifiée pour cette semaine."
                        }
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
      
      {/* --- WEEKLY SUMMARY / BILAN HEBDO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. Global Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Calculator size={64} />
              </div>
              <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Bilan Hebdomadaire</h3>
                  <div className="space-y-4">
                      <div>
                          <p className="text-xs text-slate-400 mb-1">Mouvements Prévus (Total)</p>
                          <p className="text-xl font-bold text-slate-900">
                             {weeklyStats.totalPlanned.toFixed(2)} €
                          </p>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                           <p className="text-xs text-slate-400 mb-1">Reste à Payer / Encaisser</p>
                           <p className={`text-2xl font-bold ${weeklyStats.remainingToPay < 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {weeklyStats.remainingToPay.toFixed(2)} €
                           </p>
                           <p className="text-[10px] text-slate-400 mt-1 italic">
                               {weeklyStats.remainingToPay > 0 ? "Sortie d'argent restante" : "Entrée d'argent restante"}
                           </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* 2. By Payer (Owner) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Wallet size={64} />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Par Payeur / Compte</h3>
                <div className="space-y-3">
                    {Object.keys(weeklyStats.byPayer).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Aucune donnée.</p>
                    )}
                    {Object.entries(weeklyStats.byPayer).map(([ownerId, stats]) => {
                         const personName = people.find(p => p.id === ownerId)?.name || 'Inconnu';
                         return (
                             <div key={ownerId} className="flex justify-between items-center text-sm">
                                 <span className="font-medium text-slate-700">{personName}</span>
                                 <div className="text-right">
                                     <span className="block font-bold text-slate-900">{stats.total.toFixed(2)} €</span>
                                     {stats.remaining !== 0 && (
                                         <span className="text-[10px] text-slate-500">Reste: {stats.remaining.toFixed(2)} €</span>
                                     )}
                                     {stats.remaining === 0 && stats.total !== 0 && (
                                         <span className="text-[10px] text-emerald-600 font-medium flex justify-end items-center gap-1"><Check size={10}/> Soldé</span>
                                     )}
                                 </div>
                             </div>
                         )
                    })}
                </div>
          </div>

          {/* 3. By Beneficiary (Expenses) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <PieChart size={64} />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Dépenses par Bénéf.</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {Object.keys(weeklyStats.expenseByBeneficiary).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Aucune dépense planifiée.</p>
                    )}
                    {Object.entries(weeklyStats.expenseByBeneficiary).sort((a,b) => b[1].total - a[1].total).map(([beneficiaryId, stats]) => {
                         const personName = people.find(p => p.id === beneficiaryId)?.name || 'Inconnu';
                         return (
                             <div key={beneficiaryId} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                 <span className="text-slate-600">{personName}</span>
                                 <div className="text-right">
                                     <span className="block font-semibold text-slate-800">{stats.total.toFixed(2)} €</span>
                                 </div>
                             </div>
                         )
                    })}
                </div>
          </div>

          {/* 4. By Beneficiary (Incomes) */}
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5 relative overflow-hidden bg-emerald-50/30">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600">
                  <Banknote size={64} />
                </div>
                <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-4">Revenus par Bénéf.</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {Object.keys(weeklyStats.incomeByBeneficiary).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Aucun revenu planifié.</p>
                    )}
                    {Object.entries(weeklyStats.incomeByBeneficiary).sort((a,b) => b[1].total - a[1].total).map(([beneficiaryId, stats]) => {
                         const personName = people.find(p => p.id === beneficiaryId)?.name || 'Inconnu';
                         return (
                             <div key={beneficiaryId} className="flex justify-between items-center text-sm border-b border-emerald-100/50 pb-2 last:border-0 last:pb-0">
                                 <span className="text-emerald-800">{personName}</span>
                                 <div className="text-right">
                                     <span className="block font-bold text-emerald-600">+{stats.total.toFixed(2)} €</span>
                                 </div>
                             </div>
                         )
                    })}
                </div>
          </div>

      </div>

    </div>
  );
};