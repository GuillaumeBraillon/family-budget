
import React, { useState } from 'react';
import { Card } from '../../../ui/Card';
import { TrendingUp, ChevronDown, ChevronRight, Calendar, ChevronLeft } from 'lucide-react';
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
    // Par défaut, on ouvre le mois en cours
    const currentMonthIndex = new Date().getFullYear() === year ? new Date().getMonth() : 0;
    const [openMonths, setOpenMonths] = useState<number[]>([currentMonthIndex]);

    const toggleMonth = (idx: number) => {
        setOpenMonths(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    const handleAmountClick = (e: React.MouseEvent, monthDate: Date, periodId: number, sourceType: 'RECURRING' | 'VARIABLE' | 'ALL') => {
        e.stopPropagation();
        onNavigateToPlanner(
            monthDate, 
            {
                flux: 'INCOME',
                source: sourceType,
                status: 'ALL',
                extra: 'ALL', 
                salary: 'EXCLUDE' // IMPORTANT : On garde les salaires exclus pour matcher les montants affichés dans ce tableau
            },
            periodId
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} /> Analyse détaillée des revenus (Hors Salaires)
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

            <div className="grid gap-3">
                {data.map((month) => {
                    const isOpen = openMonths.includes(month.monthIndex);
                    const totalMonth = month.totals.income;

                    return (
                        <Card key={month.monthIndex} className={`border transition-all duration-300 ${isOpen ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-md' : 'border-slate-200 shadow-sm hover:border-indigo-200'}`}>
                            <div 
                                onClick={() => toggleMonth(month.monthIndex)}
                                className="flex items-center justify-between p-4 cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-indigo-600'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 capitalize text-lg">{month.monthName}</h4>
                                        <p className="text-xs text-slate-500">{month.periods.length} périodes</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenus</span>
                                        <span className="block text-xl font-black text-emerald-600">+{totalMonth.toFixed(2)} €</span>
                                    </div>
                                    <div className="text-slate-300">
                                        {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                                    </div>
                                </div>
                            </div>

                            {isOpen && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Période</th>
                                                    <th className="px-4 py-3 text-right text-slate-600">Récurrent</th>
                                                    <th className="px-4 py-3 text-right text-indigo-600">Variable</th>
                                                    <th className="px-4 py-3 text-right bg-slate-100 font-black text-slate-900">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {month.periods.map((p, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-slate-700">
                                                            {p.period.label} 
                                                            <span className="text-[10px] text-slate-400 font-normal ml-2">({p.period.start}-{p.period.end})</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button 
                                                                onClick={(e) => handleAmountClick(e, month.dateObj, p.period.id, 'RECURRING')}
                                                                className="text-slate-600 font-medium hover:text-indigo-600 hover:underline decoration-indigo-300 underline-offset-2 transition-all"
                                                            >
                                                                {p.income.recurring > 0 ? p.income.recurring.toFixed(2) + ' €' : '-'}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button 
                                                                onClick={(e) => handleAmountClick(e, month.dateObj, p.period.id, 'VARIABLE')}
                                                                className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline decoration-indigo-300 underline-offset-2 transition-all"
                                                            >
                                                                {p.income.variable > 0 ? p.income.variable.toFixed(2) + ' €' : '-'}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold bg-slate-50/50 text-emerald-600">
                                                            <button 
                                                                onClick={(e) => handleAmountClick(e, month.dateObj, p.period.id, 'ALL')}
                                                                className="hover:text-emerald-800 hover:underline decoration-emerald-300 underline-offset-2 transition-all"
                                                            >
                                                                {p.income.total.toFixed(2)} €
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-100 font-bold text-slate-800 border-t border-slate-200">
                                                <tr>
                                                    <td className="px-4 py-3 uppercase text-xs tracking-wider">Cumul Mensuel</td>
                                                    <td className="px-4 py-3 text-right">
                                                        {month.periods.reduce((acc, p) => acc + p.income.recurring, 0).toFixed(2)} €
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-indigo-700">
                                                        {month.periods.reduce((acc, p) => acc + p.income.variable, 0).toFixed(2)} €
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-emerald-700 bg-slate-200/50">
                                                        {totalMonth.toFixed(2)} €
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
