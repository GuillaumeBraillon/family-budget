import React, { useState, useCallback } from "react";
import { usePlannerUI } from "../../../hooks/usePlannerUI";
import { usePlanner } from "../../../hooks/usePlanner";
import { useError } from "../../../contexts/ErrorContext";
import { useCsvExport } from "../../../hooks/useCsvExport";
import { useOperationsFilters, useOperationsSorting, useOperationsData } from "../../../hooks/operations";
import {
  ExpenseConfig,
  IncomeConfig,
  Account,
  Person,
  PaidItemDetails,
  PlannedItem,
  AppSettings,
  VariableTransaction,
  SavedLabel,
  Tag,
  CategoryDef,
  OperationFilters,
} from "../../../types";
import { arrayMove } from "@dnd-kit/sortable";
import { logger } from "../../../services/logger";

// Imports UI Atomic (Generic)
import { Toast } from "../../ui/Toast";
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { ScopeSelector } from "../../ui/molecules/ScopeSelector";
import { FilterBar } from "../../ui/molecules/FilterBar";
import { WeekSelector } from "../../ui/molecules/WeekSelector";
import { QuickPeriodSummary } from "../../ui/molecules/QuickPeriodSummary";
import { SearchBar } from "../../ui/atoms/SearchBar";

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
  onMoveItem?: (item: PlannedItem, newIndex: number) => void;
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
  const { showError } = useError();
  const { exportToCsv, escapeCsv, formatNumberFr } = useCsvExport();

  // Hooks spécialisés (responsabilités déléguées)
  const ui = usePlannerUI(initialDate, initialWeek);
  const { filters, setFilters, resetFilters } = useOperationsFilters(initialFilters);
  // Scope intelligent : PERIOD par défaut (ou si initialWeek fourni), MONTH si navigation sans période spécifique
  const [scope, setScope] = useState<"MONTH" | "PERIOD">(() => {
    // Si initialWeek === undefined ET initialDate === undefined, on arrive directement → PERIOD
    // Si initialWeek fourni (navigation depuis AnnualIncomeAnalysis) → PERIOD
    // Si initialDate fourni SANS initialWeek (GlobalMonthlyAnalysis) → MONTH
    if (initialWeek !== undefined) return "PERIOD";
    if (initialDate !== undefined) return "MONTH";
    return "PERIOD";
  });

  // Récupération des périodes pour le WeekSelector
  const _checkingAccounts = accounts.filter((a) => a.type === "COURANT");
  const { filteredPeriodBudgets } = usePlanner(
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    ui.currentDate,
    ui.searchQuery,
    settings,
    categories,
    filters
  );

  const { unsortedItems, quickStats, monthShort } = useOperationsData({
    accounts,
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    currentDate: ui.currentDate,
    searchQuery: ui.searchQuery,
    settings,
    categories,
    filters,
    scope,
    activeWeek: ui.activeWeek,
  });

  // Hook de tri avec callback de persistance
  const {
    sortKey,
    sortOrder,
    setSorting,
    sortItems: sortItemsWithCallback,
    isManualSort,
    sortOptions,
    canToggleOrder,
  } = useOperationsSorting(settings.operations_sorting || []);

  // État UI local
  const [isVarFormOpen, setIsVarFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariableTransaction | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Tri des items
  const currentItems = sortItemsWithCallback(unsortedItems);

  // Handlers
  const handleDeleteVariable = async (id: string) => {
    try {
      await onDeleteVariable(id);
      setFeedback({ type: "success", message: "Opération supprimée" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      showError(err as Error, "Suppression d'opération variable");
    }
  };

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

    const rows = currentItems.map((item) => {
      const dateStr =
        item.paidDetails?.paymentDate ||
        `${ui.currentDate.getFullYear()}-${String(ui.currentDate.getMonth() + 1).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;
      const personName = people.find((p) => p.id === item.beneficiaryId)?.name || "";
      const accountName = accounts.find((a) => a.id === item.accountId)?.name || "";
      const status = item.isPaid ? "Réel" : "En attente";
      const type = item.type === "INCOME" ? "Revenu" : "Dépense";
      const amount = formatNumberFr(item.amount);
      const itemTags = item.tagAmounts
        ? tags
            .filter((t) => item.tagAmounts?.some((ta) => ta.tagId === t.id))
            .map((t) => t.name)
            .join(", ")
        : "";

      return [
        escapeCsv(dateStr),
        escapeCsv(item.label),
        amount,
        escapeCsv(type),
        escapeCsv(item.category),
        escapeCsv(item.subCategory || ""),
        escapeCsv(personName),
        escapeCsv(accountName),
        escapeCsv(status),
        escapeCsv(item.comments || ""),
        escapeCsv(itemTags),
      ];
    });

    exportToCsv(headers, rows, `budget_operations_${scope.toLowerCase()}`);
  };

  const defaultVarDate = (() => {
    const today = new Date();
    if (today.getMonth() === ui.currentDate.getMonth() && today.getFullYear() === ui.currentDate.getFullYear()) return today.toISOString().split("T")[0];
    return new Date().toISOString().split("T")[0];
  })();

  // DRAG & DROP : SYSTÈME ROBUSTE BASÉ SUR ARRAY DETERMINISTE
  const handleReorder = (item: PlannedItem, oldIndex: number, newIndex: number) => {
    try {
      if (onMoveItem && sortKey === "manual") {
        logger.debug("drag-drop", "Début handleReorder (Array)", {
          item: item.label,
          oldIndex,
          newIndex,
        });

        // Avec le nouveau système, on passe simplement l'item et le nouvel index global
        // Le hook useBudget s'occupera de mettre à jour l'array complet
        onMoveItem(item, newIndex);
      }
    } catch (err) {
      showError(err as Error, "Drag & drop d'opération");
    }
  };

  return (
    <div className="space-y-1 animate-in fade-in duration-500">
      {feedback && <Toast type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />}

      {/* Navigation de période */}
      <div className="flex flex-row gap-1.5 md:gap-2 items-center flex-wrap">
        <MonthNavigator date={ui.currentDate} onPrev={ui.handlePrevMonth} onNext={ui.handleNextMonth} />
        <ScopeSelector scope={scope} onScopeChange={setScope} />
        {scope === "PERIOD" && (
          <WeekSelector weeks={filteredPeriodBudgets} activeWeek={ui.activeWeek} onSelect={ui.setActiveWeek} searchQuery={ui.searchQuery} />
        )}
        <div className="ml-auto">
          <SearchBar value={ui.searchQuery} onChange={ui.setSearchQuery} />
        </div>
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          accounts={accounts}
          people={people}
          hiddenFilters={["transfer"]}
          tags={tags}
          onReset={resetFilters}
          sortOptions={sortOptions}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSortChange={setSorting}
          canToggleOrder={canToggleOrder}
        />
      </div>

      <QuickPeriodSummary expenses={quickStats.expenses} income={quickStats.income} />

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
