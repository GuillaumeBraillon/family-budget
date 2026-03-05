/**
 * @file Composant d'analyse annuelle par bénéficiaires
 * @description Tableau détaillé affichant la répartition des revenus/dépenses
 * par bénéficiaire pour chaque mois de l'année.
 *
 * @architecture
 * **Structure similaire à AnnualIncomeAnalysis :**
 * - Colonnes : Mois | Flux | Bénéficiaire 1 | Bénéficiaire 2 | ... | Total
 * - 10 lignes par mois (comme tableau par période)
 * - Export CSV avec formatage français
 * - Navigation cliquable vers Operations avec filtres
 *
 * **Design cohérent :**
 * - Mêmes couleurs : Blue (salaires), Emerald (revenus), Rose/Indigo (dépenses)
 * - Mêmes icônes : Briefcase, CalendarClock, ShoppingBag, etc.
 * - Même comportement hover et transitions
 *
 * @dependencies
 * - hooks/dashboard/useBeneficiaryData : Calcul des données
 * - hooks/useCsvExport : Export CSV
 * - components/ui : Card, ClickableAmount, ExportCsvButton
 */
import React from "react";
import { Scale, Briefcase, CalendarClock, ShoppingBag, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card } from "../../../ui/Card";
import { ExportCsvButton } from "../../../ui/atoms/ExportCsvButton";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { useCsvExport } from "../../../../hooks/useCsvExport";
import { useBeneficiaryData, getBeneficiaryAnalysisFilters } from "../../../../hooks/dashboard/useBeneficiaryData";
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, VariableTransaction, CategoryDef, OperationFilters } from "../../../../types";

interface AnnualBeneficiaryAnalysisProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  categories: CategoryDef[];
  year: number;
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>) => void;
}

/**
 * Helper pour afficher une cellule de montant avec navigation cliquable.
 *
 * @param {number} [amount] - Montant à afficher
 * @param {Date} date - Date du mois concerné
 * @param {string} beneficiaryId - ID du bénéficiaire
 * @param {("EXPENSE" | "INCOME")} flux - Type de flux
 * @param {("RECURRING" | "VARIABLE" | "ALL")} source - Source des opérations
 * @param {Function} onNavigate - Callback de navigation
 * @param {string} [className] - Classes CSS supplémentaires
 * @param {("ALL" | "ONLY" | "EXCLUDE")} [extraFilter] - Filtre Extra/Standard
 * @returns {JSX.Element} Cellule formatée
 */
const renderCell = (
  amount: number | undefined,
  date: Date,
  beneficiaryId: string,
  flux: "EXPENSE" | "INCOME",
  source: "RECURRING" | "VARIABLE" | "ALL",
  onNavigate: (date: Date, filters?: Partial<OperationFilters>) => void,
  className = "text-slate-700",
  extraFilter: "ALL" | "ONLY" | "EXCLUDE" = "ALL"
) => {
  if (!amount || amount < 0.01) {
    return <span className="text-slate-200 font-light">-</span>;
  }

  const filters = getBeneficiaryAnalysisFilters(beneficiaryId, flux, source, extraFilter);

  return (
    <ClickableAmount date={date} filters={filters} onNavigate={onNavigate} className={`hover:underline ${className}`} as="button">
      {amount.toFixed(2)} €
    </ClickableAmount>
  );
};

export const AnnualBeneficiaryAnalysis: React.FC<AnnualBeneficiaryAnalysisProps> = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  categories,
  year,
  onNavigateToPlanner,
}) => {
  const { exportToCsv, escapeCsv, formatNumberFr } = useCsvExport();

  // Calcul des données via hook spécialisé
  const data = useBeneficiaryData({
    accounts,
    people,
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    categories,
    selectedYear: year,
  });

  // Vérification s'il y a des données à afficher
  const hasData = data.some((m) => Math.abs(m.totals.income) > 0.01 || Math.abs(m.totals.expenses) > 0.01);

  // Liste des bénéficiaires (triée par nom)
  const beneficiaryHeaders = hasData && data[0]?.beneficiaries ? data[0].beneficiaries.map((b) => b.beneficiaryName) : [];

  /**
   * Export CSV avec structure identique au tableau visuel.
   * 10 lignes par mois : Salaires, Revenus (récurrents/variables/total),
   * Dépenses (récurrentes/variables standard/extra/total), Solde.
   */
  const handleExport = () => {
    if (!hasData) return;

    // Headers dynamiques : Mois | Flux | Bénéficiaires... | Total
    const headers = ["Mois", "Flux", ...beneficiaryHeaders, "Total"];

    const rows: string[][] = [];

    data.forEach((month) => {
      // Si le mois est vide, on ne l'exporte pas
      const isEmpty = Math.abs(month.totals.income) < 0.01 && Math.abs(month.totals.expenses) < 0.01;
      if (isEmpty) return;

      const benefs = month.beneficiaries;

      // LIGNE 0 : SALAIRES
      rows.push([
        escapeCsv(month.monthName),
        escapeCsv("Salaires"),
        ...benefs.map((b) => (b.income.salaries > 0.01 ? formatNumberFr(b.income.salaries) : escapeCsv("-"))),
        formatNumberFr(benefs.reduce((sum, b) => sum + b.income.salaries, 0)),
      ]);

      // LIGNE 1 : REVENUS RÉCURRENTS
      rows.push([
        escapeCsv(""),
        escapeCsv("Revenus récurrents"),
        ...benefs.map((b) => (b.income.recurring > 0.01 ? formatNumberFr(b.income.recurring) : escapeCsv("-"))),
        formatNumberFr(benefs.reduce((sum, b) => sum + b.income.recurring, 0)),
      ]);

      // LIGNE 2 : REVENUS VARIABLES
      rows.push([
        escapeCsv(""),
        escapeCsv("Revenus variables"),
        ...benefs.map((b) => (b.income.variable > 0.01 ? formatNumberFr(b.income.variable) : escapeCsv("-"))),
        formatNumberFr(benefs.reduce((sum, b) => sum + b.income.variable, 0)),
      ]);

      // LIGNE 3 : TOTAL REVENUS
      rows.push([escapeCsv(""), escapeCsv("TOTAL REVENUS"), ...benefs.map((b) => formatNumberFr(b.income.total)), formatNumberFr(month.totals.income)]);

      // LIGNE 4 : DÉPENSES RÉCURRENTES
      rows.push([
        escapeCsv(""),
        escapeCsv("Dépenses récurrentes"),
        ...benefs.map((b) => (b.expenses.recurring > 0.01 ? formatNumberFr(b.expenses.recurring) : escapeCsv("-"))),
        formatNumberFr(benefs.reduce((sum, b) => sum + b.expenses.recurring, 0)),
      ]);

      // LIGNE 5A : DÉPENSES VARIABLES STANDARD
      rows.push([
        escapeCsv(""),
        escapeCsv("Dépenses variables (Standard)"),
        ...benefs.map((b) => (b.expenses.variableStandard > 0.01 ? formatNumberFr(b.expenses.variableStandard) : escapeCsv("-"))),
        formatNumberFr(benefs.reduce((sum, b) => sum + b.expenses.variableStandard, 0)),
      ]);

      // LIGNE 5B : DÉPENSES VARIABLES EXTRA
      rows.push([
        escapeCsv(""),
        escapeCsv("Dépenses variables (Extra)"),
        ...benefs.map((b) => (b.expenses.variableExtra > 0.01 ? formatNumberFr(b.expenses.variableExtra) : escapeCsv("-"))),
        formatNumberFr(benefs.reduce((sum, b) => sum + b.expenses.variableExtra, 0)),
      ]);

      // LIGNE 5C : TOTAL DÉPENSES VARIABLES
      rows.push([
        escapeCsv(""),
        escapeCsv("TOTAL Dépenses variables"),
        ...benefs.map((b) => (b.expenses.variable > 0.01 ? formatNumberFr(b.expenses.variable) : escapeCsv("-"))),
        formatNumberFr(benefs.reduce((sum, b) => sum + b.expenses.variable, 0)),
      ]);

      // LIGNE 6 : TOTAL DÉPENSES
      rows.push([escapeCsv(""), escapeCsv("TOTAL DÉPENSES"), ...benefs.map((b) => formatNumberFr(b.expenses.total)), formatNumberFr(month.totals.expenses)]);

      // LIGNE 7 : SOLDE
      rows.push([escapeCsv(""), escapeCsv("SOLDE"), ...benefs.map((b) => formatNumberFr(b.balance)), formatNumberFr(month.totals.balance)]);
    });

    exportToCsv(headers, rows, `analyse_beneficiaires_${year}`);
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Scale size={16} className="text-indigo-600" /> Analyse Complète (Bénéficiaires)
        </h3>
        {hasData && <ExportCsvButton onClick={handleExport} label="Export CSV" />}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b-2 border-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-40">Mois</th>
              <th className="px-3 py-3 w-40">Flux</th>
              {beneficiaryHeaders.map((name, idx) => (
                <th key={idx} className="px-3 py-3 text-right min-w-[100px]">
                  {name}
                </th>
              ))}
              <th className="px-4 py-3 text-right bg-slate-100 w-32 border-l border-slate-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {!hasData && (
              <tr>
                <td colSpan={3 + beneficiaryHeaders.length} className="px-4 py-8 text-center text-slate-400 italic">
                  Aucune donnée financière pour l'année {year}.
                </td>
              </tr>
            )}
            {data.map((month) => {
              // Si le mois est vide, on ne l'affiche pas
              const isEmpty = Math.abs(month.totals.income) < 0.01 && Math.abs(month.totals.expenses) < 0.01;
              if (isEmpty) return null;

              const benefs = month.beneficiaries;

              // Calculer les totaux pour chaque ligne
              const totSalaries = benefs.reduce((sum, b) => sum + b.income.salaries, 0);
              const totIncRec = benefs.reduce((sum, b) => sum + b.income.recurring, 0);
              const totIncVar = benefs.reduce((sum, b) => sum + b.income.variable, 0);
              const totInc = month.totals.income;

              const totExpRec = benefs.reduce((sum, b) => sum + b.expenses.recurring, 0);
              const totExpVar = benefs.reduce((sum, b) => sum + b.expenses.variable, 0);
              const totExpVarStandard = benefs.reduce((sum, b) => sum + b.expenses.variableStandard, 0);
              const totExpVarExtra = benefs.reduce((sum, b) => sum + b.expenses.variableExtra, 0);
              const totExp = month.totals.expenses;

              const totBal = month.totals.balance;

              return (
                <React.Fragment key={month.monthIndex}>
                  {/* LIGNE 0 : SALAIRES */}
                  <tr className="group bg-blue-50/40 hover:bg-blue-50/60 transition-colors border-t-2 border-slate-400">
                    <td rowSpan={10} className="px-4 py-3 align-top bg-gradient-to-r from-slate-50 to-white border-r-2 border-slate-200">
                      <div className="flex flex-col sticky left-0">
                        <span className="font-bold text-slate-900 capitalize text-sm">{month.monthName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{year}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-blue-700 font-bold text-[10px] w-full">
                        <Briefcase size={10} /> Salaires
                      </span>
                    </td>
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-1.5 text-right text-slate-700">
                        {renderCell(b.income.salaries, month.dateObj, b.beneficiaryId, "INCOME", "RECURRING", onNavigateToPlanner, "text-blue-700")}
                      </td>
                    ))}
                    <td className="px-4 py-1.5 text-right bg-blue-50/30 text-blue-700 font-bold border-l border-slate-100">
                      {totSalaries > 0 ? `${totSalaries.toFixed(2)} €` : <span className="text-slate-200 font-light">-</span>}
                    </td>
                  </tr>

                  {/* LIGNE 1 : REVENUS RÉCURRENTS */}
                  <tr className="group bg-emerald-50/40 hover:bg-emerald-50/60 transition-colors">
                    <td className="px-3 py-1.5 border-r border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-emerald-700 font-medium text-[10px] w-full">
                        <CalendarClock size={10} /> Rev. Récurrents
                      </span>
                    </td>
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-1.5 text-right text-slate-700">
                        {renderCell(b.income.recurring, month.dateObj, b.beneficiaryId, "INCOME", "RECURRING", onNavigateToPlanner, "text-emerald-600")}
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
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-1.5 text-right text-slate-700">
                        {renderCell(b.income.variable, month.dateObj, b.beneficiaryId, "INCOME", "VARIABLE", onNavigateToPlanner, "text-emerald-600")}
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
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-2 text-right font-bold text-emerald-700">
                        {renderCell(b.income.total, month.dateObj, b.beneficiaryId, "INCOME", "ALL", onNavigateToPlanner)}
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
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-1.5 text-right text-slate-700">
                        {renderCell(b.expenses.recurring, month.dateObj, b.beneficiaryId, "EXPENSE", "RECURRING", onNavigateToPlanner, "text-slate-600")}
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
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          b.expenses.variableStandard,
                          month.dateObj,
                          b.beneficiaryId,
                          "EXPENSE",
                          "VARIABLE",
                          onNavigateToPlanner,
                          "text-indigo-600",
                          "EXCLUDE"
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
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-1.5 text-right text-slate-500">
                        {renderCell(
                          b.expenses.variableExtra,
                          month.dateObj,
                          b.beneficiaryId,
                          "EXPENSE",
                          "VARIABLE",
                          onNavigateToPlanner,
                          "text-amber-600",
                          "ONLY"
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
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-1.5 text-right text-indigo-700 font-bold">
                        {renderCell(b.expenses.variable, month.dateObj, b.beneficiaryId, "EXPENSE", "VARIABLE", onNavigateToPlanner, "text-indigo-700")}
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
                    {benefs.map((b) => (
                      <td key={b.beneficiaryId} className="px-3 py-2 text-right font-bold text-slate-700">
                        {renderCell(b.expenses.total, month.dateObj, b.beneficiaryId, "EXPENSE", "ALL", onNavigateToPlanner)}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right bg-rose-50/30 font-black text-rose-700 border-l border-slate-200">{totExp.toFixed(2)} €</td>
                  </tr>

                  {/* LIGNE 7 : SOLDE */}
                  <tr className="group bg-slate-200/60 hover:bg-slate-200/80 transition-colors border-t-2 border-slate-400 border-b-[3px]">
                    <td className="px-3 py-2 border-r border-slate-50">
                      <span className="font-black text-slate-900 text-[10px] uppercase tracking-wider pl-1 flex items-center gap-1">
                        <Scale size={10} /> Solde Net
                      </span>
                    </td>
                    {benefs.map((b) => {
                      const isPos = b.balance >= 0;
                      return (
                        <td key={b.beneficiaryId} className={`px-3 py-2 text-right font-black ${isPos ? "text-emerald-600" : "text-rose-600"}`}>
                          {Math.abs(b.balance) > 0.01 ? (
                            <span>
                              {isPos ? "+" : ""}
                              {b.balance.toFixed(2)} €
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
