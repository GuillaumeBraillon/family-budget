import React, { useState } from "react";
import { usePlannerUI } from "../../../hooks/usePlannerUI";
import { usePlanner } from "../../../hooks/usePlanner";
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
import { Calendar, CalendarRange, GripVertical } from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";

// Imports UI Atomic (Generic)
import { Toast } from "../../ui/Toast";
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { FilterBar } from "../../ui/molecules/FilterBar";
import { WeekSelector } from "../../ui/molecules/WeekSelector";
import { QuickPeriodSummary } from "../../ui/molecules/QuickPeriodSummary";
import { SearchBar } from "../../ui/atoms/SearchBar";
import { ListSorter } from "../../ui/molecules/ListSorter";

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
  // Hooks spécialisés (responsabilités déléguées)
  const ui = usePlannerUI(initialDate, initialWeek);
  const { filters, setFilters, resetFilters } = useOperationsFilters(initialFilters);
  const { sortKey, sortOrder, setSorting, sortItems, isManualSort, sortOptions, getEffectivePosition } = useOperationsSorting();
  const [scope, setScope] = useState<"MONTH" | "PERIOD">("PERIOD");

  // Récupération des périodes pour le WeekSelector
  const checkingAccounts = accounts.filter((a) => a.type === "COURANT");
  const { filteredPeriodBudgets } = usePlanner(configs, incomeConfigs, paidItems, variableTransactions, ui.currentDate, ui.searchQuery, settings, categories, filters);

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
  const handleDeleteVariable = (id: string) => {
    onDeleteVariable(id);
    setFeedback({ type: "success", message: "Opération supprimée" });
    setTimeout(() => setFeedback(null), 3000);
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
    return new Date().toISOString().split("T")[0];
  })();

  // DRAG & DROP : SYSTÈME D'INTERVALLES LARGES (Scalable)
  const handleReorder = (item: PlannedItem, oldIndex: number, newIndex: number) => {
    if (onMoveItem && sortKey === "manual") {
      // 1. Simuler le nouveau tableau après déplacement
      const reorderedList = arrayMove(currentItems, oldIndex, newIndex);

      const prevItem = reorderedList[newIndex - 1] as PlannedItem | undefined;
      const nextItem = reorderedList[newIndex + 1] as PlannedItem | undefined;

      // 2. Calculer la nouvelle position entre les voisins
      const POSITION_STEP = 1000; // Intervalles larges (1000, 2000, 3000...)

      let newPosition: number;

      if (!prevItem && !nextItem) {
        // Liste vide
        newPosition = POSITION_STEP;
      } else if (!prevItem) {
        // Première position : moitié du suivant (ou suivant - 1000)
        const nextPos = nextItem!.position || getEffectivePosition(nextItem!);
        newPosition = nextPos > POSITION_STEP ? Math.floor(nextPos / 2) : 1;
      } else if (!nextItem) {
        // Dernière position : précédent + 1000
        const prevPos = prevItem.position || getEffectivePosition(prevItem);
        newPosition = prevPos + POSITION_STEP;
      } else {
        // Entre deux items : moyenne
        const prevPos = prevItem.position || getEffectivePosition(prevItem);
        const nextPos = nextItem.position || getEffectivePosition(nextItem);

        // Si l'espace est trop petit (< 2), on force un rééchelonnement local
        if (nextPos - prevPos < 2) {
          // Réaffecter uniquement les 3 items (prev, current, next) avec intervalles larges
          newPosition = prevPos + POSITION_STEP;
          // Note: On pourrait aussi réaffecter nextItem à prevPos + 2*POSITION_STEP
        } else {
          newPosition = Math.floor((prevPos + nextPos) / 2);
        }
      }

      // 3. Persister uniquement l'item déplacé (1 seule requête DB)
      onMoveItem(item, newPosition);
    }
  };

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

        {scope === "PERIOD" && <WeekSelector weeks={filteredPeriodBudgets} activeWeek={ui.activeWeek} onSelect={ui.setActiveWeek} searchQuery={ui.searchQuery} />}

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <FilterBar filters={filters} onFilterChange={setFilters} accounts={accounts} people={people} hiddenFilters={["transfer"]} tags={tags} onReset={resetFilters} />
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
              <ListSorter options={sortOptions} currentSort={sortKey} currentOrder={sortOrder} onSortChange={setSorting} />
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
