
import React from 'react';
import { Card } from '../../../ui/Card';
import { TrendingUp, ChevronLeft, ChevronRight, CalendarClock, ShoppingBag } from 'lucide-react';
import { OperationFilters } from '../../../../types';

interface PeriodIncome {
    recurring: number;
    variable: number;
    extra: number;
    total: number;
}

interface MonthData {
    monthName: string;
    monthIndex: number;
    dateObj: Date;
    periods: {
        period: { id: number; label: string; start: number; end: number };
        income: PeriodIncome;
    }[];
    totals: { income: number };
}

interface AnnualIncomeAnalysisProps {
    data: MonthData[];
    year: number;
    onYearChange: (year: number) => void;
    onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
}

export const AnnualIncomeAnalysis: React.FC<AnnualIncomeAnalysisProps> = ({ data, year, onYearChange, onNavigateToPlanner }) => {
    
    // Détermination du nombre max de périodes pour structurer les colonnes
    const maxPeriods = data.reduce((max, m) => Math.max(max, m.periods.length), 0) || 4;
    const periodsHeader = Array.from({ length: maxPeriods }, (_, i) => i + 1);

    const handleAmountClick = (e: React.MouseEvent, monthDate: Date, periodId: number | undefined, sourceType: 'RECURRING' | 'VARIABLE' | 'ALL') => {
        e.stopPropagation();
        onNavigateToPlanner(
            monthDate, 
            {
                flux: 'INCOME',
                source: sourceType === 'ALL' ? 'ALL' : sourceType,
                status: 'REAL', // On ne montre que le réel ici
                extra: 'ALL', 
                salary: 'EXCLUDE'
            },
            periodId // Si undefined, le planner gère la semaine par défaut ou via date
        );
    };

    return (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" /> Analyse des Revenus (Réel)
                </h3>
                
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button 
                        onClick={() => onYearChange(year - 1)}
                        className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-900 px-2 min-w-[40px] text-center">{year}</span>
                    <button 
                        onClick={() => onYearChange(year + 1)}
                        className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 w-40">Mois</th>
                            <th className="px-3 py-3 w-28">Type</th>
                            {periodsHeader.map(p => (
                                <th key={p} className="px-3 py-3 text-right min-w-[80px]">Période {p}</th>
                            ))}
                            <th className="px-4 py-3 text-right bg-slate-100 w-32">Cumul Mensuel</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((month) => {
                            const monthTotalRecurring = month.periods.reduce((acc, p) => acc + p.income.recurring, 0);
                            const monthTotalVariable = month.periods.reduce((acc, p) => acc + p.income.variable, 0);
                            const monthTotal = month.totals.income;

                            // Skip les mois futurs ou vides si 0 revenus (optionnel, ici on affiche tout pour la structure)
                            const isEmpty = monthTotal === 0;

                            return (
                                <React.Fragment key={month.monthIndex}>
                                    {/* LIGNE 1 : RÉCURRENT */}
                                    <tr className={`group hover:bg-slate-50/50 transition-colors ${isEmpty ? 'opacity-50 grayscale' : ''}`}>
                                        <td rowSpan={3} className="px-4 py-3 align-top bg-white border-r border-slate-100">
                                            <div className="flex flex-col sticky left-0">
                                                <span className="font-bold text-slate-900 capitalize text-sm">{month.monthName}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">{year}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 border-r border-slate-50">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px] w-full">
                                                <CalendarClock size={10} /> Récurrent
                                            </span>
                                        </td>
                                        {periodsHeader.map((p, idx) => {
                                            const val = month.periods[idx]?.income.recurring || 0;
                                            return (
                                                <td key={idx} className="px-3 py-2 text-right">
                                                    {val > 0 ? (
                                                        <button 
                                                            onClick={(e) => handleAmountClick(e, month.dateObj, month.periods[idx]?.period.id, 'RECURRING')}
                                                            className="font-medium text-slate-600 hover:text-indigo-600 hover:underline transition-colors"
                                                        >
                                                            {val.toFixed(2)} €
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-2 text-right bg-slate-50/30 font-medium text-slate-600 border-l border-slate-100">
                                            {monthTotalRecurring.toFixed(2)} €
                                        </td>
                                    </tr>

                                    {/* LIGNE 2 : VARIABLE */}
                                    <tr className={`group hover:bg-slate-50/50 transition-colors ${isEmpty ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="px-3 py-2 border-r border-slate-50">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold text-[10px] w-full">
                                                <ShoppingBag size={10} /> Variable
                                            </span>
                                        </td>
                                        {periodsHeader.map((p, idx) => {
                                            const val = month.periods[idx]?.income.variable || 0;
                                            return (
                                                <td key={idx} className="px-3 py-2 text-right">
                                                    {val > 0 ? (
                                                        <button 
                                                            onClick={(e) => handleAmountClick(e, month.dateObj, month.periods[idx]?.period.id, 'VARIABLE')}
                                                            className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                                                        >
                                                            {val.toFixed(2)} €
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-2 text-right bg-slate-50/30 font-medium text-indigo-600 border-l border-slate-100">
                                            {monthTotalVariable.toFixed(2)} €
                                        </td>
                                    </tr>

                                    {/* LIGNE 3 : TOTAL (Border Bottom séparateur de mois) */}
                                    <tr className={`group hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-0 ${isEmpty ? 'opacity-50 grayscale' : ''}`}>
                                        <td className="px-3 py-2 border-r border-slate-50">
                                            <span className="font-black text-slate-900 text-[10px] uppercase tracking-wider pl-1">Total</span>
                                        </td>
                                        {periodsHeader.map((p, idx) => {
                                            const val = month.periods[idx]?.income.total || 0;
                                            return (
                                                <td key={idx} className="px-3 py-2 text-right font-bold text-slate-800">
                                                    {val > 0 ? (
                                                        <button 
                                                            onClick={(e) => handleAmountClick(e, month.dateObj, month.periods[idx]?.period.id, 'ALL')}
                                                            className="hover:text-emerald-600 transition-colors"
                                                        >
                                                            {val.toFixed(2)} €
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300 font-normal">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-2 text-right bg-slate-100 font-black text-emerald-600 border-l border-slate-200">
                                            {monthTotal.toFixed(2)} €
                                        </td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
