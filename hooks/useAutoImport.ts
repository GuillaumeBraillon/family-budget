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
  const [pendingLabelImports, setPendingLabelImports] = useState<{ cb: boolean; vir: boolean }>({ cb: false, vir: false });
  const [autoImportToast, setAutoImportToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  useEffect(() => {
    // Si on n'est plus dans le planner et qu'il y a des imports en attente
    if (currentView === "planner") return;
    if (!pendingLabelImports.cb && !pendingLabelImports.vir) return;

    const importsToRun = pendingLabelImports;

    const runAutoImportOnLeavePlanner = async () => {
      setPendingLabelImports({ cb: false, vir: false });

      const [cbResult, virResult] = await Promise.all([
        importsToRun.cb ? actions.importLabels() : Promise.resolve<AutoImportResult>({ count: 0 }),
        importsToRun.vir ? actions.importVirLabels() : Promise.resolve<AutoImportResult>({ count: 0 }),
      ]);

      const cbError = !!cbResult?.error;
      const virError = !!virResult?.error;

      if (cbError || virError) {
        setAutoImportToast({ type: "error", message: "Import auto des libellés: erreur." });
        return;
      }

      const cbCount = cbResult?.count ?? 0;
      const virCount = virResult?.count ?? 0;
      const totalCount = cbCount + virCount;

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
