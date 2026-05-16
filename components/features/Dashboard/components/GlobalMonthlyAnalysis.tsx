import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/Card";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { getGlobalAnalysisFilters } from "../../../../hooks/dashboard";
import { useAuth } from "../../../../hooks/useAuth";
import { useBudget } from "../../../../hooks/useBudget";
import { useAdminView } from "../../../../contexts/AdminViewContext";
import { OperationFilters } from "../../../../types";
import { MonthSelector } from "./MonthSelector";

interface MonthlyGlobalData {
  monthName: string;
  monthIndex: number;
  salaries: number;
  otherIncome: number;
  totalIncome: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

interface GlobalMonthlyAnalysisProps {
  data: MonthlyGlobalData[];
  year: number;
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
  onYearChange: (year: number) => void;
}

export const GlobalMonthlyAnalysis: React.FC<GlobalMonthlyAnalysisProps> = ({ data, year, onNavigateToPlanner, onYearChange }) => {
  // Filtrer les mois vides (futur ou pas de données)
  const activeMonths = data.filter((m) => m.totalIncome > 0 || m.expenses > 0);

  // Autorisation: rendre l'élément transparent pour les non-admins
  const { user } = useAuth();
  const { authorizedUsers } = useBudget();
  const { viewAsNonAdmin } = useAdminView();
  const currentEmail = user?.email;
  const actualIsAdmin = !!authorizedUsers.find((u) => u.email === currentEmail && !!u.isAdmin);
  const isAdmin = actualIsAdmin && !viewAsNonAdmin;

  if (!isAdmin) return null;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-0 border-b-0">
        <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">Trésorerie Globale & Épargne</CardTitle>
        <MonthSelector year={year} onYearChange={onYearChange} />
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Mois</th>
              <th className="px-3 py-3 text-right text-emerald-600 bg-emerald-50/30">Salaires</th>
              <th className="px-3 py-3 text-right text-emerald-600/70">Autres Rev.</th>
              <th className="px-3 py-3 text-right font-bold text-emerald-700 border-r border-slate-100">Total Entrées</th>
              <th className="px-3 py-3 text-right text-rose-600">Dépenses </th>
              <th className="px-3 py-3 text-right font-black text-slate-800 bg-slate-50/50">Cashflow Net</th>
              <th className="px-3 py-3 text-right text-indigo-600">Capacité Épargne</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeMonths.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                  Aucune donnée consolidée pour l'année {year}.
                </td>
              </tr>
            )}
            {activeMonths.map((m, idx) => {
              const isPos = m.balance >= 0;
              // Calculer la date du mois pour la navigation
              const monthDate = new Date(year, m.monthIndex, 1);

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 font-bold text-slate-700 capitalize">{m.monthName}</td>
                  <td className="px-3 py-3 text-right bg-emerald-50/10 group-hover:bg-emerald-50/30 font-medium text-emerald-700">
                    {m.salaries > 0 ? (
                      <ClickableAmount date={monthDate} filters={getGlobalAnalysisFilters("salaries")} onNavigate={onNavigateToPlanner}>
                        {m.salaries.toFixed(2)} €
                      </ClickableAmount>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500">
                    {m.otherIncome > 0 ? (
                      <ClickableAmount date={monthDate} filters={getGlobalAnalysisFilters("otherIncome")} onNavigate={onNavigateToPlanner}>
                        {m.otherIncome.toFixed(2)} €
                      </ClickableAmount>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-600 border-r border-slate-100">
                    <ClickableAmount date={monthDate} filters={getGlobalAnalysisFilters("totalIncome")} onNavigate={onNavigateToPlanner}>
                      {m.totalIncome.toFixed(2)} €
                    </ClickableAmount>
                  </td>
                  <td className="px-3 py-3 text-right text-rose-600 font-medium">
                    <ClickableAmount date={monthDate} filters={getGlobalAnalysisFilters("expenses")} onNavigate={onNavigateToPlanner}>
                      {m.expenses.toFixed(2)} €
                    </ClickableAmount>
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-black bg-slate-50/50 group-hover:bg-slate-100 transition-colors ${
                      isPos ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isPos ? "+" : ""}
                    {m.balance.toFixed(2)} €
                  </td>
                  <td className="px-3 py-3 text-right">
                    {m.savingsRate !== 0 ? (
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold ${m.savingsRate > 0 ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {m.savingsRate.toFixed(0)}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
