import React, { useState, useMemo } from "react";
import { usePlannerUI } from "../../../hooks/usePlannerUI";
import { Account, Person, Transfer, AppSettings, SavedLabel, AccountType, VariableTransaction, CategoryDef } from "../../../types";
import { ArrowRightLeft, Filter, X, ArrowRight, GripVertical, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";

// Imports UI Atomic
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { SearchBar } from "../../ui/atoms/SearchBar";
import { InfoBox } from "../../ui/InfoBox";
import { DataList } from "../../ui/molecules/DataList";
import { ListSorter, SortOrder } from "../../ui/molecules/ListSorter";
import { SortableRow } from "../../ui/molecules/SortableRow";

// Imports Feature Components
import { VariableTransactionForm } from "../Operations/components/VariableTransactionForm";
import { TransfersKPIs } from "./components/TransfersKPIs";

// Type guard pour différencier Transfer et VariableTransaction
const isTransfer = (item: any): item is Transfer => "sourceAccountId" in item;

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
  people,
  settings,
  categories,
  savedLabels,
  onUpsertTransfer,
  onUpsertTransaction,
  onDeleteTransfer,
  onMoveTransfer,
}) => {
  const ui = usePlannerUI();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [selectedMotif, setSelectedMotif] = useState<string | null>(null);

  // Filtres avancés - AVEC PERSISTANCE localStorage
  const [accountTypeFilter, setAccountTypeFilter] = useState<"ALL" | "CHECKING" | "SAVINGS">(() => {
    const saved = localStorage.getItem("transfersView_accountType");
    return (saved as any) || "ALL";
  });
  const [specificAccountId, setSpecificAccountId] = useState<string | null>(() => {
    return localStorage.getItem("transfersView_specificAccount") || null;
  });
  const [includeDirectOps, setIncludeDirectOps] = useState(() => {
    const saved = localStorage.getItem("transfersView_includeDirectOps");
    return saved ? saved === "true" : true;
  });

  // Tri - AVEC PERSISTANCE
  const [sortKey, setSortKey] = useState<string>(() => {
    return localStorage.getItem("transfersView_sortKey") || "manual";
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    return (localStorage.getItem("transfersView_sortOrder") as SortOrder) || "asc";
  });

  // Sauvegarder les préférences dans localStorage
  React.useEffect(() => {
    localStorage.setItem("transfersView_accountType", accountTypeFilter);
  }, [accountTypeFilter]);

  React.useEffect(() => {
    if (specificAccountId) {
      localStorage.setItem("transfersView_specificAccount", specificAccountId);
    } else {
      localStorage.removeItem("transfersView_specificAccount");
    }
  }, [specificAccountId]);

  React.useEffect(() => {
    localStorage.setItem("transfersView_includeDirectOps", String(includeDirectOps));
  }, [includeDirectOps]);

  React.useEffect(() => {
    localStorage.setItem("transfersView_sortKey", sortKey);
  }, [sortKey]);

  React.useEffect(() => {
    localStorage.setItem("transfersView_sortOrder", sortOrder);
  }, [sortOrder]);

  // Calcul de position effective pour le tri manuel (DOIT être avant useMemo)
  const getEffectivePosition = (transfer: Transfer) => {
    if (typeof transfer.position === "number" && transfer.position !== 0) return transfer.position;

    const BASE_SCORE = 100_000_000_000;
    const DAY_STEP = 100_000_000;

    let hash = 0;
    for (let i = 0; i < transfer.id.length; i++) {
      hash = (hash << 5) - hash + transfer.id.charCodeAt(i);
      hash |= 0;
    }
    const safeHash = Math.abs(hash) % DAY_STEP;
    const dayOfMonth = new Date(transfer.date).getDate();

    return BASE_SCORE + dayOfMonth * DAY_STEP + safeHash;
  };

  // --- CALCUL DES SOLDES EFFECTIFS (EPARGNE) ---
  const accountsWithBalances = useMemo(() => {
    return accounts.map((acc) => {
      if (acc.type === AccountType.SAVINGS) {
        const balance = transfers.reduce((sum, t) => {
          if (t.destinationAccountId === acc.id) return sum + t.amount;
          if (t.sourceAccountId === acc.id) return sum - t.amount;
          return sum;
        }, 0);
        return { ...acc, currentBalance: balance };
      }
      return acc;
    });
  }, [accounts, transfers]);

  // --- FILTRAGE ET TRI DES TRANSFERTS ET OP\u00c9RATIONS DIRECTES ---
  const { currentItems, motifs, historyWithBalances } = useMemo(() => {
    const currentMonth = ui.currentDate.getMonth();
    const currentYear = ui.currentDate.getFullYear();
    const foundMotifs = new Set<string>();

    // 1. Filtrer les transferts par mois
    let filteredTransfers = transfers.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // 2. Filtrer les opérations directes (si incluses) - UNIQUEMENT COMPTES ÉPARGNE
    let filteredDirectOps: VariableTransaction[] = [];
    if (includeDirectOps) {
      filteredDirectOps = variableTransactions.filter((tx) => {
        const d = new Date(tx.date);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;

        // IMPORTANT : Ne garder QUE les opérations sur comptes d'épargne (intérêts, frais)
        const txAccount = accounts.find((a) => a.id === tx.accountId);
        return txAccount?.type === AccountType.SAVINGS;
      });
    }

    // 3. Appliquer le filtre par type de compte
    if (accountTypeFilter !== "ALL") {
      const filterType = accountTypeFilter === "CHECKING" ? AccountType.CHECKING : AccountType.SAVINGS;

      filteredTransfers = filteredTransfers.filter((t) => {
        const source = accounts.find((a) => a.id === t.sourceAccountId);
        const dest = accounts.find((a) => a.id === t.destinationAccountId);
        return source?.type === filterType || dest?.type === filterType;
      });

      filteredDirectOps = filteredDirectOps.filter((tx) => {
        const acc = accounts.find((a) => a.id === tx.accountId);
        return acc?.type === filterType;
      });
    }

    // 4. Appliquer le filtre par compte sp\u00e9cifique
    if (specificAccountId) {
      filteredTransfers = filteredTransfers.filter((t) => t.sourceAccountId === specificAccountId || t.destinationAccountId === specificAccountId);
      filteredDirectOps = filteredDirectOps.filter((tx) => tx.accountId === specificAccountId);
    }

    // 5. Appliquer recherche
    if (ui.searchQuery) {
      const q = ui.searchQuery.toLowerCase();
      filteredTransfers = filteredTransfers.filter((t) => t.label.toLowerCase().includes(q) || t.amount.toString().includes(q));
      filteredDirectOps = filteredDirectOps.filter((tx) => tx.label.toLowerCase().includes(q) || tx.amount.toString().includes(q));
    }

    // 6. Appliquer filtre motif
    if (selectedMotif) {
      filteredTransfers = filteredTransfers.filter((t) => t.label === selectedMotif);
      filteredDirectOps = filteredDirectOps.filter((tx) => tx.label === selectedMotif);
    }

    // 7. Unifier les flux pour l'affichage et le calcul de solde
    const combinedOps = [
      ...filteredTransfers.map((t) => ({
        id: t.id,
        date: t.date,
        label: t.label,
        amount: t.amount,
        source: "TRANSFER" as const,
        sourceAccountId: t.sourceAccountId,
        destinationAccountId: t.destinationAccountId,
        createdAt: t.createdAt,
        position: t.position,
        transferData: t,
      })),
      ...filteredDirectOps.map((tx) => ({
        id: tx.id,
        date: tx.date,
        label: tx.label,
        amount: tx.type === "INCOME" ? tx.amount : -tx.amount,
        source: "DIRECT" as const,
        accountId: tx.accountId,
        type: tx.type,
        createdAt: tx.id,
        position: tx.position,
        directOpData: tx,
      })),
    ];

    // 8. Tri
    const sorted = combinedOps.sort((a, b) => {
      let res = 0;
      if (sortKey === "manual") {
        const posA = "transferData" in a ? getEffectivePosition(a.transferData!) : a.position || 0;
        const posB = "transferData" in b ? getEffectivePosition(b.transferData!) : b.position || 0;
        if (posA !== posB) {
          res = posA - posB;
        } else {
          res = a.id.localeCompare(b.id);
        }
      } else if (sortKey === "amount") {
        res = Math.abs(a.amount) - Math.abs(b.amount);
      } else if (sortKey === "label") {
        res = a.label.localeCompare(b.label);
      } else {
        // 'date'
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) res = dateDiff;
        else res = (a.createdAt || "").localeCompare(b.createdAt || "");
      }
      return sortOrder === "asc" ? res : -res;
    });

    // 9. Extraction des motifs
    [...filteredTransfers, ...filteredDirectOps].forEach((item) => {
      foundMotifs.add(item.label);
    });

    // 10. Calcul du solde \u00e9volutif (si compte sp\u00e9cifique s\u00e9lectionn\u00e9)
    let history: Array<Transfer | VariableTransaction> = [];
    if (specificAccountId) {
      const chronological = [...combinedOps].sort((a, b) => {
        const timeDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });

      let runningBalance = 0;
      history = chronological.map((item) => {
        let deltaForAccount = 0;

        if (isTransfer(item)) {
          const isCredit = item.destinationAccountId === specificAccountId;
          deltaForAccount = isCredit ? item.amount : -item.amount;
        } else {
          // Direct op: amount d\u00e9j\u00e0 sign\u00e9
          deltaForAccount = item.amount;
        }

        runningBalance += deltaForAccount;
        return { ...item, balanceAfter: runningBalance };
      });
    }

    return { currentItems: sorted, motifs: Array.from(foundMotifs).sort(), historyWithBalances: history };
  }, [
    transfers,
    variableTransactions,
    ui.currentDate,
    ui.searchQuery,
    selectedMotif,
    sortKey,
    sortOrder,
    accountTypeFilter,
    specificAccountId,
    includeDirectOps,
    accounts,
  ]);

  // --- CALCUL DES INDICATEURS ---
  const stats = useMemo(() => {
    let toSavings = 0;
    let fromSavings = 0;
    let internalChecking = 0;

    currentItems.filter(isTransfer).forEach((item) => {
      const source = accounts.find((a) => a.id === item.sourceAccountId);
      const dest = accounts.find((a) => a.id === item.destinationAccountId);

      const isSourceSavings = source?.type === AccountType.SAVINGS;
      const isDestSavings = dest?.type === AccountType.SAVINGS;

      if (isDestSavings && !isSourceSavings) {
        toSavings += item.amount;
      } else if (isSourceSavings && !isDestSavings) {
        fromSavings += item.amount;
      } else if (!isSourceSavings && !isDestSavings) {
        internalChecking += item.amount;
      }
    });

    return { toSavings, fromSavings, internalChecking };
  }, [currentItems, accounts]);

  const handleEdit = (item: Transfer | VariableTransaction) => {
    if (isTransfer(item)) {
      // Mapping Transfer -> VariableTransaction pour réutiliser le formulaire
      const mockTx: Partial<VariableTransaction> = {
        id: item.id,
        date: item.date,
        label: item.label,
        amount: item.amount,
        category: "Virement Interne",
        accountId: item.sourceAccountId, // Source par défaut pour l'édition
        isWaiting: false,
        isExtra: false,
        type: "EXPENSE",
        // On utilise comments pour passer l'ID de destination au formulaire via le mode 'TRANSFER'
        comments: item.destinationAccountId,
      };
      setEditingTransfer(item); // On garde le vrai objet pour la suppression
      setEditingVar(mockTx);
      setIsFormOpen(true);
    } else {
      // Opération directe - item est déjà un VariableTransaction
      setEditingTransfer(null);
      setEditingVar(item);
      setIsFormOpen(true);
    }
  };

  // State temporaire pour le formulaire (VariableTransaction est attendu par le form existant)
  const [editingVar, setEditingVar] = useState<any | null>(null);

  const defaultDate = new Date().toISOString().split("T")[0];

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || "Inconnu";

  const isManualSort = sortKey === "manual";

  // --- DRAG & DROP HANDLERS ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onMoveTransfer) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Ne drag que les transferts (pas les ops directes)
    const transfers = currentItems.filter((i) => i.source === "TRANSFER").map((i) => i.transferData!);

    const oldIndex = transfers.findIndex((t) => t.id === active.id);
    const newIndex = transfers.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const movedTransfer = transfers[oldIndex];
    const reordered = arrayMove(transfers, oldIndex, newIndex);

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
  };

  const sortOptions = [
    { key: "manual", label: "Manuel" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Montant" },
    { key: "label", label: "Motif" },
  ];

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
                  setAccountTypeFilter("ALL");
                  setSpecificAccountId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  accountTypeFilter === "ALL"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => {
                  setAccountTypeFilter("CHECKING");
                  setSpecificAccountId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                  accountTypeFilter === "CHECKING"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                <Wallet size={12} /> Courants
              </button>
              <button
                onClick={() => {
                  setAccountTypeFilter("SAVINGS");
                  setSpecificAccountId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                  accountTypeFilter === "SAVINGS"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                <PiggyBank size={12} /> Épargne
              </button>
            </div>
          </div>

          {/* Compte spécifique */}
          {accountTypeFilter !== "ALL" && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compte Spécifique</span>
              <select
                value={specificAccountId || ""}
                onChange={(e) => setSpecificAccountId(e.target.value || null)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les {accountTypeFilter === "CHECKING" ? "courants" : "d'épargne"}</option>
                {accounts
                  .filter((a) => a.type === (accountTypeFilter === "CHECKING" ? AccountType.CHECKING : AccountType.SAVINGS))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Inclure opérations directes */}
          {accountTypeFilter === "SAVINGS" && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                id="includeDirectOps"
                checked={includeDirectOps}
                onChange={(e) => setIncludeDirectOps(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <label htmlFor="includeDirectOps" className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-600" />
                Inclure intérêts & frais bancaires
              </label>
            </div>
          )}

          {/* Solde évolutif (si compte spécifique) */}
          {specificAccountId && historyWithBalances.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Solde actuel</span>
                <span className={`text-lg font-black ${historyWithBalances[historyWithBalances.length - 1].balanceAfter >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
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
              {selectedMotif && (
                <button
                  onClick={() => setSelectedMotif(null)}
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
                    onClick={() => setSelectedMotif(selectedMotif === motif ? null : motif)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedMotif === motif
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

        <DataList
          title={specificAccountId ? `Historique ${accounts.find((a) => a.id === specificAccountId)?.name || ""}` : "Tous les Mouvements"}
          count={currentItems.length}
          onAdd={() => {
            setEditingTransfer(null);
            setEditingVar(null);
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
                            <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 font-medium">{getAccountName(item.sourceAccountId!)}</span>
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
                      {specificAccountId && "balanceAfter" in item && <div className="text-xs text-slate-400 font-medium">Solde: {item.balanceAfter.toFixed(2)} €</div>}
                    </div>
                  </div>
                </SortableRow>
              ))}
            </SortableContext>
          </DndContext>
        </DataList>
      </div>

      <VariableTransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        accounts={accountsWithBalances}
        categories={categories}
        people={people}
        onAddTransaction={onUpsertTransaction}
        onUpsertTransfer={onUpsertTransfer}
        onDeleteTransaction={(id) => {
          if (editingTransfer) {
            onDeleteTransfer(editingTransfer.id);
          } else if (editingVar) {
            // Supprimer l'opération directe via variableTransactions
            // À implémenter: onDeleteTransaction dans les props
          }
        }}
        defaultDate={defaultDate}
        savedLabels={savedLabels}
        labelsSuggestions={settings.variable_labels}
        editingTransaction={editingVar}
        initialMode={editingTransfer ? "TRANSFER" : "STANDARD"}
        lockMode={!!editingTransfer}
      />
    </div>
  );
};
