import React, { useState, useMemo } from 'react';
import { ExpenseConfig, IncomeConfig, WeeklyBudget, Account, PlannedItem, Person, PaidItemDetails } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Check, AlertTriangle, ArrowRightLeft, Calendar, ChevronLeft, ChevronRight, User, Users, Clock, Search, X, CreditCard, RotateCcw, Wallet, Tag, TrendingUp, TrendingDown, Calculator, PieChart, Banknote } from 'lucide-react';

interface BudgetPlannerProps {
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  accounts: Account[];
  people: Person[]; 
  paidItems: Record<string, PaidItemDetails>; 
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ configs, incomeConfigs, accounts, people, paidItems, onTogglePaid }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [activeWeek, setActiveWeek] = useState<number>(() => {
    const today = new Date();
    const day = today.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  });

  const [searchQuery, setSearchQuery] = useState('');

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

  const getExtraInfo = (item: PlannedItem) => {
    if (!item.isExtra || !item.startMonth || !item.endMonth) return null;
    const start = new Date(item.startMonth + '-01');
    const end = new Date(item.endMonth + '-01');
    const current = new Date(currentMonthKey + '-01');
    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const currentMonthIndex = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth()) + 1;
    return {
      progress: `${currentMonthIndex}/${totalMonths}`,
      endDate: item.endMonth
    };
  };

  const generatedWeeks = useMemo(() => {
    const weeks: WeeklyBudget[] = [
      { weekNumber: 1, label: "Semaine 1 (1 au 7)", items: [] },
      { weekNumber: 2, label: "Semaine 2 (8 au 14)", items: [] },
      { weekNumber: 3, label: "Semaine 3 (15 au 21)", items: [] },
      { weekNumber: 4, label: "Semaine 4 (22 à fin)", items: [] },
    ];

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
      
      weeks[targetWeekIndex].items.push({
        type: 'EXPENSE',
        configId: conf.id,
        instanceId: instanceId,
        day: conf.dayOfMonth,
        label: paidInfo ? paidInfo.label : conf.label,
        amount: paidInfo ? paidInfo.amount : conf.amount,
        originalAmount: conf.amount,
        category: conf.category,
        subCategory: conf.subCategory,
        beneficiaryId: conf.beneficiaryId,
        accountId: conf.accountId, 
        isExtra: conf.isExtra,
        startMonth: conf.startMonth,
        endMonth: conf.endMonth,
        isPaid: !!paidInfo,
        paidDetails: paidInfo
      });
    });

    incomeConfigs.forEach(inc => {
      let targetWeekIndex = 0;
      if (inc.dayOfMonth <= 7) targetWeekIndex = 0;
      else if (inc.dayOfMonth <= 14) targetWeekIndex = 1;
      else if (inc.dayOfMonth <= 21) targetWeekIndex = 2;
      else targetWeekIndex = 3;

      const instanceId = `${inc.id}-${currentMonthKey}`;
      const paidInfo = paidItems[instanceId];

      weeks[targetWeekIndex].items.push({
        type: 'INCOME',
        configId: inc.id,
        instanceId: instanceId,
        day: inc.dayOfMonth,
        label: paidInfo ? paidInfo.label : inc.label,
        amount: paidInfo ? paidInfo.amount : inc.amount,
        originalAmount: inc.amount,
        category: inc.category,
        subCategory: inc.subCategory,
        beneficiaryId: inc.beneficiaryId,
        accountId: inc.accountId,
        isExtra: false,
        isPaid: !!paidInfo,
        paidDetails: paidInfo
      });
    });

    weeks.forEach(w => w.items.sort((a, b) => a.day - b.day));
    return weeks;
  }, [configs, incomeConfigs, currentMonthKey, paidItems]);

  const filteredWeeks = useMemo(() => {
    if (!searchQuery.trim()) return generatedWeeks;
    const lowerQuery = searchQuery.toLowerCase();
    return generatedWeeks.map(week => ({
      ...week,
      items: week.items.filter(item => 
        item.label.toLowerCase().includes(lowerQuery) || 
        item.category.toLowerCase().includes(lowerQuery)
      )
    }));
  }, [generatedWeeks, searchQuery]);

  const currentWeekDisplayData = filteredWeeks.find(w => w.weekNumber === activeWeek);

  const weeklyStats = useMemo(() => {
    const currentItems = currentWeekDisplayData?.items || [];
    const previousUnpaidItems = filteredWeeks
        .filter(w => w.weekNumber < activeWeek)
        .flatMap(w => w.items)
        .filter(item => !item.isPaid);

    const previousRemaining = previousUnpaidItems.reduce((acc, item) => {
        return item.type === 'EXPENSE' ? acc + item.amount : acc - item.amount;
    }, 0);
    
    const totalOriginal = currentItems.reduce((acc, item) => {
        return item.type === 'EXPENSE' ? acc + item.originalAmount : acc - item.originalAmount;
    }, 0);

    const currentRemaining = currentItems.reduce((acc, item) => {
        if(item.isPaid) return acc;
        return item.type === 'EXPENSE' ? acc + item.amount : acc - item.amount;
    }, 0);

    const currentPaidExpenses = currentItems.reduce((acc, item) => {
        if (item.isPaid && item.type === 'EXPENSE') return acc + item.amount;
        return acc;
    }, 0);

    const totalRemaining = currentRemaining + previousRemaining;

    const byAccount: Record<string, { total: number, remaining: number }> = {};
    const expenseByBeneficiary: Record<string, { total: number }> = {};
    const incomeByBeneficiary: Record<string, { total: number }> = {};

    const processItem = (item: PlannedItem, isCurrentWeek: boolean) => {
        if (!byAccount[item.accountId]) byAccount[item.accountId] = { total: 0, remaining: 0 };
        const impact = item.type === 'EXPENSE' ? item.amount : -item.amount;
        
        if (isCurrentWeek) {
            byAccount[item.accountId].total += impact;
            if (item.type === 'EXPENSE') {
                if (!expenseByBeneficiary[item.beneficiaryId]) expenseByBeneficiary[item.beneficiaryId] = { total: 0 };
                expenseByBeneficiary[item.beneficiaryId].total += item.amount;
            } else {
                if (!incomeByBeneficiary[item.beneficiaryId]) incomeByBeneficiary[item.beneficiaryId] = { total: 0 };
                incomeByBeneficiary[item.beneficiaryId].total += item.amount;
            }
        }
        if(!item.isPaid) byAccount[item.accountId].remaining += impact;
    };

    currentItems.forEach(item => processItem(item, true));
    previousUnpaidItems.forEach(item => processItem(item, false));

    return { 
        totalOriginal, 
        remainingToPay: totalRemaining, 
        currentRemaining, 
        previousRemaining,
        currentPaidExpenses,
        byAccount,
        expenseByBeneficiary,
        incomeByBeneficiary
    };
  }, [currentWeekDisplayData, activeWeek, filteredWeeks]);

  const handleItemClick = (item: PlannedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isPaid) {
        setUncheckModal({ isOpen: true, item: item });
    } else {
        let targetAccountId = item.accountId;
        if (!accounts.some(a => a.id === targetAccountId) && accounts.length > 0) {
            targetAccountId = accounts[0].id;
        }
        setConfirmModal({
            isOpen: true,
            item: item,
            amount: item.amount || 0,
            paymentDate: new Date().toISOString().split('T')[0],
            accountId: targetAccountId,
            label: item.label
        });
    }
  };

  const handleConfirmPayment = () => {
    if (confirmModal.item && confirmModal.accountId) {
        onTogglePaid({
            instanceId: confirmModal.item.instanceId,
            amount: confirmModal.amount,
            paymentDate: confirmModal.paymentDate,
            accountId: confirmModal.accountId,
            beneficiaryId: confirmModal.item.beneficiaryId,
            label: confirmModal.label,
            category: confirmModal.item.category,
            subCategory: confirmModal.item.subCategory
        }, confirmModal.item.instanceId);
        setConfirmModal({ ...confirmModal, isOpen: false, item: null });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* --- UNCHECK MODAL --- */}
      {uncheckModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => setUncheckModal({ ...uncheckModal, isOpen: false })}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <RotateCcw size={18} className="text-amber-500" />
                        Annuler le pointage ?
                    </h3>
                    <button onClick={() => setUncheckModal({ ...uncheckModal, isOpen: false })} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-6">Souhaitez-vous remettre "{uncheckModal.item?.label}" en attente ?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setUncheckModal({ ...uncheckModal, isOpen: false })} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50">Garder pointé</button>
                        <button onClick={() => { onTogglePaid(null, uncheckModal.item!.instanceId); setUncheckModal({ ...uncheckModal, isOpen: false }); }} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Oui, annuler</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- PAYMENT / RECEPTION MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
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
                            onChange={(e) => setConfirmModal({...confirmModal, label: e.target.value})}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Montant (€)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={confirmModal.amount}
                                onChange={(e) => setConfirmModal({...confirmModal, amount: parseFloat(e.target.value)})}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 font-bold"
                            />
                        </div>
                        <div>
                             <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Date</label>
                             <input 
                                type="date"
                                value={confirmModal.paymentDate}
                                onChange={(e) => setConfirmModal({...confirmModal, paymentDate: e.target.value})}
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Compte impacté</label>
                        <select 
                            value={confirmModal.accountId} 
                            onChange={(e) => setConfirmModal({...confirmModal, accountId: e.target.value})}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <CreditCard size={12} /> Ce compte sera mis à jour.
                        </p>
                    </div>

                    <div className="pt-2">
                        <button 
                            onClick={handleConfirmPayment}
                            className={`w-full py-3 rounded-lg text-white font-medium shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${
                                confirmModal.item?.type === 'INCOME' ? 'bg-emerald-600' : 'bg-slate-900'
                            }`}
                        >
                           <Check size={20} />
                           {confirmModal.item?.type === 'INCOME' ? 'Valider le revenu' : 'Valider le paiement'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* FILTRES & HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft size={20}/></button>
            <div className="flex items-center gap-2 w-40 justify-center font-bold text-slate-800 capitalize"><Calendar size={18} className="text-indigo-600"/>{monthLabel}</div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight size={20}/></button>
          </div>
          <div className="relative flex-1 md:max-w-xs">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
      </div>

      {/* TABS SEMAINES */}
      <div className="grid grid-cols-4 gap-2 bg-slate-200/60 p-1 rounded-xl">
          {generatedWeeks.map((week) => (
             <button key={week.weekNumber} onClick={() => setActiveWeek(week.weekNumber)} className={`py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeWeek === week.weekNumber ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {week.label}
             </button>
          ))}
      </div>

      {/* STATS PRINCIPALES (3 COLONNES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* 1. RESTE A PAYER (BACKLOG + CURRENT) */}
           <Card className={`border-l-4 ${weeklyStats.remainingToPay > 0 ? 'border-l-amber-500' : 'border-l-emerald-500'}`}>
               <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                        {weeklyStats.remainingToPay > 0 ? <Clock size={14}/> : <Check size={14}/>}
                        Reste à payer
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{weeklyStats.remainingToPay.toFixed(2)} €</h3>
                  </div>
                  <div className="mt-3 space-y-1">
                     <div className="flex justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                        <span>Semaine en cours</span>
                        <span className="font-medium text-slate-700">{weeklyStats.currentRemaining.toFixed(2)} €</span>
                     </div>
                     {weeklyStats.previousRemaining > 0 && (
                        <div className="flex justify-between text-xs text-amber-600">
                           <span className="flex items-center gap-1"><AlertTriangle size={10} /> Retard</span>
                           <span className="font-medium">{weeklyStats.previousRemaining.toFixed(2)} €</span>
                        </div>
                     )}
                     {weeklyStats.remainingToPay === 0 && <p className="text-xs text-emerald-600 font-medium mt-2">Tout est à jour !</p>}
                  </div>
               </CardContent>
           </Card>

           {/* 2. BUDGET SEMAINE */}
           <Card>
               <CardContent className="p-5">
                   <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                       <Wallet size={14}/> Budget Semaine
                   </p>
                   <div className="mt-2 flex items-end gap-2">
                       <h3 className="text-2xl font-bold text-slate-900">{weeklyStats.totalOriginal.toFixed(2)} €</h3>
                       <span className="text-xs text-slate-400 mb-1">prévu (Net)</span>
                   </div>
                   <div className="mt-4 pt-3 border-t border-slate-100">
                       <div className="flex justify-between items-center text-xs mb-1.5">
                           <span className="text-slate-500">Dépenses réglées</span>
                           <span className="font-bold text-indigo-600">{weeklyStats.currentPaidExpenses.toFixed(2)} €</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                           <div 
                                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(((weeklyStats.totalOriginal - weeklyStats.currentRemaining) / Math.max(weeklyStats.totalOriginal, 1)) * 100, 100)}%`}}
                           ></div>
                       </div>
                   </div>
               </CardContent>
           </Card>

           {/* 3. FLUX PRÉVISIONNEL */}
           <Card className={`border-r-4 ${weeklyStats.remainingToPay > 0 ? 'border-r-amber-500' : 'border-r-emerald-500'}`}>
                <CardContent className="p-5">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide flex items-center gap-1">
                        <ArrowRightLeft size={14}/> Flux prévisionnel
                    </p>
                    <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(weeklyStats.byAccount).map(([accountId, stats]: [string, any]) => {
                            const acc = accounts.find(a => a.id === accountId);
                            if (!acc || Math.abs(stats.remaining) < 0.01) return null;
                            return (
                                <div key={accountId} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 truncate w-24" title={acc.name}>{acc.name}</span>
                                    <span className={`font-mono font-bold ${stats.remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {stats.remaining > 0 ? '- ' : '+ '}{Math.abs(stats.remaining).toFixed(2)} €
                                    </span>
                                </div>
                            );
                        })}
                        {Object.values(weeklyStats.byAccount).every((s: any) => Math.abs(s.remaining) < 0.01) && <p className="text-sm text-emerald-600 italic">Aucun mouvement prévu.</p>}
                    </div>
                </CardContent>
           </Card>
      </div>

      {/* ANALYSE DÉTAILLÉE (4 COLONNES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DÉPENSES / BÉNÉF. */}
          <Card className="p-4 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1"><Users size={12}/> Dépenses / Bénéf.</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(weeklyStats.expenseByBeneficiary).sort((a: any, b: any) => b[1].total - a[1].total).map(([id, stats]: [string, any]) => (
                         <div key={id} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                             <span className="text-slate-600 truncate max-w-[80px]">{people.find(p => p.id === id)?.name || 'Inconnu'}</span>
                             <span className="font-bold text-slate-900">{stats.total.toFixed(2)} €</span>
                         </div>
                    ))}
                </div>
          </Card>

          {/* REVENUS / BÉNÉF. */}
          <Card className="p-4 shadow-sm bg-emerald-50/20 border-emerald-100">
                <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1"><Banknote size={12}/> Revenus / Bénéf.</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(weeklyStats.incomeByBeneficiary).sort((a: any, b: any) => b[1].total - a[1].total).map(([id, stats]: [string, any]) => (
                         <div key={id} className="flex justify-between items-center text-xs border-b border-emerald-50 pb-2 last:border-0 last:pb-0">
                             <span className="text-emerald-800 truncate max-w-[80px]">{people.find(p => p.id === id)?.name || 'Inconnu'}</span>
                             <span className="font-bold text-emerald-600">+{stats.total.toFixed(2)} €</span>
                         </div>
                    ))}
                </div>
          </Card>

          {/* PAR COMPTE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative lg:col-span-2 overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Wallet size={64} />
                </div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Par Compte</h3>
                <div className="space-y-3">
                    {Object.keys(weeklyStats.byAccount).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Aucune donnée.</p>
                    )}
                    {Object.entries(weeklyStats.byAccount).map(([account_id, stats]: [string, any]) => {
                         const account = accounts.find(a => a.id === account_id);
                         const displayName = account ? account.name : 'Compte Inconnu';
                         return (
                             <div key={account_id} className="flex justify-between items-center text-sm">
                                 <span className="font-medium text-slate-700 truncate pr-2" title={displayName}>{displayName}</span>
                                 <div className="text-right whitespace-nowrap">
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
      </div>

      {/* LISTE DES OPERATIONS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Opérations {currentWeekDisplayData?.label}</h3>
              <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                  {currentWeekDisplayData?.items.length || 0} éléments
              </span>
          </div>

          <div className="divide-y divide-slate-100">
              {!currentWeekDisplayData || currentWeekDisplayData.items.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                      <Calendar size={48} className="mb-4 text-slate-200" />
                      <p>Aucune opération prévue pour cette semaine.</p>
                  </div>
              ) : (
                  currentWeekDisplayData.items.map((item) => {
                      const person = people.find(p => p.id === item.beneficiaryId);
                      const account = accounts.find(a => a.id === item.accountId);
                      const extraInfo = getExtraInfo(item);
                      const isIncome = item.type === 'INCOME';

                      return (
                        <div 
                            key={item.instanceId} 
                            onClick={(e) => handleItemClick(item, e)}
                            className={`p-4 flex items-center gap-4 transition-colors cursor-pointer group ${item.isPaid ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
                        >
                            <div className={`
                                flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                ${item.isPaid 
                                    ? (isIncome ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-900 border-slate-900 text-white') 
                                    : 'border-slate-300 bg-white group-hover:border-indigo-400'
                                }
                            `}>
                                {item.isPaid && <Check size={14} strokeWidth={3} />}
                            </div>

                            <div className="flex-shrink-0 w-12 text-center">
                                <span className={`text-sm font-bold block ${item.isPaid ? 'text-slate-400' : 'text-slate-900'}`}>{item.day}</span>
                                <span className="text-[10px] text-slate-400 uppercase">{monthLabel.slice(0,3)}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`font-medium truncate ${item.isPaid ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                        {item.label}
                                    </span>
                                    {item.isExtra && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded flex items-center gap-1" title={extraInfo?.endDate ? `Fin : ${extraInfo.endDate}` : ''}>
                                            Temp. {extraInfo?.progress && `(${extraInfo.progress})`}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Tag size={12}/> {item.category}{item.subCategory && <span className="opacity-75"> &gt; {item.subCategory}</span>}</span>
                                    {person && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100">{person.isChild ? <User size={10} /> : <Users size={10} />}{person.name}</span>}
                                    {account && <span className="flex items-center gap-1 text-slate-400"><CreditCard size={10} /> {account.name}</span>}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`font-mono font-bold ${item.isPaid ? 'text-slate-400' : (isIncome ? 'text-emerald-600' : 'text-slate-900')}`}>
                                    {isIncome ? '+' : '-'} {item.amount.toFixed(2)} €
                                </div>
                                {Math.abs(item.amount - item.originalAmount) > 0.01 && (
                                    <div className="text-[10px] text-amber-600 flex items-center justify-end gap-1"><ArrowRightLeft size={10} />Prévu: {item.originalAmount.toFixed(2)}</div>
                                )}
                            </div>
                        </div>
                      );
                  })
              )}
          </div>
      </div>
    </div>
  );
};