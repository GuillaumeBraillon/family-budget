import { CombinedOperation } from "./useTransfersData";
import { useManualSorting, SortOrder } from "../sorting/useManualSorting";

export type TransferSortKey = "manual" | "date" | "amount" | "label";

export interface TransferSortOption {
  key: TransferSortKey;
  label: string;
}

export const useTransfersSorting = (accountsSorting: string[] = []) => {
  const { sortKey, sortOrder, setSorting, sortItems, isManualSort, canToggleOrder } = useManualSorting<CombinedOperation, TransferSortKey>({
    storageSortKey: "transfersView_sortKey",
    storageSortOrder: "transfersView_sortOrder",
    defaultSortKey: "manual",
    defaultSortOrder: "desc",
    manualSortOrder: "desc",
    manualOrderIds: accountsSorting,
    getItemId: (item) => item.id,
    fallbackManualCompare: (a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    },
    autoCompare: (a, b, key) => {
      if (key === "amount") {
        return Math.abs(a.amount) - Math.abs(b.amount);
      }
      if (key === "label") {
        return a.label.localeCompare(b.label);
      }

      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    },
  });

  return {
    sortKey,
    sortOrder,
    setSorting,
    sortItems,
    isManualSort,
    canToggleOrder,
    sortOptions: [
      { key: "manual", label: "Manuel" },
      { key: "date", label: "Date" },
      { key: "amount", label: "Montant" },
      { key: "label", label: "Motif" },
    ] as TransferSortOption[],
  };
};

export type { SortOrder };
