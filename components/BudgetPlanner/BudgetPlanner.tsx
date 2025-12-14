import React, { useState, useMemo } from 'react';
import { ExpenseConfig, WeeklyBudget, Account, AccountType, PlannedItem, Person } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Check, AlertTriangle, ArrowRightLeft, Calendar, ChevronLeft, ChevronRight, User, Users, Clock, Search, X } from 'lucide-react';

interface BudgetPlannerProps {
  configs: ExpenseConfig[];
  accounts: Account[];
  people: Person[]; // Ajout de people
  paidItems: Record<string, boolean>; 
  onTogglePaid: (itemId: string, isPaid: boolean) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ configs, accounts, people, paidItems, onTogglePaid }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setActiveWeek(1); 
  };

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // 1. Génération des données brutes pour le mois
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
      
      weeks[targetWeekIndex].items.push({
        configId: conf.id,
        instanceId: instanceId,
        day: conf.dayOfMonth,
        label: conf.label,
        amount: conf.amount,
        category: conf.category,
        subCategory: conf.subCategory,
        beneficiaryId: conf.beneficiaryId,
        ownerId: conf.ownerId, 
        isExtra: conf.isExtra,
        startMonth: conf.startMonth,
        endMonth: conf.endMonth,
        isPaid: !!paidItems[instanceId]
      });
    });

    weeks.forEach(w => w.items.sort((a, b) => a.day - b.day));
    return weeks;
  }, [configs, currentMonthKey, paidItems]);

  // 2. Filtrage basé sur la recherche
  const filteredWeeks = useMemo(() => {
    if (!searchQuery.trim()) return generatedWeeks;
    
    const lowerQuery = searchQuery.toLowerCase();
    
    return generatedWeeks.map(week => ({
      ...week,
      items: week.items.filter(item => 
        item.label.toLowerCase().includes(lowerQuery) || 
        item.amount.toString().includes(lowerQuery)
      )
    }));
  }, [generatedWeeks, searchQuery]);

  const currentWeekData = filteredWeeks.find(w => w.weekNumber === activeWeek);
  
  // Find Joint Account properly (looking for name containing Joint or owner is Joint Person)
  const jointPerson = people.find(p => p.name === 'Commun' || p.name === 'Joint');
  const jointAccount = accounts.find(a => a.ownerId === jointPerson?.id && a.type === AccountType.CHECKING);
  const lddsAccount = accounts.find(a => a.ownerId === jointPerson?.id && a.type === AccountType.SAVINGS && a.name.includes('LDDS'));

  // Note: On calcule le "Reste à payer" sur les items filtrés ou globaux ? 
  // UX Choice: Si on filtre, on veut voir le total de ce qu'on cherche, sinon global.
  // Ici on garde la logique sur la semaine affichée (filtrée).
  const jointExpensesUnpaid = currentWeekData?.items
    .filter(i => !i.isPaid && i.ownerId === jointPerson?.id)
    .reduce((sum, item) => sum + item.amount, 0) || 0;

  const jointBalance = jointAccount?.currentBalance || 0;
  const projectedBalance = jointBalance - jointExpensesUnpaid;
  const needTransfer = projectedBalance < 0;

  // Helper pour formater l'info "Extra"
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

    return {
        progress: `${currentStep}/${totalSteps}`,
        endDate: endDateStr
    };
  };

  return (
    <div className="space-y-6">
      
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
                        placeholder="Rechercher (libellé, montant)..." 
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
                // Count items logic changes based on search
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
                        
                        {/* Badge Unpaid (Standard) */}
                        {!hasSearch && unpaidCount > 0 && (
                            <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {unpaidCount}
                            </span>
                        )}

                        {/* Badge Search Match */}
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
            <CardTitle>{currentWeekData?.label}</CardTitle>
            <div className="text-sm text-slate-500">
                Reste à payer (Joint) : <span className="font-bold text-slate-900">{jointExpensesUnpaid.toFixed(2)} €</span>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
                {currentWeekData?.items.map((item) => {
                    const ownerName = people.find(p => p.id === item.ownerId)?.name || 'Inconnu';
                    const beneficiaryName = people.find(p => p.id === item.beneficiaryId)?.name || 'Inconnu';
                    const extraInfo = getExtraInfo(item);
                    
                    return (
                        <div key={item.instanceId} 
                            className={`p-4 flex items-center justify-between transition-colors ${item.isPaid ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => onTogglePaid(item.instanceId, !item.isPaid)}
                                    className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                                        item.isPaid 
                                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                                        : 'border-slate-300 hover:border-indigo-500 text-transparent'
                                    }`}
                                >
                                    <Check size={14} strokeWidth={3} />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-medium text-sm ${item.isPaid ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                            {item.label}
                                        </p>
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
                                        <span className="text-[10px] flex items-center gap-1 text-slate-500"><User size={10}/> Payé par {ownerName}</span>
                                        <span className="text-[10px] flex items-center gap-1 text-indigo-600"><Users size={10}/> Pour {beneficiaryName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-mono font-medium ${item.isPaid ? 'text-slate-400' : 'text-slate-900'}`}>
                                    {item.amount.toFixed(2)} €
                                </p>
                            </div>
                        </div>
                    );
                })}
                {currentWeekData?.items.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        {searchQuery 
                            ? "Aucun résultat pour cette semaine." 
                            : "Aucune dépense planifiée pour cette semaine."
                        }
                    </div>
                )}
            </div>
        </CardContent>
      </Card>

      <div className={`rounded-xl p-6 border ${needTransfer ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
         <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            Simulation Trésorerie ({jointPerson?.name || 'Joint'})
         </h3>
         
         <div className="flex flex-col md:flex-row gap-8 justify-between">
             <div className="space-y-1">
                 <p className="text-sm text-slate-600">Solde Actuel</p>
                 <p className="text-xl font-bold text-slate-900">{jointBalance.toFixed(2)} €</p>
             </div>
             
             <div className="space-y-1">
                 <p className="text-sm text-slate-600">
                    {searchQuery ? "Dépenses filtrées (Non payées)" : "Dépenses prévues (Non payées)"}
                 </p>
                 <p className="text-xl font-bold text-red-600">- {jointExpensesUnpaid.toFixed(2)} €</p>
             </div>

             <div className="h-px md:h-auto md:w-px bg-slate-300 my-2 md:my-0"></div>

             <div className="space-y-1">
                 <p className="text-sm text-slate-600">Solde Prévisionnel Fin de Semaine</p>
                 <p className={`text-xl font-bold ${projectedBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {projectedBalance.toFixed(2)} €
                 </p>
             </div>
         </div>

         {needTransfer && (
             <div className="mt-6 bg-white rounded-lg p-4 border border-amber-200 flex items-start gap-3 shadow-sm">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="font-semibold text-amber-800 text-sm">Action Requise : Virement nécessaire</h4>
                    <p className="text-sm text-slate-600 mt-1">
                        Le compte {jointAccount?.name} sera débiteur de <strong>{Math.abs(projectedBalance).toFixed(2)} €</strong> cette semaine.
                    </p>
                    {lddsAccount && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Disponible sur LDDS : <strong>{lddsAccount.currentBalance.toFixed(2)} €</strong></span>
                            <button className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors">
                                <ArrowRightLeft size={12} />
                                Simuler Virement
                            </button>
                        </div>
                    )}
                </div>
             </div>
         )}
      </div>
    </div>
  );
};