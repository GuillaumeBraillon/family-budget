import React from "react";
import { Card } from "../../../../ui/Card";
import { Landmark } from "lucide-react";

interface MonthlyGlobalData {
  monthName: string;
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
}

export const GlobalMonthlyAnalysis: React.FC<GlobalMonthlyAnalysisProps> = ({ data, year }) => {
  // Filtrer les mois vides (futur ou pas de données)
  const activeMonths = data.filter((m) => m.totalIncome > 0 || m.expenses > 0);

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Landmark size={16} className="text-indigo-600" /> Trésorerie Globale & Épargne ({year})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Mois</th>
              <th className="px-3 py-3 text-right text-emerald-600 bg-emerald-50/30">Salaires (Réel)</th>
              <th className="px-3 py-3 text-right text-emerald-600/70">Autres Rev.</th>
              <th className="px-3 py-3 text-right font-bold text-emerald-700 border-r border-slate-100">Total Entrées</th>
              <th className="px-3 py-3 text-right text-rose-600">Dépenses (Réel)</th>
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
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 font-bold text-slate-700 capitalize">{m.monthName}</td>
                  <td className="px-3 py-3 text-right bg-emerald-50/10 group-hover:bg-emerald-50/30 font-medium text-emerald-700">
                    {m.salaries > 0 ? m.salaries.toFixed(2) + " €" : "-"}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500">{m.otherIncome > 0 ? m.otherIncome.toFixed(2) + " €" : "-"}</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-600 border-r border-slate-100">{m.totalIncome.toFixed(2)} €</td>
                  <td className="px-3 py-3 text-right text-rose-600 font-medium">{m.expenses.toFixed(2)} €</td>
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
      </div>
    </Card>
  );
};
