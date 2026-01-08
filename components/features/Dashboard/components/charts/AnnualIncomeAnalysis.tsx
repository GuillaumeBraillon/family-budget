import React from "react";
import { Card } from "../../../../ui/Card";
import { ChevronLeft, ChevronRight, CalendarClock, ShoppingBag, ArrowUpRight, ArrowDownLeft, Scale } from "lucide-react";
import { OperationFilters } from "../../../../../types";

interface PeriodData {
  period: { id: number; label: string; start: number; end: number };
  income: { recurring: number; variable: number; total: number };
  expenses: { recurring: number; variable: number; total: number };
  balance: number;
}

interface MonthData {
  monthName: string;
  monthIndex: number;
  dateObj: Date;
  periods: PeriodData[];
  totals: { income: number; expenses: number; balance: number };
}

interface AnnualIncomeAnalysisProps {
  data: MonthData[];
  year: number;
  onYearChange: (year: number) => void;
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
}

export const AnnualIncomeAnalysis: React.FC<AnnualIncomeAnalysisProps> = ({ data, year, onYearChange, onNavigateToPlanner }) => {
  const maxPeriods = data.reduce((max, m) => Math.max(max, m.periods.length), 0) || 4;
  const periodsHeader = Array.from({ length: maxPeriods }, (_, i) => i + 1);

  const handleAmountClick = (
    e: React.MouseEvent,
    monthDate: Date,
    periodId: number | undefined,
    flux: "EXPENSE" | "INCOME",
    source: "RECURRING" | "VARIABLE" | "ALL"
  ) => {
    e.stopPropagation();
    onNavigateToPlanner(
      monthDate,
      {
        flux: flux,
        source: source,
        status: "REAL",
        extra: "ALL",
        salary: "EXCLUDE",
      },
      periodId
    );
  };

  // Vérification s'il y a des données à afficher cette année
  const hasData = data.some((m) => Math.abs(m.totals.income) > 0.01 || Math.abs(m.totals.expenses) > 0.01);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Scale size={16} className="text-indigo-600" /> Analyse Complète (Réel)
        </h3>

        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          <button onClick={() => onYearChange(year - 1)} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-900 px-2 min-w-[40px] text-center">{year}</span>
          <button onClick={() => onYearChange(year + 1)} className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-40">Mois</th>
              <th className="px-3 py-3 w-36">Flux</th>
              {periodsHeader.map((p) => (
                <th key={p} className="px-3 py-3 text-right min-w-[80px]">
                  Période {p}
                </th>
              ))}
              <th className="px-4 py-3 text-right bg-slate-100 w-32 border-l border-slate-200">Cumul</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!hasData && (
              <tr>
                <td colSpan={3 + periodsHeader.length} className="px-4 py-8 text-center text-slate-400 italic">
                  Aucune donnée financière pour l'année {year}.
                </td>
              </tr>
            )}
            {data.map((month) => {
              // Calcul des totaux mensuels pour affichage colonne cumul
              const totIncRec = month.periods.reduce((acc, p) => acc + p.income.recurring, 0);
              const totIncVar = month.periods.reduce((acc, p) => acc + p.income.variable, 0);
              const totInc = month.totals.income;

              const totExpRec = month.periods.reduce((acc, p) => acc + p.expenses.recurring, 0);
              const totExpVar = month.periods.reduce((acc, p) => acc + p.expenses.variable, 0);
              const totExp = month.totals.expenses;

              const totBal = month.totals.balance;

              // Si le mois est vide (pas de revenus ni de dépenses), on ne l'affiche pas
              const isEmpty = Math.abs(totInc) < 0.01 && Math.abs(totExp) < 0.01;
              if (isEmpty) return null;

              return (
                <React.Fragment key={month.monthIndex}>
                  {/* LIGNE 1 : REVENUS RÉCURRENTS */}
                  <tr className="group hover:bg-emerald-50/20 transition-colors border-t-2 border-slate-100">
                    <td rowSpan={7} className="px-4 py-3 align-top bg-white border-r border-slate-100">
                      <div className="flex flex-col sticky left-0">
                        <span className="font-bold text-slate-900 capitalize text-sm">{month.monthName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{year}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-600/70 font-medium text-[10px] w-full">
                        <CalendarClock size={10} /> Rev. Récurrents
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          month.periods[idx]?.income.recurring,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "INCOME",
                          "RECURRING",
                          handleAmountClick,
                          "text-emerald-600"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-emerald-600/70 font-medium border-l border-slate-100">
                      {totIncRec.toFixed(2)} €
                    </td>
                  </tr>

                  {/* LIGNE 2 : REVENUS VARIABLES */}
                  <tr className="group hover:bg-emerald-50/20 transition-colors">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-600/70 font-medium text-[10px] w-full">
                        <ShoppingBag size={10} /> Rev. Variables
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          month.periods[idx]?.income.variable,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "INCOME",
                          "VARIABLE",
                          handleAmountClick,
                          "text-emerald-600"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-emerald-600/70 font-medium border-l border-slate-100">
                      {totIncVar.toFixed(2)} €
                    </td>
                  </tr>

                  {/* LIGNE 3 : TOTAL REVENUS */}
                  <tr className="group bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
                    <td className="px-3 py-2 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-700 font-bold text-[10px] w-full uppercase tracking-wide">
                        <ArrowUpRight size={10} /> Total Revenus
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-2 text-right font-bold text-emerald-700">
                        {renderCell(month.periods[idx]?.income.total, month.dateObj, month.periods[idx]?.period.id, "INCOME", "ALL", handleAmountClick)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right bg-emerald-100/30 font-black text-emerald-700 border-l border-slate-200">+{totInc.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 4 : DÉPENSES FIXES */}
                  <tr className="group hover:bg-rose-50/10 transition-colors">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-500 font-medium text-[10px] w-full">
                        <CalendarClock size={10} /> Dép. Fixes
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          month.periods[idx]?.expenses.recurring,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "EXPENSE",
                          "RECURRING",
                          handleAmountClick,
                          "text-slate-600"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-slate-500 font-medium border-l border-slate-100">{totExpRec.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 5 : DÉPENSES VARIABLES */}
                  <tr className="group hover:bg-rose-50/10 transition-colors">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-indigo-500 font-medium text-[10px] w-full">
                        <ShoppingBag size={10} /> Dép. Variables
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          month.periods[idx]?.expenses.variable,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "EXPENSE",
                          "VARIABLE",
                          handleAmountClick,
                          "text-indigo-600"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-indigo-500 font-medium border-l border-slate-100">{totExpVar.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 6 : TOTAL DÉPENSES */}
                  <tr className="group bg-rose-50/20 hover:bg-rose-50/40 transition-colors">
                    <td className="px-3 py-2 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-rose-700 font-bold text-[10px] w-full uppercase tracking-wide">
                        <ArrowDownLeft size={10} /> Total Dépenses
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-2 text-right font-bold text-slate-700">
                        {renderCell(month.periods[idx]?.expenses.total, month.dateObj, month.periods[idx]?.period.id, "EXPENSE", "ALL", handleAmountClick)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right bg-rose-50/30 font-black text-rose-700 border-l border-slate-200">{totExp.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 7 : SOLDE (Border Bottom séparateur) */}
                  <tr className="group bg-slate-50 transition-colors border-b border-slate-200 last:border-0">
                    <td className="px-3 py-2 border-r border-slate-50">
                      <span className="font-black text-slate-900 text-[10px] uppercase tracking-wider pl-1 flex items-center gap-1">
                        <Scale size={10} /> Solde Net
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => {
                      const val = month.periods[idx]?.balance || 0;
                      const isPos = val >= 0;
                      return (
                        <td key={idx} className={`px-3 py-2 text-right font-black ${isPos ? "text-emerald-600" : "text-rose-600"}`}>
                          {val !== 0 ? (
                            <span>
                              {isPos ? "+" : ""}
                              {val.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-slate-200 font-normal">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td
                      className={`px-4 py-2 text-right bg-slate-100 font-black border-l border-slate-200 ${totBal >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {totBal >= 0 ? "+" : ""}
                      {totBal.toFixed(2)} €
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

const renderCell = (
  value: number | undefined,
  date: Date,
  periodId: number | undefined,
  flux: "EXPENSE" | "INCOME",
  source: "RECURRING" | "VARIABLE" | "ALL",
  onClick: (data: { activePayload?: Array<{ payload: { month: string; actual: number } }> }) => void,
  colorClass?: string
) => {
  if (!value || value === 0) return <span className="text-slate-200 font-light">-</span>;
  return (
    <button onClick={(e) => onClick(e, date, periodId, flux, source)} className={`hover:underline transition-colors ${colorClass || ""}`}>
      {value.toFixed(2)} €
    </button>
  );
};
