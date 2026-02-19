import { useState, useEffect, useCallback, useMemo } from "react";

export type SortOrder = "asc" | "desc";

interface UseManualSortingParams<TItem, TSortKey extends string> {
  storageSortKey: string;
  storageSortOrder: string;
  defaultSortKey: TSortKey;
  defaultSortOrder: SortOrder;
  manualSortOrder: SortOrder;
  manualOrderIds: string[];
  getItemId: (item: TItem) => string;
  fallbackManualCompare: (a: TItem, b: TItem) => number;
  autoCompare: (a: TItem, b: TItem, sortKey: TSortKey) => number;
}

export const useManualSorting = <TItem, TSortKey extends string>({
  storageSortKey,
  storageSortOrder,
  defaultSortKey,
  defaultSortOrder,
  manualSortOrder,
  manualOrderIds,
  getItemId,
  fallbackManualCompare,
  autoCompare,
}: UseManualSortingParams<TItem, TSortKey>) => {
  const [sortKey, setSortKey] = useState<TSortKey>(() => {
    const saved = localStorage.getItem(storageSortKey) as TSortKey | null;
    return saved || defaultSortKey;
  });

  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const saved = localStorage.getItem(storageSortOrder) as SortOrder | null;
    return saved || defaultSortOrder;
  });

  useEffect(() => {
    localStorage.setItem(storageSortKey, sortKey);
  }, [storageSortKey, sortKey]);

  useEffect(() => {
    localStorage.setItem(storageSortOrder, sortOrder);
  }, [storageSortOrder, sortOrder]);

  const setSorting = useCallback(
    (key: TSortKey, order?: SortOrder) => {
      setSortKey(key);
      if ((key as string) === "manual") {
        setSortOrder(manualSortOrder);
      } else if (order) {
        setSortOrder(order);
      }
    },
    [manualSortOrder]
  );

  const sortingMap = useMemo(() => {
    const map = new Map<string, number>();
    manualOrderIds.forEach((id, index) => {
      map.set(id, index);
    });
    return map;
  }, [manualOrderIds]);

  const sortItems = useCallback(
    (items: TItem[]): TItem[] => {
      if (!items) return [];
      const sorted = [...items];

      if ((sortKey as string) === "manual") {
        sorted.sort((a, b) => {
          const itemAId = getItemId(a);
          const itemBId = getItemId(b);
          const indexA = sortingMap.has(itemAId) ? sortingMap.get(itemAId)! : Infinity;
          const indexB = sortingMap.has(itemBId) ? sortingMap.get(itemBId)! : Infinity;

          if (indexA === Infinity && indexB === Infinity) {
            return fallbackManualCompare(a, b);
          }

          return indexA - indexB;
        });
        return sorted;
      }

      sorted.sort((a, b) => {
        const result = autoCompare(a, b, sortKey);
        return sortOrder === "asc" ? result : -result;
      });

      return sorted;
    },
    [sortKey, sortOrder, sortingMap, getItemId, fallbackManualCompare, autoCompare]
  );

  return {
    sortKey,
    sortOrder,
    setSorting,
    sortItems,
    isManualSort: (sortKey as string) === "manual",
    canToggleOrder: (sortKey as string) !== "manual",
  };
};
