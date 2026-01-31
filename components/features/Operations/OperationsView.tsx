import React, { useState } from "react";
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
  const { showError } = useError();
  const { exportToCsv, escapeCsv, formatNumberFr } = useCsvExport();

  // Hooks spécialisés (responsabilités déléguées)
  const ui = usePlannerUI(initialDate, initialWeek);
  const { filters, setFilters, resetFilters } = useOperationsFilters(initialFilters);
  const {
    sortKey,
    sortOrder,
    setSorting,
    sortItems,
    isManualSort,
    sortOptions,
    getEffectivePosition: _getEffectivePosition,
    canToggleOrder,
  } = useOperationsSorting();
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

  // État UI local
  const [isVarFormOpen, setIsVarFormOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariableTransaction | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Tri des items
  const currentItems = sortItems(unsortedItems);

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

  // DRAG & DROP : SYSTÈME D'INTERVALLES LARGES (Scalable)
  const handleReorder = (item: PlannedItem, oldIndex: number, newIndex: number) => {
    try {
      if (onMoveItem && sortKey === "manual") {
        logger.debug("drag-drop", "Début handleReorder", {
          item: item.label,
          oldIndex,
          newIndex,
          sortOrder,
          currentPosition: item.position,
        });

        // 1. Simuler le nouveau tableau après déplacement
        const reorderedList: PlannedItem[] = arrayMove(currentItems, oldIndex, newIndex);

        // IMPORTANT : En mode DESC, l'ordre visuel est inversé
        // prev devient next et vice-versa pour le calcul des positions
        const isDescending = sortOrder === "desc";
        const prevItem = (isDescending ? reorderedList[newIndex + 1] : reorderedList[newIndex - 1]) as PlannedItem | undefined;
        const nextItem = (isDescending ? reorderedList[newIndex - 1] : reorderedList[newIndex + 1]) as PlannedItem | undefined;

        // 2. Calculer la nouvelle position entre les voisins
        const POSITION_STEP = 1000; // Intervalles larges (1000, 2000, 3000...)
        const MIN_POSITION = 1; // Position minimale
        const MAX_MANUAL = 999_999; // Position manuelle max (< 1M)

        // Helper : Récupère la position manuelle ou null (< 1M = manuel, >= 1M = auto)
        const getManualPosition = (item: PlannedItem | undefined): number | null => {
          if (!item) return null;
          // Les positions manuelles sont < 1M (1, 2, 3... 999999)
          // Les positions automatiques sont >= 1M (générées par jour + hash)
          return item.position && item.position > 0 && item.position < 1_000_000 ? item.position : null;
        };

        const prevPos = getManualPosition(prevItem);
        const nextPos = getManualPosition(nextItem);

        let newPosition: number;

        if (!prevItem && !nextItem) {
          // Liste vide
          newPosition = POSITION_STEP;
        } else if (!prevItem) {
          // Première position
          if (nextPos !== null && nextPos > POSITION_STEP) {
            // Il y a de l'espace avant le suivant
            newPosition = Math.floor(nextPos / 2);
          } else {
            // Pas d'espace : assigner 1, décaler le suivant
            newPosition = MIN_POSITION;
            if (nextItem) onMoveItem(nextItem, POSITION_STEP);
          }
        } else if (!nextItem) {
          // Dernière position
          if (prevPos !== null && prevPos < MAX_MANUAL - POSITION_STEP) {
            newPosition = prevPos + POSITION_STEP;
          } else {
            // Prev n'a pas de position ou trop proche de la limite
            if (prevItem) onMoveItem(prevItem, MAX_MANUAL - POSITION_STEP);
            newPosition = MAX_MANUAL;
          }
        } else {
          // Entre deux items
          if (prevPos !== null && nextPos !== null) {
            // Les deux ont des positions manuelles
            const gap = nextPos - prevPos;
            if (gap > 2) {
              // Espace suffisant : moyenne
              newPosition = Math.floor((prevPos + nextPos) / 2);
            } else {
              // Espace trop petit : forcer un écart en décalant tout vers le haut
              newPosition = prevPos + POSITION_STEP;
              // Décaler tous les items suivants de +POSITION_STEP
              for (let i = newIndex + 1; i < reorderedList.length; i++) {
                const futureItem = reorderedList[i];
                const futurePos = getManualPosition(futureItem);
                if (futurePos !== null) {
                  onMoveItem(futureItem, futurePos + POSITION_STEP);
                }
              }
            }
          } else if (prevPos !== null && nextPos === null) {
            // Seul prev a une position
            newPosition = prevPos + POSITION_STEP;
            if (nextItem) onMoveItem(nextItem, prevPos + 2 * POSITION_STEP);
          } else if (prevPos === null && nextPos !== null) {
            // Seul next a une position
            if (nextPos > POSITION_STEP) {
              if (prevItem) onMoveItem(prevItem, nextPos - 2 * POSITION_STEP);
              newPosition = nextPos - POSITION_STEP;
            } else {
              if (prevItem) onMoveItem(prevItem, MIN_POSITION);
              newPosition = POSITION_STEP;
              if (nextItem) onMoveItem(nextItem, 2 * POSITION_STEP);
            }
          } else {
            // Aucun des deux n'a de position : initialiser séquentiellement
            if (prevItem) onMoveItem(prevItem, POSITION_STEP);
            newPosition = 2 * POSITION_STEP;
            if (nextItem) onMoveItem(nextItem, 3 * POSITION_STEP);
          }
        }

        // 3. Persister l'item déplacé
        onMoveItem(item, newPosition);
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
