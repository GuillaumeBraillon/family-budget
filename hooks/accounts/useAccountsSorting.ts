import { useState, useEffect, useMemo, useCallback } from "react";
import { Account } from "../../types";

export type SortOrder = "asc" | "desc";

export type AccountSortKey = "manual" | "name" | "balance" | "type";

export interface AccountSortOption {
  key: AccountSortKey;
  label: string;
}

export const useAccountsSorting = (accountsSorting: string[] = []) => {
  const [sortKey, setSortKey] = useState<AccountSortKey>(() => {
    return (localStorage.getItem("accountsView_sortKey") as AccountSortKey) || "manual";
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    return (localStorage.getItem("accountsView_sortOrder") as SortOrder) || "asc";
  });

  useEffect(() => {
    localStorage.setItem("accountsView_sortKey", sortKey);
  }, [sortKey]);

  useEffect(() => {
    localStorage.setItem("accountsView_sortOrder", sortOrder);
  }, [sortOrder]);

  const setSorting = (key: AccountSortKey, order?: SortOrder) => {
    setSortKey(key);
    if (key === "manual") {
      setSortOrder("asc"); // Manual sort will be fixed to asc based on the array
    } else if (order) {
      setSortOrder(order);
    }
  };

  const sortingMap = useMemo(() => {
    const map = new Map<string, number>();
    accountsSorting.forEach((id, index) => {
      map.set(id, index);
    });
    return map;
  }, [accountsSorting]);

  const sortAccounts = useCallback(
    (accounts: Account[]): Account[] => {
      if (!accounts) return [];
      const sorted = [...accounts];

      if (sortKey === "manual") {
        sorted.sort((a, b) => {
          const indexA = sortingMap.has(a.id) ? sortingMap.get(a.id)! : Infinity;
          const indexB = sortingMap.has(b.id) ? sortingMap.get(b.id)! : Infinity;

          if (indexA === Infinity && indexB === Infinity) {
            return a.name.localeCompare(b.name); // Fallback alphabétique
          }

          return indexA - indexB;
        });
      } else {
        sorted.sort((a, b) => {
          let valA: string | number;
          let valB: string | number;

          switch (sortKey) {
            case "name":
              valA = a.name;
              valB = b.name;
              break;
            case "balance":
              valA = a.currentBalance;
              valB = b.currentBalance;
              break;
            case "type":
              valA = a.type;
              valB = b.type;
              break;
            default: // name as default
              valA = a.name;
              valB = b.name;
              break;
          }

          if (typeof valA === "string" && typeof valB === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          } else if (typeof valA === "number" && typeof valB === "number") {
            return sortOrder === "asc" ? valA - valB : valB - valA;
          }
          // Fallback, should not be reached if types are consistent from the switch statement
          return 0;
        });
      }
      return sorted;
    },
    [sortKey, sortOrder, sortingMap]
  );

  return {
    sortKey,
    sortOrder,
    setSorting,
    sortAccounts,
    isManualSort: sortKey === "manual",
    canToggleOrder: sortKey !== "manual",
    sortOptions: [
      { key: "manual", label: "Manuel" },
      { key: "name", label: "Nom" },
      { key: "balance", label: "Solde" },
      { key: "type", label: "Type" },
    ],
  };
};
