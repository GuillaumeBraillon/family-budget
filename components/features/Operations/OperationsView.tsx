import React, { useState, useEffect } from "react";
import { usePlannerUI } from "../../../hooks/usePlannerUI";
import { usePlanner } from "../../../hooks/usePlanner";
import { useError } from "../../../contexts/ErrorContext";
import { useCsvExport } from "../../../hooks/useCsvExport";
import { useOperationsFilters, useOperationsSorting, useOperationsData } from "../../../hooks/operations";
import { usePeriodNav } from "../../../contexts/PeriodNavigationContext";
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

// Imports UI Atomic (Generic)
import { Toast } from "../../ui/Toast";
import { PeriodNavigationBar } from "../../ui/molecules/PeriodNavigationBar";
import { FilterBar } from "../../ui/molecules/FilterBar";
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
  onVariableCreated?: (type: "EXPENSE" | "INCOME") => void;
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
  onVariableCreated,
}) => {
  const { showError } = useError();
  const { exportToCsv, escapeCsv, formatNumberFr } = useCsvExport();

  // Navigation partagée (contexte global, persistante entre vues)
  const { currentDate, scope, setScope, activeWeek, setActiveWeek, setCurrentDate } = usePeriodNav();

  // Sync initialDate/initialWeek depuis navigations externes (ex: Dashboard → Operations)
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
      if (initialWeek !== undefined) {
        setActiveWeek(initialWeek);
        setScope("PERIOD");
      } else {
        setScope("MONTH");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI local : modales + recherche
  const ui = usePlannerUI();
  const { filters, setFilters, resetFilters } = useOperationsFilters(initialFilters);

  // Récupération des périodes pour le WeekSelector
  const _checkingAccounts = accounts.filter((a) => a.type === "COURANT");
  const { filteredPeriodBudgets } = usePlanner(
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    currentDate,
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
    currentDate,
    searchQuery: ui.searchQuery,
    settings,
    categories,
    filters,
    scope,
    activeWeek,
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

  const handleUpsertVariable = async (transaction: VariableTransaction) => {
    const isCreation = !editingVar;
    await onUpsertVariable(transaction);
    if (isCreation) {
      onVariableCreated?.(transaction.type);
    }
  };

  const handleItemClick = (item: PlannedItem) => {
    if (item.source === "RECURRING") {
      if (item.isPaid) {
        ui.openUncheckModal(item);
      } else {
        ui.openConfirmModal(item, accounts.find((a) => a.id === item.accountId)?.id || accounts[0]?.id || "");
      }
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
        `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;
      const personName =
        item.beneficiaryAmounts && item.beneficiaryAmounts.length > 0
          ? item.beneficiaryAmounts
              .map((beneficiaryAmount) => {
                const person = people.find((p) => p.id === beneficiaryAmount.beneficiaryId);
                return person ? `${person.name} (${beneficiaryAmount.amount.toFixed(2)}€)` : "";
              })
              .filter(Boolean)
              .join(" | ")
          : people.find((p) => p.id === item.beneficiaryId)?.name || "";
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
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) return today.toISOString().split("T")[0];
    return new Date().toISOString().split("T")[0];
  })();

  // DRAG & DROP : SYSTÈME ROBUSTE BASÉ SUR ARRAY DETERMINISTE
  const handleReorder = (item: PlannedItem, oldIndex: number, newIndex: number) => {
    try {
      if (onMoveItem && sortKey === "manual") {
        // Avec le nouveau système, on passe simplement l'item et le nouvel index global
        // Le hook useBudget s'occupera de mettre à jour l'array complet
        onMoveItem(item, newIndex);
      }
    } catch (err) {
      showError(err as Error, "Drag & drop d'opération");
    }
  };

  return (
    <div className="flex flex-col gap-1.5 md:gap-2 m-2">
      {feedback && <Toast type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />}

      {/* Navigation de période */}
      <PeriodNavigationBar filteredPeriodBudgets={filteredPeriodBudgets}>
        <SearchBar value={ui.searchQuery} onChange={ui.setSearchQuery} />
      </PeriodNavigationBar>

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
        currentDate={currentDate}
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
        people={people}
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
        onAddTransaction={handleUpsertVariable}
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
