/**
 * @file Carte "Coût par projet" (Analytics)
 * @description Affiche le coût réel de chaque projet/événement (ex: "Vacances été 2026"),
 * en agrégeant toutes les opérations pointées qui lui sont rattachées, indépendamment
 * de leurs catégories (restaurants, carburant, achats divers, etc.).
 *
 * @architecture
 * Source de vérité : `paidItems` (table `paid_items`), seule table où `project_id` existe.
 * Un item compte pour le coût du projet si :
 * - il est rattaché au projet (`projectId`)
 * - il est réel (`!isWaiting`)
 * - il n'est pas exclu du budget (virement interne / intérêts, voir `isBudgetExcluded`)
 * Les remboursements (`isRefund`) réduisent le coût plutôt que de l'augmenter.
 */
import React, { useMemo, useState } from "react";
import { Briefcase, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";
import { ClickableAmount } from "../../../ui/atoms/ClickableAmount";
import { ExportCsvButton } from "../../../ui/atoms/ExportCsvButton";
import { CategoryDef, OperationFilters, PaidItemDetails, Project } from "../../../../types";
import { buildOperationsFilters, isBudgetExcluded } from "../../../../services/financeUtils";
import { useCsvExport } from "../../../../hooks/useCsvExport";

interface ProjectsCostCardProps {
  projects: Project[];
  paidItems: Record<string, PaidItemDetails>;
  categories: CategoryDef[];
  onNavigateToPlanner: (date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => void;
}

interface ProjectCost {
  project: Project;
  total: number;
  expensesTotal: number;
  refundsTotal: number;
  operationsCount: number;
  firstDate?: Date;
  lastDate?: Date;
  byCategory: {
    name: string;
    categoryId?: string;
    amount: number;
    expensesTotal: number;
    refundsTotal: number;
    count: number;
    firstDate?: Date;
    lastDate?: Date;
  }[];
}

const formatAmount = (amount: number) => `${amount.toFixed(2)} €`;
const formatCompactDate = (date?: Date) => (date ? date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : "Date inconnue");
const formatCsvDate = (date?: Date) => (date ? date.toISOString().split("T")[0] : "");
const getPaymentDate = (item: PaidItemDetails) => {
  const date = new Date(item.paymentDate);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getEarlierDate = (a?: Date, b?: Date) => {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() <= b.getTime() ? a : b;
};

const getLaterDate = (a?: Date, b?: Date) => {
  if (!a) return b;
  if (!b) return a;
  return a.getTime() >= b.getTime() ? a : b;
};

export const ProjectsCostCard: React.FC<ProjectsCostCardProps> = ({ projects, paidItems, categories, onNavigateToPlanner }) => {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const { exportToCsv, escapeCsv, formatNumberFr } = useCsvExport();

  const projectCosts = useMemo<ProjectCost[]>(() => {
    const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]));
    const costsByProjectId = new Map<
      string,
      {
        total: number;
        expensesTotal: number;
        refundsTotal: number;
        count: number;
        firstDate?: Date;
        lastDate?: Date;
        byCategory: Map<string, { amount: number; expensesTotal: number; refundsTotal: number; count: number; firstDate?: Date; lastDate?: Date }>;
      }
    >();

    Object.values(paidItems).forEach((item) => {
      if (!item.projectId || item.isWaiting) return;
      if (isBudgetExcluded(item)) return;

      const signedAmount = item.type === "EXPENSE" ? item.amount : item.isRefund ? -item.amount : 0;
      if (signedAmount === 0 && item.type !== "EXPENSE") return;

      const paymentDate = getPaymentDate(item);
      const current = costsByProjectId.get(item.projectId) || {
        total: 0,
        expensesTotal: 0,
        refundsTotal: 0,
        count: 0,
        firstDate: undefined,
        lastDate: undefined,
        byCategory: new Map<string, { amount: number; expensesTotal: number; refundsTotal: number; count: number; firstDate?: Date; lastDate?: Date }>(),
      };
      const categoryStats = current.byCategory.get(item.category) || {
        amount: 0,
        expensesTotal: 0,
        refundsTotal: 0,
        count: 0,
        firstDate: undefined,
        lastDate: undefined,
      };

      current.total += signedAmount;
      if (item.type === "EXPENSE") current.expensesTotal += item.amount;
      if (item.isRefund) current.refundsTotal += item.amount;
      current.count += 1;
      current.firstDate = getEarlierDate(current.firstDate, paymentDate);
      current.lastDate = getLaterDate(current.lastDate, paymentDate);

      categoryStats.amount += signedAmount;
      if (item.type === "EXPENSE") categoryStats.expensesTotal += item.amount;
      if (item.isRefund) categoryStats.refundsTotal += item.amount;
      categoryStats.count += 1;
      categoryStats.firstDate = getEarlierDate(categoryStats.firstDate, paymentDate);
      categoryStats.lastDate = getLaterDate(categoryStats.lastDate, paymentDate);
      current.byCategory.set(item.category, categoryStats);
      costsByProjectId.set(item.projectId, current);
    });

    return projects
      .map((project) => {
        const stats = costsByProjectId.get(project.id);
        return {
          project,
          total: stats?.total || 0,
          expensesTotal: stats?.expensesTotal || 0,
          refundsTotal: stats?.refundsTotal || 0,
          operationsCount: stats?.count || 0,
          firstDate: stats?.firstDate,
          lastDate: stats?.lastDate,
          byCategory: Array.from(stats?.byCategory.entries() || [])
            .map(([name, categoryStats]) => ({ name, categoryId: categoryIdByName.get(name), ...categoryStats }))
            .sort((a, b) => b.amount - a.amount),
        };
      })
      .filter((pc) => pc.operationsCount > 0)
      .sort((a, b) => b.total - a.total);
  }, [projects, paidItems, categories]);

  const navigateToOperations = (date: Date | undefined, filters: Partial<OperationFilters>) => {
    onNavigateToPlanner(date || new Date(), buildOperationsFilters(filters));
  };

  const handleExport = () => {
    const headers = [
      "Type de ligne",
      "Projet",
      "Statut projet",
      "Date début",
      "Date fin",
      "Catégorie",
      "Nombre opérations",
      "Dépenses",
      "Remboursé",
      "Coût net",
      "Moyenne",
      "Part du projet",
    ];

    const rows = projectCosts.flatMap((projectCost) => {
      const projectRows = [
        [
          escapeCsv("Projet"),
          escapeCsv(projectCost.project.name),
          escapeCsv(projectCost.project.isArchived ? "Archivé" : "Actif"),
          escapeCsv(formatCsvDate(projectCost.firstDate)),
          escapeCsv(formatCsvDate(projectCost.lastDate)),
          escapeCsv(""),
          projectCost.operationsCount.toString(),
          formatNumberFr(projectCost.expensesTotal),
          formatNumberFr(projectCost.refundsTotal),
          formatNumberFr(projectCost.total),
          formatNumberFr(projectCost.operationsCount > 0 ? projectCost.total / projectCost.operationsCount : 0),
          formatNumberFr(100, 0),
        ],
      ];

      const categoryRows = projectCost.byCategory.map((category) => [
        escapeCsv("Catégorie"),
        escapeCsv(projectCost.project.name),
        escapeCsv(projectCost.project.isArchived ? "Archivé" : "Actif"),
        escapeCsv(formatCsvDate(category.firstDate)),
        escapeCsv(formatCsvDate(category.lastDate)),
        escapeCsv(category.name),
        category.count.toString(),
        formatNumberFr(category.expensesTotal),
        formatNumberFr(category.refundsTotal),
        formatNumberFr(category.amount),
        formatNumberFr(category.count > 0 ? category.amount / category.count : 0),
        formatNumberFr(projectCost.total !== 0 ? (category.amount / projectCost.total) * 100 : 0, 0),
      ]);

      return [...projectRows, ...categoryRows];
    });

    exportToCsv(headers, rows, "details_projets_analytics");
  };

  if (projectCosts.length === 0) return null;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-500" /> Coût réel par projet
          </CardTitle>
          <ExportCsvButton onClick={handleExport} label="Export CSV" showLabel={false} />
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col divide-y divide-slate-100">
          {projectCosts.map(({ project, total, expensesTotal, refundsTotal, operationsCount, firstDate, lastDate, byCategory }) => {
            const isExpanded = expandedProjectId === project.id;
            const averageAmount = operationsCount > 0 ? total / operationsCount : 0;
            const periodLabel =
              firstDate && lastDate && firstDate.getTime() !== lastDate.getTime()
                ? `${formatCompactDate(firstDate)} - ${formatCompactDate(lastDate)}`
                : formatCompactDate(lastDate);
            return (
              <div key={project.id} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setExpandedProjectId(isExpanded ? null : project.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-2 font-bold text-slate-800 truncate">
                        {project.name}
                        {project.isArchived && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">Archivé</span>}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                        <span>
                          {operationsCount} opération{operationsCount > 1 ? "s" : ""}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} /> {periodLabel}
                        </span>
                      </span>
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="shrink-0 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <ClickableAmount
                      as="button"
                      date={lastDate || new Date()}
                      filters={{
                        flux: "ALL",
                        source: "ALL",
                        status: "REAL",
                        nature: "ALL",
                        salary: "ALL",
                        projectFilterMode: "SELECTED",
                        isProjectFilterActive: true,
                        includedProjectIds: [project.id],
                      }}
                      onNavigate={onNavigateToPlanner}
                      className={`font-black text-base ${total >= 0 ? "text-slate-900" : "text-emerald-600"}`}
                    >
                      {formatAmount(total)}
                    </ClickableAmount>
                  </div>
                </div>

                {isExpanded && byCategory.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 px-2 py-2 text-[11px] text-slate-500">
                      <div>
                        <span className="block uppercase font-bold text-slate-400">Dépenses</span>
                        <span className="font-mono font-semibold text-slate-700">{formatAmount(expensesTotal)}</span>
                      </div>
                      <div>
                        <span className="block uppercase font-bold text-slate-400">Remboursé</span>
                        <span className="font-mono font-semibold text-emerald-600">{formatAmount(refundsTotal)}</span>
                      </div>
                      <div>
                        <span className="block uppercase font-bold text-slate-400">Moyenne</span>
                        <span className="font-mono font-semibold text-slate-700">{formatAmount(averageAmount)}</span>
                      </div>
                    </div>

                    {byCategory.map(({ name, categoryId, amount, count, firstDate: categoryFirstDate, lastDate: categoryLastDate }) => {
                      const categoryDate = categoryLastDate || lastDate;
                      const percent = total !== 0 ? Math.round((amount / total) * 100) : 0;
                      const categoryPeriodLabel =
                        categoryFirstDate && categoryLastDate && categoryFirstDate.getTime() !== categoryLastDate.getTime()
                          ? `${formatCompactDate(categoryFirstDate)} - ${formatCompactDate(categoryLastDate)}`
                          : formatCompactDate(categoryDate);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() =>
                            navigateToOperations(categoryDate, {
                              flux: "ALL",
                              source: "ALL",
                              status: "REAL",
                              nature: "ALL",
                              salary: "ALL",
                              projectFilterMode: "SELECTED",
                              isProjectFilterActive: true,
                              includedProjectIds: [project.id],
                              isCategoryFilterActive: !!categoryId,
                              includedCategoryIds: categoryId ? [categoryId] : [],
                            })
                          }
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2 text-left text-xs text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                          title="Ouvrir les opérations filtrées sur ce projet et cette catégorie"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-700">{name}</span>
                            <span className="block truncate text-[11px] text-slate-400">
                              {count} opération{count > 1 ? "s" : ""} · {percent}% · {categoryPeriodLabel}
                            </span>
                          </span>
                          <span className={`font-mono font-bold ${amount >= 0 ? "text-slate-700" : "text-emerald-600"}`}>{formatAmount(amount)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
