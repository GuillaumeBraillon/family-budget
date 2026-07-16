import { useState, useEffect } from "react";
import { ViewState } from "../constants/navigation";

interface AutoImportResult {
  error?: unknown;
  count?: number;
}

interface AutoImportActions {
  importLabels: () => Promise<AutoImportResult>;
  importVirLabels: () => Promise<AutoImportResult>;
}

/**
 * Hook gérant l'import automatique des libellés lors de la navigation.
 */
export const useAutoImport = (currentView: ViewState, actions: AutoImportActions) => {
  const [pendingLabelImports, setPendingLabelImports] = useState<{ expense: boolean; income: boolean }>({ expense: false, income: false });
  const [autoImportToast, setAutoImportToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    // Si on n'est plus dans le planner et qu'il y a des imports en attente
    if (currentView === "planner") return;
    if (!pendingLabelImports.expense && !pendingLabelImports.income) return;

    const importsToRun = pendingLabelImports;

    const runAutoImportOnLeavePlanner = async () => {
      setPendingLabelImports({ expense: false, income: false });

      const [expenseResult, incomeResult] = await Promise.all([
        importsToRun.expense ? actions.importLabels() : Promise.resolve<AutoImportResult>({ count: 0 }),
        importsToRun.income ? actions.importVirLabels() : Promise.resolve<AutoImportResult>({ count: 0 }),
      ]);

      const expenseError = !!expenseResult?.error;
      const incomeError = !!incomeResult?.error;

      if (expenseError || incomeError) {
        setAutoImportToast({ type: "error", message: "Import auto des libellés: erreur." });
        return;
      }

      const expenseCount = expenseResult?.count ?? 0;
      const incomeCount = incomeResult?.count ?? 0;
      const totalCount = expenseCount + incomeCount;

      if (totalCount > 0) {
        setAutoImportToast({
          type: "success",
          message: `${totalCount} libellé${totalCount > 1 ? "s" : ""} importé${totalCount > 1 ? "s" : ""} automatiquement.`,
        });
      } else {
        setAutoImportToast({ type: "info", message: "Import auto: aucun nouveau libellé." });
      }
    };

    void runAutoImportOnLeavePlanner();
  }, [currentView, pendingLabelImports, actions]);

  return {
    pendingLabelImports,
    setPendingLabelImports,
    autoImportToast,
    setAutoImportToast,
  };
};
