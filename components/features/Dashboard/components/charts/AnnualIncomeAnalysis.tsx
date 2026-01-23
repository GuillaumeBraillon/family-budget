import React from "react";
import { Card } from "../../../../ui/Card";
import { CalendarClock, ShoppingBag, ArrowUpRight, ArrowDownLeft, Scale } from "lucide-react";
import { ClickableAmount } from "../../../../ui/atoms/ClickableAmount";
import { OperationFilters } from "../../../../../types";
import { getDetailedAnalysisFilters } from "../../../../../hooks/dashboard/useDashboardData";

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

export const AnnualIncomeAnalysis: React.FC<AnnualIncomeAnalysisProps> = ({ data, year, onYearChange: _onYearChange, onNavigateToPlanner }) => {
  const maxPeriods = data.reduce((max, m) => Math.max(max, m.periods.length), 0) || 4;
  const periodsHeader = Array.from({ length: maxPeriods }, (_, i) => i + 1);

  // Vérification s'il y a des données à afficher cette année
  const hasData = data.some((m) => Math.abs(m.totals.income) > 0.01 || Math.abs(m.totals.expenses) > 0.01);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Scale size={16} className="text-indigo-600" /> Analyse Complète (Réel)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b-2 border-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-40">Mois</th>
              <th className="px-3 py-3 w-40">Flux</th>
              {periodsHeader.map((p) => (
                <th key={p} className="px-3 py-3 text-right min-w-[80px]">
                  Période {p}
                </th>
              ))}
              <th className="px-4 py-3 text-right bg-slate-100 w-32 border-l border-slate-200">Cumul</th>
            </tr>
          </thead>
          <tbody>
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
              const totExpVarStandard = month.periods.reduce((acc, p) => acc + p.expenses.variableStandard, 0);
              const totExpVarExtra = month.periods.reduce((acc, p) => acc + p.expenses.variableExtra, 0);
              const totExp = month.totals.expenses;

              const totBal = month.totals.balance;

              // Si le mois est vide (pas de revenus ni de dépenses), on ne l'affiche pas
              const isEmpty = Math.abs(totInc) < 0.01 && Math.abs(totExp) < 0.01;
              if (isEmpty) return null;

              return (
                <React.Fragment key={month.monthIndex}>
                  {/* LIGNE 1 : REVENUS RÉCURRENTS */}
                  <tr className="group bg-emerald-50/40 hover:bg-emerald-50/60 transition-colors border-t-2 border-slate-400">
                    <td rowSpan={9} className="px-4 py-3 align-top bg-gradient-to-r from-slate-50 to-white border-r-2 border-slate-200">
                      <div className="flex flex-col sticky left-0">
                        <span className="font-bold text-slate-900 capitalize text-sm">{month.monthName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{year}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-700 font-medium text-[10px] w-full">
                        <CalendarClock size={10} /> Rev. Récurrents
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-700">
                        {renderCell(
                          month.periods[idx]?.income.recurring,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "INCOME",
                          "RECURRING",
                          onNavigateToPlanner,
                          "text-emerald-600"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-emerald-700 font-medium border-l border-slate-100">{totIncRec.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 2 : REVENUS VARIABLES */}
                  <tr className="group bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-700 font-medium text-[10px] w-full">
                        <ShoppingBag size={10} /> Rev. Variables
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-700">
                        {renderCell(
                          month.periods[idx]?.income.variable,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "INCOME",
                          "VARIABLE",
                          onNavigateToPlanner,
                          "text-emerald-600"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-emerald-700 font-medium border-l border-slate-100">{totIncVar.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 3 : TOTAL REVENUS */}
                  <tr className="group bg-emerald-100/50 hover:bg-emerald-100/70 transition-colors border-t-2 border-b-2 border-emerald-300">
                    <td className="px-3 py-2 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-700 font-bold text-[10px] w-full uppercase tracking-wide">
                        <ArrowUpRight size={10} /> Total Revenus
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-2 text-right font-bold text-emerald-700">
                        {renderCell(month.periods[idx]?.income.total, month.dateObj, month.periods[idx]?.period.id, "INCOME", "ALL", onNavigateToPlanner)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right bg-emerald-100/30 font-black text-emerald-700 border-l border-slate-200">+{totInc.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 4 : DÉPENSES RÉCURRENTES */}
                  <tr className="group bg-slate-100/60 hover:bg-slate-100/80 transition-colors border-t-2 border-slate-400">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-700 font-medium text-[10px] w-full">
                        <CalendarClock size={10} /> Dép. Récurrentes
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-700">
                        {renderCell(
                          month.periods[idx]?.expenses.recurring,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "EXPENSE",
                          "RECURRING",
                          onNavigateToPlanner,
                          "text-slate-600"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-slate-700 font-medium border-l border-slate-100">{totExpRec.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 5A : DÉPENSES VARIABLES STANDARD */}
                  <tr className="group bg-indigo-50/40 hover:bg-indigo-50/60 transition-colors border-t border-slate-300">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-indigo-600 font-bold text-[10px] w-full">
                        <ShoppingBag size={10} /> Dép. Var. Standard
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          month.periods[idx]?.expenses.variableStandard,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "EXPENSE",
                          "VARIABLE",
                          onNavigateToPlanner,
                          "text-indigo-600",
                          "EXCLUDE" // Exclure les Extra (afficher uniquement Standard)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-slate-50/30 text-indigo-700 font-medium border-l border-slate-100">
                      {totExpVarStandard.toFixed(2)} €
                    </td>
                  </tr>

                  {/* LIGNE 5B : DÉPENSES VARIABLES EXTRA */}
                  <tr className="group bg-amber-50/40 hover:bg-amber-50/60 transition-colors">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-amber-700 font-bold text-[10px] w-full">
                        <ShoppingBag size={10} /> Dép. Var. Extra
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          month.periods[idx]?.expenses.variableExtra,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "EXPENSE",
                          "VARIABLE",
                          onNavigateToPlanner,
                          "text-amber-600",
                          "ONLY" // Afficher uniquement les Extra
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-amber-50/30 text-amber-600 font-medium border-l border-slate-100">
                      {totExpVarExtra.toFixed(2)} €
                    </td>
                  </tr>

                  {/* LIGNE 5C : TOTAL DÉPENSES VARIABLES */}
                  <tr className="group bg-indigo-100/50 hover:bg-indigo-100/70 transition-colors border-t-1 border-b-1 border-indigo-300">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-indigo-700 font-bold text-[10px] w-full uppercase tracking-wide">
                        <ShoppingBag size={10} /> Total Variables
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-1.5 text-right text-indigo-700 font-bold">
                        {renderCell(
                          month.periods[idx]?.expenses.variable,
                          month.dateObj,
                          month.periods[idx]?.period.id,
                          "EXPENSE",
                          "VARIABLE",
                          onNavigateToPlanner,
                          "text-indigo-700"
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-indigo-100/30 text-indigo-700 font-bold border-l border-slate-200">{totExpVar.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 6 : TOTAL DÉPENSES */}
                  <tr className="group bg-rose-100/50 hover:bg-rose-100/70 transition-colors border-t-2 border-b-2 border-rose-300">
                    <td className="px-3 py-2 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-rose-700 font-bold text-[10px] w-full uppercase tracking-wide">
                        <ArrowDownLeft size={10} /> Total Dépenses
                      </span>
                    </td>
                    {periodsHeader.map((p, idx) => (
                      <td key={idx} className="px-3 py-2 text-right font-bold text-slate-700">
                        {renderCell(month.periods[idx]?.expenses.total, month.dateObj, month.periods[idx]?.period.id, "EXPENSE", "ALL", onNavigateToPlanner)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right bg-rose-50/30 font-black text-rose-700 border-l border-slate-200">{totExp.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 8 : SOLDE (Border Bottom séparateur) */}
                  <tr className="group bg-slate-200/60 hover:bg-slate-200/80 transition-colors border-t-2 border-slate-400 border-b-[3px]">
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
  onNavigate: (date: Date, filters: Partial<OperationFilters>, weekNumber?: number) => void,
  colorClass?: string,
  nature?: "ALL" | "ONLY" | "EXCLUDE" // Nouveau paramètre pour la nature (Standard/Extra)
) => {
  if (!value || value === 0) return <span className="text-slate-200 font-light">-</span>;

  // Récupérer les filtres de base et surcharger la nature si spécifiée
  const filters = getDetailedAnalysisFilters(flux, source);
  if (nature) {
    filters.nature = nature;
  }

  return (
    <ClickableAmount date={date} filters={filters} weekNumber={periodId} onNavigate={onNavigate} className={`hover:underline ${colorClass || ""}`} as="button">
      {value.toFixed(2)} €
    </ClickableAmount>
  );
};
