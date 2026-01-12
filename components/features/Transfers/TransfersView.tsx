/**
 * @file Vue principale de gestion des transferts et mouvements de comptes (refactorisée)
 * @description Container orchestrateur qui délègue la logique métier aux hooks spécialisés
 * et l'affichage aux composants atomiques. Applique les principes Clean Code et Atomic Design.
 *
 * @architecture
 * **Refactorisation Clean Code :**
 * - Logique des filtres → `useTransfersFilters` (hooks/transfers)
 * - Logique des calculs → `useTransfersData` (hooks/transfers)
 * - UI navigation → Atomic Design (molecules/organisms)
 * - Container → `TransfersView` (ce fichier, ~150L)
 *
 * **Flux de données :**
 * ```
 * Props (App.tsx) → TransfersView
 *                      ↓
 *                ┌─────┴──────┐
 *                ↓            ↓
 *         useTransfersFilters  useTransfersData
 *         (état filtres)       (calculs/tri)
 *                ↓            ↓
 *              UI Components
 *         (KPIs, List, Forms)
 * ```
 *
 * @dependencies
 * - hooks/usePlannerUI : Navigation mois + recherche
 * - hooks/transfers : useTransfersFilters + useTransfersData
 * - components atomiques : MonthNavigator, SearchBar, InfoBox, etc.
 */
import React, { useState } from "react";
import { usePlannerUI } from "../../../hooks/usePlannerUI";
import { useError } from "../../../contexts/ErrorContext";
import { useTransfersFilters } from "../../../hooks/transfers/useTransfersFilters";
import { useTransfersData, isTransfer } from "../../../hooks/transfers/useTransfersData";
import { Account, Person, Transfer, AppSettings, SavedLabel, AccountType, VariableTransaction, CategoryDef } from "../../../types";
import { ArrowRightLeft, Filter, X, ArrowRight, GripVertical, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

// Imports UI Atomic
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { SearchBar } from "../../ui/atoms/SearchBar";
import { InfoBox } from "../../ui/InfoBox";
import { DataList } from "../../ui/molecules/DataList";
import { ListSorter } from "../../ui/molecules/ListSorter";
import { SortableRow } from "../../ui/molecules/SortableRow";

// Imports Feature Components
import { TransferForm } from "./components/TransferForm";
import { TransfersKPIs } from "./components/TransfersKPIs";

interface TransfersViewProps {
  transfers: Transfer[];
  variableTransactions: VariableTransaction[];
  accounts: Account[];
  people: Person[];
  settings: AppSettings;
  categories: CategoryDef[];
  savedLabels?: SavedLabel[];
  onUpsertTransfer: (t: Transfer) => void;
  onUpsertTransaction: (t: VariableTransaction) => void;
  onDeleteTransfer: (id: string) => void;
  onMoveTransfer?: (transfer: Transfer, newPosition: number) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  transfers,
  variableTransactions,
  accounts,
  _people,
  _settings,
  _categories,
  savedLabels,
  onUpsertTransfer,
  _onUpsertTransaction,
  onDeleteTransfer,
  onMoveTransfer,
}) => {
  const { showError } = useError();
  // --- HOOKS SPÉCIALISÉS (LOGIQUE DÉLÉGUÉE) ---

  // Navigation et recherche (UI state global)
  const ui = usePlannerUI();

  // Filtres avec persistance localStorage (187L extraites → useTransfersFilters)
  const filters = useTransfersFilters();

  // Calculs et transformations de données (454L extraites → useTransfersData)
  const { accountsWithBalances, currentItems, motifs, historyWithBalances, stats, getEffectivePosition } = useTransfersData({
    transfers,
    variableTransactions,
    accounts,
    currentDate: ui.currentDate,
    searchQuery: ui.searchQuery,
    selectedMotif: filters.selectedMotif,
    sortKey: filters.sortKey,
    sortOrder: filters.sortOrder,
    accountTypeFilter: filters.accountTypeFilter,
    specificAccountId: filters.specificAccountId,
    includeDirectOps: filters.includeDirectOps,
  });

  // --- ÉTAT LOCAL UI (MODALES, ÉDITION) ---

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);

  // --- HANDLERS ---

  /**
   * Ouvre le formulaire d'édition pour un virement.
   *
   * @param {Transfer | VariableTransaction} item - Item à éditer
   */
  const handleEdit = (item: Transfer | VariableTransaction) => {
    if (isTransfer(item)) {
      setEditingTransfer(item);
      setIsFormOpen(true);
    } else {
      // Opérations directes non supportées dans ce formulaire
      // À implémenter: utiliser VariableTransactionForm pour les opérations directes
      console.warn("Édition d'opération directe non supportée dans TransferForm");
    }
  };

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || "Inconnu";
  const isManualSort = filters.sortKey === "manual";
  const defaultDate = new Date().toISOString().split("T")[0];

  // --- DRAG & DROP ---

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * Gère la fin d'un drag & drop pour réorganiser les virements.
   *
   * @param {DragEndEvent} event - Événement DnD
   */
  const handleDragEnd = (event: DragEndEvent) => {
    try {
      if (!onMoveTransfer) return;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const transfersList = currentItems.filter((i) => i.source === "TRANSFER").map((i) => i.transferData!);
      const oldIndex = transfersList.findIndex((t) => t.id === active.id);
      const newIndex = transfersList.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const movedTransfer = transfersList[oldIndex];
      const reordered = arrayMove(transfersList, oldIndex, newIndex);

      let newPosition: number;
      if (newIndex === 0) {
        const nextPos = getEffectivePosition(reordered[1] as Transfer);
        newPosition = nextPos - 50_000_000;
      } else if (newIndex === reordered.length - 1) {
        const prevPos = getEffectivePosition(reordered[newIndex - 1] as Transfer);
        newPosition = prevPos + 50_000_000;
      } else {
        const prevPos = getEffectivePosition(reordered[newIndex - 1] as Transfer);
        const nextPos = getEffectivePosition(reordered[newIndex + 1] as Transfer);
        newPosition = Math.floor((prevPos + nextPos) / 2);
      }

      onMoveTransfer(movedTransfer, newPosition);
    } catch (err) {
      showError(err as Error, "Drag & drop de virement");
    }
  };

  const sortOptions = [
    { key: "manual", label: "Manuel" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Montant" },
    { key: "label", label: "Motif" },
  ];

  // --- RENDER ---

  return (
    <div className="space-y-6">
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* KPIs DÉPLACÉS EN HAUT */}
        <TransfersKPIs stats={stats} />

        <InfoBox
          title="Virements & Comptes"
          description="Suivez les mouvements entre vos comptes : virements internes, intérêts d'épargne et frais bancaires."
          icon={<ArrowRightLeft size={18} />}
        />

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <MonthNavigator date={ui.currentDate} onPrev={ui.handlePrevMonth} onNext={ui.handleNextMonth} />
          <SearchBar value={ui.searchQuery} onChange={ui.setSearchQuery} />
        </div>

        {/* FILTRES AVANC\u00c9S */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
          {/* Filtres par type de compte */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Wallet size={14} /> Type de Compte
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  filters.setAccountTypeFilter("ALL");
                  filters.setSpecificAccountId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  filters.accountTypeFilter === "ALL"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => {
                  filters.setAccountTypeFilter("CHECKING");
                  filters.setSpecificAccountId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                  filters.accountTypeFilter === "CHECKING"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                <Wallet size={12} /> Courants
              </button>
              <button
                onClick={() => {
                  filters.setAccountTypeFilter("SAVINGS");
                  filters.setSpecificAccountId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                  filters.accountTypeFilter === "SAVINGS"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                <PiggyBank size={12} /> Épargne
              </button>
            </div>
          </div>

          {/* Compte spécifique */}
          {filters.accountTypeFilter !== "ALL" && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compte Spécifique</span>
              <select
                value={filters.specificAccountId || ""}
                onChange={(e) => filters.setSpecificAccountId(e.target.value || null)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les {filters.accountTypeFilter === "CHECKING" ? "courants" : "d'épargne"}</option>
                {accounts
                  .filter((a) => a.type === (filters.accountTypeFilter === "CHECKING" ? AccountType.CHECKING : AccountType.SAVINGS))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Inclure opérations directes */}
          {filters.accountTypeFilter === "SAVINGS" && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                id="includeDirectOps"
                checked={filters.includeDirectOps}
                onChange={(e) => filters.setIncludeDirectOps(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="includeDirectOps" className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-600" />
                Inclure intérêts & frais bancaires
              </label>
            </div>
          )}

          {/* Solde évolutif (si compte spécifique) */}
          {filters.specificAccountId && historyWithBalances.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Solde actuel</span>
                <span
                  className={`text-lg font-black ${historyWithBalances[historyWithBalances.length - 1].balanceAfter >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {historyWithBalances[historyWithBalances.length - 1].balanceAfter.toFixed(2)} €
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BARRE DE FILTRES MOTIFS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Filter size={14} /> Filtrer par Motif
              </span>
              {filters.selectedMotif && (
                <button
                  onClick={() => filters.setSelectedMotif(null)}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 uppercase transition-colors"
                >
                  <X size={12} /> Effacer filtre
                </button>
              )}
            </div>

            {motifs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {motifs.map((motif) => (
                  <button
                    key={motif}
                    onClick={() => filters.setSelectedMotif(filters.selectedMotif === motif ? null : motif)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      filters.selectedMotif === motif
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {motif}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucun mouvement ce mois-ci.</p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <ListSorter
              options={sortOptions}
              currentSort={filters.sortKey}
              currentOrder={filters.sortOrder}
              onSortChange={(k, o) => {
                filters.setSortKey(k);
                filters.setSortOrder(o);
                if (k === "manual" && filters.sortKey !== "manual") filters.setSortOrder("asc");
              }}
            />
          </div>
        </div>

        <DataList
          title={filters.specificAccountId ? `Historique ${accounts.find((a) => a.id === filters.specificAccountId)?.name || ""}` : "Tous les Mouvements"}
          count={currentItems.length}
          onAdd={() => {
            setEditingTransfer(null);
            setIsFormOpen(true);
          }}
          addButtonLabel="Nouveau mouvement"
          emptyMessage="Aucun mouvement trouvé pour cette période."
        >
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={currentItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {currentItems.map((item) => (
                <SortableRow key={item.id} id={item.id} disabled={!isManualSort || item.source !== "TRANSFER"}>
                  <div onClick={() => handleEdit(item)} className="p-4 flex items-center gap-4 group transition-all cursor-pointer hover:bg-slate-50">
                    <div className="flex-shrink-0 w-12 text-center flex flex-col items-center justify-center rounded-lg py-1 border bg-slate-50 border-slate-100">
                      <span className="text-sm font-bold block text-slate-700 leading-none">{new Date(item.date).getDate()}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none mt-0.5">
                        {new Date(item.date).toLocaleDateString("fr-FR", { month: "short" })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate mb-1">{item.label}</div>
                      <div className="flex items-center gap-2 text-xs">
                        {item.source === "TRANSFER" ? (
                          <>
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-medium">
                              {getAccountName(item.sourceAccountId!)}
                            </span>
                            <ArrowRight size={12} className="text-slate-400" />
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-medium">
                              {getAccountName(item.destinationAccountId!)}
                            </span>
                          </>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded font-medium ${
                              item.amount > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                            }`}
                          >
                            {item.amount > 0 ? "Crédit" : "Débit"} · {getAccountName(item.accountId!)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className={`text-right font-black text-base ${item.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.amount >= 0 ? "+" : ""}
                        {Math.abs(item.amount).toFixed(2)} €
                      </div>
                      {filters.specificAccountId && "balanceAfter" in item && (
                        <div className="text-xs text-slate-400 font-medium">Solde: {item.balanceAfter.toFixed(2)} €</div>
                      )}
                    </div>
                  </div>
                </SortableRow>
              ))}
            </SortableContext>
          </DndContext>
        </DataList>
      </div>

      <TransferForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        accounts={accountsWithBalances}
        savedLabels={savedLabels}
        editingTransfer={editingTransfer}
        defaultDate={defaultDate}
        onUpsertTransfer={onUpsertTransfer}
        onDeleteTransfer={onDeleteTransfer}
      />
    </div>
  );
};
