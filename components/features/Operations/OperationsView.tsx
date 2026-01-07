import React, { useState, useMemo, useEffect } from "react";
import { usePlanner } from "../../../hooks/usePlanner";
import { usePlannerUI } from "../../../hooks/usePlannerUI";
import {
  ExpenseConfig,
  IncomeConfig,
  Account,
  Person,
  PaidItemDetails,
  PlannedItem,
  AppSettings,
  VariableTransaction,
  OperationFilters,
  SavedLabel,
  Tag,
  CategoryDef,
  AccountType,
} from "../../../types";
import { Calendar, CalendarRange, GripVertical } from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";

// Imports UI Atomic (Generic)
import { Toast } from "../../ui/Toast";
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { FilterBar } from "../../ui/molecules/FilterBar";
import { WeekSelector } from "../../ui/molecules/WeekSelector";
import { QuickPeriodSummary } from "../../ui/molecules/QuickPeriodSummary";
import { SearchBar } from "../../ui/atoms/SearchBar";
import { ListSorter, SortOrder } from "../../ui/molecules/ListSorter";

// Imports Feature-Specific Components
import { OperationsList } from "./components/OperationsList";
import { PlannerModals } from "./components/PlannerModals";
import { VariableTransactionForm } from "./components/VariableTransactionForm";

interface OperationsViewProps {
  initialDate?: Date;
  initialWeek?: number;
  initialFilters?: Partial<OperationFilters>;
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  variableTransactions: VariableTransaction[];
  accounts: Account[];
  people: Person[];
  paidItems: Record<string, PaidItemDetails>;
  settings: AppSettings;
  categories: CategoryDef[];
  savedLabels?: SavedLabel[];
  tags?: Tag[];
  onTogglePaid: (details: PaidItemDetails | null, instanceId: string) => void;
  onUpsertVariable: (t: VariableTransaction) => void;
  onDeleteVariable: (id: string) => void;
  onMoveItem?: (item: PlannedItem, newPosition: number) => void;
}

export const OperationsView: React.FC<OperationsViewProps> = ({
  initialDate,
  initialWeek,
  initialFilters,
  configs,
  incomeConfigs,
  variableTransactions,
  accounts,
  people,
  paidItems,
  settings,
  categories,
  savedLabels,
  tags = [],
  onTogglePaid,
  onUpsertVariable,
  onDeleteVariable,
  onMoveItem,
}) => {
  const ui = usePlannerUI(initialDate, initialWeek);
  const [scope, setScope] = useState<"MONTH" | "PERIOD">("PERIOD");
  const [isVarFormOpen, setIsVarFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariableTransaction | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Tri par défaut sur Manuel - AVEC PERSISTANCE
  const [sortKey, setSortKey] = useState<string>(() => {
    return localStorage.getItem("operationsView_sortKey") || "manual";
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    return (localStorage.getItem("operationsView_sortOrder") as SortOrder) || "asc";
  });

  // FILTRES PAR DÉFAUT
  const DEFAULT_FILTERS: OperationFilters = {
    flux: "ALL",
    source: "VARIABLE",
    status: "REAL",
    extra: "EXCLUDE",
    transfer: "EXCLUDE",
    salary: "EXCLUDE",
    accountIds: [],
    beneficiaryIds: [],
    includedTagIds: [],
    excludedTagIds: [],
    tagPresence: "ALL",
  };

  // FILTRES - AVEC PERSISTANCE
  const [filters, setFilters] = useState<OperationFilters>(() => {
    const saved = localStorage.getItem("operationsView_filters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_FILTERS;
      }
    }
    return DEFAULT_FILTERS;
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters((prev) => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);

  // Sauvegarder les préférences
  React.useEffect(() => {
    localStorage.setItem("operationsView_sortKey", sortKey);
  }, [sortKey]);

  React.useEffect(() => {
    localStorage.setItem("operationsView_sortOrder", sortOrder);
  }, [sortOrder]);

  React.useEffect(() => {
    localStorage.setItem("operationsView_filters", JSON.stringify(filters));
  }, [filters]);

  const handleDeleteVariable = (id: string) => {
    onDeleteVariable(id);
    setFeedback({ type: "success", message: "Opération supprimée" });
    setTimeout(() => setFeedback(null), 3000);
  };

  const checkingAccountIds = useMemo(() => accounts.filter((a) => a.type === AccountType.CHECKING).map((a) => a.id), [accounts]);

  const checkingTransactions = useMemo(() => variableTransactions.filter((t) => checkingAccountIds.includes(t.accountId)), [variableTransactions, checkingAccountIds]);

  const checkingConfigs = useMemo(() => configs.filter((c) => checkingAccountIds.includes(c.accountId)), [configs, checkingAccountIds]);

  const checkingIncomes = useMemo(() => incomeConfigs.filter((i) => checkingAccountIds.includes(i.accountId)), [incomeConfigs, checkingAccountIds]);

  const { filteredWeeks } = usePlanner(checkingConfigs, checkingIncomes, paidItems, checkingTransactions, ui.currentDate, ui.searchQuery, settings, categories, filters);

  const currentWeekIndex = ui.activeWeek;
  const currentWeekData = filteredWeeks.find((w) => w.weekNumber === currentWeekIndex);

  const unsortedItems = scope === "MONTH" ? filteredWeeks.flatMap((w) => w.items) : currentWeekData?.items || [];

  /**
   * Calcule une position effective pour le tri Manuel.
   * STRICTEMENT ALIGNÉ AVEC usePlanner pour garantir la stabilité du tri.
   */
  const getEffectivePosition = (item: PlannedItem) => {
    if (typeof item.position === "number" && item.position !== 0) return item.position;

    const BASE_SCORE = 100_000_000_000;
    const DAY_STEP = 100_000_000;

    // Génération d'un hash entier déterministe
    let hash = 0;
    for (let i = 0; i < item.instanceId.length; i++) {
      hash = (hash << 5) - hash + item.instanceId.charCodeAt(i);
      hash |= 0;
    }
    const safeHash = Math.abs(hash) % DAY_STEP;

    return BASE_SCORE + item.day * DAY_STEP + safeHash;
  };

  // Logique de tri
  const currentItems = useMemo(() => {
    return [...unsortedItems].sort((a, b) => {
      let res = 0;

      if (sortKey === "manual") {
        const posA = getEffectivePosition(a);
        const posB = getEffectivePosition(b);

        if (posA !== posB) {
          res = posA - posB;
        } else {
          // Fallback ultime stable
          res = a.instanceId.localeCompare(b.instanceId);
        }
      } else if (sortKey === "date") {
        res = a.day - b.day;
      } else if (sortKey === "amount") {
        res = a.amount - b.amount;
      } else if (sortKey === "label") {
        res = a.label.localeCompare(b.label);
      }

      return sortOrder === "asc" ? res : -res;
    });
  }, [unsortedItems, sortKey, sortOrder]);

  const quickStats = useMemo(() => {
    const stats = { expenses: { real: 0, planned: 0, pending: 0, extra: 0 }, income: { real: 0, planned: 0, pending: 0, extra: 0 } };
    currentItems.forEach((item) => {
      if (item.category === "Virement Interne") return;

      const isRefund =
        item.type === "INCOME" &&
        (item.category === "Dépenses" || item.category === "Remboursement" || categories.find((c) => c.name === item.category)?.type === "EXPENSE");

      let target;
      let amount = item.amount;

      if (item.type === "EXPENSE") {
        target = stats.expenses;
      } else if (isRefund) {
        target = stats.expenses;
        amount = -item.amount;
      } else {
        target = stats.income;
      }

      if (item.source === "VARIABLE") {
        if (item.isPaid) target.real += amount;
        else target.pending += amount;
      } else {
        const plannedAmount = item.type === "INCOME" && isRefund ? -item.originalAmount : item.originalAmount;
        target.planned += plannedAmount;
        if (item.isPaid) target.real += amount;
        else target.pending += amount;
      }

      if (item.isExtra) {
        target.extra += amount;
      }
    });
    return stats;
  }, [currentItems, categories]);

  const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(ui.currentDate);

  const handleItemClick = (item: PlannedItem) => {
    if (item.source === "RECURRING") {
      item.isPaid ? ui.openUncheckModal(item) : ui.openConfirmModal(item, accounts.find((a) => a.id === item.accountId)?.id || accounts[0]?.id || "");
    } else {
      const tx = variableTransactions.find((t) => t.id === item.instanceId);
      if (tx) {
        setEditingVar(tx);
        setIsVarFormOpen(true);
      }
    }
  };

  const handleExport = () => {
    if (currentItems.length === 0) return;
    const headers = ["Date", "Libellé", "Montant", "Type", "Catégorie", "Sous-Catégorie", "Bénéficiaire", "Compte", "Statut", "Note", "Tags"];
    const csvContent = [
      headers.join(";"),
      ...currentItems.map((item) => {
        const dateStr =
          item.paidDetails?.paymentDate ||
          `${ui.currentDate.getFullYear()}-${String(ui.currentDate.getMonth() + 1).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;
        const personName = people.find((p) => p.id === item.beneficiaryId)?.name || "";
        const accountName = accounts.find((a) => a.id === item.accountId)?.name || "";
        const status = item.isPaid ? "Réel" : "En attente";
        const type = item.type === "INCOME" ? "Revenu" : "Dépense";
        const amount = item.amount.toFixed(2).replace(".", ",");
        const itemTags = item.tagAmounts
          ? tags
              .filter((t) => item.tagAmounts?.some((ta) => ta.tagId === t.id))
              .map((t) => t.name)
              .join(", ")
          : "";
        const escapeCsv = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;
        return [
          dateStr,
          escapeCsv(item.label),
          amount,
          type,
          escapeCsv(item.category),
          escapeCsv(item.subCategory || ""),
          escapeCsv(personName),
          escapeCsv(accountName),
          status,
          escapeCsv(item.comments || ""),
          escapeCsv(itemTags),
        ].join(";");
      }),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `budget_export_${scope.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const defaultVarDate = (() => {
    const today = new Date();
    if (today.getMonth() === ui.currentDate.getMonth() && today.getFullYear() === ui.currentDate.getFullYear()) return today.toISOString().split("T")[0];
    if (scope === "PERIOD" && currentWeekData)
      return new Date(ui.currentDate.getFullYear(), ui.currentDate.getMonth(), currentWeekData.startDate, 12).toISOString().split("T")[0];
    return new Date().toISOString().split("T")[0];
  })();

  const sortOptions = [
    { key: "manual", label: "Manuel" },
    { key: "date", label: "Date" },
    { key: "label", label: "Libellé" },
    { key: "amount", label: "Montant" },
  ];

  // LOGIQUE ROBUSTE DE RÉORDONNANCEMENT AVEC GRANDS ENTIERS
  const handleReorder = (item: PlannedItem, oldIndex: number, newIndex: number) => {
    if (onMoveItem && sortKey === "manual") {
      // On simule le nouveau tableau pour trouver les voisins
      const reorderedList = arrayMove(currentItems, oldIndex, newIndex);

      const prevItem = reorderedList[newIndex - 1] as PlannedItem | undefined;
      const nextItem = reorderedList[newIndex + 1] as PlannedItem | undefined;

      // On utilise getEffectivePosition pour avoir un score valide et unique même si le voisin n'a pas de position DB
      const prevScore = prevItem ? getEffectivePosition(prevItem) : 0;

      // Si on est à la fin, on ajoute un pas arbitraire au dernier score (100 Millions = 1 Jour théorique)
      const nextScore = nextItem ? getEffectivePosition(nextItem) : prevScore + 100000000;

      // Nouvelle position = moyenne entière (Math.floor).
      // Avec l'échelle de 100 Milliards, cela donne suffisamment de précision.
      const newPosition = Math.floor((prevScore + nextScore) / 2);

      onMoveItem(item, newPosition);
    }
  };

  const isManualSort = sortKey === "manual";

  return (
    <div className="space-y-6">
      {feedback && <Toast type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <QuickPeriodSummary expenses={quickStats.expenses} income={quickStats.income} />

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <MonthNavigator date={ui.currentDate} onPrev={ui.handlePrevMonth} onNext={ui.handleNextMonth} />

            <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center justify-center shadow-sm">
              <button
                onClick={() => setScope("MONTH")}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  scope === "MONTH" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Calendar size={14} /> Mois
              </button>
              <button
                onClick={() => setScope("PERIOD")}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                  scope === "PERIOD" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <CalendarRange size={14} /> Période
              </button>
            </div>
          </div>
          <SearchBar value={ui.searchQuery} onChange={ui.setSearchQuery} />
        </div>

        {scope === "PERIOD" && <WeekSelector weeks={filteredWeeks} activeWeek={currentWeekIndex} onSelect={ui.setActiveWeek} searchQuery={ui.searchQuery} />}

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            accounts={accounts}
            people={people}
            hiddenFilters={["transfer"]}
            tags={tags}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {isManualSort ? (
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded flex items-center gap-1">
                  <GripVertical size={12} /> Drag & Drop Actif
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Passez en mode "Manuel" pour réorganiser.</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ListSorter
                options={sortOptions}
                currentSort={sortKey}
                currentOrder={sortOrder}
                onSortChange={(k, o) => {
                  setSortKey(k);
                  setSortOrder(o);
                  if (k === "manual" && sortKey !== "manual") setSortOrder("asc");
                }}
              />
            </div>
          </div>
        </div>

        <OperationsList
          items={currentItems}
          monthShort={monthShort}
          people={people}
          accounts={accounts}
          tags={tags}
          currentDate={ui.currentDate}
          onItemClick={handleItemClick}
          onAddClick={() => {
            setEditingVar(null);
            setIsVarFormOpen(true);
          }}
          onExport={handleExport}
          onReorder={isManualSort ? handleReorder : undefined}
        />
      </div>

      <PlannerModals
        confirmModal={ui.confirmModal}
        uncheckModal={ui.uncheckModal}
        accounts={accounts}
        tags={tags}
        onTogglePaid={onTogglePaid}
        onCloseConfirm={ui.closeConfirmModal}
        onCloseUncheck={ui.closeUncheckModal}
        setConfirmModal={ui.setConfirmModal}
      />

      <VariableTransactionForm
        isOpen={isVarFormOpen}
        onClose={() => setIsVarFormOpen(false)}
        accounts={accounts}
        categories={categories}
        people={people}
        tags={tags}
        onAddTransaction={onUpsertVariable}
        onDeleteTransaction={handleDeleteVariable}
        defaultDate={defaultVarDate}
        savedLabels={savedLabels}
        labelsSuggestions={settings.variable_labels}
        editingTransaction={editingVar}
        initialMode="STANDARD"
        lockMode={true}
      />
    </div>
  );
};
